import { loadLevel, setCellStatus } from '~/games/semantogramme/engine'
import type { GameState, Level } from '~/games/semantogramme/types'

/** Marque chaque case selon la solution (sans deviner le thème). */
export function applySolution(level: Level): GameState {
  let state = loadLevel(level)
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      state = setCellStatus(state, x, y, level.solution[y][x] ? 'in' : 'out')
    }
  }
  return state
}

/** Chiffres en marge tels qu'ils se déduisent de la solution. */
export function cluesOf(solution: boolean[][]): { rowClues: number[]; colClues: number[] } {
  return {
    rowClues: solution.map((row) => row.filter(Boolean).length),
    colClues: solution[0].map((_, x) => solution.filter((row) => row[x]).length),
  }
}
