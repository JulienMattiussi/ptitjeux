import { loadLevel, toggleEdge } from '~/games/boucle/engine'
import type { Coord, Edge, GameState, Level } from '~/games/boucle/types'

/** Arêtes de la frontière d'un ensemble de cases intérieures. */
function insideCellsToBoundary(cells: Coord[]): Edge[] {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`))
  const isIn = (x: number, y: number) => set.has(`${x},${y}`)
  const out: Edge[] = []
  for (const [cx, cy] of cells) {
    if (!isIn(cx, cy - 1)) out.push({ x: cx, y: cy, orientation: 'horizontal' })
    if (!isIn(cx, cy + 1)) out.push({ x: cx, y: cy + 1, orientation: 'horizontal' })
    if (!isIn(cx - 1, cy)) out.push({ x: cx, y: cy, orientation: 'vertical' })
    if (!isIn(cx + 1, cy)) out.push({ x: cx + 1, y: cy, orientation: 'vertical' })
  }
  return out
}

/** Trace la boucle attendue (le tour des cases du mot) et renvoie l'état obtenu. */
export function playExpectedLoop(level: Level): { state: GameState; edges: Edge[] } {
  const edges = insideCellsToBoundary(level.solutionInsideCells)
  let state = loadLevel(level)
  for (const e of edges) state = toggleEdge(state, e)
  return { state, edges }
}
