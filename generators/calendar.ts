/**
 * Calendrier des niveaux publiés, commun aux quatre jeux : période couverte
 * et emplacement du fichier de chaque niveau.
 */
import { join } from 'node:path'
import type { LevelIndex } from '~/games/types'
import { monthKey } from '~/lib/dates'
import type { GameId } from '~/lib/game-styles'

export const CALENDAR_START = '2026-09-01'
export const CALENDAR_END = '2027-09-30'

/** Fichier d'un niveau, relatif au dossier `challenges/` de son jeu. */
export function levelFile(date: string, index: LevelIndex): string {
  return `${monthKey(date)}/${date}-${index}.json`
}

/** Chemin absolu du fichier d'un niveau. */
export function challengeFile(game: GameId, date: string, index: LevelIndex): string {
  return join(import.meta.dirname, '../app/games', game, 'challenges', levelFile(date, index))
}
