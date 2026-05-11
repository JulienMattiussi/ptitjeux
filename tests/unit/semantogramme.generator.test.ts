import { describe, expect, it } from 'vitest'
import { isGridSolved, isWon, loadLevel, setCellStatus, setThemeGuess } from '~/games/semantogramme/engine'
import { generateSemantogrammeLevel } from '../../generators/semantogramme'

describe('semantogramme/generator', () => {
  it.each([1, 2, 3, 4] as const)('niveau %s : grille carrée 3+i', (i) => {
    const level = generateSemantogrammeLevel('2026-05-07', i)
    expect(level.width).toBe(3 + i)
    expect(level.height).toBe(3 + i)
    expect(level.words.length).toBe(level.height)
    expect(level.words[0].length).toBe(level.width)
  })

  it('rowClues et colClues sont cohérents avec solution', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateSemantogrammeLevel('2026-05-07', idx)
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
      const level = generateSemantogrammeLevel('2026-05-07', idx)
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
      const level = generateSemantogrammeLevel('2026-05-07', idx)
      for (let y = 0; y < level.height; y++) {
        expect(level.rowClues[y]).toBeLessThan(level.width)
      }
    }
  })

  it('appliquer la solution + thème déclenche victoire', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateSemantogrammeLevel('2026-05-07', idx)
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
    const a = generateSemantogrammeLevel('2026-05-07', 2)
    const b = generateSemantogrammeLevel('2026-05-07', 2)
    expect(a.themeWord).toBe(b.themeWord)
    expect(a.solution).toEqual(b.solution)
  })

  describe('branche aléatoire (date sans thème curé)', () => {
    // `1970-01-01` n'existe dans aucun des `CURATED_THEMES_L*` → le générateur
    // retombe sur le template aléatoire historique (grille N×N, ~50% thème,
    // mots potentiellement répétés). On vérifie qu'il produit toujours un
    // niveau valide et résoluble.
    const DATE = '1970-01-01'

    it.each([1, 2, 3, 4] as const)('niveau %s : grille valide et résoluble', (idx) => {
      const level = generateSemantogrammeLevel(DATE, idx)
      expect(level.width).toBe(3 + idx)
      expect(level.height).toBe(3 + idx)
      // Au moins un IN par ligne et colonne, au moins un OUT par ligne.
      for (let y = 0; y < level.height; y++) {
        expect(level.solution[y].some(Boolean)).toBe(true)
        expect(level.rowClues[y]).toBeLessThan(level.width)
      }
      for (let x = 0; x < level.width; x++) {
        let any = false
        for (let y = 0; y < level.height; y++) if (level.solution[y][x]) any = true
        expect(any).toBe(true)
      }
      // Résoluble : appliquer la solution + le thème valide la grille.
      let state = loadLevel(level)
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          state = setCellStatus(state, x, y, level.solution[y][x] ? 'in' : 'out')
        }
      }
      expect(isGridSolved(state)).toBe(true)
      state = setThemeGuess(state, level.themeWord)
      expect(isWon(state)).toBe(true)
    })

    it('déterministe sur la branche aléatoire aussi', () => {
      const a = generateSemantogrammeLevel(DATE, 3)
      const b = generateSemantogrammeLevel(DATE, 3)
      expect(a.themeWord).toBe(b.themeWord)
      expect(a.solution).toEqual(b.solution)
      expect(a.words).toEqual(b.words)
    })
  })
})
