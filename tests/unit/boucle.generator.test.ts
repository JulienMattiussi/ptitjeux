import { describe, expect, it } from 'vitest'
import { areCluesSatisfied, isValidLoop, isWon, loadLevel, toggleEdge } from '~/games/boucle/engine'
import { generateBoucleLevel } from '~/games/boucle/generator'
import type { Coord, Edge } from '~/games/boucle/types'

function insideCellsToBoundary(cells: Coord[]): Edge[] {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`))
  const isIn = (x: number, y: number) => set.has(`${x},${y}`)
  const out: Edge[] = []
  for (const [cx, cy] of cells) {
    if (!isIn(cx, cy - 1)) out.push({ x: cx, y: cy, orientation: 'horizontal' })
    if (!isIn(cx, cy + 1)) out.push({ x: cx, y: cy + 1, orientation: 'horizontal' })
    if (!isIn(cx - 1, cy)) out.push({ x: cx, y: cy, orientation: 'vertical' })
    if (!isIn(cx + 1, cy)) out.push({ x: cx + 1, y: cy, orientation: 'vertical' })
  }
  return out
}

describe('boucle/generator', () => {
  it.each([1, 2, 3, 4] as const)('niveau %s : grille carrée 3+i', (i) => {
    const level = generateBoucleLevel('2026-05-07', i)
    expect(level.width).toBe(3 + i)
    expect(level.height).toBe(3 + i)
  })

  it('solution stockée fait gagner', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateBoucleLevel('2026-05-07', idx)
      const edges = insideCellsToBoundary(level.solutionInsideCells!)
      let state = loadLevel(level)
      for (const e of edges) state = toggleEdge(state, e)
      expect(isValidLoop(state.edges), `niveau ${idx} : boucle invalide`).toBe(true)
      expect(areCluesSatisfied(state), `niveau ${idx} : indices KO`).toBe(true)
      expect(isWon(state), `niveau ${idx} : non gagnant`).toBe(true)
    }
  })

  it('génération déterministe', () => {
    const a = generateBoucleLevel('2026-05-07', 2)
    const b = generateBoucleLevel('2026-05-07', 2)
    expect(a.solutionWord).toBe(b.solutionWord)
    expect(a.letters).toEqual(b.letters)
  })

  it('mot solution = hauteur de la grille', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateBoucleLevel('2026-05-07', idx)
      expect(level.solutionWord.length).toBe(level.height)
    }
  })
})
