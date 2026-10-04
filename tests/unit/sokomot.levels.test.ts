import { describe, expect, it } from 'vitest'
import { getAllDates, getLevel } from '~/games/sokomot/challenges'
import { applyMove, isWon, loadLevel } from '~/games/sokomot/engine'

/**
 * Vérifie que **chaque niveau de chaque défi quotidien généré** est résoluble :
 * on rejoue la séquence `solution` stockée dans le JSON et on vérifie que
 * `isWon()` renvoie true.
 *
 * Cela attrape simultanément :
 * - les régressions du moteur (un changement casse les niveaux historiques)
 * - les bugs du générateur (un niveau qui sort sans solution valide)
 */
describe('niveaux Sokomot : intégrité', () => {
  const dates = getAllDates()

  it('au moins un défi est généré', () => {
    expect(dates.length).toBeGreaterThan(0)
  })

  it('chaque niveau a 4 défis et chacun est résoluble', () => {
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)
        expect(level, `${date}/${i} introuvable`).toBeDefined()
        expect(level!.solution, `${date}/${i} sans solution`).toBeDefined()
        let state = loadLevel(level!)
        for (const move of level!.solution!) {
          state = applyMove(state, move)
        }
        expect(
          isWon(state),
          `${date}/${i} non résolu après replay (mot ${level!.target.word})`,
        ).toBe(true)
        if (level!.parMoves !== undefined) {
          expect(
            level!.solution!.length,
            `${date}/${i} solution dépasse parMoves`,
          ).toBeLessThanOrEqual(level!.parMoves)
        }
      }
    }
  })

  it('aucun mot ne sert deux fois, tous jours et niveaux confondus', () => {
    const seen = new Map<string, string>()
    const repeats: string[] = []
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const word = getLevel(date, i)?.target.word.toUpperCase()
        if (!word) continue
        const first = seen.get(word)
        if (first) repeats.push(`${word} : ${first} et ${date}/${i}`)
        else seen.set(word, `${date}/${i}`)
      }
    }
    expect(repeats).toEqual([])
  })
})
