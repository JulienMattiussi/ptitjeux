import type { SolvedStatus } from './completion'

/**
 * Un niveau n'est enregistré qu'une fois réussi. Le statut est figé au moment
 * de la victoire : les listes n'ont pas à recharger les niveaux pour le déduire.
 */
export type LevelProgress = {
  status: SolvedStatus
  lastPlayedAt: string
}

export type GameProgress = Record<string, LevelProgress>

export type AllProgress = Record<string, GameProgress>

export const STORAGE_KEY = 'ptitjeux.progress'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/** Identifiant de progression d'un niveau (date, index). */
export function levelKey(date: string, index: number): string {
  return `${date}-${index}`
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

function writeLevelProgress(gameId: string, levelId: string, progress: LevelProgress): void {
  if (!isBrowser()) return
  const all = readAllProgress()
  all[gameId] = { ...all[gameId], [levelId]: progress }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage indisponible (mode privé) : on ignore silencieusement.
  }
}

/**
 * Enregistre une victoire en gardant le meilleur statut : rejouer un niveau
 * parfait en plus de coups ne doit pas lui faire perdre son statut.
 */
export function recordWin(gameId: string, levelId: string, status: SolvedStatus): void {
  const previous = readGameProgress(gameId)[levelId]?.status
  writeLevelProgress(gameId, levelId, {
    status: previous === 'perfect' ? 'perfect' : status,
    lastPlayedAt: new Date().toISOString(),
  })
}
