/**
 * Plus petite pose qui produit un couloir donné, build-time uniquement.
 *
 * Un lot a un vigile inutile s'il existe une pose plus courte qui laisse le
 * même couloir dans l'ombre et respecte les indices : le joueur qui la trouve
 * garde un vigile en main sans place utile. Le couloir étant fixé, la question
 * devient un petit programme linéaire en nombres entiers, confié à HiGHS :
 *
 * - `x` : un vigile d'un type et d'une orientation sur une case ;
 * - `f` : un faisceau entre dans une case en avançant dans une direction. Il
 *   vient de la case précédente, émis par son vigile ou traversant une case
 *   vide ; un vigile arrête les faisceaux qui l'atteignent ; un miroir dévie.
 *
 * Contraintes : aucun faisceau dans le couloir, chaque autre case de sol
 * occupée ou éclairée, chaque indice compté juste, lot respecté type par type.
 * Objectif : le moins de vigiles possible.
 *
 * Le modèle compte une case vue deux fois par le même vigile (ses deux
 * regards, via un miroir) comme deux regards, le moteur comme un seul : la
 * pose trouvée est donc toujours rejouée par le moteur avant d'être rendue.
 */
import highsLoader from 'highs'
import {
  computeVision,
  areCluesSatisfied,
  DELTA,
  FACINGS,
  guardDirs,
  GUARD_TYPES,
  isFacingAllowed,
  isFloor,
  isPlaceable,
  key,
  REFLECT,
  unseenCells,
} from '~/games/anglemort/engine'
import type { Dir, Guard, Level, MirrorKind, Pos } from '~/games/anglemort/types'

const DIRS: readonly Dir[] = ['N', 'E', 'S', 'W']

export type MinimalPose =
  /** Pose la plus courte possible, rejouée par le moteur. */
  | { status: 'optimal'; pose: Guard[] }
  /** Aucune pose du lot ne produit ce couloir. */
  | { status: 'infeasible' }
  /** Échec du solveur, ou pose que le moteur ne valide pas. */
  | { status: 'unknown'; reason: string }

let highs: ReturnType<typeof highsLoader> | undefined

function solver() {
  highs ??= highsLoader()
  return highs
}

type Cell = number

function mirrorKind(level: Level, [x, y]: Pos): MirrorKind | undefined {
  return level.mirrors.find((m) => m.pos[0] === x && m.pos[1] === y)?.kind
}

/** Case que traverse un faisceau : sol ou miroir (pas de pilier, pas hors grille). */
function isLightCell(level: Level, [x, y]: Pos): boolean {
  return isFloor(level, x, y) || mirrorKind(level, [x, y]) !== undefined
}

type Term = { name: string; coef: number }

function expr(terms: Term[]): string {
  if (terms.length === 0) throw new Error('Angle mort : contrainte vide')
  return terms
    .map(({ name, coef }, i) => {
      const sign = coef < 0 ? '-' : i === 0 ? '' : '+'
      const abs = Math.abs(coef)
      return `${sign} ${abs === 1 ? '' : abs + ' '}${name}`
    })
    .join(' ')
}

