import { describe, expect, it } from 'vitest'
import {
  isGridSolved,
  isWon,
  loadLevel,
  setCellStatus,
  setThemeGuess,
} from '~/games/semantogramme/engine'
import { generateSemantogrammeLevel } from '../../generators/semantogramme'
import { loadCuration } from '../../generators/semantogramme-curation'

describe('semantogramme/generator', () => {
  it.each([1, 2, 3, 4] as const)('niveau %s : grille carrée 3+i', (i) => {
    const level = generateSemantogrammeLevel('2026-10-07', i)
    expect(level.width).toBe(3 + i)
    expect(level.height).toBe(3 + i)
    expect(level.words.length).toBe(level.height)
    expect(level.words[0].length).toBe(level.width)
  })

  it('rowClues et colClues sont cohérents avec solution', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateSemantogrammeLevel('2026-10-07', idx)
      for (let y = 0; y < level.height; y++) {
        const expected = level.solution[y].filter(Boolean).length
        expect(level.rowClues[y]).toBe(expected)
      }
      for (let x = 0; x < level.width; x++) {
        let count = 0
        for (let y = 0; y < level.height; y++) if (level.solution[y][x]) count++
        expect(level.colClues[x]).toBe(count)
      }
    }
  })

  it('au moins une case « in » par ligne et par colonne', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateSemantogrammeLevel('2026-10-07', idx)
      for (let y = 0; y < level.height; y++) {
        expect(level.solution[y].some(Boolean), `ligne ${y} sans IN`).toBe(true)
      }
      for (let x = 0; x < level.width; x++) {
        let any = false
        for (let y = 0; y < level.height; y++) if (level.solution[y][x]) any = true
        expect(any, `colonne ${x} sans IN`).toBe(true)
      }
    }
  })

  it('au moins une case « hors thème » par ligne (clue ≠ width)', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateSemantogrammeLevel('2026-10-07', idx)
      for (let y = 0; y < level.height; y++) {
        expect(level.rowClues[y]).toBeLessThan(level.width)
      }
    }
  })

  it('appliquer la solution + thème déclenche victoire', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateSemantogrammeLevel('2026-10-07', idx)
      let state = loadLevel(level)
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          state = setCellStatus(state, x, y, level.solution[y][x] ? 'in' : 'out')
        }
      }
      expect(isGridSolved(state)).toBe(true)
      state = setThemeGuess(state, level.themeWord)
      expect(isWon(state)).toBe(true)
    }
  })

  it('génération déterministe', () => {
    const a = generateSemantogrammeLevel('2026-10-07', 2)
    const b = generateSemantogrammeLevel('2026-10-07', 2)
    expect(a.themeWord).toBe(b.themeWord)
    expect(a.solution).toEqual(b.solution)
  })

  it('reprend le thème du calendrier de curation', () => {
    expect(generateSemantogrammeLevel('2026-09-01', 1).themeWord).toBe('roman')
  })

  it('les cases thème sont des mots curés du thème, les autres non', () => {
    const curation = loadCuration()
    const level = generateSemantogrammeLevel('2026-10-07', 3)
    const members = new Set(curation.words[`3|${level.themeWord}`])
    level.words.forEach((row, y) =>
      row.forEach((word, x) => expect(members.has(word), word).toBe(level.solution[y][x])),
    )
  })

  it('refuse une date absente du calendrier', () => {
    expect(() => generateSemantogrammeLevel('1970-01-01', 1)).toThrow()
  })
})
