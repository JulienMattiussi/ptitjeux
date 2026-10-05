import type { Level as AngleMortLevel } from '~/games/anglemort/types'
import type { Level as BoucleLevel } from '~/games/boucle/types'
import type { Level as SemantogrammeLevel } from '~/games/semantogramme/types'
import type { Level as SokomotLevel } from '~/games/sokomot/types'
import { LEVEL_INDICES } from '~/games/types'
import { buildChallengeIndex, type ChallengeIndex } from '~/lib/challenges-loader'
import type { GameId } from '~/lib/game-styles'

type LevelOf = {
  sokomot: SokomotLevel
  boucle: BoucleLevel
  semantogramme: SemantogrammeLevel
  anglemort: AngleMortLevel
}

// Le site charge un niveau à la fois ; les tests d'intégrité, eux, lisent tout.
const MODULES = import.meta.glob('../../app/games/*/challenges/*/*.json', {
  eager: true,
  import: 'default',
})

/** Tous les niveaux publiés d'un jeu, accessibles sans attente. */
export function committedChallenges<G extends GameId>(game: G): ChallengeIndex<LevelOf[G]> {
  const own = Object.entries(MODULES).filter(([path]) => path.includes(`/games/${game}/`))
  // Le filtre sur le dossier du jeu garantit le type des fichiers retenus.
  return buildChallengeIndex(Object.fromEntries(own) as Record<string, LevelOf[G]>)
}

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
