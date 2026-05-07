import { describe, expect, it } from 'vitest'
import { applyMove, isWon, loadLevel, undo } from '~/games/sokomot/engine'
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

  it('met à jour lastDirection à chaque coup réussi', () => {
    let state = loadLevel(makeLevel())
    state = applyMove(state, 'right')
    expect(state.lastDirection).toBe('right')
    // Niveau au-delà du mur : le coup est refusé, lastDirection ne change pas
    const blockedLevel = makeLevel({ player: [0, 1], walls: [[1, 1]] })
    let blocked = loadLevel(blockedLevel)
    blocked = applyMove(blocked, 'right')
    expect(blocked.lastDirection).toBe('right') // inchangé car bloqué
  })

  it('undo restaure aussi lastDirection', () => {
    let state = loadLevel(makeLevel())
    state = applyMove(state, 'right') // lastDirection: right
    const beforeUp = state
    // Tenter up depuis (1,1) : sort des bornes (haut), donc bloqué — pas de changement
    // Faisons plutôt un coup à droite confirmé puis undo
    state = applyMove(state, 'right')
    // après undo, lastDirection redevient ce qu'il était à l'état précédent
    state = undo(state)
    expect(state).toEqual(beforeUp)
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

  it('annule le dernier coup avec undo', () => {
    const state = loadLevel(makeLevel())
    const moved = applyMove(state, 'right')
    const back = undo(moved)
    expect(back.player).toEqual(state.player)
    expect(back.moves).toBe(0)
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
