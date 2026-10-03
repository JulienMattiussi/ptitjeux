import type { Level } from '~/games/anglemort/types'
import { UNIQUE_NODES, levelOrigin } from '../../generators/anglemort'
import { solveAngleMort } from '../../generators/anglemort-solver'

/** Niveaux qui sont la version d'origine (non transformée) de leur grille de base. */
export function originalLevels(levels: Level[]): Level[] {
  return levels.filter((l) => levelOrigin(l.id.slice(0, 10)).variant === 0)
}

/** Preuve d'unicité à l'écran, avec le budget utilisé à la génération. */
export function isUnique(level: Level): boolean {
  const index = Number(level.id.slice(11)) as 1 | 2 | 3 | 4
  const result = solveAngleMort(level, {
    exactPool: true,
    limit: 2,
    maxNodes: UNIQUE_NODES[index],
  })
  return result.complete && result.solutions.length === 1
}
