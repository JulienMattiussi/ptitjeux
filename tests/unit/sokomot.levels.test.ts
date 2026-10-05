import { describe, expect, it } from 'vitest'
import * as challenges from '~/games/sokomot/challenges'
import { isWon, placementOrder } from '~/games/sokomot/engine'
import { byId, committedLevels } from '../helpers/levels'
import { replaySolution } from '../helpers/sokomot'

/**
 * Chaque niveau publié est résoluble : la `solution` du JSON, rejouée, gagne
 * en au plus `parMoves` coups. Attrape à la fois les régressions du moteur et
 * les niveaux sortis du générateur sans solution valide.
 */
describe('niveaux Sokomot : intégrité', () => {
  const levels = committedLevels(challenges)

  it('chaque jour publié a ses 4 niveaux', () => {
    const dates = challenges.getAllDates()
    expect(dates.length).toBeGreaterThan(0)
    expect(levels).toHaveLength(dates.length * 4)
  })

  it.each(byId(levels))('%s : la solution rejouée gagne en parMoves coups', (_, level) => {
    expect(isWon(replaySolution(level))).toBe(true)
    expect(level.solution.length).toBeLessThanOrEqual(level.parMoves)
  })

  it.each(byId(levels))(
    "%s : l'aide donne un rang de pose distinct à chaque lettre",
    (_, level) => {
      const ranks = [...placementOrder(level)].sort((a, b) => a - b)
      expect(ranks).toEqual(level.target.word.split('').map((_, r) => r + 1))
    },
  )

  it('aucun mot ne sert deux fois, tous jours et niveaux confondus', () => {
    const seen = new Map<string, string>()
    const repeats: string[] = []
    for (const level of levels) {
      const first = seen.get(level.target.word)
      if (first) repeats.push(`${level.target.word} : ${first} et ${level.id}`)
      else seen.set(level.target.word, level.id)
    }
    expect(repeats).toEqual([])
  })
})
