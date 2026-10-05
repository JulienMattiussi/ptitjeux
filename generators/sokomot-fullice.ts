/**
 * Niveau 4 de Sokomot : tout l'intérieur est gelé. Le joueur glisse à chaque
 * coup et s'appuie sur les blocs et les murs pour s'arrêter. Les cibles sont
 * alignées le long d'un mur, qui sert d'ancre commune pour arrêter les blocs
 * poussés vers lui : avec des cibles dispersées, la plupart n'auraient aucune
 * butée et la recherche à rebours ne trouverait pas d'état de départ.
 *
 * Génération **à rebours** : depuis l'état résolu, on applique des coups
 * inversés. Lue à l'envers, la suite de coups est une solution valide par
 * construction, sans explorer l'espace d'états à l'endroit.
 */
import type { Coord, Direction } from '~/games/sokomot/types'
import type { Rng } from './random'
import {
  DIRECTIONS,
  type LevelDraft,
  buildBorderWalls,
  cellKey,
  eq,
  letterBlocks,
} from './sokomot-grid'
import { stateKey } from './sokomot-search'

const MAX_DEPTH = 80
const MAX_STATES = 15_000
/** Positions de départ du joueur essayées dans l'état résolu. */
const START_TRIALS = 6

type RevBlock = { pos: Coord; letter: string }
type RevState = { player: Coord; blocks: RevBlock[] }
type RevMove = { direction: Direction; newState: RevState }

export function tryGenerateFullIce(
  rng: Rng,
  word: string,
  width: number,
  height: number,
): LevelDraft | null {
  const targets = pickWallAlignedPath(rng, word.length, width, height)
  if (!targets) return null

  const walls = buildBorderWalls(width, height)
  const wallSet = new Set(walls.map(cellKey))

  const ice: Coord[] = []
  for (let y = 1; y <= height - 2; y++) {
    for (let x = 1; x <= width - 2; x++) ice.push([x, y])
  }

  const letters = word.split('')
  const targetSet = new Set(targets.map(cellKey))
  const freeAtSolved = ice.filter((c) => !targetSet.has(cellKey(c)))
  if (freeAtSolved.length === 0) return null

  for (const startPlayer of rng.shuffle(freeAtSolved.slice()).slice(0, START_TRIALS)) {
    const solved: RevState = {
      player: startPlayer,
      blocks: targets.map((t, i) => ({ pos: t, letter: letters[i] })),
    }
    const minOffTarget = Math.max(2, Math.ceil(word.length / 2))
    const found = backwardBFS(solved, targets, letters, wallSet, width, height, minOffTarget)
    if (!found) continue
    return {
      walls,
      ice,
      player: found.state.player,
      blocks: letterBlocks(
        word,
        found.state.blocks.map((b) => b.pos),
      ),
      targets,
      solution: found.directions.slice().reverse(),
    }
  }
  return null
}

/**
 * Parcours en largeur à rebours depuis l'état résolu. Renvoie dès qu'il en
 * trouve un état où aucune cible ne porte sa lettre ; sinon, budget épuisé,
 * l'état le plus décollé s'il atteint `minOffTarget` blocs hors cible.
 */
function backwardBFS(
  initial: RevState,
  targets: Coord[],
  letters: string[],
  wallSet: Set<string>,
  width: number,
  height: number,
  minOffTarget: number,
): { state: RevState; directions: Direction[] } | null {
  const targetKeys = targets.map(cellKey)
  const offTargetCount = (state: RevState): number => {
    let count = 0
    for (let i = 0; i < targets.length; i++) {
      const blockHere = state.blocks.find((b) => cellKey(b.pos) === targetKeys[i])
      if (!blockHere || blockHere.letter !== letters[i]) count++
    }
    return count
  }
  // Deux blocs de même lettre sont interchangeables pour la victoire, donc
  // aussi pour la déduplication.
  const keyOf = (state: RevState) => stateKey(state.player, state.blocks)

  type Node = { state: RevState; directions: Direction[] }
  const visited = new Set<string>([keyOf(initial)])
  const queue: Node[] = [{ state: initial, directions: [] }]
  let best: Node | null = null
  let bestCount = -1

  while (queue.length > 0) {
    if (visited.size > MAX_STATES) break
    const node = queue.shift()!
    if (node.directions.length >= MAX_DEPTH) continue
    for (const move of computeReverseMoves(node.state, wallSet, width, height)) {
      const k = keyOf(move.newState)
      if (visited.has(k)) continue
      visited.add(k)
      const newNode: Node = {
        state: move.newState,
        directions: [...node.directions, move.direction],
      }
      const cnt = offTargetCount(move.newState)
      if (cnt === targets.length) return newNode
      if (cnt > bestCount) {
        bestCount = cnt
        best = newNode
      }
      queue.push(newNode)
    }
  }
  if (best && bestCount >= minOffTarget) return best
  return null
}

