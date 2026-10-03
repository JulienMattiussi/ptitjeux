import {
  DIRS,
  GUARD_TYPES,
  computeVision,
  isFacingAllowed,
  isFloor,
  isPlaceable,
  key,
  unseenCells,
} from '~/games/anglemort/engine'
import type { Dir, Guard, GuardType, Level, Mirror, Pool, Pos } from '~/games/anglemort/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { Rng } from '~/lib/random'
import { poolOf, solveAngleMort, visibleKey } from './anglemort-solver'
import { VARIANTS, type Variant, transformLevel } from './anglemort-symmetry'

type LevelIndex = 1 | 2 | 3 | 4

/** Étape à laquelle une tentative de génération a échoué. */
export type FailureStage = 'path' | 'construct' | 'pillars' | 'types' | 'mirror' | 'clues'

/**
 * Statistiques de génération, pour mesurer et régler le générateur. Ne
 * change rien au niveau produit.
 */
export type GenerationStats = {
  attempts: number
  failures: Record<FailureStage, number>
  constructMs: number
  uniqueMs: number
  uniqueCalls: number
  /** Vérifications d'unicité interrompues faute de budget. */
  uniqueAborted: number
}

export function emptyStats(): GenerationStats {
  return {
    attempts: 0,
    failures: { path: 0, construct: 0, pillars: 0, types: 0, mirror: 0, clues: 0 },
    constructMs: 0,
    uniqueMs: 0,
    uniqueCalls: 0,
    uniqueAborted: 0,
  }
}

export type GenerateOptions = {
  stats?: GenerationStats
  maxAttempts?: number
}

const MAX_ATTEMPTS = 400
/** Nombre total d'indices au-delà duquel une grille est rejetée. */
const MAX_CLUES: Record<LevelIndex, number> = { 1: 12, 2: 16, 3: 18, 4: 20 }
/** Indices posés d'office : sur le couloir, et de valeur 2. */
const SEED_CORRIDOR = 3
const SEED_TWOS = 2
/** Solutions concurrentes récoltées par tour pour choisir le meilleur indice. */
const RIVALS = 8
const PATH_STEPS = 4_000
const MIN_TURNS = 3
/** Marge de score acceptée dans le choix glouton (variété des niveaux). */
const GREEDY_SLACK = 1
/**
 * Budget de nœuds d'une vérification d'unicité, par niveau. La génération est
 * hors ligne : on préfère payer en temps que poser des indices au hasard
 * faute de preuve. Le test d'intégrité réutilise ce même budget.
 */
export const UNIQUE_NODES: Record<LevelIndex, number> = {
  1: 150_000,
  2: 1_500_000,
  3: 1_500_000,
  4: 1_500_000,
}

/** Plafond du lot pour la construction : doubles seulement à partir du niveau 3. */
function poolCap(index: LevelIndex): Pool {
  return index <= 2 ? { simple: 99, angle: 0, oppose: 0 } : { simple: 99, angle: 99, oppose: 99 }
}

const STEPS: readonly Pos[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]

function borderCells(width: number, height: number): Pos[] {
  const out: Pos[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) out.push([x, y])
    }
  }
  return out
}

function countTurns(path: Pos[]): number {
  let turns = 0
  for (let i = 2; i < path.length; i++) {
    const d1 = [path[i - 1][0] - path[i - 2][0], path[i - 1][1] - path[i - 2][1]]
    const d2 = [path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]]
    if (d1[0] !== d2[0] || d1[1] !== d2[1]) turns++
  }
  return turns
}

/**
 * Couloir **induit** depuis la porte : chaque nouvelle case ne touche aucune
 * case déjà posée sauf la précédente (sinon les cases dans l'ombre formeraient
 * un embranchement ou un bloc). Recherche en profondeur avec retour arrière,
 * voisins mélangés, jusqu'à la longueur visée avec au moins `minTurns`
 * virages ; `null` si le budget de pas est épuisé.
 */
