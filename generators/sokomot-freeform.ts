/**
 * Niveaux 1 et 2 de Sokomot : chaque bloc est posé à `slideLength` cases de
 * sa cible, dans une direction de poussée tirée au hasard.
 * - Niveau 1 : bloc adjacent à sa cible, une poussée suffit.
 * - Niveau 2 : deux cases d'écart dont une case de glace intermédiaire : le
 *   bloc poussé glisse et s'arrête sur la cible, qui n'est pas gelée.
 * La solution pousse les blocs dans l'ordre du mot ; des obstacles aléatoires
 * sont ensuite posés hors des cases qu'elle utilise.
 */
import type { Coord, Direction } from '~/games/sokomot/types'
import type { Rng } from './random'
import {
  DIRECTIONS,
  type LevelDraft,
  buildBorderWalls,
  cellKey,
  inInterior,
  letterBlocks,
  placeRandomObstacles,
  placeTargetsRandomWalk,
  tracePlayerCells,
  vectorOf,
  walkPath,
} from './sokomot-grid'

export type FreeformParams = {
  slideLength: number
  /** Cases entre bloc et cible gelées (le bloc glisse) ; sinon poussées une à une. */
  iceBetween: boolean
  obstacleCount: number
}

type Placement = {
  blocks: Coord[]
  pushDirs: Direction[]
  pushers: Coord[]
  ice: Coord[]
  /** Sans glace : cases entre bloc et cible, à garder libres pour les poussées. */
  pushPath: Coord[]
}

/**
 * Pour chaque cible, choisit une direction de poussée et en déduit la case
 * du bloc, celle du pousseur et les cases intermédiaires. `null` si une
 * cible ne peut pas être servie sans conflit.
 */
function placeBlocksWithSlide(
  rng: Rng,
  targets: Coord[],
  { slideLength, iceBetween }: FreeformParams,
  width: number,
  height: number,
): Placement | null {
  const targetSet = new Set(targets.map(cellKey))
  const usedBlocks = new Set<string>()
  const allIceSet = new Set<string>()
  const allIce: Coord[] = []
  const allPushPath: Coord[] = []
  const allPushPathSet = new Set<string>()
  const blocks: Coord[] = []
  const pushDirs: Direction[] = []
  const pushers: Coord[] = []

  for (const t of targets) {
    let placed = false
    const order = rng.shuffle([...DIRECTIONS])
    for (const { dir, vec } of order) {
      const block: Coord = [t[0] - slideLength * vec[0], t[1] - slideLength * vec[1]]
      const pusher: Coord = [t[0] - (slideLength + 1) * vec[0], t[1] - (slideLength + 1) * vec[1]]
      if (!inInterior(block, width, height)) continue
      if (!inInterior(pusher, width, height)) continue

      const middleCells: Coord[] = []
      let valid = true
      for (let i = 1; i < slideLength; i++) {
        const c: Coord = [t[0] - i * vec[0], t[1] - i * vec[1]]
        if (
          !inInterior(c, width, height) ||
          targetSet.has(cellKey(c)) ||
          usedBlocks.has(cellKey(c))
        ) {
          valid = false
          break
        }
        middleCells.push(c)
      }
      if (!valid) continue

      const blockKey = cellKey(block)
      const pusherKey = cellKey(pusher)
      // Un bloc sur de la glace ferait glisser le joueur qui prend sa place.
      if (targetSet.has(blockKey)) continue
      if (usedBlocks.has(blockKey)) continue
      if (allIceSet.has(blockKey)) continue
      // Sur la trajectoire d'un bloc déjà placé, il bloquerait sa poussée.
      if (allPushPathSet.has(blockKey)) continue
      if (usedBlocks.has(pusherKey)) continue
      if (allIceSet.has(pusherKey)) continue

      blocks.push(block)
      pushDirs.push(dir)
      pushers.push(pusher)
      usedBlocks.add(blockKey)
      const [cells, cellSet] = iceBetween ? [allIce, allIceSet] : [allPushPath, allPushPathSet]
      for (const c of middleCells) {
        const k = cellKey(c)
        if (!cellSet.has(k)) {
          cells.push(c)
          cellSet.add(k)
        }
      }
      placed = true
      break
    }
    if (!placed) return null
  }
  return { blocks, pushDirs, pushers, ice: allIce, pushPath: allPushPath }
}

/**
 * Pousse les blocs dans l'ordre des cibles : le joueur marche jusqu'au
 * pousseur (en évitant murs, blocs et glace), puis pousse une fois (glace,
 * le bloc glisse) ou `slideLength` fois. `null` si un pousseur est
 * inaccessible.
 */
function solveInOrder(
  initialPlayer: Coord,
  placement: Placement,
  targets: Coord[],
  walls: Set<string>,
  { slideLength, iceBetween }: FreeformParams,
  width: number,
  height: number,
): Direction[] | null {
  let player = initialPlayer
  const currentBlocks = placement.blocks.slice()
  const moves: Direction[] = []
  const ice = placement.ice.map(cellKey)

  for (let i = 0; i < currentBlocks.length; i++) {
    const obstacles = new Set<string>([...walls, ...ice, ...currentBlocks.map(cellKey)])
    const pusher = placement.pushers[i]
    const path = walkPath(player, pusher, obstacles, width, height)
    if (!path) return null
    moves.push(...path)

    const pushCount = iceBetween ? 1 : slideLength
    for (let k = 0; k < pushCount; k++) moves.push(placement.pushDirs[i])
    if (iceBetween) {
      // Le bloc glisse jusqu'à la cible ; le joueur s'arrête où était le bloc.
      player = currentBlocks[i]
    } else {
      const vec = vectorOf(placement.pushDirs[i])
      player = [targets[i][0] - vec[0], targets[i][1] - vec[1]]
    }
    currentBlocks[i] = targets[i]
  }
  return moves
}

/** Départ sur le pousseur du premier bloc, à défaut la première case libre. */
function startCell(occupied: Set<string>, firstPusher: Coord, width: number, height: number) {
  if (!occupied.has(cellKey(firstPusher))) return firstPusher
  for (let y = 1; y <= height - 2; y++) {
    for (let x = 1; x <= width - 2; x++) {
      if (!occupied.has(cellKey([x, y]))) return [x, y] as Coord
    }
  }
  return null
}

export function tryGenerateFreeform(
  rng: Rng,
  word: string,
  width: number,
  height: number,
  params: FreeformParams,
): LevelDraft | null {
  const targets = placeTargetsRandomWalk(rng, word.length, width, height)
  if (!targets) return null

  const placement = placeBlocksWithSlide(rng, targets, params, width, height)
  if (!placement) return null

  const walls = buildBorderWalls(width, height)
  const wallSet = new Set(walls.map(cellKey))
  const occupied = new Set([...targets, ...placement.blocks, ...placement.ice].map(cellKey))
  const player = startCell(occupied, placement.pushers[0], width, height)
  if (!player) return null

  const solution = solveInOrder(player, placement, targets, wallSet, params, width, height)
  if (!solution) return null

  const forbidden = new Set(
    [...targets, ...placement.blocks, ...placement.pushers, ...placement.ice, ...placement.pushPath]
      .map(cellKey)
      .concat(cellKey(player)),
  )
  for (const c of tracePlayerCells(player, solution)) forbidden.add(c)
  const obstacles = placeRandomObstacles(rng, params.obstacleCount, forbidden, width, height)

  return {
    walls: [...walls, ...obstacles],
    ice: placement.ice,
    player,
    blocks: letterBlocks(word, placement.blocks),
    targets,
    solution,
  }
}
