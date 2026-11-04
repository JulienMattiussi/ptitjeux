import { describe, expect, it } from 'vitest'
import { hasMinimalPool } from '../helpers/anglemort'
import { byId, committedChallenges, committedLevels } from '../helpers/levels'

const challenges = committedChallenges('anglemort')

/**
 * Lot minimal : aucune pose plus courte que le lot ne produit le couloir de
 * chaque niveau, dans chacune des 8 versions de sa grille de base.
 */
describe('niveaux Angle mort : aucun vigile inutile', () => {
  it.each(byId(committedLevels(challenges)))('%s : le lot est minimal', async (_, level) => {
    expect(await hasMinimalPool(level)).toBe(true)
  })
})
