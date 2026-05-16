export type LevelProgress = {
  completed: boolean
  bestMoves?: number
  lastPlayedAt: string
}

export type GameProgress = Record<string, LevelProgress>

export type AllProgress = Record<string, GameProgress>

const STORAGE_KEY = 'ptitjeux.progress'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readAllProgress(): AllProgress {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as AllProgress) : {}
  } catch {
    return {}
  }
}

export function readGameProgress(gameId: string): GameProgress {
  return readAllProgress()[gameId] ?? {}
}

export function writeLevelProgress(
  gameId: string,
  levelId: string,
  patch: Partial<LevelProgress>,
): void {
  if (!isBrowser()) return
  const all = readAllProgress()
  const game = all[gameId] ?? {}
  const previous = game[levelId] ?? { completed: false, lastPlayedAt: new Date().toISOString() }
  game[levelId] = { ...previous, ...patch, lastPlayedAt: new Date().toISOString() }
  all[gameId] = game
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage indisponible (mode privé) : on ignore silencieusement.
  }
}

export function countCompleted(gameId: string): number {
  const game = readGameProgress(gameId)
  return Object.values(game).filter((l) => l.completed).length
}
