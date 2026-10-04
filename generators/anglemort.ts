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
import type { Dir, Guard, GuardType, Level, Pool, Pos } from '~/games/anglemort/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { Rng } from '~/lib/random'
import {
  checkRival,
  compatibleCorridors,
  corridorCells,
  corridorId,
  poseFitsClues,
  type RivalCheck,
} from './anglemort-corridors'
import { poolOf } from './anglemort-solver'
import { VARIANTS, type Variant, transformLevel } from './anglemort-symmetry'

type LevelIndex = 1 | 2 | 3 | 4

/** Étape à laquelle une tentative de génération a échoué. */
export type FailureStage =
  'path' | 'construct' | 'pillars' | 'diamond' | 'types' | 'mirror' | 'clues'

/**
 * Statistiques de génération, pour mesurer et régler le générateur. Ne
 * change rien au niveau produit.
 */
export type GenerationStats = {
  attempts: number
  failures: Record<FailureStage, number>
  constructMs: number
  /** Abonné aux événements de génération (instrumentation, facultatif). */
  onEvent?: (event: GenerationEvent) => void
  uniqueMs: number
  uniqueCalls: number
  /** Vérifications d'unicité interrompues faute de budget. */
  uniqueAborted: number
}

function fail(stats: GenerationStats, stage: FailureStage): null {
  stats.failures[stage]++
  stats.onEvent?.({ type: 'failure', stage })
  return null
}

export function emptyStats(): GenerationStats {
  return {
    attempts: 0,
    failures: { path: 0, construct: 0, pillars: 0, diamond: 0, types: 0, mirror: 0, clues: 0 },
    constructMs: 0,
    uniqueMs: 0,
    uniqueCalls: 0,
    uniqueAborted: 0,
  }
}

/** Événement de génération, pour suivre en direct où part le temps. */
export type GenerationEvent =
  | { type: 'attempt'; attempt: number }
  | { type: 'failure'; stage: FailureStage }
  | { type: 'unique'; ms: number; complete: boolean; rivals: number; clues: number }
  | { type: 'success'; clues: number; guards: number }

export type GenerateOptions = {
  stats?: GenerationStats
  maxAttempts?: number
  onEvent?: (event: GenerationEvent) => void
}

const MAX_ATTEMPTS = 400
/** Nombre total d'indices au-delà duquel une grille est rejetée. */
const MAX_CLUES: Record<LevelIndex, number> = { 1: 12, 2: 16, 3: 18, 4: 20 }
/** Indices posés d'office : sur le couloir, et de valeur 2. */
const SEED_CORRIDOR = 3
const SEED_TWOS = 2
/** Indices supplémentaires posés d'office hors du couloir, pour restreindre d'emblée les options. */
const SEED_EXTRA: Record<LevelIndex, number> = { 1: 0, 2: 0, 3: 1, 4: 1 }
const PATH_STEPS = 4_000
const MIN_TURNS = 3
/** Marge de score acceptée dans le choix glouton (variété des niveaux). */
const GREEDY_SLACK = 1
/** Plafond de couloirs énumérés : au-delà, on pose des indices sans appeler le solveur. */
const MAX_CORRIDORS = 200_000
/** Nombre de concurrents à partir duquel le solveur trie les réalisables. */
const SOLVE_RIVALS = 300
/** Budget du solveur pour un couloir concurrent (génération et tests d'intégrité). */
export const RIVAL_NODES = 50_000
/** Plafond d'énumération des tests d'intégrité. */
export const PROOF_CORRIDORS = 1_000_000

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

function seenCounts(level: Level, guards: Guard[]): number[][] {
  return computeVision(level, guards).seen
}

/**
 * Indices posés d'office, avant toute vérification d'unicité : au moins 3 sur
 * le couloir (des « 0 »), au moins 2 « 2 », et un « 3 » ou « 4 » s'il en
 * existe, plus `extra` indices hors du couloir. `null` si la grille n'offre pas
 * deux cases éclairées par 2 vigiles.
 */
function seedClues(
  rng: Rng,
  level: Level,
  path: Pos[],
  solution: Guard[],
  extra: number,
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
  const taken = new Set(picked.map(([x, y]) => key(x, y)))
  picked.push(...rng.shuffle(lit.filter(([x, y]) => !taken.has(key(x, y)))).slice(0, extra))
  return Object.fromEntries(picked.map(([x, y]) => [key(x, y), truth[y][x]]))
}

/**
 * Complète les indices jusqu'à l'unicité du couloir. À chaque tour, on liste
 * les couloirs compatibles avec les indices. Tant qu'ils sont nombreux, on
 * pose l'indice qui en élimine le plus. Quand il en reste peu, le solveur
 * écarte ceux qu'aucune pose ne produit (ils ne coûtent aucun indice), et on
 * ne vise que les concurrents réalisables ou non tranchés.
 *
 * Chaque concurrent passe au solveur une seule fois : un impossible le reste
 * quand on ajoute des indices, un non tranché reste une cible (un indice de
 * chemin finira par l'éliminer), et un réalisable garde sa pose, revérifiée à
 * chaque tour en quelques millisecondes. Le solveur ne repasse que si cette
 * pose ne respecte plus un nouvel indice.
 */
