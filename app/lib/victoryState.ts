import { victoryVariant } from './completion'

type Level = { parMoves?: number }

type VictoryState = {
  /** True si le nombre de coups est ≤ parMoves (ou si parMoves n'est pas défini). */
  beatPar: boolean
  /** Variante d'overlay à passer à `VictoryOverlay`. */
  variant: 'perfect' | 'solved'
}

/**
 * Calcule l'état de victoire pour l'UI : `beatPar` (objectif atteint) et
 * `variant` (style de l'overlay). Centralise le pattern dupliqué dans les
 * 3 routes de jeu.
 *
 * Fonction pure (pas un hook) malgré son nom de fichier : elle n'utilise
 * aucun hook React et peut être appelée après un early return.
 */
export function getVictoryState(level: Level | undefined, moves: number): VictoryState {
  const beatPar = !!level && level.parMoves !== undefined && moves <= level.parMoves
  const variant = victoryVariant(moves, level?.parMoves)
  return { beatPar, variant }
}
