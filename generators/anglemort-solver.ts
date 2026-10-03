/**
 * Solveur Angle mort, build-time uniquement.
 *
 * Un vigile arrête le faisceau des autres : l'éclairage d'une case dépend donc
 * des vigiles posés **plus loin** sur le faisceau. Chaque candidat (case,
 * variante) garde ses faisceaux sous forme de listes ordonnées de cases (ce
 * qu'il éclairerait sans aucun autre vigile), tronquées dynamiquement :
 *
 * - une case est **éclairée à coup sûr** si un vigile posé la voit et qu'aucune
 *   case intermédiaire ne peut encore recevoir de vigile ;
 * - elle est **peut-être éclairée** si un vigile posé ou encore posable peut
 *   l'atteindre sans traverser un vigile déjà posé.
 *
 * Ces bornes alimentent la propagation : chemin (degrés, interdiction d'être
 * éclairé), indices chiffrés, couverture des cases hors chemin. Le branchement
 * se fait **par case** (une variante de vigile, ou aucun vigile), ce qui
 * partitionne l'espace : chaque solution est trouvée une seule fois, donc on
 * peut compter. La validation finale passe par le moteur du jeu.
 */
import {
  DIRS,
  GUARD_TYPES,
  areCluesSatisfied,
  computeVision,
  guardDirs,
  isFloor,
  isPlaceable,
  isSinglePath,
  unseenCells,
} from '~/games/anglemort/engine'
import type { Dir, Guard, GuardType, Level, MirrorKind, Pool, Pos } from '~/games/anglemort/types'
import type { Rng } from '~/lib/random'

const FACINGS: Record<GuardType, readonly Dir[]> = {
  simple: DIRS,
  angle: DIRS,
  oppose: ['N', 'E'],
}

const DELTA: Record<Dir, Pos> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }

const REFLECT: Record<MirrorKind, Record<Dir, Dir>> = {
  '/': { E: 'N', N: 'E', W: 'S', S: 'W' },
  '\\': { E: 'S', S: 'E', W: 'N', N: 'W' },
}

type Candidate = {
  pos: number
  type: GuardType
  facing: Dir
  /** Cases de sol traversées par chaque faisceau, dans l'ordre. */
  rays: number[][]
  /** Nombre total de cases éclairables (heuristique d'ordre). */
  reach: number
  usesMirror: boolean
}

export type SolveOptions = {
  /** `true` : le lot doit être posé en entier. `false` : le lot est un plafond. */
  exactPool: boolean
  /** Cases imposées sur le chemin (la porte et le diamant le sont toujours). */
  forcedPath?: Pos[]
  /** Cases imposées hors du chemin (donc vigile ou éclairées). */
  forbiddenPath?: Pos[]
  /** Arrêt dès que ce nombre de solutions est atteint. */
  limit: number
  /** Budget de nœuds explorés ; au-delà, la recherche est déclarée incomplète. */
  maxNodes: number
  /** Ordre aléatoire des options (construction) ; sinon ordre fixe. */
  rng?: Rng
}

export type SolveResult = {
  /** Solutions distinctes à l'écran (cf. `visibleKey`). */
  solutions: Guard[][]
  /** `false` si le budget a été épuisé avant la fin de l'exploration. */
  complete: boolean
  /** Pour chaque solution, vrai si au moins un faisceau passe par un miroir. */
  usesMirror: boolean[]
}

type Node = {
  /** 0 disponible, 1 choisi, -1 interdit. */
  cand: Int8Array
  /** 1 sur le chemin, -1 hors chemin, 0 indécis. */
  path: Int8Array
  chosen: Record<GuardType, number>
}

/** Bornes d'éclairage recalculées à chaque passe de propagation. */
type Bounds = {
  /** État du chemin au moment du calcul des bornes. */
  pathSnapshot: Int8Array
  guardAt: Uint8Array
  canGuard: Uint8Array
  sure: Int16Array
  maybe: Int16Array
}

type Ctx = {
  level: Level
  w: number
  size: number
  floor: boolean[]
  ends: Set<number>
  clues: Map<number, number>
  cands: Candidate[]
  candsAt: number[][]
  neighbours: number[][]
  options: SolveOptions
  nodes: number
  aborted: boolean
  solutions: Guard[][]
  usesMirror: boolean[]
  seenKeys: Set<string>
}

