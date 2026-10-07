import { describe, expect, it } from 'vitest'
import { isGridSolved, isWon, setThemeGuess, solvedState } from '~/games/semantogramme/engine'
import { LEVEL_INDICES } from '~/games/types'
import { loadDomains } from '../../generators/semantogramme'
import { type ThemeLevel, helpDomains, loadCuration } from '../../generators/semantogramme-curation'
import { familyPairs, normalizeWord } from '../../generators/semantogramme-rules'
import { byId, committedChallenges, committedLevels } from '../helpers/levels'
import { applySolution, cluesOf } from '../helpers/semantogramme'

const challenges = committedChallenges('semantogramme')

describe('niveaux Sémantogramme : intégrité', () => {
  const dates = challenges.getAllDates()
  const levels = committedLevels(challenges)

  it('chaque jour publié a ses 4 niveaux', () => {
    expect(dates.length).toBeGreaterThan(0)
    expect(levels).toHaveLength(dates.length * 4)
  })

  it.each(byId(levels))('%s : rowClues et colClues correspondent à la solution', (_, level) => {
    expect(cluesOf(level.solution)).toEqual({ rowClues: level.rowClues, colClues: level.colClues })
  })

  it.each(byId(levels))('%s : la solution et le thème font gagner', (_, level) => {
    const state = applySolution(level)
    expect(isGridSolved(state), 'grille non résolue').toBe(true)
    expect(isWon(setThemeGuess(state, level.themeWord)), `thème ${level.themeWord} rejeté`).toBe(
      true,
    )
  })

  it.each(byId(levels))('%s : la solution affichée des jours passés est gagnante', (_, level) => {
    expect(isWon(solvedState(level))).toBe(true)
  })

  // Une ligne ou colonne toute « thème » ou toute « hors thème » appauvrit le puzzle.
  it.each(byId(levels))(
    '%s : au moins une case de chaque sorte par ligne et colonne',
    (_, level) => {
      const { rowClues, colClues } = cluesOf(level.solution)
      for (const n of rowClues) expect(n > 0 && n < level.width).toBe(true)
      for (const n of colClues) expect(n > 0 && n < level.height).toBe(true)
    },
  )

  it.each(byId(levels))('%s : aucun mot dupliqué dans la grille', (_, level) => {
    const flat = level.words.flat()
    expect(new Set(flat).size).toBe(flat.length)
  })

  it("les mots d'une journée sont tous différents, et différents des thèmes du jour (règle 2)", () => {
    const found: string[] = []
    for (const date of dates) {
      const day = LEVEL_INDICES.flatMap((i) => challenges.getLevel(date, i) ?? [])
      const themes = new Set(day.map((l) => normalizeWord(l.themeWord)))
      const seen = new Set<string>()
      for (const level of day) {
        for (const word of level.words.flat()) {
          const n = normalizeWord(word)
          if (seen.has(n) || themes.has(n)) found.push(`${level.id} : ${word}`)
          seen.add(n)
        }
      }
    }
    expect(found).toEqual([])
  })

  it('aucun niveau ne contient deux mots de la même famille (règle 4)', () => {
    const found: string[] = []
    for (const level of levels) {
      for (const [a, b] of familyPairs(level.words.flat())) found.push(`${level.id} : ${a} / ${b}`)
    }
    expect(found).toEqual([])
  })

  it('aucun mot commun avec les deux jours précédents (règle 3)', () => {
    const found: string[] = []
    const sorted = [...dates].sort()
    const wordsOfDay = sorted.map(
      (date) =>
        new Set(
          LEVEL_INDICES.flatMap((i) => challenges.getLevel(date, i) ?? []).flatMap((l) =>
            l.words.flat().map(normalizeWord),
          ),
        ),
    )
    wordsOfDay.forEach((words, d) => {
      for (const back of [1, 2]) {
        const earlier = wordsOfDay[d - back]
        if (!earlier) continue
        for (const w of words) if (earlier.has(w)) found.push(`${sorted[d]} : ${w}`)
      }
    })
    expect(found).toEqual([])
  })

  it("l'aide révèle des domaines (ou la catégorie) qui ne trahissent pas le thème", () => {
    const curation = loadCuration()
    const domainsOf = new Map<string, string[]>()
    for (const [domain, themes] of Object.entries(loadDomains())) {
      for (const t of themes) domainsOf.set(t, [...(domainsOf.get(t) ?? []), domain])
    }
    const found: string[] = []
    for (const level of levels) {
      const date = level.id.slice(0, 10)
      const scheduled = curation.schedule[level.id.slice(11) as ThemeLevel].find(
        (t) => t.date === date,
      )!
      const expected = helpDomains(
        level.themeWord,
        scheduled.category,
        domainsOf.get(level.themeWord) ?? [],
      )
      if (expected.length === 0 || level.domains.join('|') !== expected.join('|'))
        found.push(`${level.id} : ${level.domains.join(', ')}`)
    }
    expect(found).toEqual([])
  })

  it('thèmes tous distincts sur tous les niveaux', () => {
    const seen = new Map<string, string>()
    const duplicates: string[] = []
    for (const level of levels) {
      const theme = normalizeWord(level.themeWord)
      const previous = seen.get(theme)
      if (previous) duplicates.push(`${level.themeWord} : ${previous} et ${level.id}`)
      seen.set(theme, level.id)
    }
    expect(duplicates).toEqual([])
  })
})
