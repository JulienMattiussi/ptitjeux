import { describe, expect, it } from 'vitest'
import { getAllDates, getLevel } from '~/games/semantogramme/challenges'
import {
  isGridSolved,
  isWon,
  loadLevel,
  setCellStatus,
  setThemeGuess,
} from '~/games/semantogramme/engine'
import { CURATED_THEMES_L1 } from '../../generators/curated-themes-l1'
import { CURATED_THEMES_L2 } from '../../generators/curated-themes-l2'
import { CURATED_THEMES_L3 } from '../../generators/curated-themes-l3'

const CURATED_MAPS = { 1: CURATED_THEMES_L1, 2: CURATED_THEMES_L2, 3: CURATED_THEMES_L3 } as const

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

  it('puzzles curés : ≥1 IN et ≥1 OUT par ligne et par colonne', () => {
    // Une ligne ou colonne tout-IN (clue = width/height) ou tout-OUT
    // (clue = 0) appauvrit le puzzle. Le générateur curé re-mélange jusqu'à
    // satisfaction ; on vérifie ici que le JSON livré respecte bien la règle.
    for (const date of dates) {
      for (const i of [1, 2, 3] as const) {
        if (!CURATED_MAPS[i][date]) continue
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

  it('puzzles curés : aucun mot dupliqué dans la grille', () => {
    // L1, L2 et L3 sont curés : chaque case porte un mot distinct. L4 reste
    // tiré aléatoirement et peut répéter (par construction).
    for (const date of dates) {
      for (const i of [1, 2, 3] as const) {
        if (!CURATED_MAPS[i][date]) continue
        const level = getLevel(date, i)!
        const flat = level.words.flat()
        const unique = new Set(flat)
        expect(unique.size, `${date}/L${i} contient un doublon`).toBe(flat.length)
      }
    }
  })

  it('thèmes curés : tous distincts entre L1, L2, L3 et entre eux', () => {
    const allCurated: Array<{ source: string; word: string }> = []
    for (const [date, theme] of Object.entries(CURATED_THEMES_L1)) {
      allCurated.push({ source: `L1/${date}`, word: theme.word })
    }
    for (const [date, theme] of Object.entries(CURATED_THEMES_L2)) {
      allCurated.push({ source: `L2/${date}`, word: theme.word })
    }
    for (const [date, theme] of Object.entries(CURATED_THEMES_L3)) {
      allCurated.push({ source: `L3/${date}`, word: theme.word })
    }
    const seen = new Map<string, string>()
    for (const { source, word } of allCurated) {
      const previous = seen.get(word)
      expect(previous, `thème "${word}" déjà utilisé en ${previous} et en ${source}`).toBeUndefined()
      seen.set(word, source)
    }
  })
})
