import { describe, expect, it } from 'vitest'
import { getAllDates, getLevel } from '~/games/semantogramme/challenges'
import {
  isGridSolved,
  isWon,
  loadLevel,
  setCellStatus,
  setThemeGuess,
} from '~/games/semantogramme/engine'

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
})