function randomPath(rng: Rng, level: Level, length: number, minTurns: number): Pos[] | null {
  const path: Pos[] = [level.door]
  const used = new Set([key(...level.door)])
  let budget = PATH_STEPS

  const extend = (): boolean => {
    if (path.length === length) return countTurns(path) >= minTurns
    if (--budget < 0) return false
    const [cx, cy] = path[path.length - 1]
    const options = rng.shuffle(
      STEPS.map(([dx, dy]): Pos => [cx + dx, cy + dy]).filter(([x, y]) => {
        if (!isFloor(level, x, y) || used.has(key(x, y))) return false
        return STEPS.every(([dx, dy]) => {
          const k = key(x + dx, y + dy)
          return k === key(cx, cy) || !used.has(k)
        })
      }),
    )
    for (const next of options) {
      path.push(next)
      used.add(key(...next))
      if (extend()) return true
      path.pop()
      used.delete(key(...next))
    }
    return false
  }

  return extend() ? path : null
}

function scatter(
  rng: Rng,
  width: number,
  height: number,
  count: number,
  avoid: Set<string>,
): Pos[] {
  const cells: Pos[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) if (!avoid.has(key(x, y))) cells.push([x, y])
  }
  return rng.shuffle(cells).slice(0, count)
}

function seenCounts(level: Level, guards: Guard[]): number[][] {
  return computeVision(level, guards).seen
}

/**
 * Indices posés d'office, avant toute vérification d'unicité : au moins 3 sur
 * le couloir (des « 0 »), au moins 2 « 2 », et un « 3 » ou « 4 » s'il en
 * existe. `null` si la grille n'offre pas deux cases éclairées par 2 vigiles.
 */
function seedClues(
  rng: Rng,
  level: Level,
  path: Pos[],
  solution: Guard[],
): Record<string, number> | null {
  const truth = seenCounts(level, solution)
  const occupied = new Set(solution.map((g) => key(...g.pos)))
  const ends = new Set([key(...level.door), key(...level.diamond)])
  const onPath = new Set(path.map((p) => key(...p)))
  const corridor = path.filter((p) => !ends.has(key(...p)))
  const lit = offCorridor(level, onPath).filter(([x, y]) => !occupied.has(key(x, y)))
  const twos = lit.filter(([x, y]) => truth[y][x] === 2)
  const high = lit.filter(([x, y]) => truth[y][x] >= 3)
  if (corridor.length < SEED_CORRIDOR || twos.length < SEED_TWOS) return null
  const picked = [
    ...rng.shuffle([...corridor]).slice(0, SEED_CORRIDOR),
    ...rng.shuffle([...twos]).slice(0, SEED_TWOS),
    ...rng.shuffle([...high]).slice(0, 1),
  ]
  return Object.fromEntries(picked.map(([x, y]) => [key(x, y), truth[y][x]]))
}

/**
 * Complète les indices jusqu'à l'unicité. À chaque tour, le solveur récolte
 * plusieurs solutions concurrentes, et on pose l'indice (valeur tirée de la
 * solution voulue) qui en élimine le plus.
 */
function addCluesUntilUnique(
  rng: Rng,
  level: Level,
  solution: Guard[],
  maxClues: number,
  maxNodes: number,
  stats: GenerationStats,
): Level | null {
  const truth = seenCounts(level, solution)
  const occupied = new Set(solution.map((g) => key(...g.pos)))
  const ends = new Set([key(...level.door), key(...level.diamond)])
  let current = level
  while (Object.keys(current.clues).length <= maxClues) {
    const started = Date.now()
    const result = solveAngleMort(current, {
      exactPool: true,
      limit: RIVALS + 1,
      maxNodes,
    })
    stats.uniqueMs += Date.now() - started
    stats.uniqueCalls++
    if (!result.complete) stats.uniqueAborted++
    const intended = visibleKey(current, solution)
    const rivals = result.solutions.filter((s) => visibleKey(current, s) !== intended)
    if (result.complete && rivals.length === 0) {
      return result.solutions.length === 1 ? current : null
    }

    const free: Pos[] = []
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const k = key(x, y)
        if (isFloor(level, x, y) && !occupied.has(k) && !ends.has(k) && !(k in current.clues)) {
          free.push([x, y])
        }
      }
    }
    if (free.length === 0) return null
    // Un indice élimine un rival qui pose un vigile sur sa case ou l'éclaire autrement.
    const rivalViews = rivals.map((r) => ({
      seen: seenCounts(current, r),
      guards: new Set(r.map((g) => key(...g.pos))),
    }))
    const score = ([x, y]: Pos) =>
      rivalViews.filter((r) => r.guards.has(key(x, y)) || r.seen[y][x] !== truth[y][x]).length
    const best = Math.max(...free.map(score))
    const [x, y] = rng.pick(free.filter((c) => score(c) === best))
    current = { ...current, clues: { ...current.clues, [key(x, y)]: truth[y][x] } }
  }
  return null
}

