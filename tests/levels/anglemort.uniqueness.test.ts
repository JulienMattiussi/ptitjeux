import { describe, expect, it } from 'vitest'
import { getAllDates, getChallenge } from '~/games/anglemort/challenges'
import { isUnique, originalLevels } from './anglemort.helpers'

/**
 * Preuve complète : chaque grille de base, dans sa version d'origine, a une
 * solution unique à l'écran. Les 7 autres versions en héritent (symétries).
 */
describe('niveaux Angle mort : unicité de chaque grille de base', () => {
  const levels = getAllDates().flatMap((date) => (getChallenge(date) ?? []).filter(Boolean))
  const originals = originalLevels(levels)

  it('au moins une grille de base est présente', () => {
    expect(originals.length).toBeGreaterThan(0)
  })

  it.each(originals.map((l) => [l.id, l] as const))('%s : la solution est unique', (_, level) => {
    expect(isUnique(level)).toBe(true)
  })
})
