import { describe, expect, it } from 'vitest'
import {
  isGridSolved,
  isWon,
  loadLevel,
  setCellStatus,
  setThemeGuess,
} from '~/games/semantogramme/engine'
import { findLevel } from '~/games/semantogramme/levels'

/**
 * Pour chaque niveau, on vérifie deux invariants :
 * 1. Cohérence : les rowClues et colClues correspondent au nombre de cases
 *    `true` dans la matrice solution.
 * 2. Résolubilité : appliquer la solution puis le themeWord déclenche isWon.
 */
const LEVEL_IDS = ['001-intro', '002-fruits']

describe('niveaux Sémantogramme : intégrité', () => {
  for (const id of LEVEL_IDS) {
    it(`${id} : rowClues coïncide avec la solution`, () => {
      const level = findLevel(id)!
      for (let y = 0; y < level.height; y++) {
        const expected = level.solution[y].filter(Boolean).length
        expect(level.rowClues[y], `rowClues[${y}]`).toBe(expected)
      }
    })

    it(`${id} : colClues coïncide avec la solution`, () => {
      const level = findLevel(id)!
      for (let x = 0; x < level.width; x++) {
        let count = 0
        for (let y = 0; y < level.height; y++) {
          if (level.solution[y][x]) count++
        }
        expect(level.colClues[x], `colClues[${x}]`).toBe(count)
      }
    })

    it(`${id} : appliquer la solution + le thème déclenche la victoire`, () => {
      const level = findLevel(id)!
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
  }
})
