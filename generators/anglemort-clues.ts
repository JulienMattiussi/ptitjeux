/**
 * Indices d'une grille Angle mort : les indices posés d'office, puis ceux
 * ajoutés un à un jusqu'à ce qu'un seul couloir reste possible.
 */
import { computeVision, isFloor, key } from '~/games/anglemort/engine'
import type { Guard, Level, Pos } from '~/games/anglemort/types'
import type { GenerationStats } from './anglemort'
import { offCorridor } from './anglemort-construct'
import {
  type RivalCheck,
  checkRival,
  compatibleCorridors,
  corridorCells,
  corridorId,
  poseFitsClues,
} from './anglemort-corridors'
import type { Rng } from './random'

/** Indices posés d'office : sur le couloir, et de valeur 2. */
const SEED_CORRIDOR = 3
const SEED_TWOS = 2
/** Plafond de couloirs énumérés : au-delà, on pose des indices sans appeler le solveur. */
const MAX_CORRIDORS = 200_000
/** Budget du solveur pour un couloir concurrent, à la génération. */
const RIVAL_NODES = 50_000

/**
 * Indices posés d'office, avant toute vérification d'unicité : au moins 3 sur
 * le couloir (des « 0 »), au moins 2 « 2 », et un « 3 » ou « 4 » s'il en
 * existe, plus `extra` indices hors du couloir. `null` si la grille n'offre pas
 * deux cases éclairées par 2 vigiles.
 */
export function seedClues(
  rng: Rng,
  level: Level,
  path: Pos[],
  solution: Guard[],
  extra: number,
): Record<string, number> | null {
  const truth = computeVision(level, solution).seen
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
 * pose l'indice qui en élimine le plus. Quand il en reste au plus
 * `solveRivals`, le solveur écarte ceux qu'aucune pose ne produit (ils ne
 * coûtent aucun indice), et on ne vise que les concurrents réalisables ou non
 * tranchés.
 *
 * Chaque concurrent passe au solveur une seule fois : un impossible le reste
 * quand on ajoute des indices, un non tranché reste une cible (un indice de
 * chemin finira par l'éliminer), et un réalisable garde sa pose, revérifiée à
 * chaque tour en quelques millisecondes. Le solveur ne repasse que si cette
 * pose ne respecte plus un nouvel indice.
 */
export function addCluesUntilUnique(
  rng: Rng,
  level: Level,
  path: Pos[],
  maxClues: number,
  solveRivals: number,
  stats: GenerationStats,
): Level | null {
  const w = level.width
  const truth = computeVision(level, level.solution).seen
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
    if (complete && rivals.length > 0 && rivals.length <= solveRivals) {
      const clued = current
      rivals = rivals.filter((c) => {
        const id = corridorId(c)
        let verdict = verdicts.get(id)
        if (!verdict || (verdict.status === 'possible' && !poseFitsClues(clued, verdict.pose))) {
          verdict = checkRival(clued, c, RIVAL_NODES)
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
