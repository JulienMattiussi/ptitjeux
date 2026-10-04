import { describe, expect, it } from 'vitest'
import { getAllDates, getChallenge } from '~/games/anglemort/challenges'
import { hasUniqueCorridor } from './anglemort.helpers'

/**
 * Preuve complète : chaque niveau, dans chacune des 8 versions de sa grille de
 * base, n'admet qu'un seul couloir. Les symétries le conservent en théorie ;
 * ce passage le vérifie aussi en pratique, transformation comprise.
 */
describe('niveaux Angle mort : unicité du couloir de chaque niveau', () => {
  const levels = getAllDates().flatMap((date) => (getChallenge(date) ?? []).filter(Boolean))

  it('au moins un niveau est présent', () => {
    expect(levels.length).toBeGreaterThan(0)
  })

  it.each(levels.map((l) => [l.id, l] as const))('%s : le couloir est unique', (_, level) => {
    expect(hasUniqueCorridor(level)).toBe(true)
  })
})