function traceRays(level: Level, guard: Guard): { rays: number[][]; usesMirror: boolean } {
  const w = level.width
  const pillars = new Set(level.pillars.map(([x, y]) => y * w + x))
  const mirrors = new Map(level.mirrors.map((m) => [m.pos[1] * w + m.pos[0], m.kind]))
  const start = guard.pos[1] * w + guard.pos[0]
  let usesMirror = false
  const rays = guardDirs(guard).map((first) => {
    const ray: number[] = []
    let [x, y] = guard.pos
    let dir = first
    for (;;) {
      x += DELTA[dir][0]
      y += DELTA[dir][1]
      const i = y * w + x
      if (x < 0 || y < 0 || x >= w || y >= level.height || pillars.has(i) || i === start) break
      const mirror = mirrors.get(i)
      if (mirror) {
        usesMirror = true
        dir = REFLECT[mirror][dir]
        continue
      }
      ray.push(i)
    }
    return ray
  })
  return { rays, usesMirror }
}

function buildCandidates(level: Level): Candidate[] {
  const out: Candidate[] = []
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (!isPlaceable(level, x, y)) continue
      for (const type of GUARD_TYPES) {
        if (level.pool[type] === 0) continue
        for (const facing of FACINGS[type]) {
          const { rays, usesMirror } = traceRays(level, { pos: [x, y], type, facing })
          const reach = new Set(rays.flat()).size
          out.push({ pos: y * level.width + x, type, facing, rays, reach, usesMirror })
        }
      }
    }
  }
  return out
}

function makeCtx(level: Level, options: SolveOptions): Ctx {
  const w = level.width
  const size = w * level.height
  const floor = Array.from({ length: size }, (_, i) => isFloor(level, i % w, Math.floor(i / w)))
  const cands = buildCandidates(level)
  const candsAt: number[][] = Array.from({ length: size }, () => [])
  cands.forEach((c, k) => candsAt[c.pos].push(k))
  const neighbours = Array.from({ length: size }, (_, i) => {
    const x = i % w
    const y = Math.floor(i / w)
    const list: number[] = []
    if (x > 0) list.push(i - 1)
    if (x < w - 1) list.push(i + 1)
    if (y > 0) list.push(i - w)
    if (y < level.height - 1) list.push(i + w)
    return list.filter((n) => floor[n])
  })
  const clues = new Map(
    Object.entries(level.clues).map(([k, v]) => {
      const [x, y] = k.split(',').map(Number)
      return [y * w + x, v]
    }),
  )
  const ends = new Set([
    level.door[1] * w + level.door[0],
    level.diamond[1] * w + level.diamond[0],
  ])
  return {
    level,
    w,
    size,
    floor,
    ends,
    clues,
    cands,
    candsAt,
    neighbours,
    options,
    nodes: 0,
    aborted: false,
    solutions: [],
    usesMirror: [],
    seenKeys: new Set(),
  }
}

function cloneNode(n: Node): Node {
  return { cand: n.cand.slice(), path: n.path.slice(), chosen: { ...n.chosen } }
}

function forbidAt(ctx: Ctx, n: Node, i: number): void {
  for (const k of ctx.candsAt[i]) if (n.cand[k] === 0) n.cand[k] = -1
}

function forcePath(ctx: Ctx, n: Node, i: number): boolean {
  if (n.path[i] === -1) return false
  if (ctx.candsAt[i].some((k) => n.cand[k] === 1)) return false
  n.path[i] = 1
  forbidAt(ctx, n, i)
  return true
}

function choose(ctx: Ctx, n: Node, k: number): boolean {
  const c = ctx.cands[k]
  if (n.cand[k] !== 0 || n.path[c.pos] === 1) return false
  if (n.chosen[c.type] >= ctx.level.pool[c.type]) return false
  forbidAt(ctx, n, c.pos)
  n.cand[k] = 1
  n.chosen[c.type]++
  n.path[c.pos] = -1
  if (n.chosen[c.type] === ctx.level.pool[c.type]) {
    ctx.cands.forEach((other, j) => {
      if (other.type === c.type && n.cand[j] === 0) n.cand[j] = -1
    })
  }
  return true
}