function addCluesUntilUnique(
  rng: Rng,
  level: Level,
  path: Pos[],
  maxClues: number,
  stats: GenerationStats,
): Level | null {
  const w = level.width
  const truth = seenCounts(level, level.solution)
  const occupied = new Set(level.solution.map((g) => key(...g.pos)))
  const ends = new Set([key(...level.door), key(...level.diamond)])
  const intended = corridorCells(level, path)
  const intendedId = corridorId(intended)
  const verdicts = new Map<string, RivalCheck>()
  let current = level
  while (Object.keys(current.clues).length <= maxClues) {
    const started = Date.now()
    const { corridors, complete } = compatibleCorridors(current, MAX_CORRIDORS)
    let rivals = corridors.filter((c) => corridorId(c) !== intendedId)
    if (complete && rivals.length <= SOLVE_RIVALS) {
      const level = current
      rivals = rivals.filter((c) => {
        const id = corridorId(c)
        let verdict = verdicts.get(id)
        if (!verdict || (verdict.status === 'possible' && !poseFitsClues(level, verdict.pose))) {
          verdict = checkRival(level, c, RIVAL_NODES)
          verdicts.set(id, verdict)
        }
        return verdict.status !== 'impossible'
      })
    }
    stats.uniqueMs += Date.now() - started
    stats.uniqueCalls++
    if (!complete) stats.uniqueAborted++
    stats.onEvent?.({
      type: 'unique',
      ms: Date.now() - started,
      complete,
      rivals: rivals.length,
      clues: Object.keys(current.clues).length,
    })
    if (complete && rivals.length === 0) return current

    // Un « 0 » élimine les couloirs qui évitent sa case, un chiffre positif
    // ceux qui la traversent.
    const free: Pos[] = []
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < w; x++) {
        const k = key(x, y)
        if (isFloor(level, x, y) && !occupied.has(k) && !ends.has(k) && !(k in current.clues)) {
          free.push([x, y])
        }
      }
    }
    const score = ([x, y]: Pos) => {
      const i = y * w + x
      return rivals.filter((c) => c[i] !== intended[i]).length
    }
    const scores = free.map(score)
    const best = Math.max(0, ...scores)
    if (best === 0) return null
    const [x, y] = rng.pick(free.filter((_, j) => scores[j] === best))
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
  let current = guards
  for (const guard of guards) {
    const rest = current.filter((g) => g !== guard)
    if (keepsCorridor(level, path, rest)) current = rest
  }
  return current
}

/** Nombre de vigiles visé par niveau : on ajoute des piliers jusqu'à l'atteindre. */
const TARGET_GUARDS: Record<LevelIndex, number> = { 1: 6, 2: 7, 3: 8, 4: 9 }
/** Nombre minimal de piliers par niveau. */
const MIN_PILLARS: Record<LevelIndex, number> = { 1: 3, 2: 3, 3: 4, 4: 0 }
/** Nombre minimal de vigiles à deux lampes (angle ou opposé), la nouveauté du niveau 3. */
const MIN_DOUBLES: Record<LevelIndex, number> = { 1: 0, 2: 0, 3: 2, 4: 1 }
/** À partir du niveau 3, le diamant est toujours contre le mur d'enceinte ou un pilier. */
const DIAMOND_AGAINST_WALL: Record<LevelIndex, boolean> = { 1: false, 2: false, 3: true, 4: true }
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

/** Vrai si une case voisine du diamant est hors de la salle ou un pilier. */
function diamondAgainstWall(level: Level): boolean {
  const [x, y] = level.diamond
  return STEPS.some(([dx, dy]) => {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return true
    return level.pillars.some((p) => p[0] === nx && p[1] === ny)
  })
}

/**
 * Colle le diamant à un pilier s'il ne touche pas déjà le mur : on essaie un
 * pilier sur chaque case voisine hors couloir, en réparant la couverture des
 * vigiles. `null` si aucune case ne convient.
 */
