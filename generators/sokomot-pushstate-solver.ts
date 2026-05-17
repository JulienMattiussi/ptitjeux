import type { Coord, Direction, Level } from '~/games/sokomot/types'

/**
 * Solveur Sokoban optimal **par-push** (pour les niveaux SANS glace).
 *
 * Idée : au lieu d'explorer chaque coup joueur (BFS-A* classique), on
 * explore par poussées. À chaque expansion, le joueur marche (BFS interne)
 * jusqu'à une position de poussée puis pousse un cube ; le coût de cette
 * « macro-transition » = longueur du chemin de marche + 1.
 *
 * Bénéfices vs BFS-A* :
 * - L'espace d'états (cubes_positions, position_joueur) reste le même,
 *   mais on ne crée un nœud que pour les états « post-push », pas pour
 *   les intermédiaires de marche. Le graphe de recherche est donc beaucoup
 *   plus sparse — A* trouve l'optimum en explorant 10-100× moins d'états
 *   sur les puzzles Sokoban profonds (échanges de cubes adjacents, etc.).
 *
 * Note : on dédup par `(cubes, position_joueur_actuelle)` et pas par région
 * canonique. Une collapse par région perd la position précise du joueur,
 * laquelle conditionne le coût des marches futures — ce qui casse
 * l'optimalité pour la métrique « coups joueur minimum ». La version par
 * (cubes, joueur) garde toute la précision tout en évitant les nœuds
 * intermédiaires de marche.
 *
 * Restriction : niveaux sans glace (la glace fait glisser et casse la
 * notion de « walk-then-push »).
 */
const DIRECTIONS: Array<{ dir: Direction; dx: number; dy: number }> = [
  { dir: 'up', dx: 0, dy: -1 },
  { dir: 'down', dx: 0, dy: 1 },
  { dir: 'left', dx: -1, dy: 0 },
  { dir: 'right', dx: 1, dy: 0 },
]

function coordKey(x: number, y: number): string {
  return `${x},${y}`
}

/**
 * BFS de marche du joueur depuis `start`, évitant murs + cubes. Renvoie
 * distance et parents pour reconstituer le chemin jusqu'à toute cellule
 * joignable.
 */
function bfsPlayerWalk(
  start: Coord,
  cubeSet: Set<string>,
  wallSet: Set<string>,
  width: number,
  height: number,
): { dist: Map<string, number>; parent: Map<string, [string, Direction] | null> } {
  const dist = new Map<string, number>()
  const parent = new Map<string, [string, Direction] | null>()
  const startKey = coordKey(start[0], start[1])
  dist.set(startKey, 0)
  parent.set(startKey, null)
  const queue: Array<[number, number]> = [[start[0], start[1]]]
  let head = 0
  while (head < queue.length) {
    const [x, y] = queue[head++]
    const k = coordKey(x, y)
    const d = dist.get(k)!
    for (const { dir, dx, dy } of DIRECTIONS) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const nk = coordKey(nx, ny)
      if (wallSet.has(nk) || cubeSet.has(nk)) continue
      if (dist.has(nk)) continue
      dist.set(nk, d + 1)
      parent.set(nk, [k, dir])
      queue.push([nx, ny])
    }
  }
  return { dist, parent }
}

function pathFromParents(end: string, parent: Map<string, [string, Direction] | null>): Direction[] {
  const path: Direction[] = []
  let cur = end
  while (true) {
    const p = parent.get(cur)
    if (!p) break
    path.unshift(p[1])
    cur = p[0]
  }
  return path
}

function heuristic(
  blocks: Coord[],
  targets: Coord[],
  blockLetters: string[],
  targetLetters: string[],
): number {
  const n = blocks.length
  if (n !== targets.length) return Infinity
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(Infinity))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (blockLetters[i] !== targetLetters[j]) continue
      dist[i][j] = Math.abs(blocks[i][0] - targets[j][0]) + Math.abs(blocks[i][1] - targets[j][1])
    }
  }
  let best = Infinity
  const used = new Array<boolean>(n).fill(false)
  function rec(i: number, sum: number) {
    if (sum >= best) return
    if (i === n) {
      best = sum
      return
    }
    for (let j = 0; j < n; j++) {
      if (used[j]) continue
      if (!Number.isFinite(dist[i][j])) continue
      used[j] = true
      rec(i + 1, sum + dist[i][j])
      used[j] = false
    }
  }
  rec(0, 0)
  return Number.isFinite(best) ? best : Infinity
}

type Node = {
  cubes: Coord[]
  playerPos: Coord
  parent: number
  /** Suite de directions joueur jusqu'à cet état (marche + push final). */
  moves: Direction[] | null
  g: number
  f: number
}

