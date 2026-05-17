import type { CellStatus, GameState, Level } from './types'

export function loadLevel(level: Level): GameState {
  const status: CellStatus[][] = Array.from({ length: level.height }, () =>
    Array.from({ length: level.width }, () => 'unmarked' as CellStatus),
  )
  return { level, status, themeGuess: '', moves: 0 }
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
  const next = setCellStatus(state, x, y, NEXT_STATUS[current])
  return { ...next, moves: state.moves + 1 }
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

/**
 * Grille résolue ⇔ l'ensemble des cases marquées IN correspond exactement à
 * l'ensemble des cases « thème » (`solution[y][x] === true`).
 *
 * Les cases hors thème peuvent rester `unmarked` ou `out` indifféremment :
 * seul le placement des IN compte. Cela évite d'imposer au joueur de marquer
 * explicitement chaque case non thématique avec OUT pour gagner.
 */
export function isGridSolved(state: GameState): boolean {
  const { solution } = state.level
  for (let y = 0; y < state.level.height; y++) {
    for (let x = 0; x < state.level.width; x++) {
      const shouldBeIn = solution[y][x]
      const isMarkedIn = state.status[y][x] === 'in'
      if (shouldBeIn !== isMarkedIn) return false
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

export type Action =
  | { type: 'cycle'; x: number; y: number }
  | { type: 'reset' }
  | { type: 'guess'; value: string }

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'cycle':
      return cycleCellStatus(state, action.x, action.y)
    case 'reset':
      return reset(state)
    case 'guess':
      return setThemeGuess(state, action.value)
  }
}
