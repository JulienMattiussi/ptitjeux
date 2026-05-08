import { useEffect } from 'react'
import { dateLabel, todayString } from './dates'
import { writeLevelProgress } from './localStorage'
import { levelKey } from './useLocalProgress'

type Options = {
  /** Identifiant du jeu, aussi utilisé comme préfixe de route (`/sokomot`, …). */
  gameId: string
  date: string
  idx: number
  /** Date du dernier niveau disponible (pour la mention « Défi du jour »). */
  lastAvailableDate?: string
  won: boolean
  moves: number
  /** Nombre de niveaux dans une journée (4 par défaut, le dernier n'a pas de « suivant »). */
  totalLevels?: number
}

type Lifecycle = {
  isToday: boolean
  dateChip: string
  /** URL du niveau suivant, ou `undefined` si on est au dernier. */
  nextHref: string | undefined
}

/**
 * Centralise les calculs et effets dupliqués entre les 3 pages de jeu :
 * - étiquette « Défi du jour » vs date complète,
 * - calcul de l'URL du niveau suivant (4 niveaux par jour),
 * - écriture de la progression dans `localStorage` à la victoire.
 *
 * Les pages de jeu restent responsables de leurs spécificités (reducer,
 * sélection clavier propre au plateau, animations, etc.).
 */
export function useLevelPlayLifecycle({
  gameId,
  date,
  idx,
  lastAvailableDate,
  won,
  moves,
  totalLevels = 4,
}: Options): Lifecycle {
  useEffect(() => {
    if (won && date && idx) {
      writeLevelProgress(gameId, levelKey(date, idx), {
        completed: true,
        bestMoves: moves,
      })
    }
  }, [gameId, won, date, idx, moves])

  const isToday = !!date && !!lastAvailableDate && date === todayString(lastAvailableDate)
  const dateChip = isToday ? 'Défi du jour' : date ? dateLabel(date) : ''
  const nextHref = idx < totalLevels ? `/${gameId}/${date}/${idx + 1}` : undefined

  return { isToday, dateChip, nextHref }
}
