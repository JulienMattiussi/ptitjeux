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

const NEXT_STATUS: Record<CellStatus, CellStatus> = {
  unmarked: 'in',
  in: 'out',
  out: 'unmarked',
}

export function cycleCellStatus(state: GameState, x: number, y: number): GameState {
  if (y < 0 || y >= state.level.height || x < 0 || x >= state.level.width) return state
  const current = state.status[y][x]
  return setCellStatus(state, x, y, NEXT_STATUS[current])
}

export function setThemeGuess(state: GameState, themeGuess: string): GameState {
  return { ...state, themeGuess }
}

export function reset(state: GameState): GameState {
  return loadLevel(state.level)
}

export function countInPerRow(state: GameState, y: number): number {
  if (y < 0 || y >= state.level.height) return 0
  return state.status[y].filter((s) => s === 'in').length
}

export function countInPerCol(state: GameState, x: number): number {
  if (x < 0 || x >= state.level.width) return 0
  return state.status.reduce((acc, row) => acc + (row[x] === 'in' ? 1 : 0), 0)
}

export function isFullyMarked(state: GameState): boolean {
  return state.status.every((row) => row.every((s) => s !== 'unmarked'))
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
  if (!state.themeGuess) return false
  return normalize(state.themeGuess) === normalize(state.level.themeWord)
}

export function isWon(state: GameState): boolean {
  return isGridSolved(state) && isThemeGuessCorrect(state)
}