export function solveOptimalSokobanPushState(
  level: Level,
  maxStates = 5_000_000,
): Direction[] | null {
  if (level.ice.length > 0) return null

  const { width, height } = level
  const wallSet = new Set(level.walls.map(([x, y]) => coordKey(x, y)))
  const blockLetters = level.blocks.map((b) => b.letter.toUpperCase())
  const targetLetters = level.target.word.split('').map((l) => l.toUpperCase())
  const targets: Coord[] = level.target.cells.map(([x, y]) => [x, y])

  const initialCubes: Coord[] = level.blocks.map((b) => [b.pos[0], b.pos[1]])
  const initialPlayer: Coord = [level.player[0], level.player[1]]

  function isWon(cubes: Coord[]): boolean {
    for (let i = 0; i < targets.length; i++) {
      let found = false
      for (let j = 0; j < cubes.length; j++) {
        if (
          cubes[j][0] === targets[i][0] &&
          cubes[j][1] === targets[i][1] &&
          blockLetters[j] === targetLetters[i]
        ) {
          found = true
          break
        }
      }
      if (!found) return false
    }
    return true
  }

  function stateKey(cubes: Coord[], player: Coord): string {
    const parts: string[] = []
    for (let i = 0; i < cubes.length; i++) {
      parts.push(`${blockLetters[i]}:${cubes[i][0]},${cubes[i][1]}`)
    }
    parts.sort()
    return `${player[0]},${player[1]}|${parts.join(';')}`
  }

  const initialH = heuristic(initialCubes, targets, blockLetters, targetLetters)
  const nodes: Node[] = [
    {
      cubes: initialCubes,
      playerPos: initialPlayer,
      parent: -1,
      moves: null,
      g: 0,
      f: initialH,
    },
  ]
  if (isWon(initialCubes)) return []

  const heap: number[] = [0]
  const bestG = new Map<string, number>()
  bestG.set(stateKey(initialCubes, initialPlayer), 0)

  const cmp = (a: number, b: number) => nodes[a].f - nodes[b].f
  const push = (idx: number) => {
    heap.push(idx)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (cmp(heap[i], heap[p]) < 0) {
        const t = heap[i]
        heap[i] = heap[p]
        heap[p] = t
        i = p
      } else break
    }
  }
  const pop = (): number => {
    const top = heap[0]
    const last = heap.pop()!
    if (heap.length > 0) {
      heap[0] = last
      let i = 0
      while (true) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        let best = i
        if (l < heap.length && cmp(heap[l], heap[best]) < 0) best = l
        if (r < heap.length && cmp(heap[r], heap[best]) < 0) best = r
        if (best === i) break
        const t = heap[i]
        heap[i] = heap[best]
        heap[best] = t
        i = best
      }
    }
    return top
  }

  while (heap.length > 0) {
    if (nodes.length > maxStates) return null
    const cur = pop()
    const node = nodes[cur]
    if (node.cubes.length === 0) continue // déjà libéré

    const cubeSet = new Set(node.cubes.map(([x, y]) => coordKey(x, y)))
    const reach = bfsPlayerWalk(node.playerPos, cubeSet, wallSet, width, height)

    for (let i = 0; i < node.cubes.length; i++) {
      const [cx, cy] = node.cubes[i]
      for (const { dir, dx, dy } of DIRECTIONS) {
        const px = cx - dx
        const py = cy - dy
        const tx = cx + dx
        const ty = cy + dy
        if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue
        if (px < 0 || px >= width || py < 0 || py >= height) continue
        const tk = coordKey(tx, ty)
        if (wallSet.has(tk) || cubeSet.has(tk)) continue
        const pk = coordKey(px, py)
        if (!reach.dist.has(pk)) continue

        const walkPath = pathFromParents(pk, reach.parent)
        const newCubes: Coord[] = node.cubes.map((c, j) =>
          j === i ? ([tx, ty] as Coord) : ([c[0], c[1]] as Coord),
        )
        const newPlayer: Coord = [cx, cy]
        const k = stateKey(newCubes, newPlayer)
        const stepCost = walkPath.length + 1
        const newG = node.g + stepCost
        const prev = bestG.get(k)
        if (prev !== undefined && prev <= newG) continue
        bestG.set(k, newG)
        const h = heuristic(newCubes, targets, blockLetters, targetLetters)
        if (!Number.isFinite(h)) continue
        const moves: Direction[] = [...walkPath, dir]
        const idx = nodes.length
        nodes.push({
          cubes: newCubes,
          playerPos: newPlayer,
          parent: cur,
          moves,
          g: newG,
          f: newG + h,
        })
        if (isWon(newCubes)) {
          const full: Direction[] = []
          let ni = idx
          while (ni !== -1) {
            const n = nodes[ni]
            if (n.moves) full.unshift(...n.moves)
            ni = n.parent
          }
          return full
        }
        push(idx)
      }
    }
    // Libère le state lourd post-expansion (parent/moves suffisent pour
    // reconstituer le chemin final).
    node.cubes = []
    node.playerPos = [0, 0]
  }
  return null
}