/**
 * Retire les vigiles dont la pièce peut se passer : leurs cases restent
 * éclairées par les autres et le couloir ne change pas. Un vigile superflu
 * pourrait sinon être posé ailleurs, ce qui casserait l'unicité.
 */
function pruneRedundant(level: Level, path: Pos[], guards: Guard[]): Guard[] {
  const expected = new Set(path.map((p) => key(...p)))
  const keepsCorridor = (rest: Guard[]) => {
    const cells = unseenCells(level, rest, computeVision(level, rest))
    return cells.length === expected.size && cells.every((c) => expected.has(key(...c)))
  }
  let current = guards
  for (const guard of guards) {
    const rest = current.filter((g) => g !== guard)
    if (keepsCorridor(rest)) current = rest
  }
  return current
}

/** Nombre de vigiles visé par niveau : on ajoute des piliers jusqu'à l'atteindre. */
const TARGET_GUARDS: Record<LevelIndex, number> = { 1: 6, 2: 7, 3: 8, 4: 9 }
/** Nombre minimal de piliers par niveau. */
const MIN_PILLARS: Record<LevelIndex, number> = { 1: 3, 2: 0, 3: 0, 4: 0 }
/** Densité maximale de piliers (piliers ÷ cases de la salle). */
const MAX_PILLAR_RATIO = 0.18
/** Essais de pilier par niveau pendant la phase de réduction. */
const PILLAR_TRIALS = 80

function offCorridor(level: Level, onPath: Set<string>): Pos[] {
  const cells: Pos[] = []
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (isFloor(level, x, y) && !onPath.has(key(x, y))) cells.push([x, y])
    }
  }
  return cells
}

const FACINGS: Record<GuardType, readonly Dir[]> = {
  simple: DIRS,
  angle: DIRS,
  oppose: ['N', 'E'],
}

/** Cases hors couloir couvertes : éclairées ou occupées par un vigile. */
function coveredCount(level: Level, onPath: Set<string>, guards: Guard[]): number | null {
  const { seen } = computeVision(level, guards)
  const occupied = new Set(guards.map((g) => key(...g.pos)))
  let covered = 0
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (!isFloor(level, x, y)) continue
      const k = key(x, y)
      if (onPath.has(k)) {
        if (seen[y][x] > 0) return null
      } else if (seen[y][x] > 0 || occupied.has(k)) {
        covered++
      }
    }
  }
  return covered
}

/**
 * Couverture gloutonne : tant qu'une case hors couloir reste dans l'ombre, on
 * pose le vigile qui couvre le plus de cases en plus, sans jamais éclairer le
 * couloir (un nouveau vigile peut aussi masquer des cases, le décompte en
 * tient compte). Choix tiré au hasard parmi les meilleurs pour varier les
 * niveaux. Part des vigiles déjà posés, ce qui sert aussi à réparer une
 * couverture abîmée par un nouveau pilier.
 */
