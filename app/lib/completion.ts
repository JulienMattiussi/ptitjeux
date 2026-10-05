import { LEVEL_INDICES } from '~/games/types'
import { levelKey, type GameProgress, type LevelProgress } from './localStorage'

/**
 * Statut de complétion d'un niveau pour un joueur :
 * - `unsolved` : pas encore réussi
 * - `solved` : réussi mais au-dessus de l'objectif de coups
 * - `perfect` : réussi ET objectif respecté
 */
export type CompletionStatus = 'unsolved' | 'solved' | 'perfect'

/** Statut d'un niveau réussi : variante de la modale de victoire et des coches. */
export type SolvedStatus = Exclude<CompletionStatus, 'unsolved'>

export function completionStatus(progress: LevelProgress | undefined): CompletionStatus {
  return progress?.status ?? 'unsolved'
}

/** Statuts des 4 niveaux d'une journée, dans l'ordre. */
export function dayStatuses(date: string, progress: GameProgress): CompletionStatus[] {
  return LEVEL_INDICES.map((i) => completionStatus(progress[levelKey(date, i)]))
}

/**
 * Agrège plusieurs statuts de complétion :
 * - `perfect` si tous sont parfaits
 * - `solved` si tous sont au moins résolus (mais pas tous parfaits)
 * - `unsolved` si au moins un n'est pas terminé
 */
export function aggregateCompletion(statuses: readonly CompletionStatus[]): CompletionStatus {
  if (statuses.length === 0) return 'unsolved'
  if (statuses.every((s) => s === 'perfect')) return 'perfect'
  if (statuses.every((s) => s !== 'unsolved')) return 'solved'
  return 'unsolved'
}

/** `perfect` si l'objectif est respecté (`moves ≤ parMoves`), `solved` sinon. */
export function victoryVariant(moves: number, parMoves: number): SolvedStatus {
  return moves <= parMoves ? 'perfect' : 'solved'
}
