import type { LevelProgress } from './localStorage'

/**
 * Statut de complétion d'un niveau pour un joueur :
 * - `unsolved` : pas encore réussi
 * - `solved` : réussi mais au-dessus de l'objectif de coups
 * - `perfect` : réussi ET objectif respecté
 */
export type CompletionStatus = 'unsolved' | 'solved' | 'perfect'

/** Statut d'un niveau réussi : variante de la modale de victoire et des coches. */
export type SolvedStatus = Exclude<CompletionStatus, 'unsolved'>

export function completionStatus(
  progress: LevelProgress | undefined,
  parMoves: number,
): CompletionStatus {
  if (!progress?.completed) return 'unsolved'
  if (progress.bestMoves === undefined) return 'solved'
  return victoryVariant(progress.bestMoves, parMoves)
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
