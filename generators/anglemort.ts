import { computeVision, isFloor, key, unseenCells } from '~/games/anglemort/engine'
import type { Guard, Level, Mirror, Pool, Pos } from '~/games/anglemort/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { Rng } from '~/lib/random'
import { poolOf, solveAngleMort, visibleKey } from './anglemort-solver'

type LevelIndex = 1 | 2 | 3 | 4

const MAX_ATTEMPTS = 400
const MAX_CLUES = 18
const CONSTRUCT_NODES = 20_000
const UNIQUE_NODES = 150_000

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
 * Marche aléatoire **induite** depuis la porte : chaque nouvelle case ne
 * touche aucune case déjà posée sauf la précédente. Sinon les cases non
 * surveillées formeraient un embranchement ou un bloc, pas un couloir.
 */
function randomPath(rng: Rng, level: Level, length: number): Pos[] | null {
  const path: Pos[] = [level.door]
  const used = new Set([key(...level.door)])
  while (path.length < length) {
    const [cx, cy] = path[path.length - 1]
    const options = STEPS.map(([dx, dy]): Pos => [cx + dx, cy + dy]).filter(([x, y]) => {
      if (!isFloor(level, x, y) || used.has(key(x, y))) return false
      return STEPS.every(([dx, dy]) => {
        const k = key(x + dx, y + dy)
        return k === key(cx, cy) || !used.has(k)
      })
    })
    if (options.length === 0) return null
    const next = rng.pick(options)
    path.push(next)
    used.add(key(...next))
  }
  return path
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
 * Ajoute des indices tirés de la solution voulue jusqu'à l'unicité. Chaque
 * nouvel indice est pris là où la solution concurrente diffère, pour
 * l'éliminer à coup sûr.
 */
function addCluesUntilUnique(rng: Rng, level: Level, solution: Guard[]): Level | null {
  const truth = seenCounts(level, solution)
  const occupied = new Set(solution.map((g) => key(...g.pos)))
  const ends = new Set([key(...level.door), key(...level.diamond)])
  let current = level
  for (let round = 0; round <= MAX_CLUES; round++) {
    const result = solveAngleMort(current, { exactPool: true, limit: 2, maxNodes: UNIQUE_NODES })
    if (result.complete && result.solutions.length === 1) return current
    if (result.solutions.length === 0 && result.complete) return null
    const intended = visibleKey(current, solution)
    const rival = result.solutions.find((s) => visibleKey(current, s) !== intended)
    const rivalSeen = rival ? seenCounts(current, rival) : undefined
    const rivalGuards = new Set(rival?.map((g) => key(...g.pos)))
    const free: Pos[] = []
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const k = key(x, y)
        if (
          !isFloor(level, x, y) ||
          occupied.has(k) ||
          ends.has(k) ||
          current.clues[k] !== undefined
        )
          continue
        free.push([x, y])
      }
    }
    const discriminating = rivalSeen
      ? free.filter(([x, y]) => rivalGuards.has(key(x, y)) || rivalSeen[y][x] !== truth[y][x])
      : free
    const pool = discriminating.length > 0 ? discriminating : free
    if (pool.length === 0) return null
    const [x, y] = rng.pick(pool)
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

function tryGenerate(rng: Rng, date: string, index: LevelIndex): Level | null {
  const { width, height } = GAME_SIZE.anglemort(index)
  const door = rng.pick(borderCells(width, height))
  const reserved = new Set([key(...door)])
  const pillars = scatter(rng, width, height, Math.round(width * height * 0.12), reserved)
  pillars.forEach((p) => reserved.add(key(...p)))
  const mirrors: Mirror[] =
    index === 4
      ? scatter(rng, width, height, 1 + rng.nextInt(2), reserved).map((pos) => ({
          pos,
          kind: rng.pick(['/', '\\'] as const),
        }))
      : []

  const base: Level = {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height}`,
    width,
    height,
    pillars,
    mirrors,
    door,
    diamond: door,
    clues: {},
    pool: poolCap(index),
    solution: [],
  }

  const floorCount = width * height - pillars.length - mirrors.length
  const minLength = width + height
  const maxLength = Math.max(minLength, Math.floor(floorCount * 0.4))
  const path = randomPath(rng, base, minLength + rng.nextInt(maxLength - minLength + 1))
  if (!path || countTurns(path) < 3) return null

  const withPath: Level = { ...base, diamond: path[path.length - 1] }
  const onPath = new Set(path.map((p) => key(...p)))
  const offPath: Pos[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isFloor(withPath, x, y) && !onPath.has(key(x, y))) offPath.push([x, y])
    }
  }

  const built = solveAngleMort(withPath, {
    exactPool: false,
    forcedPath: path,
    forbiddenPath: offPath,
    limit: 1,
    maxNodes: CONSTRUCT_NODES,
    rng,
  })
  if (!built.solutions[0]) return null
  const solution = pruneRedundant(withPath, path, built.solutions[0])
  if (index >= 3 && solution.every((g) => g.type === 'simple')) return null
  if (index === 4 && !built.usesMirror[0]) return null

  const pool = poolOf(solution)
  const unique = addCluesUntilUnique(rng, { ...withPath, pool, solution }, solution)
  if (!unique) return null
  return { ...unique, parMoves: solution.length }
}

export function generateAngleMortLevel(date: string, index: LevelIndex): Level {
  const rng = new Rng(`anglemort-${date}-${index}`)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const level = tryGenerate(rng, date, index)
    if (level) return level
  }
  throw new Error(`Angle mort : aucun niveau valide pour ${date} niveau ${index}`)
}
