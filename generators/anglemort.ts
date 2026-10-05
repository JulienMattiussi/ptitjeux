/**
 * Générateur Angle mort. Une grille de base par numéro de base (voir
 * `anglemort-schedule.ts`), déclinée en 8 symétries au fil du calendrier.
 * Une grille se construit en quatre temps : le couloir dans une salle vide,
 * des vigiles qui le matérialisent, des piliers qui en réduisent le nombre,
 * puis des indices jusqu'à l'unicité du couloir.
 */
import { GUARD_TYPES, isFacingAllowed } from '~/games/anglemort/engine'
import type { Guard, Level, Pool } from '~/games/anglemort/types'
import type { LevelIndex } from '~/games/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { addCluesUntilUnique, seedClues } from './anglemort-clues'
import {
  type GuardKit,
  anchorDiamond,
  borderCells,
  cornerPillars,
  doubles,
  greedyCover,
  placeDiamondAgainstWall,
  randomPath,
  reduceWithPillars,
  replaceGuardsWithMirrors,
} from './anglemort-construct'
import { fixedBase, levelOrigin } from './anglemort-schedule'
import { transformLevel } from './anglemort-symmetry'
import { Rng } from './random'

/** Étape à laquelle une tentative de génération a échoué. */
type FailureStage = 'path' | 'construct' | 'pillars' | 'diamond' | 'types' | 'mirror' | 'clues'

/** Étapes d'une tentative, dans l'ordre, pour en mesurer la durée. */
type GenerationStep =
  'path' | 'anchor' | 'cover' | 'pillars' | 'diamond' | 'mirror' | 'seed' | 'unique'

/** Événement de génération, pour suivre en direct où part le temps. */
type GenerationEvent =
  | { type: 'attempt'; attempt: number }
  | { type: 'failure'; stage: FailureStage }
  | { type: 'unique'; ms: number; complete: boolean; rivals: number; clues: number }
  | { type: 'step'; step: GenerationStep; ms: number }
  | { type: 'success'; clues: number; guards: number }

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
  /** Abonné aux événements de génération (facultatif). */
  onEvent?: (event: GenerationEvent) => void
}

