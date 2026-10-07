import { loadLevel, solutionEdges, toggleEdge } from '~/games/boucle/engine'
import type { Edge, GameState, Level } from '~/games/boucle/types'

/** Trace la boucle attendue (le tour des cases du mot) et renvoie l'état obtenu. */
export function playExpectedLoop(level: Level): { state: GameState; edges: Edge[] } {
  const edges = solutionEdges(level)
  let state = loadLevel(level)
  for (const e of edges) state = toggleEdge(state, e)
  return { state, edges }
}
