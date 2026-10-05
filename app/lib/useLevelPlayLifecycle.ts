import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { LEVEL_INDICES } from '~/games/types'
import { victoryVariant, type SolvedStatus } from './completion'
import { dateLabel, todayString } from './dates'
import type { GameId } from './game-styles'
import { findGame } from './games-registry'
import { levelKey, recordWin } from './localStorage'

type Options = {
  gameId: GameId
  date: string
  idx: number
  /** Dernier défi publié (cf. `todayString`). */
  lastDate: string | undefined
  won: boolean
  moves: number
  parMoves: number
}

type Lifecycle = {
  /** Titre de la barre du haut : jeu, « Défi du jour » ou date, niveau. */
  title: string
  /** Liste des niveaux, ouverte sur le jour joué. */
  backHref: string
  goBack: () => void
  /** URL du niveau suivant, `undefined` au dernier niveau du jour. */
  nextHref: string | undefined
  variant: SolvedStatus
}

/**
 * Ce que toutes les pages de partie partagent : titre, liens de navigation,
 * variante de victoire et enregistrement de la progression à la victoire.
 */
export function useLevelPlayLifecycle({
  gameId,
  date,
  idx,
  lastDate,
  won,
  moves,
  parMoves,
}: Options): Lifecycle {
  const navigate = useNavigate()

  const variant = victoryVariant(moves, parMoves)
  useEffect(() => {
    if (won) recordWin(gameId, levelKey(date, idx), variant)
  }, [gameId, won, date, idx, variant])

  const isToday = date === todayString(lastDate)
  const dateChip = isToday ? 'Défi du jour' : dateLabel(date)
  const backHref = `/${gameId}?from=${date}`
  return {
    title: `${findGame(gameId).name} · ${dateChip} · niveau ${idx}`,
    backHref,
    goBack: () => navigate(backHref),
    nextHref: idx < LEVEL_INDICES.length ? `/${gameId}/${date}/${idx + 1}` : undefined,
    variant,
  }
}