function computeBounds(ctx: Ctx, n: Node): Bounds {
  const guardAt = new Uint8Array(ctx.size)
  const canGuard = new Uint8Array(ctx.size)
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] === 1) guardAt[c.pos] = 1
    else if (n.cand[k] === 0) canGuard[c.pos] = 1
  })
  const sure = new Int16Array(ctx.size)
  const maybe = new Int16Array(ctx.size)
  // Un même vigile (ou une même case candidate) ne compte qu'une fois par case.
  const sureMark = new Int32Array(ctx.size).fill(-1)
  const maybeMark = new Int32Array(ctx.size).fill(-1)
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] === -1) return
    const placed = n.cand[k] === 1
    for (const ray of c.rays) {
      let certain = placed
      for (const i of ray) {
        if (guardAt[i]) break
        if (certain) {
          if (sureMark[i] !== c.pos) {
            sureMark[i] = c.pos
            sure[i]++
          }
        } else if (maybeMark[i] !== c.pos) {
          maybeMark[i] = c.pos
          maybe[i]++
        }
        if (canGuard[i]) certain = false
      }
    }
  })
  return { pathSnapshot: n.path.slice(), guardAt, canGuard, sure, maybe }
}

/**
 * Vrai si le candidat éclairerait à coup sûr la case `target` une fois posé :
 * aucune case intermédiaire ne peut plus recevoir de vigile.
 */
function surelyLights(ctx: Ctx, b: Bounds, k: number, target: number): boolean {
  for (const ray of ctx.cands[k].rays) {
    for (const i of ray) {
      if (b.guardAt[i]) break
      if (i === target) return true
      if (b.canGuard[i]) break
    }
  }
  return false
}

/** Propagation jusqu'au point fixe. Renvoie les bornes, ou `null` si contradiction. */
function propagate(ctx: Ctx, n: Node): Bounds | null {
  for (;;) {
    let changed = false
    const b = computeBounds(ctx, n)

    if (ctx.options.exactPool) {
      for (const type of GUARD_TYPES) {
        const missing = ctx.level.pool[type] - n.chosen[type]
        if (missing === 0) continue
        const positions = new Set<number>()
        ctx.cands.forEach((c, k) => c.type === type && n.cand[k] === 0 && positions.add(c.pos))
        if (positions.size < missing) return null
      }
    }

    for (const [i, clue] of ctx.clues) {
      if (b.sure[i] > clue || b.sure[i] + b.maybe[i] < clue) return null
    }

    for (let i = 0; i < ctx.size; i++) {
      if (!ctx.floor[i] || b.guardAt[i]) continue
      const lit = b.sure[i] > 0
      if (n.path[i] === 1 && lit) return null
      if (lit && n.path[i] === 0) {
        n.path[i] = -1
        changed = true
      }
      if (!lit && b.maybe[i] === 0 && !b.canGuard[i]) {
        if (n.path[i] === -1) return null
        if (n.path[i] === 0) {
          if (!forcePath(ctx, n, i)) return null
          changed = true
        }
      }
    }

    for (let i = 0; i < ctx.size; i++) {
      if (n.path[i] !== 1) continue
      const needed = ctx.ends.has(i) ? 1 : 2
      let onPath = 0
      const open: number[] = []
      for (const j of ctx.neighbours[i]) {
        if (n.path[j] === 1) onPath++
        else if (n.path[j] === 0 && !b.guardAt[j] && b.sure[j] === 0) open.push(j)
      }
      if (onPath > needed || onPath + open.length < needed) return null
      if (open.length > 0 && onPath === needed) {
        for (const j of open) n.path[j] = -1
        changed = true
      } else if (open.length > 0 && onPath + open.length === needed) {
        for (const j of open) if (!forcePath(ctx, n, j)) return null
        changed = true
      }
    }

    // Candidats qui éclaireraient à coup sûr une case du chemin, ou un indice
    // déjà atteint : à interdire.
    ctx.cands.forEach((c, k) => {
      if (n.cand[k] !== 0) return
      for (const ray of c.rays) {
        for (const i of ray) {
          if (b.guardAt[i]) break
          const saturated = ctx.clues.has(i) && b.sure[i] >= (ctx.clues.get(i) as number)
          if ((n.path[i] === 1 || saturated) && surelyLights(ctx, b, k, i)) {
            n.cand[k] = -1
            changed = true
            return
          }
          if (b.canGuard[i]) break
        }
      }
    })

    if (!connectCorridor(ctx, n, b)) return null
    if (n.path.some((v, i) => v !== b.pathSnapshot[i])) changed = true

    for (let u = 0; u < ctx.size; u++) {
      if (!needsCover(ctx, n, b, u) || n.path[u] !== -1) continue
      const { cands, uncertain } = coverers(ctx, n, b, u)
      if (uncertain || cands.length === 0) continue
      const pos = ctx.cands[cands[0]].pos
      if (cands.some((k) => ctx.cands[k].pos !== pos)) continue
      // Une seule case peut encore éclairer `u` : seules ses variantes qui
      // l'éclairent restent permises.
      for (const k of ctx.candsAt[pos]) {
        if (n.cand[k] === 0 && !cands.includes(k)) {
          n.cand[k] = -1
          changed = true
        }
      }
    }

    if (!changed) return b
  }
}

