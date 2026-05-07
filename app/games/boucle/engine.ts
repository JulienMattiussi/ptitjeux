import type { Coord, Edge, GameState, Level } from './types'

export function loadLevel(level: Level): GameState {
  return { level, edges: [] }
}

export function reset(state: GameState): GameState {
  return loadLevel(state.level)
}

function edgeKey(e: Edge): string {
  return `${e.orientation}:${e.x},${e.y}`
}

function sameEdge(a: Edge, b: Edge): boolean {
  return a.x === b.x && a.y === b.y && a.orientation === b.orientation
}

export function toggleEdge(state: GameState, edge: Edge): GameState {
  const exists = state.edges.some((e) => sameEdge(e, edge))
  return {
    ...state,
    edges: exists ? state.edges.filter((e) => !sameEdge(e, edge)) : [...state.edges, edge],
  }
}

/**
 * Renvoie les 4 arêtes qui bordent la case `(cx, cy)` :
 * top (horizontale en y=cy), bottom (y=cy+1), left (verticale en x=cx), right (x=cx+1).
 */
function cellEdges(cx: number, cy: number): Edge[] {
  return [
    { x: cx, y: cy, orientation: 'horizontal' },
    { x: cx, y: cy + 1, orientation: 'horizontal' },
    { x: cx, y: cy, orientation: 'vertical' },
    { x: cx + 1, y: cy, orientation: 'vertical' },
  ]
}

export function countEdgesAroundCell(state: GameState, cx: number, cy: number): number {
  const set = new Set(state.edges.map(edgeKey))
  return cellEdges(cx, cy).filter((e) => set.has(edgeKey(e))).length
}

/** Liste des sommets touchés par une arête. */
function edgeVertices(e: Edge): [Coord, Coord] {
  return e.orientation === 'horizontal'
    ? [
        [e.x, e.y],
        [e.x + 1, e.y],
      ]
    : [
        [e.x, e.y],
        [e.x, e.y + 1],
      ]
}

function vertexKey(v: Coord): string {
  return `${v[0]},${v[1]}`
}

/**
 * Vérifie que les arêtes forment **une seule boucle simple fermée** :
 * - Tout sommet touché a un degré exactement 2 (jamais 1, 3, 4).
 * - Le sous-graphe est connexe (un seul cycle, pas plusieurs disjoints).
 */
export function isValidLoop(edges: Edge[]): boolean {
  if (edges.length < 4) return false

  const degree = new Map<string, number>()
  for (const e of edges) {
    const [a, b] = edgeVertices(e)
    degree.set(vertexKey(a), (degree.get(vertexKey(a)) ?? 0) + 1)
    degree.set(vertexKey(b), (degree.get(vertexKey(b)) ?? 0) + 1)
  }
  for (const deg of degree.values()) {
    if (deg !== 2) return false
  }

  // Connexité : DFS sur le multigraphe edges.
  const adjacency = new Map<string, Edge[]>()
  for (const e of edges) {
    const [a, b] = edgeVertices(e)
    const ka = vertexKey(a)
    const kb = vertexKey(b)
    adjacency.set(ka, [...(adjacency.get(ka) ?? []), e])
    adjacency.set(kb, [...(adjacency.get(kb) ?? []), e])
  }
  const visited = new Set<string>()
  const startVertex = vertexKey(edgeVertices(edges[0])[0])
  const stack = [startVertex]
  while (stack.length) {
    const v = stack.pop()!
    if (visited.has(v)) continue
    visited.add(v)
    for (const e of adjacency.get(v) ?? []) {
      const [a, b] = edgeVertices(e)
      const other = vertexKey(a) === v ? vertexKey(b) : vertexKey(a)
      if (!visited.has(other)) stack.push(other)
    }
  }
  return visited.size === degree.size
}

/**
 * Vérifie que tous les indices sont satisfaits :
 * pour chaque case avec un indice, le nombre d'arêtes utilisées correspond.
 */
export function areCluesSatisfied(state: GameState): boolean {
  for (const [key, expected] of Object.entries(state.level.clues)) {
    const [cxStr, cyStr] = key.split(',')
    const count = countEdgesAroundCell(state, Number(cxStr), Number(cyStr))
    if (count !== expected) return false
  }
  return true
}

