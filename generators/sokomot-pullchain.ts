/**
 * Niveau 3 de Sokomot : Sokoban classique, sans glace, généré à rebours. On
 * part de l'état résolu et on **tire** les blocs case par case, dans des
 * directions variées : leur trajet zigzague au lieu d'aller en ligne droite.
 *
 * Un tirage est l'inverse d'une poussée : bloc en C, tiré dans la direction
 * opposée à D, il passe en C - D et le joueur en C - 2D. Avant chaque
 * tirage, on vérifie que le joueur peut marcher jusqu'à C - D sans pousser
 * de bloc : la suite inverse des tirages est donc une solution valide.
 */
import type { Coord, Direction } from '~/games/sokomot/types'
import type { Rng } from './random'
import {
  DIRECTIONS,
  type LevelDraft,
  buildBorderWalls,
  cellKey,
  eq,
  inInterior,
  letterBlocks,
  placeTargetsRandomWalk,
  walkPath,
} from './sokomot-grid'

/** Plafond par bloc : un bloc peut compenser un autre coincé, sans saturer la grille. */
const SOFT_CAP_PER_CUBE = 3
const MAX_ROUNDS = 50

type PullRecord = {
  cubeIdx: number
  pushDir: Direction
  /** Case du bloc avant le tirage, donc après la poussée correspondante. */
  cubeTo: Coord
  /** Case du bloc après le tirage, donc avant la poussée. */
  cubeFrom: Coord
  /** Case du joueur au moment de la poussée. */
  playerPrePush: Coord
}

export function tryGenerateSokobanPullChain(
  rng: Rng,
  word: string,
  width: number,
  height: number,
  pullsPerCube: number,
): LevelDraft | null {
  const wordLen = word.length
  const targets = placeTargetsRandomWalk(rng, wordLen, width, height)
  if (!targets) return null
  const targetSet = new Set(targets.map(cellKey))

  const walls = buildBorderWalls(width, height)
  const wallSet = new Set(walls.map(cellKey))

  const cubes: Coord[] = targets.map((t) => [t[0], t[1]] as Coord)

  const freeCells: Coord[] = []
  for (let y = 1; y <= height - 2; y++) {
    for (let x = 1; x <= width - 2; x++) {
      const c: Coord = [x, y]
      if (!targetSet.has(cellKey(c))) freeCells.push(c)
    }
  }
  if (freeCells.length === 0) return null
  let player: Coord = rng.pick(freeCells)

  const pulls: PullRecord[] = []
  const pullsCount = cubes.map(() => 0)
  const lastPullVec: (Coord | null)[] = cubes.map(() => null)

  let progress = true
  let rounds = 0
  while (progress && rounds++ < MAX_ROUNDS) {
    progress = false
    for (const cubeIdx of rng.shuffle(cubes.map((_, i) => i))) {
      if (pullsCount[cubeIdx] >= SOFT_CAP_PER_CUBE) continue
      const pulled = tryOneSokobanPull(
        cubes,
        cubeIdx,
        player,
        wallSet,
        rng,
        width,
        height,
        lastPullVec[cubeIdx],
      )
      if (!pulled) continue
      pulls.push(pulled.record)
      cubes[cubeIdx] = pulled.record.cubeFrom
      player = pulled.record.playerPrePush
      pullsCount[cubeIdx]++
      lastPullVec[cubeIdx] = pulled.usedVec
      progress = true
    }
  }

  // Un total minimal de tirages, et chaque bloc tiré au moins une fois (sinon
  // une lettre serait déjà sur sa cible).
  if (pulls.length < wordLen * pullsPerCube) return null
  if (pullsCount.some((n) => n === 0)) return null

  const solution: Direction[] = []
  let curPlayer: Coord = player
  const cubesNow: Coord[] = cubes.map((c) => [c[0], c[1]] as Coord)
  for (const pull of pulls.slice().reverse()) {
    if (!eq(curPlayer, pull.playerPrePush)) {
      const obstacles = new Set([...wallSet, ...cubesNow.map(cellKey)])
      const path = walkPath(curPlayer, pull.playerPrePush, obstacles, width, height)
      if (!path) return null
      solution.push(...path)
      curPlayer = pull.playerPrePush
    }
    solution.push(pull.pushDir)
    if (cubesNow.findIndex((c) => eq(c, pull.cubeFrom)) !== pull.cubeIdx) return null
    cubesNow[pull.cubeIdx] = [pull.cubeTo[0], pull.cubeTo[1]] as Coord
    curPlayer = pull.cubeFrom
  }
  if (cubesNow.some((c, i) => !eq(c, targets[i]))) return null

  // Solution valide mais souvent plus longue que nécessaire (zigzags) :
  // `finalize` la remplace par celle des solveurs quand ils font mieux.
  return { walls, ice: [], player, blocks: letterBlocks(word, cubes), targets, solution }
}

/**
 * Tire le bloc `cubeIdx` d'une case, dans une direction où la case d'arrivée
 * du bloc et celle du joueur sont libres, et que le joueur peut atteindre en
 * marchant. Les virages (direction perpendiculaire au tirage précédent) sont
 * essayés d'abord.
 */
function tryOneSokobanPull(
  cubes: Coord[],
  cubeIdx: number,
  player: Coord,
  wallSet: Set<string>,
  rng: Rng,
  width: number,
  height: number,
  lastVec: Coord | null,
): { record: PullRecord; usedVec: Coord } | null {
  const cube = cubes[cubeIdx]
  const cubeKeys = new Set(cubes.map(cellKey))
  const isOccupied = (c: Coord): boolean => {
    if (!inInterior(c, width, height)) return true
    const k = cellKey(c)
    return wallSet.has(k) || (cubeKeys.has(k) && !eq(c, cube))
  }

  type Candidate = { dir: Direction; vec: Coord; cubeFrom: Coord; newPlayer: Coord }
  const perpendicular: Candidate[] = []
  const sameAxis: Candidate[] = []
  for (const { dir, vec } of DIRECTIONS) {
    const cubeFrom: Coord = [cube[0] - vec[0], cube[1] - vec[1]]
    const newPlayer: Coord = [cube[0] - 2 * vec[0], cube[1] - 2 * vec[1]]
    if (isOccupied(cubeFrom) || isOccupied(newPlayer)) continue
    const turn =
      !lastVec || !((vec[0] !== 0 && lastVec[0] !== 0) || (vec[1] !== 0 && lastVec[1] !== 0))
    ;(turn ? perpendicular : sameAxis).push({ dir, vec, cubeFrom, newPlayer })
  }
  if (perpendicular.length + sameAxis.length === 0) return null

  const obstacles = new Set([...wallSet, ...cubeKeys])
  for (const c of [...rng.shuffle(perpendicular), ...rng.shuffle(sameAxis)]) {
    if (!walkPath(player, c.cubeFrom, obstacles, width, height)) continue
    return {
      record: {
        cubeIdx,
        pushDir: c.dir,
        cubeTo: cube,
        cubeFrom: c.cubeFrom,
        playerPrePush: c.newPlayer,
      },
      usedVec: c.vec,
    }
  }
  return null
}