/** Modèle au format LP de CPLEX, et les vigiles candidats par nom de variable. */
function buildModel(level: Level, corridor: Pos[]) {
  const { width, height } = level
  const cell = ([x, y]: Pos): Cell => y * width + x
  const pos = (c: Cell): Pos => [c % width, Math.floor(c / width)]
  const inCorridor = new Set(corridor.map(cell))

  const candidates = new Map<string, Guard>()
  const guardsAt = new Map<Cell, string[]>()
  const emitters = new Map<string, string[]>()
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = cell([x, y])
      if (!isPlaceable(level, x, y) || inCorridor.has(c)) continue
      for (const type of GUARD_TYPES) {
        if (level.pool[type] === 0) continue
        for (const facing of FACINGS[type]) {
          const guard: Guard = { pos: [x, y], type, facing }
          if (!isFacingAllowed(level, guard)) continue
          const name = `x${candidates.size}`
          candidates.set(name, guard)
          guardsAt.set(c, [...(guardsAt.get(c) ?? []), name])
          for (const d of guardDirs(guard)) {
            emitters.set(`${c}${d}`, [...(emitters.get(`${c}${d}`) ?? []), name])
          }
        }
      }
    }
  }

  const occ = (c: Cell): Term[] => (guardsAt.get(c) ?? []).map((name) => ({ name, coef: 1 }))
  const emit = (c: Cell, d: Dir): Term[] =>
    (emitters.get(`${c}${d}`) ?? []).map((name) => ({ name, coef: 1 }))
  const f = (c: Cell, d: Dir) => `f${c}${d}`

  const rows: string[] = []
  const flows = new Set<string>()
  const add = (terms: Term[], op: '>=' | '<=' | '=', rhs: number) => {
    rows.push(` c${rows.length}: ${expr(terms)} ${op} ${rhs}`)
  }

  // Faisceau qui entre dans `c` en avançant vers `d` : il sort de la case `p`
  // qui précède. Les chaînes ainsi formées partent d'un bord ou d'un pilier,
  // ou bouclent sur elles-mêmes à travers des miroirs.
  const predecessor = new Map<string, string | null>()
  for (let c = 0; c < width * height; c++) {
    if (!isLightCell(level, pos(c))) continue
    for (const d of DIRS) {
      const name = f(c, d)
      flows.add(name)
      const [x, y] = pos(c)
      const p: Pos = [x - DELTA[d][0], y - DELTA[d][1]]
      const pc = cell(p)
      const inside = p[0] >= 0 && p[0] < width && p[1] >= 0 && p[1] < height
      if (!inside || !isLightCell(level, p)) {
        predecessor.set(name, null)
        add([{ name, coef: 1 }], '=', 0)
        continue
      }
      const mirror = mirrorKind(level, p)
      if (mirror) {
        // La réflexion est une involution : le faisceau sorti vers `d` est
        // entré vers `REFLECT[mirror][d]`.
        const incoming = f(pc, REFLECT[mirror][d])
        predecessor.set(name, incoming)
        add(
          [
            { name, coef: 1 },
            { name: incoming, coef: -1 },
          ],
          '=',
          0,
        )
        continue
      }
      const before = f(pc, d)
      predecessor.set(name, before)
      const self = { name, coef: 1 }
      const neg = (terms: Term[]) => terms.map((t) => ({ ...t, coef: -t.coef }))
      // f ≥ émission ; f ≥ faisceau entrant si la case est vide.
      add([self, ...neg(emit(pc, d))], '>=', 0)
      add([self, { name: before, coef: -1 }, ...occ(pc)], '>=', 0)
      // f ≤ émission + faisceau entrant ; f ≤ émission si la case est occupée.
      add([self, ...neg(emit(pc, d)), { name: before, coef: -1 }], '<=', 0)
      add([self, ...neg(emit(pc, d)), ...occ(pc)], '<=', 1)
    }
  }

  // Une boucle de miroirs sans vigile ne doit pas s'éclairer d'elle-même :
  // chaque faisceau d'une boucle exige un vigile sur l'une de ses cases.
  const visited = new Set<string>()
  for (const start of flows) {
    if (visited.has(start)) continue
    const chain: string[] = []
    let current: string | null | undefined = start
    while (current && !visited.has(current) && !chain.includes(current)) {
      chain.push(current)
      current = predecessor.get(current)
    }
    for (const name of chain) visited.add(name)
    if (current !== start) continue
    const cells = [...new Set(chain.map((name) => Number(name.slice(1, -1))))]
    for (const name of chain)
      add(
        [{ name, coef: 1 }, ...cells.flatMap((c) => occ(c)).map((t) => ({ ...t, coef: -1 }))],
        '<=',
        0,
      )
  }

  const light = (c: Cell): Term[] => DIRS.map((d) => ({ name: f(c, d), coef: 1 }))
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isFloor(level, x, y)) continue
      const c = cell([x, y])
      const clue = level.clues[key(x, y)]
      if (clue !== undefined) add(light(c), '=', clue)
      if (inCorridor.has(c)) add(light(c), '=', 0)
      else add([...occ(c), ...light(c)], '>=', 1)
    }
  }
  for (const c of guardsAt.keys()) add(occ(c), '<=', 1)
  for (const type of GUARD_TYPES) {
    const names = [...candidates].filter(([, g]) => g.type === type).map(([name]) => name)
    if (names.length > 0)
      add(
        names.map((name) => ({ name, coef: 1 })),
        '<=',
        level.pool[type],
      )
  }

  const all = [...candidates.keys()]
  if (all.length === 0) return { model: '', candidates }
  const model = [
    'Minimize',
    ` obj: ${expr(all.map((name) => ({ name, coef: 1 })))}`,
    'Subject To',
    ...rows,
    'Binary',
    ...[...all, ...flows].map((name) => ` ${name}`),
    'End',
  ].join('\n')
  return { model, candidates }
}

function producesCorridor(level: Level, pose: Guard[], corridor: Pos[]): boolean {
  const vision = computeVision(level, pose)
  const unseen = new Set(unseenCells(level, pose, vision).map((p) => key(...p)))
  return (
    areCluesSatisfied(level, vision) &&
    unseen.size === corridor.length &&
    corridor.every((p) => unseen.has(key(...p)))
  )
}

/** Plus petite pose, prise dans le lot du niveau, qui laisse exactement `corridor` dans l'ombre. */
export async function minimalPose(level: Level, corridor: Pos[]): Promise<MinimalPose> {
  const { model, candidates } = buildModel(level, corridor)
  // Sans vigile possible, rien n'éclaire les cases hors du couloir.
  if (candidates.size === 0) return { status: 'infeasible' }
  const result = (await solver()).solve(model, { output_flag: false })
  if (result.Status === 'Infeasible') return { status: 'infeasible' }
  if (result.Status !== 'Optimal') return { status: 'unknown', reason: result.Status }
  const pose = [...candidates]
    .filter(([name]) => (result.Columns[name]?.Primal ?? 0) > 0.5)
    .map(([, guard]) => guard)
  if (!producesCorridor(level, pose, corridor)) {
    return { status: 'unknown', reason: 'pose refusée par le moteur' }
  }
  return { status: 'optimal', pose }
}

/** Nombre de vigiles du lot. */
export function poolSize(level: Level): number {
  return GUARD_TYPES.reduce((n, t) => n + level.pool[t], 0)
}
