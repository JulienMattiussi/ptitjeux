import type { LevelProgress } from './localStorage'

/**
 * Statut de complétion d'un niveau pour un joueur :
 * - `unsolved` : pas encore réussi
 * - `solved` : réussi mais au-dessus de l'objectif de coups
 * - `perfect` : réussi ET objectif respecté
 *
 * Si le niveau n'a pas d'objectif (parMoves indéfini), on retombe sur `solved`
 * dès qu'il est terminé.
 */
export type CompletionStatus = 'unsolved' | 'solved' | 'perfect'

export function completionStatus(
  progress: LevelProgress | undefined,
  parMoves: number | undefined,
): CompletionStatus {
  if (!progress?.completed) return 'unsolved'
  if (parMoves === undefined || progress.bestMoves === undefined) return 'solved'
  return progress.bestMoves <= parMoves ? 'perfect' : 'solved'
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

/**
 * Choix de la variante d'overlay de victoire en fonction du score réalisé.
 * `perfect` si objectif respecté (`moves ≤ parMoves`), `solved` sinon.
 * Si `parMoves` est indéfini, retombe sur `perfect`.
 */
export function victoryVariant(
  moves: number,
  parMoves: number | undefined,
): 'perfect' | 'solved' {
  if (parMoves === undefined) return 'perfect'
  return moves <= parMoves ? 'perfect' : 'solved'
}
