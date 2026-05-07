import { describe, expect, it } from 'vitest'
import {
  areCluesSatisfied,
  countEdgesAroundCell,
  findInsideCells,
  getInsideWord,
  isValidLoop,
  isWon,
  loadLevel,
  toggleEdge,
} from '~/games/boucle/engine'
import type { Edge, Level } from '~/games/boucle/types'

function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'test',
    name: 'Test',
    width: 3,
    height: 3,
    letters: [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
    ],
    clues: {},
    solutionWord: 'E',
    ...overrides,
  }
}

/** Boucle = carré 1×1 entourant la case `(cx, cy)`. */
function squareLoop(cx: number, cy: number): Edge[] {
  return [
    { x: cx, y: cy, orientation: 'horizontal' }, // top
    { x: cx, y: cy + 1, orientation: 'horizontal' }, // bottom
    { x: cx, y: cy, orientation: 'vertical' }, // left
    { x: cx + 1, y: cy, orientation: 'vertical' }, // right
  ]
}

/** Boucle = rectangle entourant les cases (cx..cx+w-1, cy..cy+h-1). */
function rectangleLoop(cx: number, cy: number, w: number, h: number): Edge[] {
  const edges: Edge[] = []
  for (let i = 0; i < w; i++) {
    edges.push({ x: cx + i, y: cy, orientation: 'horizontal' })
    edges.push({ x: cx + i, y: cy + h, orientation: 'horizontal' })
  }
  for (let j = 0; j < h; j++) {
    edges.push({ x: cx, y: cy + j, orientation: 'vertical' })
    edges.push({ x: cx + w, y: cy + j, orientation: 'vertical' })
  }
  return edges
}

describe('boucle engine', () => {
  it('toggle ajoute puis enlève une arête', () => {
    let state = loadLevel(makeLevel())
    const e: Edge = { x: 0, y: 0, orientation: 'horizontal' }
    state = toggleEdge(state, e)
    expect(state.edges).toHaveLength(1)
    state = toggleEdge(state, e)
    expect(state.edges).toHaveLength(0)
  })

  it('chaque toggle incrémente le compteur de coups', () => {
    let state = loadLevel(makeLevel())
    expect(state.moves).toBe(0)
    state = toggleEdge(state, { x: 0, y: 0, orientation: 'horizontal' })
    expect(state.moves).toBe(1)
    state = toggleEdge(state, { x: 1, y: 0, orientation: 'vertical' })
    expect(state.moves).toBe(2)
    // Re-toggle compte aussi
    state = toggleEdge(state, { x: 0, y: 0, orientation: 'horizontal' })
    expect(state.moves).toBe(3)
  })

  it('compte les arêtes autour d\'une case', () => {
    let state = loadLevel(makeLevel())
    for (const e of squareLoop(1, 1)) {
      state = toggleEdge(state, e)
    }
    expect(countEdgesAroundCell(state, 1, 1)).toBe(4)
    // Les voisines de (1,1) ont chacune 1 arête commune avec la boucle.
    expect(countEdgesAroundCell(state, 0, 1)).toBe(1)
    expect(countEdgesAroundCell(state, 2, 1)).toBe(1)
    expect(countEdgesAroundCell(state, 1, 0)).toBe(1)
    expect(countEdgesAroundCell(state, 1, 2)).toBe(1)
  })

  it('isValidLoop accepte un carré 1×1', () => {
    expect(isValidLoop(squareLoop(1, 1))).toBe(true)
  })

  it('isValidLoop accepte un rectangle 2×3', () => {
    expect(isValidLoop(rectangleLoop(0, 0, 2, 3))).toBe(true)
  })

  it('isValidLoop refuse une chaîne ouverte', () => {
    const open: Edge[] = [
      { x: 0, y: 0, orientation: 'horizontal' },
      { x: 1, y: 0, orientation: 'horizontal' },
      { x: 2, y: 0, orientation: 'horizontal' },
    ]
    expect(isValidLoop(open)).toBe(false)
  })

  it('isValidLoop refuse deux boucles disjointes', () => {
    const two = [...squareLoop(0, 0), ...squareLoop(2, 2)]
    expect(isValidLoop(two)).toBe(false)
  })

  it('isValidLoop refuse une figure en 8 (sommet de degré 4)', () => {
    // Un nœud à (1,1) partagé par deux carrés = degré 4
    const figureEight = [
      ...squareLoop(0, 0),
      { x: 1, y: 1, orientation: 'horizontal' as const },
      { x: 1, y: 2, orientation: 'horizontal' as const },
      { x: 1, y: 1, orientation: 'vertical' as const },
      { x: 2, y: 1, orientation: 'vertical' as const },
    ]
    expect(isValidLoop(figureEight)).toBe(false)
  })

  it('findInsideCells identifie les cases enfermées dans un carré 1×1', () => {
    const inside = findInsideCells(squareLoop(1, 1), 3, 3)
    expect(inside).toEqual([[1, 1]])
  })

  it('findInsideCells identifie les cases enfermées dans un rectangle 2×1', () => {
    const inside = findInsideCells(rectangleLoop(0, 1, 2, 1), 3, 3)
    expect(inside.sort()).toEqual([
      [0, 1],
      [1, 1],
    ])
  })

  it('getInsideWord lit les lettres dans l\'ordre normal', () => {
    let state = loadLevel(
      makeLevel({
        letters: [
          ['M', 'A', 'X'],
          ['I', 'S', 'X'],
          ['X', 'X', 'X'],
        ],
      }),
    )
    for (const e of rectangleLoop(0, 0, 2, 2)) {
      state = toggleEdge(state, e)
    }
    expect(getInsideWord(state)).toBe('MAIS')
  })

  it('areCluesSatisfied valide un carré 1×1 avec clue 4', () => {
    let state = loadLevel(makeLevel({ clues: { '1,1': 4 } }))
    expect(areCluesSatisfied(state)).toBe(false)
    for (const e of squareLoop(1, 1)) {
      state = toggleEdge(state, e)
    }
    expect(areCluesSatisfied(state)).toBe(true)
  })

  it('isWon : tout doit valider (boucle + indices + mot)', () => {
    let state = loadLevel(
      makeLevel({
        letters: [
          ['B', 'X', 'X'],
          ['O', 'X', 'X'],
          ['N', 'X', 'X'],
        ],
        clues: { '0,0': 3, '0,2': 3 },
        solutionWord: 'BON',
      }),
    )
    expect(isWon(state)).toBe(false)
    for (const e of rectangleLoop(0, 0, 1, 3)) {
      state = toggleEdge(state, e)
    }
    expect(isWon(state)).toBe(true)
  })
})
