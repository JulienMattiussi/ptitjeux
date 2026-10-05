/**
 * Solveur Sokomot **par poussées**, pour les niveaux sans glace : recours de
 * `finalize` quand le solveur optimal dépasse son budget (niveau 3 profond,
 * échanges de blocs voisins).
 *
 * Chaque transition est une marche du joueur (plus court chemin) suivie d'une
 * poussée, de coût « longueur de la marche + 1 ». On ne crée de nœud que pour
 * les états après poussée : le graphe est bien plus creux qu'avec un nœud par
 * pas, et A* explore 10 à 100 fois moins d'états. Les états restent
 * distingués par la case exacte du joueur (et non par la zone qu'il peut
 * atteindre), dont dépend le coût des marches suivantes.
 *
 * **Pas d'optimalité garantie** : le test de victoire se fait à la création
 * d'un nœud, alors que les transitions n'ont pas toutes le même coût ; une
 * solution plus courte peut rester dans le tas. Le résultat est une solution
 * valide, en pratique proche de l'optimum, donc une borne supérieure de
 * `parMoves` bien meilleure que la solution générée à rebours.
 */
import type { Coord, Direction, Level } from '~/games/sokomot/types'
import { DIRECTIONS, cellKey } from './sokomot-grid'
import { createMinHeap, matchingDistance, stateKey } from './sokomot-search'

type Walk = { dist: Map<string, number>; parent: Map<string, [string, Direction] | null> }

/** Parcours en largeur de la marche du joueur depuis `start`, murs et blocs exclus. */
function walkFrom(
  start: Coord,
  cubeSet: Set<string>,
  wallSet: Set<string>,
  width: number,
  height: number,
): Walk {
  const dist = new Map<string, number>()
  const parent = new Map<string, [string, Direction] | null>()
  const startKey = cellKey(start)
  dist.set(startKey, 0)
  parent.set(startKey, null)
  const queue: Coord[] = [start]
  let head = 0
  while (head < queue.length) {
    const [x, y] = queue[head++]
    const k = cellKey([x, y])
    const d = dist.get(k)!
    for (const { dir, vec } of DIRECTIONS) {
      const next: Coord = [x + vec[0], y + vec[1]]
      if (next[0] < 0 || next[0] >= width || next[1] < 0 || next[1] >= height) continue
      const nk = cellKey(next)
      if (wallSet.has(nk) || cubeSet.has(nk) || dist.has(nk)) continue
      dist.set(nk, d + 1)
      parent.set(nk, [k, dir])
      queue.push(next)
    }
  }
  return { dist, parent }
}

function pathTo(end: string, parent: Walk['parent']): Direction[] {
  const path: Direction[] = []
  for (let p = parent.get(end); p; p = parent.get(p[0])) path.unshift(p[1])
  return path
}

type Node = {
  /** Vidé une fois le nœud développé, pour ménager la mémoire. */
  cubes: Coord[]
  playerPos: Coord
  parent: number
  /** Coups depuis le nœud parent : marche puis poussée. */
  moves: Direction[] | null
  g: number
  f: number
}

/**
 * Une solution du niveau (voir l'en-tête : pas forcément la plus courte), ou
 * `null` si le niveau a de la glace ou si `maxStates` états sont dépassés.
 */
export function solveSokomotByPushes(level: Level, maxStates: number): Direction[] | null {
  if (level.ice.length > 0) return null

  const { width, height } = level
  const wallSet = new Set(level.walls.map(cellKey))
  const blockLetters = level.blocks.map((b) => b.letter)
  const targetLetters = level.target.word.split('')
  const targets = level.target.cells

  const isWon = (cubes: Coord[]): boolean =>
    targets.every((t, i) =>
      cubes.some((c, j) => c[0] === t[0] && c[1] === t[1] && blockLetters[j] === targetLetters[i]),
    )
  const keyOf = (cubes: Coord[], player: Coord): string =>
    stateKey(
      player,
      cubes.map((pos, i) => ({ letter: blockLetters[i], pos })),
    )
  const h = (cubes: Coord[]) => matchingDistance(cubes, blockLetters, targets, targetLetters)

  const initialCubes: Coord[] = level.blocks.map((b) => [b.pos[0], b.pos[1]])
  const initialPlayer: Coord = [level.player[0], level.player[1]]
  if (isWon(initialCubes)) return []
  const nodes: Node[] = [
    {
      cubes: initialCubes,
      playerPos: initialPlayer,
      parent: -1,
      moves: null,
      g: 0,
      f: h(initialCubes),
    },
  ]
  const heap = createMinHeap((a, b) => nodes[a].f - nodes[b].f)
  heap.push(0)
  const bestG = new Map<string, number>()
  bestG.set(keyOf(initialCubes, initialPlayer), 0)

  while (heap.size > 0) {
    if (nodes.length > maxStates) return null
    const cur = heap.pop()
    const node = nodes[cur]
    if (node.cubes.length === 0) continue

    const cubeSet = new Set(node.cubes.map(cellKey))
    const reach = walkFrom(node.playerPos, cubeSet, wallSet, width, height)

    for (let i = 0; i < node.cubes.length; i++) {
      const [cx, cy] = node.cubes[i]
      for (const { dir, vec } of DIRECTIONS) {
        const pusher: Coord = [cx - vec[0], cy - vec[1]]
        const to: Coord = [cx + vec[0], cy + vec[1]]
        if (to[0] < 0 || to[0] >= width || to[1] < 0 || to[1] >= height) continue
        if (pusher[0] < 0 || pusher[0] >= width || pusher[1] < 0 || pusher[1] >= height) continue
        const tk = cellKey(to)
        if (wallSet.has(tk) || cubeSet.has(tk)) continue
        const pk = cellKey(pusher)
        if (!reach.dist.has(pk)) continue

        const walk = pathTo(pk, reach.parent)
        const newCubes: Coord[] = node.cubes.map((c, j) => (j === i ? to : ([c[0], c[1]] as Coord)))
        const newPlayer: Coord = [cx, cy]
        const k = keyOf(newCubes, newPlayer)
        const newG = node.g + walk.length + 1
        const prev = bestG.get(k)
        if (prev !== undefined && prev <= newG) continue
        bestG.set(k, newG)
        const hn = h(newCubes)
        if (!Number.isFinite(hn)) continue
        const idx = nodes.length
        nodes.push({
          cubes: newCubes,
          playerPos: newPlayer,
          parent: cur,
          moves: [...walk, dir],
          g: newG,
          f: newG + hn,
        })
        if (isWon(newCubes)) {
          const full: Direction[] = []
          for (let ni = idx; ni !== -1; ni = nodes[ni].parent)
            full.unshift(...(nodes[ni].moves ?? []))
          return full
        }
        heap.push(idx)
      }
    }
    node.cubes = []
    node.playerPos = [0, 0]
  }
  return null
}
