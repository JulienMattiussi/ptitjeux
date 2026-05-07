import { getLevel as getBoucleLevel } from './boucle/challenges'
import { getLevel as getSemantogrammeLevel } from './semantogramme/challenges'
import { getLevel as getSokomotLevel } from './sokomot/challenges'
import type { GameId } from '~/lib/game-styles'

const GETTERS: Record<GameId, (date: string, index: number) => { parMoves?: number } | undefined> = {
  sokomot: getSokomotLevel,
  boucle: getBoucleLevel,
  semantogramme: getSemantogrammeLevel,
}

/**
 * Renvoie l'objectif de coups (parMoves) pour un niveau donné, quel que soit
 * le jeu. Utilisé par les pages de liste pour afficher une coche verte
 * « parfait » vs ambre « simplement résolu » selon la performance.
 */
export function getLevelParMoves(
  gameId: GameId,
  date: string,
  index: number,
): number | undefined {
  return GETTERS[gameId](date, index)?.parMoves
}