function greedyCover(
  rng: Rng,
  level: Level,
  path: Pos[],
  types: readonly GuardType[],
  initial: Guard[],
): Guard[] | null {
  const onPath = new Set(path.map((p) => key(...p)))
  const target = offCorridor(level, onPath).length
  let guards = initial
  let covered = coveredCount(level, onPath, guards)
  if (covered === null) return null
  const maxSteps = level.width * level.height
  for (let step = 0; step < maxSteps && covered < target; step++) {
    const occupied = new Set(guards.map((g) => key(...g.pos)))
    const options: { guard: Guard; covered: number }[] = []
    for (const [x, y] of offCorridor(level, onPath)) {
      if (!isPlaceable(level, x, y) || occupied.has(key(x, y))) continue
      for (const type of types) {
        for (const facing of FACINGS[type]) {
          const guard: Guard = { pos: [x, y], type, facing }
          if (!isFacingAllowed(level, guard)) continue
          const next = coveredCount(level, onPath, [...guards, guard])
          if (next !== null && next > covered) options.push({ guard, covered: next })
        }
      }
    }
    if (options.length === 0) return null
    options.sort((a, b) => b.covered - a.covered)
    const best = options.filter((o) => o.covered >= options[0].covered - GREEDY_SLACK)
    const pick = rng.pick(best)
    guards = [...guards, pick.guard]
    covered = pick.covered
  }
  if (covered < target) return null
  return pruneRedundant(level, path, guards)
}

/**
 * Ajoute des piliers un par un pour faire baisser le nombre de vigiles, et
 * jusqu'au minimum de piliers du niveau : on
 * pose un pilier (de préférence sur un vigile, qu'il remplace en bloquant la
 * lumière comme lui), on répare la couverture, et on garde le pilier si le
 * total de vigiles a baissé.
 */
function reduceWithPillars(
  rng: Rng,
  level: Level,
  path: Pos[],
  types: readonly GuardType[],
  start: Guard[],
  target: number,
  minPillars: number,
): { level: Level; guards: Guard[] } {
  const onPath = new Set(path.map((p) => key(...p)))
  const maxPillars = Math.floor(level.width * level.height * MAX_PILLAR_RATIO)
  let current = level
  let guards = start
  const unfinished = () => guards.length > target || current.pillars.length < minPillars
  for (let trial = 0; trial < PILLAR_TRIALS && unfinished(); trial++) {
    if (current.pillars.length >= maxPillars) break
    const onGuard = rng.nextInt(3) > 0 && guards.length > 0
    const pos = onGuard ? rng.pick(guards).pos : rng.pick(offCorridor(current, onPath))
    if (samePos(pos, current.door) || samePos(pos, current.diamond)) continue
    const candidate: Level = { ...current, pillars: [...current.pillars, pos] }
    // Un vigile dont la lampe se retrouve contre le nouveau pilier aurait une
    // orientation interdite : on le retire, la réparation le remplace au besoin.
    const kept = guards.filter((g) => !samePos(g.pos, pos) && isFacingAllowed(candidate, g))
    const repaired = greedyCover(rng, candidate, path, types, pruneRedundant(candidate, path, kept))
    // Sous le minimum de piliers, un pilier qui ne fait pas grimper le nombre
    // de vigiles est gardé aussi.
    const needPillar = current.pillars.length < minPillars
    if (
      repaired &&
      (repaired.length < guards.length || (needPillar && repaired.length <= guards.length))
    ) {
      current = candidate
      guards = repaired
    }
  }
  return { level: current, guards }
}

function samePos(a: Pos, b: Pos): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

