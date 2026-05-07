import { describe, expect, it } from 'vitest'
import { areCluesSatisfied, getInsideWord, isValidLoop, isWon, loadLevel, toggleEdge } from '~/games/boucle/engine'
import { findLevel } from '~/games/boucle/levels'
import type { Edge } from '~/games/boucle/types'

/**
 * Pour chaque niveau, on encode la boucle "attendue" sous forme de rectangle
 * (cx, cy, w, h). On joue les arêtes correspondantes et on vérifie que isWon
 * retourne true. Cela garantit que les clues du niveau sont cohérentes avec
 * la solution intentionnelle.
 */

function rectangleEdges(cx: number, cy: number, w: number, h: number): Edge[] {
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

const LEVEL_SOLUTIONS: Record<string, Edge[]> = {
  '001-intro': rectangleEdges(0, 0, 1, 3), // colonne 0, lignes 0..2 → "BON"
  '002-carre': rectangleEdges(0, 0, 2, 2), // carré 2×2 en haut-gauche → "MAIS"
}

describe('niveaux Boucle : intégrité', () => {
  for (const [levelId, solution] of Object.entries(LEVEL_SOLUTIONS)) {
    it(`${levelId} est résoluble avec la boucle attendue`, () => {
      const level = findLevel(levelId)
      expect(level, `Niveau ${levelId} introuvable`).toBeDefined()
      let state = loadLevel(level!)
      for (const edge of solution) {
        state = toggleEdge(state, edge)
      }
      expect(isValidLoop(state.edges), 'la boucle doit être valide').toBe(true)
      expect(areCluesSatisfied(state), 'tous les indices doivent être satisfaits').toBe(true)
      expect(getInsideWord(state).toUpperCase()).toBe(level!.solutionWord.toUpperCase())
      expect(isWon(state)).toBe(true)
    })
  }
})
