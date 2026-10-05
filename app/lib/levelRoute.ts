import { data } from 'react-router'
import type { GameChallenges } from './challenges-loader'

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

/**
 * `loader` d'une page de partie, exécuté côté serveur : seul le niveau
 * désigné par l'URL part vers le navigateur, jamais l'index des niveaux. Un
 * niveau absent répond 404, et la page affiche `LevelNotFound`.
 */
export async function loadLevelRoute<L>(params: LevelParams, challenges: GameChallenges<L>) {
  const date = params.date ?? ''
  const idx = Number(params.index)
  const level = (await challenges.fetchLevel(date, idx)) ?? null
  const lastDate = challenges.getAllDates().at(-1)
  return data({ date, idx, level, lastDate }, { status: level ? 200 : 404 })
}
