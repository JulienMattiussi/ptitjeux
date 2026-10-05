import { describe, expect, it } from 'vitest'
import { isWon } from '~/games/sokomot/engine'
import type { Coord, Level } from '~/games/sokomot/types'
import { buildBorderWalls } from '../../generators/sokomot-grid'
import { solveOptimalSokomot } from '../../generators/sokomot-optimal-solver'
import { solveSokomotByPushes } from '../../generators/sokomot-pushstate-solver'
import { replaySolution } from '../helpers/sokomot'

/**
 * #######
 * #  a b#    Cibles a et b sur la rangée du haut. Au mieux : pousser A
 * #  A B#    (2 pas et 1 poussée), puis passer sous B et la pousser (3 pas et
 * #@    #    1 poussée) : 7 coups.
 * #######
 */
function tinyLevel(ice: Coord[] = []): Level {
  return {
    id: 'test',
    name: 'test',
    width: 7,
    height: 5,
    player: [1, 3],
    walls: buildBorderWalls(7, 5),
    ice,
    blocks: [
      { id: 'b1', letter: 'A', pos: [3, 2] },
      { id: 'b2', letter: 'B', pos: [5, 2] },
    ],
    target: {
      word: 'AB',
      cells: [
        [3, 1],
        [5, 1],
      ],
    },
    parMoves: 0,
    solution: [],
    canonicalWord: 'ab',
  }
}

const solved = (level: Level, solution: Level['solution'] | null) =>
  solution !== null && isWon(replaySolution({ ...level, solution }))

describe('solveOptimalSokomot', () => {
  it('trouve une solution la plus courte', () => {
    const level = tinyLevel()
    const solution = solveOptimalSokomot(level, 100_000)
    expect(solved(level, solution)).toBe(true)
    expect(solution).toHaveLength(7)
  })

  it('renvoie null au-delà du budget', () => {
    expect(solveOptimalSokomot(tinyLevel(), 1)).toBeNull()
  })
})

describe('solveSokomotByPushes', () => {
  it('trouve une solution valide', () => {
    const level = tinyLevel()
    expect(solved(level, solveSokomotByPushes(level, 100_000))).toBe(true)
  })

  it('renvoie null au-delà du budget', () => {
    expect(solveSokomotByPushes(tinyLevel(), 1)).toBeNull()
  })

  it('refuse un niveau avec de la glace', () => {
    expect(solveSokomotByPushes(tinyLevel([[2, 1]]), 100_000)).toBeNull()
  })
})
