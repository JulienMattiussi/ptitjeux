import { describe, expect, it } from 'vitest'
import {
  areCluesSatisfied,
  countEdgesAroundCell,
  findInsideCells,
  getInsideWord,
  isValidLoop,
  isWon,
  loadLevel,
  moveEdgeSelection,
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

  describe('moveEdgeSelection', () => {
    // Plateau 3x3 : H valide pour x ∈ [0..2], y ∈ [0..3] ; V pour x ∈ [0..3], y ∈ [0..2].
    const W = 3
    const H = 3
    const h = (x: number, y: number): Edge => ({ x, y, orientation: 'horizontal' })
    const v = (x: number, y: number): Edge => ({ x, y, orientation: 'vertical' })

    it('H droite/gauche reste en H, déplace x', () => {
      expect(moveEdgeSelection(h(1, 1), 'right', W, H)).toEqual(h(2, 1))
      expect(moveEdgeSelection(h(1, 1), 'left', W, H)).toEqual(h(0, 1))
    })

    it('H haut/bas pivote en V (autour du sommet gauche)', () => {
      // H(1,1) up = V(1, 0) ; H(1,1) down = V(1, 1)
      expect(moveEdgeSelection(h(1, 1), 'up', W, H)).toEqual(v(1, 0))
      expect(moveEdgeSelection(h(1, 1), 'down', W, H)).toEqual(v(1, 1))
    })

    it('V haut/bas reste en V, déplace y', () => {
      expect(moveEdgeSelection(v(1, 1), 'down', W, H)).toEqual(v(1, 2))
      expect(moveEdgeSelection(v(1, 1), 'up', W, H)).toEqual(v(1, 0))
    })

    it('V gauche/droite pivote en H (autour du sommet haut)', () => {
      // V(1,1) right = H(1, 1) ; V(1,1) left = H(0, 1)
      expect(moveEdgeSelection(v(1, 1), 'right', W, H)).toEqual(h(1, 1))
      expect(moveEdgeSelection(v(1, 1), 'left', W, H)).toEqual(h(0, 1))
    })

    it("clamp aux bords « intérieurs » : H ne sort pas à gauche, V ne sort pas en haut", () => {
      expect(moveEdgeSelection(h(0, 1), 'left', W, H)).toEqual(h(0, 1))
      expect(moveEdgeSelection(v(1, 0), 'up', W, H)).toEqual(v(1, 0))
    })

    it("aux deux bords « extrêmes », déborde sur la perpendiculaire pour atteindre les arêtes sinon inaccessibles", () => {
      // H(W-1, 1) + right : déborde sur la colonne V de droite (V valide pour x=W).
      expect(moveEdgeSelection(h(W - 1, 1), 'right', W, H)).toEqual(v(W, 1))
      // V(1, H-1) + down : déborde sur la ligne H du bas (H valide pour y=H).
      expect(moveEdgeSelection(v(1, H - 1), 'down', W, H)).toEqual(h(1, H))
    })

    it('on peut naviguer jusqu\'à la colonne V de droite et la ligne H du bas', () => {
      // H(0,0) →→→→ : H(W-1,0) puis débordement vers V(W, 0)
      let e: Edge = h(0, 0)
      for (let i = 0; i < W - 1; i++) e = moveEdgeSelection(e, 'right', W, H)
      expect(e).toEqual(h(W - 1, 0))
      e = moveEdgeSelection(e, 'right', W, H)
      expect(e).toEqual(v(W, 0))
      // V(W, 0) ↓↓↓ : V(W, H-1) puis débordement vers H(W-1, H)
      for (let i = 0; i < H - 1; i++) e = moveEdgeSelection(e, 'down', W, H)
      expect(e).toEqual(v(W, H - 1))
      e = moveEdgeSelection(e, 'down', W, H)
      expect(e).toEqual(h(W - 1, H))
    })

    it('clamp aux bords lors d\'un pivot H↔V', () => {
      // H(1,0) up : pivote vers V(1, max(0, -1)) = V(1, 0)
      expect(moveEdgeSelection(h(1, 0), 'up', W, H)).toEqual(v(1, 0))
      // H(1, H) down : pivote vers V(1, min(H-1, H)) = V(1, H-1)
      expect(moveEdgeSelection(h(1, H), 'down', W, H)).toEqual(v(1, H - 1))
      // V(0, 1) left : pivote vers H(max(0, -1), 1) = H(0, 1)
      expect(moveEdgeSelection(v(0, 1), 'left', W, H)).toEqual(h(0, 1))
      // V(W, 1) right : pivote vers H(min(W-1, W), 1) = H(W-1, 1)
      expect(moveEdgeSelection(v(W, 1), 'right', W, H)).toEqual(h(W - 1, 1))
    })
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
