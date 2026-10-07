import { describe, expect, it } from 'vitest'
import {
  areCluesSatisfied,
  getInsideWord,
  isValidLoop,
  isWon,
  solvedState,
} from '~/games/boucle/engine'
import { playExpectedLoop } from '../helpers/boucle'
import { byId, committedChallenges, committedLevels } from '../helpers/levels'

const challenges = committedChallenges('boucle')

describe('niveaux Boucle : intégrité', () => {
  const levels = committedLevels(challenges)

  it('chaque jour publié a ses 4 niveaux', () => {
    const dates = challenges.getAllDates()
    expect(dates.length).toBeGreaterThan(0)
    expect(levels).toHaveLength(dates.length * 4)
  })

  it.each(byId(levels))('%s : la boucle attendue fait gagner', (_, level) => {
    const { state, edges } = playExpectedLoop(level)
    expect(isValidLoop(state.edges), 'boucle non valide').toBe(true)
    expect(areCluesSatisfied(state), 'indices non satisfaits').toBe(true)
    expect(getInsideWord(state)).toBe(level.solutionWord)
    expect(isWon(state)).toBe(true)
    expect(edges.length).toBeLessThanOrEqual(level.parMoves)
  })

  it.each(byId(levels))('%s : la solution affichée des jours passés est gagnante', (_, level) => {
    expect(isWon(solvedState(level))).toBe(true)
  })

  it('aucun mot ne sert deux fois, tous jours et niveaux confondus', () => {
    const seen = new Map<string, string>()
    const repeats: string[] = []
    for (const level of levels) {
      const first = seen.get(level.solutionWord)
      if (first) repeats.push(`${level.solutionWord} : ${first} et ${level.id}`)
      else seen.set(level.solutionWord, level.id)
    }
    expect(repeats).toEqual([])
  })
})