/** Case de sol ni vigile, ni éclairée à coup sûr, ni sur le chemin. */
function needsCover(ctx: Ctx, n: Node, b: Bounds, u: number): boolean {
  return ctx.floor[u] && !b.guardAt[u] && b.sure[u] === 0 && n.path[u] !== 1
}

/**
 * Candidats disponibles qui pourraient couvrir `u` (posés dessus, ou dont un
 * faisceau l'atteint sans traverser de vigile posé), et présence d'un vigile
 * déjà posé qui l'éclairera si rien ne s'interpose.
 */
function coverers(ctx: Ctx, n: Node, b: Bounds, u: number): { cands: number[]; uncertain: boolean } {
  const cands = ctx.candsAt[u].filter((k) => n.cand[k] === 0)
  let uncertain = false
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] === -1 || c.pos === u) return
    if (!c.rays.some((ray) => reaches(ray, u, b))) return
    if (n.cand[k] === 1) uncertain = true
    else cands.push(k)
  })
  return { cands, uncertain }
}

/**
 * Le couloir relie la porte au diamant par des cases qui peuvent encore être
 * dans l'ombre. Les cases indécises hors de portée sortent du couloir.
 */
function connectCorridor(ctx: Ctx, n: Node, b: Bounds): boolean {
  const open = (i: number) => ctx.floor[i] && !b.guardAt[i] && n.path[i] !== -1 && b.sure[i] === 0
  const [door, diamond] = [...ctx.ends]
  const reached = new Uint8Array(ctx.size)
  const queue = [door]
  reached[door] = 1
  while (queue.length > 0) {
    const i = queue.pop() as number
    for (const j of ctx.neighbours[i]) {
      if (!reached[j] && open(j)) {
        reached[j] = 1
        queue.push(j)
      }
    }
  }
  if (!reached[diamond]) return false
  for (let i = 0; i < ctx.size; i++) {
    if (n.path[i] === 1 && !reached[i]) return false
    if (n.path[i] === 0 && open(i) && !reached[i]) n.path[i] = -1
  }
  return true
}

function chosenGuards(ctx: Ctx, n: Node): Guard[] {
  const out: Guard[] = []
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] === 1) {
      out.push({ pos: [c.pos % ctx.w, Math.floor(c.pos / ctx.w)], type: c.type, facing: c.facing })
    }
  })
  return out
}

function isSolution(ctx: Ctx, n: Node): boolean {
  if (ctx.options.exactPool && GUARD_TYPES.some((t) => n.chosen[t] !== ctx.level.pool[t])) {
    return false
  }
  const { level } = ctx
  const guards = chosenGuards(ctx, n)
  const vision = computeVision(level, guards)
  return (
    areCluesSatisfied(level, vision) &&
    isSinglePath(unseenCells(level, guards, vision), level.door, level.diamond)
  )
}

function reaches(ray: number[], target: number, b: Bounds): boolean {
  for (const i of ray) {
    if (b.guardAt[i]) return false
    if (i === target) return true
  }
  return false
}

/**
 * Ce que voit le joueur : cases et types des vigiles, plus l'éclairage de
 * chaque case. Deux placements qui ne diffèrent que par l'orientation d'une
 * lampe braquée sur un mur donnent le même plateau : ils comptent pour une
 * seule solution, puisque aucun indice ne pourrait les départager.
 */
export function visibleKey(level: Level, guards: Guard[]): string {
  const placed = guards.map((g) => `${g.pos[0]},${g.pos[1]}:${g.type}`).sort()
  return `${placed.join(';')}|${computeVision(level, guards).seen.join(';')}`
}

