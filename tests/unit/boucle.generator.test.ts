import { describe, expect, it } from 'vitest'
import { areCluesSatisfied, isValidLoop, isWon } from '~/games/boucle/engine'
import { LEVEL_INDICES } from '~/games/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { stripAccents } from '~/lib/text'
import { generateBoucleLevel } from '../../generators/boucle'
import { playExpectedLoop } from '../helpers/boucle'

const DATE = '2026-10-07'

describe('boucle/generator', () => {
  it.each(LEVEL_INDICES)('niveau %s : grille à la taille du niveau', (i) => {
    const level = generateBoucleLevel(DATE, i)
    expect({ width: level.width, height: level.height }).toEqual(GAME_SIZE.boucle(i))
  })

  it.each(LEVEL_INDICES)('niveau %s : la boucle attendue fait gagner', (i) => {
    const { state } = playExpectedLoop(generateBoucleLevel(DATE, i))
    expect(isValidLoop(state.edges), 'boucle invalide').toBe(true)
    expect(areCluesSatisfied(state), 'indices non satisfaits').toBe(true)
    expect(isWon(state), 'non gagnant').toBe(true)
  })

  it.each(LEVEL_INDICES)('niveau %s : le mot affiché est le canonicalWord sans accents', (i) => {
    const level = generateBoucleLevel(DATE, i)
    expect(stripAccents(level.canonicalWord).toUpperCase()).toBe(level.solutionWord)
  })

  it.each(LEVEL_INDICES)('niveau %s : parMoves = périmètre + 4', (i) => {
    const level = generateBoucleLevel(DATE, i)
    expect(level.parMoves).toBe(playExpectedLoop(level).edges.length + 4)
  })

  it.each(LEVEL_INDICES)('niveau %s : mot aussi long que la grille', (i) => {
    const level = generateBoucleLevel(DATE, i)
    expect(level.solutionWord).toHaveLength(level.width)
  })

  it('génération déterministe', () => {
    expect(generateBoucleLevel(DATE, 2)).toEqual(generateBoucleLevel(DATE, 2))
  })

  it('écarte les mots déjà publiés', () => {
    const first = generateBoucleLevel(DATE, 1)
    const other = generateBoucleLevel(DATE, 1, { usedWords: new Set([first.solutionWord]) })
    expect(other.solutionWord).not.toBe(first.solutionWord)
  })
})
