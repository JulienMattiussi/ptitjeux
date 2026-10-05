import { describe, expect, it } from 'vitest'
import { isGridSolved, isWon, setThemeGuess } from '~/games/semantogramme/engine'
import { LEVEL_INDICES } from '~/games/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { generateSemantogrammeLevel } from '../../generators/semantogramme'
import { loadCuration } from '../../generators/semantogramme-curation'
import { applySolution, cluesOf } from '../helpers/semantogramme'

const DATE = '2026-10-07'

describe('semantogramme/generator', () => {
  it.each(LEVEL_INDICES)('niveau %s : grille à la taille du niveau', (i) => {
    const level = generateSemantogrammeLevel(DATE, i)
    expect({ width: level.width, height: level.height }).toEqual(GAME_SIZE.semantogramme(i))
    expect(level.words).toHaveLength(level.height)
    expect(level.words[0]).toHaveLength(level.width)
  })

  it.each(LEVEL_INDICES)('niveau %s : rowClues et colClues comptent la solution', (i) => {
    const level = generateSemantogrammeLevel(DATE, i)
    expect(cluesOf(level.solution)).toEqual({ rowClues: level.rowClues, colClues: level.colClues })
  })

  it.each(LEVEL_INDICES)(
    'niveau %s : au moins une case de chaque sorte par ligne et colonne',
    (i) => {
      const level = generateSemantogrammeLevel(DATE, i)
      for (const n of [...level.rowClues, ...level.colClues]) {
        expect(n > 0 && n < level.width).toBe(true)
      }
    },
  )

  it.each(LEVEL_INDICES)('niveau %s : la solution et le thème font gagner', (i) => {
    const level = generateSemantogrammeLevel(DATE, i)
    const state = applySolution(level)
    expect(isGridSolved(state)).toBe(true)
    expect(isWon(setThemeGuess(state, level.themeWord))).toBe(true)
  })

  it('génération déterministe', () => {
    expect(generateSemantogrammeLevel(DATE, 2)).toEqual(generateSemantogrammeLevel(DATE, 2))
  })

  it('reprend le thème du calendrier de curation', () => {
    expect(generateSemantogrammeLevel('2026-09-01', 1).themeWord).toBe('roman')
  })

  it('les cases thème sont des mots curés du thème, les autres non', () => {
    const curation = loadCuration()
    const level = generateSemantogrammeLevel(DATE, 3)
    const members = new Set(curation.words[`3|${level.themeWord}`])
    level.words.forEach((row, y) =>
      row.forEach((word, x) => expect(members.has(word), word).toBe(level.solution[y][x])),
    )
  })

  it('refuse une date absente du calendrier', () => {
    expect(() => generateSemantogrammeLevel('1970-01-01', 1)).toThrow()
  })
})
