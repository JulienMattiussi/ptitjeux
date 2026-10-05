import { describe, expect, it } from 'vitest'
import { LEVEL_INDICES } from '~/games/types'
import { stripAccents } from '~/lib/text'
import { committedChallenges } from '../helpers/levels'

const boucle = committedChallenges('boucle')
const semantogramme = committedChallenges('semantogramme')
const sokomot = committedChallenges('sokomot')

/** Comparaison telle que le joueur la voit : sans accents, en majuscules. */
function normalize(word: string): string {
  return stripAccents(word).toUpperCase()
}

/** Mots à trouver d'une journée, tous jeux et niveaux confondus. */
function wordsOfDay(date: string): { word: string; source: string }[] {
  return LEVEL_INDICES.flatMap((i) => [
    { word: sokomot.getLevel(date, i)?.target.word, source: `Sokomot ${i}` },
    { word: boucle.getLevel(date, i)?.solutionWord, source: `Boucle ${i}` },
    { word: semantogramme.getLevel(date, i)?.themeWord, source: `Sémantogramme ${i}` },
  ]).flatMap(({ word, source }) => (word ? [{ word: normalize(word), source }] : []))
}

describe('mots du jour : tous jeux confondus', () => {
  const dates = [
    ...new Set([...sokomot.getAllDates(), ...boucle.getAllDates(), ...semantogramme.getAllDates()]),
  ].sort()

  it('un même jour ne fait jamais chercher deux fois le même mot', () => {
    const repeats: string[] = []
    for (const date of dates) {
      const seen = new Map<string, string>()
      for (const { word, source } of wordsOfDay(date)) {
        const first = seen.get(word)
        if (first) repeats.push(`${date} : ${word} (${first} et ${source})`)
        else seen.set(word, source)
      }
    }
    expect(repeats).toEqual([])
  })
})
