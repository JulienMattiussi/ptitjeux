import { describe, expect, it } from 'vitest'
import { applyMove, isWon, loadLevel, placementOrder, reducer } from '~/games/sokomot/engine'
import type { Level } from '~/games/sokomot/types'

function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'test',
    name: 'Test',
    width: 5,
    height: 3,
    player: [0, 1],
    walls: [],
    ice: [],
    blocks: [{ id: 'b1', letter: 'A', pos: [2, 1] }],
    target: { word: 'A', cells: [[3, 1]] },
    parMoves: 2,
    solution: ['right', 'right'],
    canonicalWord: 'a',
    ...overrides,
  }
}

describe('sokomot engine', () => {
  it('charge un niveau dans son état initial', () => {
    const state = loadLevel(makeLevel())
    expect(state.player).toEqual([0, 1])
    expect(state.blocks).toHaveLength(1)
    expect(state.moves).toBe(0)
    expect(state.lastDirection).toBe('right')
  })

  it('oriente le crayon dans la direction du coup joué', () => {
    const state = applyMove(loadLevel(makeLevel()), 'down')
    expect(state.lastDirection).toBe('down')
  })

  it("garde l'orientation quand le coup est bloqué", () => {
    const down = applyMove(loadLevel(makeLevel({ walls: [[1, 2]] })), 'down')
    expect(applyMove(down, 'right').lastDirection).toBe('down')
  })

  it('déplace le joueur dans une direction libre', () => {
    const state = loadLevel(makeLevel())
    const next = applyMove(state, 'right')
    expect(next.player).toEqual([1, 1])
    expect(next.moves).toBe(1)
  })

  it('pousse un bloc vers une case libre', () => {
    const level = makeLevel({ player: [1, 1] })
    const state = loadLevel(level)
    const next = applyMove(state, 'right')
    expect(next.player).toEqual([2, 1])
    expect(next.blocks[0].pos).toEqual([3, 1])
  })

  it('refuse de pousser un bloc contre un mur', () => {
    const level = makeLevel({
      player: [1, 1],
      blocks: [{ id: 'b1', letter: 'A', pos: [2, 1] }],
      walls: [[3, 1]],
    })
    const state = loadLevel(level)
    const next = applyMove(state, 'right')
    expect(next).toBe(state)
  })

  it("fait glisser un bloc poussé sur la glace jusqu'à un mur", () => {
    const level = makeLevel({
      width: 7,
      player: [1, 1],
      blocks: [{ id: 'b1', letter: 'A', pos: [2, 1] }],
      ice: [
        [3, 1],
        [4, 1],
        [5, 1],
      ],
      walls: [[6, 1]],
      target: { word: 'A', cells: [[5, 1]] },
    })
    const state = loadLevel(level)
    const next = applyMove(state, 'right')
    expect(next.blocks[0].pos).toEqual([5, 1])
    expect(isWon(next)).toBe(true)
  })

  it('reset revient au niveau de départ', () => {
    const moved = applyMove(loadLevel(makeLevel()), 'right')
    expect(reducer(moved, { type: 'reset' })).toEqual(loadLevel(makeLevel()))
  })

  it('détecte la victoire', () => {
    const level = makeLevel({
      player: [1, 1],
      blocks: [{ id: 'b1', letter: 'A', pos: [2, 1] }],
      target: { word: 'A', cells: [[3, 1]] },
    })
    const state = loadLevel(level)
    expect(isWon(state)).toBe(false)
    const moved = applyMove(state, 'right')
    expect(isWon(moved)).toBe(true)
  })
})

describe('sokomot placementOrder', () => {
  // B est poussé sur sa case au 1er coup, A au 4e : B se pose en premier.
  const twoBlocks = makeLevel({
    height: 4,
    player: [1, 1],
    blocks: [
      { id: 'b1', letter: 'B', pos: [2, 1] },
      { id: 'b2', letter: 'A', pos: [2, 2] },
    ],
    target: {
      word: 'AB',
      cells: [
        [3, 2],
        [3, 1],
      ],
    },
    solution: ['right', 'left', 'down', 'right'],
  })

  it('donne à chaque lettre son rang de pose dans la solution', () => {
    expect(placementOrder(twoBlocks)).toEqual([2, 1])
  })
})
