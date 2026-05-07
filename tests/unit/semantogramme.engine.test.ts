import { describe, expect, it } from 'vitest'
import {
  countInPerCol,
  countInPerRow,
  cycleCellStatus,
  isFullyMarked,
  isGridSolved,
  isThemeGuessCorrect,
  isWon,
  loadLevel,
  setThemeGuess,
} from '~/games/semantogramme/engine'
import type { Level } from '~/games/semantogramme/types'

function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'test',
    name: 'Test',
    width: 2,
    height: 2,
    words: [
      ['a', 'b'],
      ['c', 'd'],
    ],
    rowClues: [1, 1],
    colClues: [1, 1],
    themeWord: 'animal',
    solution: [
      [true, false],
      [false, true],
    ],
    ...overrides,
  }
}

describe('semantogramme engine', () => {
  it('charge un niveau avec toutes les cases unmarked', () => {
    const state = loadLevel(makeLevel())
    expect(state.status).toEqual([
      ['unmarked', 'unmarked'],
      ['unmarked', 'unmarked'],
    ])
    expect(state.themeGuess).toBe('')
  })

  it('cycle les statuts unmarked → in → out → unmarked', () => {
    let state = loadLevel(makeLevel())
    state = cycleCellStatus(state, 0, 0)
    expect(state.status[0][0]).toBe('in')
    state = cycleCellStatus(state, 0, 0)
    expect(state.status[0][0]).toBe('out')
    state = cycleCellStatus(state, 0, 0)
    expect(state.status[0][0]).toBe('unmarked')
  })

  it('chaque cycle de case incrémente le compteur de coups', () => {
    let state = loadLevel(makeLevel())
    expect(state.moves).toBe(0)
    state = cycleCellStatus(state, 0, 0)
    expect(state.moves).toBe(1)
    state = cycleCellStatus(state, 1, 1)
    expect(state.moves).toBe(2)
    // Cycle hors bornes : pas de mouvement
    state = cycleCellStatus(state, 99, 99)
    expect(state.moves).toBe(2)
  })

  it('compte les IN par ligne et par colonne', () => {
    let state = loadLevel(makeLevel())
    state = cycleCellStatus(state, 0, 0) // (0,0) → in
    state = cycleCellStatus(state, 1, 1) // (1,1) → in
    expect(countInPerRow(state, 0)).toBe(1)
    expect(countInPerRow(state, 1)).toBe(1)
    expect(countInPerCol(state, 0)).toBe(1)
    expect(countInPerCol(state, 1)).toBe(1)
  })

  it('détecte une grille pleinement marquée', () => {
    let state = loadLevel(makeLevel())
    expect(isFullyMarked(state)).toBe(false)
    state = cycleCellStatus(state, 0, 0) // in
    state = cycleCellStatus(state, 0, 1) // in
    state = cycleCellStatus(state, 1, 0) // in
    state = cycleCellStatus(state, 1, 1) // in
    expect(isFullyMarked(state)).toBe(true)
  })

  it('détecte la grille résolue avec OUT explicites sur les non-thème', () => {
    let state = loadLevel(makeLevel())
    state = cycleCellStatus(state, 0, 0) // (0,0) → in
    state = cycleCellStatus(state, 1, 0) // (1,0) → in
    state = cycleCellStatus(state, 1, 0) // (1,0) → out
    state = cycleCellStatus(state, 0, 1) // (0,1) → in
    state = cycleCellStatus(state, 0, 1) // (0,1) → out
    state = cycleCellStatus(state, 1, 1) // (1,1) → in
    expect(isGridSolved(state)).toBe(true)
  })

  it('détecte la grille résolue avec uniquement les IN posés (OUT laissés vides)', () => {
    let state = loadLevel(makeLevel())
    state = cycleCellStatus(state, 0, 0) // (0,0) → in (solution: true)
    state = cycleCellStatus(state, 1, 1) // (1,1) → in (solution: true)
    // (1,0) et (0,1) restent unmarked — leur solution est false, donc OK.
    expect(isGridSolved(state)).toBe(true)
  })

  it('refuse la grille résolue si une case hors-thème est marquée IN (faux positif)', () => {
    let state = loadLevel(makeLevel())
    state = cycleCellStatus(state, 0, 0) // (0,0) → in (solution: true)
    state = cycleCellStatus(state, 1, 1) // (1,1) → in (solution: true)
    state = cycleCellStatus(state, 1, 0) // (1,0) → in MAIS solution: false
    expect(isGridSolved(state)).toBe(false)
  })

  it('valide le thème en ignorant la casse et les accents', () => {
    let state = loadLevel(makeLevel({ themeWord: 'éléphant' }))
    state = setThemeGuess(state, 'Elephant')
    expect(isThemeGuessCorrect(state)).toBe(true)
    state = setThemeGuess(state, 'tigre')
    expect(isThemeGuessCorrect(state)).toBe(false)
  })

  it("isWon n'est vrai que si la grille est résolue ET le thème est juste", () => {
    let state = loadLevel(makeLevel())
    state = cycleCellStatus(state, 0, 0) // (0,0) → in
    state = cycleCellStatus(state, 1, 1) // (1,1) → in
    expect(isWon(state)).toBe(false) // pas de thème
    state = setThemeGuess(state, 'tigre')
    expect(isWon(state)).toBe(false) // mauvais thème
    state = setThemeGuess(state, 'animal')
    expect(isWon(state)).toBe(true) // grille OK + bon thème
  })

  it("isWon est faux quand un IN manque", () => {
    let state = loadLevel(makeLevel())
    state = cycleCellStatus(state, 0, 0) // (0,0) → in
    // (1,1) reste unmarked alors que solution true
    state = setThemeGuess(state, 'animal')
    expect(isWon(state)).toBe(false)
  })
})
