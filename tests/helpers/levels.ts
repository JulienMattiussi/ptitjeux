import { LEVEL_INDICES } from '~/games/types'
import type { ChallengeIndex } from '~/lib/challenges-loader'

/**
 * Tous les niveaux publiés d'un jeu, jour par jour puis niveau par niveau. Un
 * niveau manquant est omis : les tests qui l'exigent comparent au nombre de
 * jours.
 */
export function committedLevels<L>(
  challenges: Pick<ChallengeIndex<L>, 'getAllDates' | 'getLevel'>,
): L[] {
  return challenges.getAllDates().flatMap((date) =>
    LEVEL_INDICES.flatMap((index) => {
      const level = challenges.getLevel(date, index)
      return level === undefined ? [] : [level]
    }),
  )
}

/** Cas `it.each` nommés par l'identifiant du niveau. */
export function byId<L extends { id: string }>(levels: L[]): (readonly [string, L])[] {
  return levels.map((l) => [l.id, l] as const)
}
