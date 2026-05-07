import type { Edge, GameState, Level } from './types'

export function loadLevel(level: Level): GameState {
  return { level, edges: [] }
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

export function reset(state: GameState): GameState {
  return loadLevel(state.level)
}

/**
 * TODO : implémenter la validation complète :
 * - les arêtes forment une boucle simple unique
 * - chaque indice est respecté
 * - les lettres encerclées forment `solutionWord`
 */
export function isWon(_state: GameState): boolean {
  return false
}
