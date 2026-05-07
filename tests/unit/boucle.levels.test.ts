import { describe, expect, it } from 'vitest'
import { getAllDates, getLevel } from '~/games/boucle/challenges'
import {
  areCluesSatisfied,
  getInsideWord,
  isValidLoop,
  isWon,
  loadLevel,
  toggleEdge,
} from '~/games/boucle/engine'
import type { Coord, Edge } from '~/games/boucle/types'

/** Construit les arêtes de la frontière d'un ensemble de cases intérieures. */
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

describe('niveaux Boucle : intégrité', () => {
  const dates = getAllDates()

  it('au moins un défi est généré', () => {
    expect(dates.length).toBeGreaterThan(0)
  })

  it('chaque niveau est résoluble avec sa boucle attendue', () => {
    for (const date of dates) {
      for (const i of [1, 2, 3, 4] as const) {
        const level = getLevel(date, i)
        expect(level, `${date}/${i} introuvable`).toBeDefined()
        expect(
          level!.solutionInsideCells,
          `${date}/${i} sans solutionInsideCells`,
        ).toBeDefined()
        const edges = insideCellsToBoundary(level!.solutionInsideCells!)
        let state = loadLevel(level!)
        for (const e of edges) {
          state = toggleEdge(state, e)
        }
        expect(isValidLoop(state.edges), `${date}/${i} : boucle non valide`).toBe(true)
        expect(
          areCluesSatisfied(state),
          `${date}/${i} : indices non satisfaits`,
        ).toBe(true)
        expect(getInsideWord(state).toUpperCase()).toBe(level!.solutionWord.toUpperCase())
        expect(isWon(state)).toBe(true)
      }
    }
  })
})
