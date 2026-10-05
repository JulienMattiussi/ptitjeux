import { completionStatus, type CompletionStatus } from '~/lib/completion'
import type { GameId } from '~/lib/game-styles'
import { levelKey, type GameProgress } from '~/lib/localStorage'
import * as anglemort from './anglemort/challenges'
import * as boucle from './boucle/challenges'
import * as semantogramme from './semantogramme/challenges'
import * as sokomot from './sokomot/challenges'
import { LEVEL_INDICES } from './types'

/** Ce que les pages communes (listes, archives) lisent des niveaux de n'importe quel jeu. */
type GameChallenges = {
  getLevel(date: string, index: number): { parMoves: number } | undefined
  getAllDates(): string[]
}

const CHALLENGES: Record<GameId, GameChallenges> = { sokomot, boucle, semantogramme, anglemort }

/** Dates de tous les défis publiés d'un jeu, triées. */
export function getGameDates(gameId: GameId): string[] {
  return CHALLENGES[gameId].getAllDates()
}

/** Date du défi le plus récent d'un jeu (base de la mention « Défi du jour »). */
export function lastAvailableDate(gameId: GameId): string | undefined {
  const dates = getGameDates(gameId)
  return dates[dates.length - 1]
}

/** Statut de complétion d'un niveau, rapporté à son objectif de coups. */
function levelStatus(
  gameId: GameId,
  date: string,
  index: number,
  progress: GameProgress,
): CompletionStatus {
  const parMoves = CHALLENGES[gameId].getLevel(date, index)?.parMoves
  if (parMoves === undefined) return 'unsolved'
  return completionStatus(progress[levelKey(date, index)], parMoves)
}

/** Statuts des 4 niveaux d'une journée, dans l'ordre. */
export function dayStatuses(
  gameId: GameId,
  date: string,
  progress: GameProgress,
): CompletionStatus[] {
  return LEVEL_INDICES.map((i) => levelStatus(gameId, date, i, progress))
}
