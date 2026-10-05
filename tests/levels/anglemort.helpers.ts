import { expectedCorridor } from '~/games/anglemort/engine'
import type { Level } from '~/games/anglemort/types'
import { PROOF_CORRIDORS, PROOF_NODES, levelOrigin } from '../../generators/anglemort'
import { isCorridorUnique } from '../../generators/anglemort-corridors'

/** Niveaux qui sont la version d'origine (non transformée) de leur grille de base. */
export function originalLevels(levels: Level[]): Level[] {
  return levels.filter((l) => levelOrigin(l.id.slice(0, 10)).variant === 0)
}

/** Preuve que le couloir de la solution est le seul couloir possible. */
export function hasUniqueCorridor(level: Level): boolean {
  return isCorridorUnique(level, expectedCorridor(level), {
    maxCorridors: PROOF_CORRIDORS,
    maxNodes: PROOF_NODES,
  })
}
