import { describe, expect, it } from 'vitest'
import { getAllDates, getLevel } from '~/games/semantogramme/challenges'
import {
  isGridSolved,
  isWon,
  loadLevel,
  setCellStatus,
  setThemeGuess,
} from '~/games/semantogramme/engine'
import { loadDomains } from '../../generators/semantogramme'
import { helpDomains, loadCuration } from '../../generators/semantogramme-curation'
import { familyPairs, normalizeWord } from '../../generators/semantogramme-rules'

describe('niveaux Sémantogramme : intégrité', () => {
  const dates = getAllDates()

  it('au moins un défi est généré', () => {
    expect(dates.length).toBeGreaterThan(0)
  })

  it('rowClues et colClues correspondent à la solution', () => {
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)!
        for (let y = 0; y < level.height; y++) {
          const expected = level.solution[y].filter(Boolean).length
          expect(level.rowClues[y], `${date}/${i} rowClues[${y}]`).toBe(expected)
        }
        for (let x = 0; x < level.width; x++) {
          let count = 0
          for (let y = 0; y < level.height; y++) {
            if (level.solution[y][x]) count++
          }
          expect(level.colClues[x], `${date}/${i} colClues[${x}]`).toBe(count)
        }
      }
    }
  })

  it('appliquer la solution + thème déclenche la victoire', () => {
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)!
        let state = loadLevel(level)
        for (let y = 0; y < level.height; y++) {
          for (let x = 0; x < level.width; x++) {
            state = setCellStatus(state, x, y, level.solution[y][x] ? 'in' : 'out')
          }
        }
        expect(isGridSolved(state), `${date}/${i} grille non résolue`).toBe(true)
        state = setThemeGuess(state, level.themeWord)
        expect(isWon(state), `${date}/${i} thème ${level.themeWord} rejeté`).toBe(true)
      }
    }
  })

  it('≥1 IN et ≥1 OUT par ligne et par colonne', () => {
    // Une ligne ou colonne tout-IN (clue = width/height) ou tout-OUT
    // (clue = 0) appauvrit le puzzle.
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)!
        for (let y = 0; y < level.height; y++) {
          const inCount = level.solution[y].filter(Boolean).length
          expect(inCount, `${date}/L${i} ligne ${y} clue=${inCount}`).toBeGreaterThan(0)
          expect(inCount, `${date}/L${i} ligne ${y} toute-IN`).toBeLessThan(level.width)
        }
        for (let x = 0; x < level.width; x++) {
          let inCount = 0
          for (let y = 0; y < level.height; y++) if (level.solution[y][x]) inCount++
          expect(inCount, `${date}/L${i} colonne ${x} clue=0`).toBeGreaterThan(0)
          expect(inCount, `${date}/L${i} colonne ${x} toute-IN`).toBeLessThan(level.height)
        }
      }
    }
  })

  it('aucun mot dupliqué dans la grille', () => {
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)!
        const flat = level.words.flat()
        const unique = new Set(flat)
        expect(unique.size, `${date}/L${i} contient un doublon`).toBe(flat.length)
      }
    }
  })

  it("les mots d'une journée sont tous différents, et différents des thèmes du jour", () => {
    const found: string[] = []
    for (const date of dates) {
      const day = ([1, 2, 3, 4] as const).map((i) => getLevel(date, i)).filter((l) => !!l)
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

  it('aucun niveau ne contient deux mots de la même famille', () => {
    const found: string[] = []
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)
        if (!level) continue
        for (const [a, b] of familyPairs(level.words.flat()))
          found.push(`${level.id} : ${a} / ${b}`)
      }
    }
    expect(found).toEqual([])
  })

  it('aucun mot commun avec les deux jours précédents (règle 3)', () => {
    const found: string[] = []
    const sorted = [...dates].sort()
    const wordsOfDay = sorted.map(
      (date) =>
        new Set(
          ([1, 2, 3, 4] as const).flatMap((i) =>
            getLevel(date, i)!.words.flat().map(normalizeWord),
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
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)!
        const scheduled = curation.schedule[`${i}`].find((t) => t.date === date)!
        const expected = helpDomains(
          level.themeWord,
          scheduled.category,
          domainsOf.get(level.themeWord) ?? [],
        )
        if (expected.length === 0 || level.domains.join('|') !== expected.join('|'))
          found.push(`${level.id} : ${level.domains.join(', ')}`)
      }
    }
    expect(found).toEqual([])
  })

  it('thèmes tous distincts sur tous les niveaux', () => {
    const seen = new Map<string, string>()
    const duplicates: string[] = []
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)!
        const theme = normalizeWord(level.themeWord)
        const previous = seen.get(theme)
        if (previous) duplicates.push(`${level.themeWord} : ${previous} et ${level.id}`)
        seen.set(theme, level.id)
      }
    }
    expect(duplicates).toEqual([])
  })
})