function tryGenerate(
  rng: Rng,
  id: string,
  index: LevelIndex,
  stats: GenerationStats,
): Level | null {
  const { width, height } = GAME_SIZE.anglemort(index)
  const door = rng.pick(borderCells(width, height))
  const empty: Level = {
    id,
    name: `Niveau ${index} · ${width}×${height}`,
    width,
    height,
    pillars: [],
    mirrors: [],
    door,
    diamond: door,
    clues: {},
    pool: poolCap(index),
    solution: [],
  }

  // 1. Le couloir, dans une salle vide.
  const minLength = width + height
  const maxLength = Math.max(minLength, Math.floor(width * height * 0.4))
  const path = randomPath(rng, empty, minLength + rng.nextInt(maxLength - minLength + 1), MIN_TURNS)
  if (!path) {
    stats.failures.path++
    return null
  }
  const onPath = new Set(path.map((p) => key(...p)))
  const mirrors: Mirror[] =
    index === 4
      ? scatter(rng, width, height, 1 + rng.nextInt(2), onPath).map((pos) => ({
          pos,
          kind: rng.pick(['/', '\\'] as const),
        }))
      : []
  const room: Level = { ...empty, mirrors, diamond: path[path.length - 1] }

  // 2. Des vigiles qui matérialisent le couloir, sans contrainte de nombre.
  const types = GUARD_TYPES.filter((t) => room.pool[t] > 0)
  const started = Date.now()
  const first = greedyCover(rng, room, path, types, [])
  if (!first) {
    stats.constructMs += Date.now() - started
    stats.failures.construct++
    return null
  }

  // 3. Des piliers pour ramener les vigiles au nombre visé.
  const reduced = reduceWithPillars(
    rng,
    room,
    path,
    types,
    first,
    TARGET_GUARDS[index],
    MIN_PILLARS[index],
  )
  stats.constructMs += Date.now() - started
  const solution = reduced.guards
  if (!solution.every((g) => isFacingAllowed(reduced.level, g))) {
    stats.failures.construct++
    return null
  }
  if (reduced.level.pillars.length < MIN_PILLARS[index]) {
    stats.failures.pillars++
    return null
  }
  if (index >= 3 && solution.every((g) => g.type === 'simple')) {
    stats.failures.types++
    return null
  }
  if (index === 4 && !usesMirror(reduced.level, solution)) {
    stats.failures.mirror++
    return null
  }

  // 4. Les indices guides, jusqu'à l'unicité.
  const pool = poolOf(solution)
  const seeded = seedClues(rng, { ...reduced.level, solution }, path, solution)
  if (!seeded) {
    stats.failures.clues++
    return null
  }
  const level: Level = { ...reduced.level, pool, solution, clues: seeded }
  const unique = addCluesUntilUnique(
    rng,
    level,
    solution,
    MAX_CLUES[index],
    UNIQUE_NODES[index],
    stats,
  )
  if (!unique) {
    stats.failures.clues++
    return null
  }
  return { ...unique, parMoves: solution.length }
}

/** Vrai si retirer les miroirs change l'éclairage : au moins un faisceau les utilise. */
function usesMirror(level: Level, guards: Guard[]): boolean {
  if (level.mirrors.length === 0) return false
  const withMirrors = computeVision(level, guards).seen.join(';')
  return withMirrors !== computeVision({ ...level, mirrors: [] }, guards).seen.join(';')
}

/**
 * Calendrier : 13 mois, du 1er septembre 2026 au 30 septembre 2027. Chaque
 * grille de base sert 8 fois (ses 8 symétries) : le jour n°t utilise la base
 * `t mod BASES` dans la version `⌊t / BASES⌋`. Deux usages d'une même base sont espacés de `BASES`
 * jours (≥ 31), donc jamais dans le même mois.
 */
export const SCHEDULE_START = '2026-09-01'
export const SCHEDULE_DAYS = 395
export const BASES = Math.ceil(SCHEDULE_DAYS / VARIANTS.length)

export function levelOrigin(date: string): { base: number; variant: Variant } {
  const day = Math.round((Date.parse(date) - Date.parse(SCHEDULE_START)) / 86_400_000)
  const t = ((day % SCHEDULE_DAYS) + SCHEDULE_DAYS) % SCHEDULE_DAYS
  return { base: t % BASES, variant: Math.floor(t / BASES) as Variant }
}

/** Grilles de base déjà calculées : chacune sert à 8 dates d'une même génération. */
const baseCache = new Map<string, Level>()

export function generateBaseLevel(
  index: LevelIndex,
  base: number,
  { stats = emptyStats(), maxAttempts = MAX_ATTEMPTS }: GenerateOptions = {},
): Level {
  const cacheKey = `${index}-${base}`
  const cached = baseCache.get(cacheKey)
  if (cached) return cached
  const rng = new Rng(`anglemort-${index}-base-${base}`)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    stats.attempts++
    const level = tryGenerate(rng, `base-${index}-${base}`, index, stats)
    if (level) {
      baseCache.set(cacheKey, level)
      return level
    }
  }
  throw new Error(`Angle mort : aucune grille de base ${base} pour le niveau ${index}`)
}

export function generateAngleMortLevel(
  date: string,
  index: LevelIndex,
  options: GenerateOptions = {},
): Level {
  const { base, variant } = levelOrigin(date)
  const level = transformLevel(generateBaseLevel(index, base, options), variant)
  return { ...level, id: `${date}-${index}` }
}
