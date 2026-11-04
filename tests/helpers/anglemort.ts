import { expectedCorridor } from '~/games/anglemort/engine'
import type { Level } from '~/games/anglemort/types'
import { isCorridorUnique } from '../../generators/anglemort-corridors'
import { minimalPose, poolSize } from '../../generators/anglemort-minpose'
import { levelOrigin } from '../../generators/anglemort-schedule'

/** Niveaux qui sont la version d'origine (non transformée) de leur grille de base. */
export function originalLevels(levels: Level[]): Level[] {
  return levels.filter((l) => levelOrigin(l.id.slice(0, 10)).variant === 0)
}

/** Preuve, au budget des tests d'intégrité, que le couloir de la solution est le seul possible. */
export function hasUniqueCorridor(level: Level): boolean {
  return isCorridorUnique(level, expectedCorridor(level))
}

/**
 * Vrai si aucune pose plus courte que le lot ne produit le couloir de la
 * solution : le joueur qui la trouverait garderait un vigile sans place utile.
 */
export async function hasMinimalPool(level: Level): Promise<boolean> {
  const result = await minimalPose(level, expectedCorridor(level))
  return result.status === 'optimal' && result.pose.length === poolSize(level)
}