function placeDiamondAgainstWall(
  rng: Rng,
  level: Level,
  path: Pos[],
  types: readonly GuardType[],
  guards: Guard[],
): { level: Level; guards: Guard[] } | null {
  if (diamondAgainstWall(level)) return { level, guards }
  const onPath = new Set(path.map((p) => key(...p)))
  const [x, y] = level.diamond
  const options = rng.shuffle(
    STEPS.map(([dx, dy]): Pos => [x + dx, y + dy]).filter(
      ([nx, ny]) => isFloor(level, nx, ny) && !onPath.has(key(nx, ny)),
    ),
  )
  for (const pos of options) {
    const candidate: Level = { ...level, pillars: [...level.pillars, pos] }
    const kept = guards.filter((g) => !samePos(g.pos, pos) && isFacingAllowed(candidate, g))
    const repaired = greedyCover(rng, candidate, path, types, pruneRedundant(candidate, path, kept))
    if (repaired) return { level: candidate, guards: repaired }
  }
  return null
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
    return fail(stats, 'path')
  }
  const room: Level = { ...empty, diamond: path[path.length - 1] }

  // 2. Des vigiles qui matérialisent le couloir, sans contrainte de nombre.
  const types = GUARD_TYPES.filter((t) => room.pool[t] > 0)
  const started = Date.now()
  const first = greedyCover(rng, room, path, types, [])
  if (!first) {
    stats.constructMs += Date.now() - started
    return fail(stats, 'construct')
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
  const anchored = DIAMOND_AGAINST_WALL[index]
    ? placeDiamondAgainstWall(rng, reduced.level, path, types, reduced.guards)
    : reduced
  stats.constructMs += Date.now() - started
  if (!anchored) return fail(stats, 'diamond')

  // Niveau 4 : 1 ou 2 vigiles remplacés par des miroirs.
  const mirrored =
    index === 4
      ? replaceGuardsWithMirrors(rng, anchored.level, path, anchored.guards, 1 + rng.nextInt(2))
      : anchored
  if (index === 4 && mirrored.level.mirrors.length === 0) return fail(stats, 'mirror')
  const solution = mirrored.guards
  if (!solution.every((g) => isFacingAllowed(mirrored.level, g))) {
    return fail(stats, 'construct')
  }
  if (mirrored.level.pillars.length < MIN_PILLARS[index]) {
    return fail(stats, 'pillars')
  }
  if (solution.filter((g) => g.type !== 'simple').length < MIN_DOUBLES[index]) {
    return fail(stats, 'types')
  }

  // 4. Les indices guides, jusqu'à l'unicité du couloir.
  const pool = poolOf(solution)
  const seeded = seedClues(rng, { ...mirrored.level, solution }, path, solution, SEED_EXTRA[index])
  if (!seeded) {
    return fail(stats, 'clues')
  }
  const level: Level = { ...mirrored.level, pool, solution, clues: seeded }
  const unique = addCluesUntilUnique(rng, level, path, MAX_CLUES[index], stats)
  if (!unique) {
    return fail(stats, 'clues')
  }
  stats.onEvent?.({
    type: 'success',
    clues: Object.keys(unique.clues).length,
    guards: solution.length,
  })
  return { ...unique, parMoves: solution.length }
}

function keepsCorridor(level: Level, path: Pos[], guards: Guard[]): boolean {
  const expected = new Set(path.map((p) => key(...p)))
  const cells = unseenCells(level, guards, computeVision(level, guards))
  return cells.length === expected.size && cells.every((c) => expected.has(key(...c)))
}

/**
 * Vrai si chaque miroir est indispensable : remplacé par un pilier, il
 * laisserait des cases hors du couloir dans l'ombre. Un miroir qui ne renvoie
 * la lumière que dans le mur ne serait qu'un pilier déguisé.
 */
function mirrorsEssential(level: Level, path: Pos[], guards: Guard[]): boolean {
  return level.mirrors.every((m) => {
    const walled: Level = {
      ...level,
      mirrors: level.mirrors.filter((o) => o !== m),
      pillars: [...level.pillars, m.pos],
    }
    return !keepsCorridor(walled, path, guards)
  })
}

/**
 * Remplace jusqu'à `count` vigiles par des miroirs. Un vigile qui reçoit un
 * faisceau par le côté peut céder sa place à un miroir qui renvoie ce faisceau
 * sur sa propre ligne : ses cases restent éclairées, avec un vigile de moins.
 * On essaie chaque vigile dans les deux sens de miroir, et on garde le
 * remplacement si le couloir est intact et chaque miroir indispensable.
 */
function replaceGuardsWithMirrors(
  rng: Rng,
  level: Level,
  path: Pos[],
  guards: Guard[],
  count: number,
): { level: Level; guards: Guard[] } {
  let current = { level, guards }
  for (let placed = 0; placed < count; placed++) {
    const options = rng.shuffle(
      current.guards.flatMap((g) => (['/', '\\'] as const).map((kind) => ({ g, kind }))),
    )
    const next = options
      .map(({ g, kind }) => ({
        level: { ...current.level, mirrors: [...current.level.mirrors, { pos: g.pos, kind }] },
        guards: current.guards.filter((o) => o !== g),
      }))
      .find(
        (c) => keepsCorridor(c.level, path, c.guards) && mirrorsEssential(c.level, path, c.guards),
      )
    if (!next) break
    current = next
  }
  return current
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
  { stats = emptyStats(), maxAttempts = MAX_ATTEMPTS, onEvent }: GenerateOptions = {},
): Level {
  if (onEvent) stats.onEvent = onEvent
  const cacheKey = `${index}-${base}`
  const cached = baseCache.get(cacheKey)
  if (cached) return cached
  const rng = new Rng(`anglemort-${index}-base-${base}`)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    stats.attempts++
    stats.onEvent?.({ type: 'attempt', attempt: attempt + 1 })
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