export type GenerateOptions = {
  /** Statistiques à compléter ; leur `onEvent` reçoit les événements. */
  stats?: GenerationStats
  maxAttempts?: number
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

function fail(stats: GenerationStats, stage: FailureStage): null {
  stats.failures[stage]++
  stats.onEvent?.({ type: 'failure', stage })
  return null
}

type LevelParams = {
  /** Plafond du lot pour la construction : doubles seulement à partir du niveau 3. */
  poolCap: Pool
  /**
   * Piliers posés avant les vigiles, contre le diamant et dans `[min, max]`
   * coudes du couloir. `null` : aucun.
   */
  earlyPillars: [number, number] | null
  /** Nombre de vigiles visé : on ajoute des piliers jusqu'à l'atteindre. */
  targetGuards: number
  minPillars: number
  /** Plafond absolu de piliers, en plus de la densité : au-delà, la salle paraît encombrée. */
  maxPillars: number
  /**
   * Vigiles à deux lampes (angle ou opposé), la nouveauté du niveau 3. Au-delà
   * du maximum, la grille devient touffue.
   */
  minDoubles: number
  maxDoubles: number
  /** Diamant toujours contre le mur d'enceinte ou un pilier. */
  diamondAgainstWall: boolean
  /** 1 ou 2 vigiles remplacés par des miroirs. */
  mirrors: boolean
  /**
   * Indices posés d'office hors du couloir. Tirés au hasard après la pose des
   * vigiles, ils font moins bien que les indices choisis par
   * `addCluesUntilUnique`.
   */
  seedExtra: number
  /** Nombre total d'indices au-delà duquel une grille est rejetée. */
  maxClues: number
  /**
   * Nombre maximal de concurrents que le solveur trie. Au niveau 4, aucun :
   * avec les miroirs, un concurrent coûte ~10 s de solveur, on ajoute plutôt
   * des indices jusqu'à un seul couloir possible par la forme.
   */
  solveRivals: number
}

const SIMPLES_ONLY: Pool = { simple: 99, angle: 0, oppose: 0 }
const ALL_TYPES: Pool = { simple: 99, angle: 99, oppose: 99 }

const LEVEL_PARAMS: Record<LevelIndex, LevelParams> = {
  1: {
    poolCap: SIMPLES_ONLY,
    earlyPillars: null,
    targetGuards: 6,
    minPillars: 3,
    maxPillars: Infinity,
    minDoubles: 0,
    maxDoubles: 0,
    diamondAgainstWall: false,
    mirrors: false,
    seedExtra: 0,
    maxClues: 12,
    solveRivals: 300,
  },
  2: {
    poolCap: SIMPLES_ONLY,
    earlyPillars: null,
    targetGuards: 7,
    minPillars: 3,
    maxPillars: Infinity,
    minDoubles: 0,
    maxDoubles: 0,
    diamondAgainstWall: false,
    mirrors: false,
    seedExtra: 0,
    maxClues: 16,
    solveRivals: 300,
  },
  3: {
    poolCap: ALL_TYPES,
    earlyPillars: null,
    targetGuards: 8,
    minPillars: 4,
    maxPillars: Infinity,
    minDoubles: 2,
    maxDoubles: 3,
    diamondAgainstWall: true,
    mirrors: false,
    seedExtra: 1,
    maxClues: 18,
    solveRivals: 300,
  },
  4: {
    poolCap: ALL_TYPES,
    earlyPillars: [2, 3],
    targetGuards: 9,
    minPillars: 0,
    maxPillars: 10,
    minDoubles: 1,
    maxDoubles: 4,
    diamondAgainstWall: true,
    mirrors: true,
    seedExtra: 0,
    maxClues: 20,
    solveRivals: 0,
  },
}

const MAX_ATTEMPTS = 400
const MIN_TURNS = 3

function poolOf(guards: Guard[]): Pool {
  const pool: Pool = { simple: 0, angle: 0, oppose: 0 }
  for (const g of guards) pool[g.type]++
  return pool
}

function tryGenerate(
  rng: Rng,
  id: string,
  index: LevelIndex,
  stats: GenerationStats,
): Level | null {
  const params = LEVEL_PARAMS[index]
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
    pool: { ...params.poolCap },
    solution: [],
    parMoves: 0,
  }

  let lap = Date.now()
  const step = (name: GenerationStep) => {
    const now = Date.now()
    stats.onEvent?.({ type: 'step', step: name, ms: now - lap })
    lap = now
  }

  // 1. Le couloir, dans une salle vide.
  const minLength = width + height
  const maxLength = Math.max(minLength, Math.floor(width * height * 0.4))
  const path = randomPath(rng, empty, minLength + rng.nextInt(maxLength - minLength + 1), MIN_TURNS)
  step('path')
  if (!path) return fail(stats, 'path')
  let room: Level = { ...empty, diamond: path[path.length - 1] }
  if (params.earlyPillars) {
    const [min, max] = params.earlyPillars
    room = cornerPillars(
      rng,
      anchorDiamond(rng, room, path),
      path,
      min + rng.nextInt(max - min + 1),
    )
    step('anchor')
  }

  // 2. Des vigiles qui matérialisent le couloir, sans contrainte de nombre.
  const kit: GuardKit = {
    types: GUARD_TYPES.filter((t) => room.pool[t] > 0),
    maxDoubles: params.maxDoubles,
  }
  const started = Date.now()
  const first = greedyCover(rng, room, path, kit, [])
  step('cover')
  if (!first) {
    stats.constructMs += Date.now() - started
    return fail(stats, 'construct')
  }

  // 3. Des piliers pour ramener les vigiles au nombre visé.
  const reduced = reduceWithPillars(rng, { level: room, guards: first }, path, kit, params)
  step('pillars')
  const anchored = params.diamondAgainstWall
    ? placeDiamondAgainstWall(rng, reduced, path, kit)
    : reduced
  stats.constructMs += Date.now() - started
  step('diamond')
  if (!anchored) return fail(stats, 'diamond')

  const mirrored = params.mirrors
    ? replaceGuardsWithMirrors(rng, anchored, path, 1 + rng.nextInt(2))
    : anchored
  step('mirror')
  if (params.mirrors && mirrored.level.mirrors.length === 0) return fail(stats, 'mirror')
  const solution = mirrored.guards
  if (!solution.every((g) => isFacingAllowed(mirrored.level, g))) return fail(stats, 'construct')
  if (mirrored.level.pillars.length < params.minPillars) return fail(stats, 'pillars')
  const doubleCount = doubles(solution)
  if (doubleCount < params.minDoubles || doubleCount > params.maxDoubles) {
    return fail(stats, 'types')
  }

  // 4. Les indices guides, jusqu'à l'unicité du couloir.
  const seeded = seedClues(rng, mirrored.level, path, solution, params.seedExtra)
  step('seed')
  if (!seeded) return fail(stats, 'clues')
  const level: Level = { ...mirrored.level, pool: poolOf(solution), solution, clues: seeded }
  const unique = addCluesUntilUnique(rng, level, path, params.maxClues, params.solveRivals, stats)
  step('unique')
  if (!unique) return fail(stats, 'clues')
  stats.onEvent?.({
    type: 'success',
    clues: Object.keys(unique.clues).length,
    guards: solution.length,
  })
  return { ...unique, parMoves: solution.length }
}

/** Grilles de base déjà calculées : chacune sert à 8 dates d'une même génération. */
const baseCache = new Map<string, Level>()

function generateBaseLevel(
  index: LevelIndex,
  base: number,
  { stats = emptyStats(), maxAttempts = MAX_ATTEMPTS }: GenerateOptions,
): Level {
  const cacheKey = `${index}-${base}`
  const cached = baseCache.get(cacheKey)
  if (cached) return cached
  const fixed = fixedBase(index, base)
  if (fixed) {
    baseCache.set(cacheKey, fixed)
    return fixed
  }
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
