import type { CellStatus, GameState, Level } from './types'

export function loadLevel(level: Level): GameState {
  const status: CellStatus[][] = Array.from({ length: level.height }, () =>
    Array.from({ length: level.width }, () => 'unmarked' as CellStatus),
  )
  return { level, status, themeGuess: '' }
}

export function setCellStatus(
  state: GameState,
  x: number,
  y: number,
  next: CellStatus,
): GameState {
  if (y < 0 || y >= state.level.height || x < 0 || x >= state.level.width) return state
  const status = state.status.map((row, ry) =>
    ry === y ? row.map((s, rx) => (rx === x ? next : s)) : row,
  )
  return { ...state, status }
}

export function setThemeGuess(state: GameState, themeGuess: string): GameState {
  return { ...state, themeGuess }
}

export function isGridSolved(state: GameState): boolean {
  const { solution } = state.level
  for (let y = 0; y < state.level.height; y++) {
    for (let x = 0; x < state.level.width; x++) {
      const expected = solution[y][x] ? 'in' : 'out'
      if (state.status[y][x] !== expected) return false
    }
  }
  return true
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function isThemeGuessCorrect(state: GameState): boolean {
  return normalize(state.themeGuess) === normalize(state.level.themeWord)
}

export function isWon(state: GameState): boolean {
  return isGridSolved(state) && isThemeGuessCorrect(state)
}
