import { data } from 'react-router'
import type { GameChallenges } from './challenges-loader'
import { shouldShowFutureDates, todayString } from './dates'

/** Calendrier publié d'un jeu : un défi chaque jour, de `firstDate` à `lastDate`. */
export type CalendarRange = { firstDate: string | undefined; lastDate: string | undefined }

/**
 * `loader` d'une page de liste : le calendrier étant continu (vérifié par
 * `games.calendar.test.ts`), ses deux bornes suffisent à retrouver chaque jour.
 */
export function loadListRoute(
  challenges: Pick<GameChallenges<unknown>, 'getAllDates'>,
): CalendarRange {
  const dates = challenges.getAllDates()
  return { firstDate: dates[0], lastDate: dates.at(-1) }
}

/** Paramètres d'URL d'une page de partie (`/<jeu>/:date/:index`). */
export type LevelParams = { date?: string; index?: string }

/** Ce qu'une page de partie reçoit de son `loader`, niveau trouvé. */
export type PlayProps<L> = {
  level: L
  date: string
  idx: number
  /** Dernier défi publié, base de la mention « Défi du jour ». */
  lastDate: string | undefined
}

/** Un défi à venir n'est pas encore publié, même si son fichier existe. */
function isPublished(date: string): boolean {
  return shouldShowFutureDates() || date <= todayString()
}

/**
 * `loader` d'une page de partie, exécuté côté serveur : seul le niveau
 * désigné par l'URL part vers le navigateur, jamais l'index des niveaux. Une
 * URL mal formée, un niveau absent ou à venir répondent 404, et la page
 * affiche `LevelNotFound`.
 */
export async function loadLevelRoute<L>(params: LevelParams, challenges: GameChallenges<L>) {
  const date = params.date ?? ''
  const idx = Number(params.index)
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^[1-4]$/.test(params.index ?? '')
  const level =
    valid && isPublished(date) ? ((await challenges.fetchLevel(date, idx)) ?? null) : null
  const lastDate = challenges.getAllDates().at(-1)
  return data({ date, idx, level, lastDate }, { status: level ? 200 : 404 })
}