/** `wordLen` cases adjacentes le long d'un mur tiré au hasard. */
function pickWallAlignedPath(
  rng: Rng,
  wordLen: number,
  width: number,
  height: number,
): Coord[] | null {
  const interiorMaxX = width - 2
  const interiorMaxY = height - 2
  const line = (start: Coord, step: Coord): Coord[] =>
    Array.from({ length: wordLen }, (_, i) => [start[0] + i * step[0], start[1] + i * step[1]])
  const candidates: Coord[][] = []
  for (let sx = 1; sx <= interiorMaxX - wordLen + 1; sx++) {
    candidates.push(line([sx, 1], [1, 0]), line([sx, interiorMaxY], [1, 0]))
  }
  for (let sy = 1; sy <= interiorMaxY - wordLen + 1; sy++) {
    candidates.push(line([1, sy], [0, 1]), line([interiorMaxX, sy], [0, 1]))
  }
  if (candidates.length === 0) return null
  return rng.pick(candidates)
}

/**
 * Coups inversés valides depuis `state` : chacun donne un état antérieur
 * d'où le coup joué à l'endroit (glissade jusqu'au prochain obstacle)
 * ramène à `state`.
 * - Sans poussée : le joueur a glissé depuis une case A de la ligne derrière
 *   lui jusqu'à P ; la case devant P est donc un mur ou un bloc.
 * - Avec poussée : le premier bloc devant P a glissé depuis P (le joueur
 *   venait de P - D) et s'est arrêté contre un mur ou un bloc.
 */
function computeReverseMoves(
  state: RevState,
  wallSet: Set<string>,
  width: number,
  height: number,
): RevMove[] {
  const moves: RevMove[] = []
  const blockPosSet = new Set(state.blocks.map((b) => cellKey(b.pos)))
  const outside = (c: Coord) => c[0] < 0 || c[1] < 0 || c[0] >= width || c[1] >= height
  const isWallOrBlock = (c: Coord): boolean =>
    outside(c) || wallSet.has(cellKey(c)) || blockPosSet.has(cellKey(c))

  for (const { dir, vec } of DIRECTIONS) {
    const ahead: Coord = [state.player[0] + vec[0], state.player[1] + vec[1]]
    if (isWallOrBlock(ahead)) {
      let cur: Coord = state.player
      for (;;) {
        const from: Coord = [cur[0] - vec[0], cur[1] - vec[1]]
        if (isWallOrBlock(from)) break
        moves.push({ direction: dir, newState: { player: from, blocks: state.blocks } })
        cur = from
      }
    }

    const from: Coord = [state.player[0] - vec[0], state.player[1] - vec[1]]
    if (isWallOrBlock(from)) continue
    let cur: Coord = ahead
    while (!outside(cur) && !wallSet.has(cellKey(cur))) {
      if (blockPosSet.has(cellKey(cur))) {
        if (isWallOrBlock([cur[0] + vec[0], cur[1] + vec[1]])) {
          const blockIdx = state.blocks.findIndex((b) => eq(b.pos, cur))
          const newBlocks = state.blocks.map((b, i) =>
            i === blockIdx ? { pos: state.player, letter: b.letter } : b,
          )
          moves.push({ direction: dir, newState: { player: from, blocks: newBlocks } })
        }
        break
      }
      cur = [cur[0] + vec[0], cur[1] + vec[1]]
    }
  }
  return moves
}