/**
 * Renvoie l'état de chaque indice : satisfait, dépassé ou non encore atteint.
 * Utile pour l'UI (couleur des indices).
 */
export type ClueStatus = 'ok' | 'over' | 'under'

export function clueStatus(state: GameState, cx: number, cy: number): ClueStatus | null {
  const expected = state.level.clues[`${cx},${cy}`]
  if (expected === undefined) return null
  const count = countEdgesAroundCell(state, cx, cy)
  if (count === expected) return 'ok'
  if (count > expected) return 'over'
  return 'under'
}

/**
 * Flood-fill identifiant les cases extérieures à la boucle, puis renvoie le
 * complémentaire : les cases intérieures.
 *
 * On modélise un **anneau extérieur virtuel** d'une case d'épaisseur autour de
 * la grille. Le flood-fill démarre dans cet anneau et tente d'entrer dans la
 * grille en traversant les arêtes du bord — mais s'arrête sur toute arête
 * appartenant à la boucle, y compris quand elle longe le bord.
 *
 * Sans cet anneau, une boucle qui longe le bord (par exemple un rectangle
 * collé au bord gauche) ne piégerait pas correctement les cases qui sont
 * derrière elle, puisqu'elles seraient déjà dans la queue initiale.
 */
export function findInsideCells(edges: Edge[], width: number, height: number): Coord[] {
  const edgeSet = new Set(edges.map(edgeKey))
  const visited = new Set<string>()
  const queue: Coord[] = []

  function edgeExists(e: Edge): boolean {
    if (e.orientation === 'horizontal') {
      return e.x >= 0 && e.x < width && e.y >= 0 && e.y <= height
    }
    return e.x >= 0 && e.x <= width && e.y >= 0 && e.y < height
  }

  // Démarre depuis l'anneau extérieur (couche de cases fictives x∈{-1,width}, y∈{-1,height}).
  for (let x = -1; x <= width; x++) {
    queue.push([x, -1])
    queue.push([x, height])
  }
  for (let y = -1; y <= height; y++) {
    queue.push([-1, y])
    queue.push([width, y])
  }

  while (queue.length) {
    const [cx, cy] = queue.shift()!
    const key = `${cx},${cy}`
    if (visited.has(key)) continue
    visited.add(key)

    const neighbors: { neighbor: Coord; edge: Edge }[] = [
      { neighbor: [cx, cy - 1], edge: { x: cx, y: cy, orientation: 'horizontal' } },
      { neighbor: [cx, cy + 1], edge: { x: cx, y: cy + 1, orientation: 'horizontal' } },
      { neighbor: [cx - 1, cy], edge: { x: cx, y: cy, orientation: 'vertical' } },
      { neighbor: [cx + 1, cy], edge: { x: cx + 1, y: cy, orientation: 'vertical' } },
    ]
    for (const { neighbor, edge } of neighbors) {
      const [nx, ny] = neighbor
      if (nx < -1 || ny < -1 || nx > width || ny > height) continue
      // Si l'arête existe (= a des coordonnées valides dans la grille) et est
      // dans la boucle, on ne peut pas traverser.
      if (edgeExists(edge) && edgeSet.has(edgeKey(edge))) continue
      if (!visited.has(`${nx},${ny}`)) queue.push(neighbor)
    }
  }

  const inside: Coord[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited.has(`${x},${y}`)) inside.push([x, y])
    }
  }
  return inside
}

/**
 * Mot formé par les lettres des cases intérieures, lues en ordre normal
 * (haut→bas, gauche→droite).
 */
export function getInsideWord(state: GameState): string {
  const inside = findInsideCells(state.edges, state.level.width, state.level.height)
  inside.sort((a, b) => a[1] - b[1] || a[0] - b[0])
  return inside.map(([x, y]) => state.level.letters[y][x]).join('')
}

export function isWon(state: GameState): boolean {
  if (!isValidLoop(state.edges)) return false
  if (!areCluesSatisfied(state)) return false
  return getInsideWord(state).toUpperCase() === state.level.solutionWord.toUpperCase()
}