function record(ctx: Ctx, n: Node): void {
  if (!isSolution(ctx, n)) return
  const guards = chosenGuards(ctx, n)
  const k = visibleKey(ctx.level, guards)
  if (ctx.seenKeys.has(k)) return
  ctx.seenKeys.add(k)
  ctx.solutions.push(guards)
  ctx.usesMirror.push(ctx.cands.some((c, k) => n.cand[k] === 1 && c.usesMirror))
}

function spend(ctx: Ctx): boolean {
  if (ctx.aborted || ctx.solutions.length >= ctx.options.limit) return false
  if (++ctx.nodes > ctx.options.maxNodes) {
    ctx.aborted = true
    return false
  }
  return true
}

/**
 * Toutes les cases sont décidées. En lot exact, il peut rester des vigiles
 * sans rôle de couverture : on les ajoute par indices croissants pour
 * énumérer chaque complément une seule fois.
 */
function fill(ctx: Ctx, n: Node, from: number): void {
  const missing = GUARD_TYPES.some((t) => n.chosen[t] < ctx.level.pool[t])
  if (!ctx.options.exactPool || !missing) {
    record(ctx, n)
    return
  }
  for (let k = from; k < ctx.cands.length; k++) {
    if (n.cand[k] !== 0) continue
    if (!spend(ctx)) return
    const child = cloneNode(n)
    if (choose(ctx, child, k) && propagate(ctx, child)) fill(ctx, child, k + 1)
  }
}

/**
 * Branche sur la case à couvrir la moins bien desservie. Ses couvreurs
 * possibles sont ordonnés ; la branche i pose le couvreur i et interdit les
 * précédents, la dernière n'en pose aucun. Chaque solution tombe ainsi dans
 * exactement une branche, même si le blocage empêche finalement un couvreur
 * posé d'éclairer la case.
 */
function search(ctx: Ctx, n: Node): void {
  if (!spend(ctx)) return
  const b = propagate(ctx, n)
  if (!b) return

  let target = -1
  let options: number[] = []
  let bestScore = Infinity
  for (let u = 0; u < ctx.size; u++) {
    if (!needsCover(ctx, n, b, u)) continue
    const { cands, uncertain } = coverers(ctx, n, b, u)
    // Sans couvreur à poser, la case se décide via les autres choix (blocage
    // ou chemin) : brancher dessus ne ferait pas avancer la recherche.
    if (cands.length === 0) continue
    const score = cands.length + (uncertain || n.path[u] === 0 ? 1 : 0)
    if (score < bestScore) {
      target = u
      options = cands
      bestScore = score
    }
  }
  if (target === -1) {
    fill(ctx, n, 0)
    return
  }

  const ordered = ctx.options.rng
    ? ctx.options.rng.shuffle([...options]).sort((a, c) => ctx.cands[c].reach - ctx.cands[a].reach)
    : options
  for (let idx = 0; idx < ordered.length; idx++) {
    const child = cloneNode(n)
    for (let j = 0; j < idx; j++) if (child.cand[ordered[j]] === 0) child.cand[ordered[j]] = -1
    if (choose(ctx, child, ordered[idx])) search(ctx, child)
    if (ctx.aborted || ctx.solutions.length >= ctx.options.limit) return
  }
  const none = cloneNode(n)
  for (const k of ordered) if (none.cand[k] === 0) none.cand[k] = -1
  search(ctx, none)
}

export function solveAngleMort(level: Level, options: SolveOptions): SolveResult {
  const ctx = makeCtx(level, options)
  const n: Node = {
    cand: new Int8Array(ctx.cands.length),
    path: new Int8Array(ctx.size),
    chosen: { simple: 0, angle: 0, oppose: 0 },
  }
  const forced = [level.door, level.diamond, ...(options.forcedPath ?? [])]
  const ok = forced.every(([x, y]) => forcePath(ctx, n, y * ctx.w + x))
  for (const [x, y] of options.forbiddenPath ?? []) {
    if (n.path[y * ctx.w + x] !== 1) n.path[y * ctx.w + x] = -1
  }
  if (ok) search(ctx, n)
  return { solutions: ctx.solutions, complete: !ctx.aborted, usesMirror: ctx.usesMirror }
}

export function poolOf(guards: Guard[]): Pool {
  const pool: Pool = { simple: 0, angle: 0, oppose: 0 }
  for (const g of guards) pool[g.type]++
  return pool
}
