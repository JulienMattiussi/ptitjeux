import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { lastAvailableDate } from '~/games'
import { LEVEL_INDICES } from '~/games/types'
import { victoryVariant, type SolvedStatus } from './completion'
import { dateLabel, todayString } from './dates'
import type { GameId } from './game-styles'
import { findGame } from './games-registry'
import { levelKey, recordWin } from './localStorage'

/**
 * Niveau désigné par l'URL `/<jeu>/:date/:index`, `undefined` s'il n'existe
 * pas. Lu par le wrapper de chaque route de partie, qui affiche alors
 * `LevelNotFound`, ou remonte la partie sur un `key` propre au niveau.
 */
export function useLevelParams<L>(getLevel: (date: string, index: number) => L | undefined) {
  const { date = '', index = '' } = useParams<{ date: string; index: string }>()
  const idx = Number(index)
  return { date, idx, level: getLevel(date, idx) }
}

type Options = {
  gameId: GameId
  date: string
  idx: number
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
  won,
  moves,
  parMoves,
}: Options): Lifecycle {
  const navigate = useNavigate()

  useEffect(() => {
    if (won) recordWin(gameId, levelKey(date, idx), moves)
  }, [gameId, won, date, idx, moves])

  const isToday = date === todayString(lastAvailableDate(gameId))
  const dateChip = isToday ? 'Défi du jour' : dateLabel(date)
  const backHref = `/${gameId}?from=${date}`
  return {
    title: `${findGame(gameId).name} · ${dateChip} · niveau ${idx}`,
    backHref,
    goBack: () => navigate(backHref),
    nextHref: idx < LEVEL_INDICES.length ? `/${gameId}/${date}/${idx + 1}` : undefined,
    variant: victoryVariant(moves, parMoves),
  }
}
