import { describe, expect, it } from 'vitest'
import { applyMove, isWon, loadLevel } from '~/games/sokomot/engine'
import { findLevel } from '~/games/sokomot/levels'
import type { Direction } from '~/games/sokomot/types'

/**
 * Pour chaque niveau, on encode une séquence de coups qui doit le résoudre.
 * Le test rejoue cette séquence et vérifie isWon(). Cela garantit que chaque
 * niveau livré est réellement résoluble.
 *
 * Quand on ajoute un nouveau niveau, on doit ajouter sa solution ici. Sans
 * cette entrée, ce test échoue immédiatement, ce qui est intentionnel.
 */
const SOLUTIONS: Record<string, Direction[]> = {
  // (1,4) → push M up → push A up → push T up
  '001-intro': ['right', 'up', 'down', 'right', 'up', 'down', 'right', 'up'],
  // (1,4) → (3,4) → push O up (slide jusqu'à (3,1)) → (4,4) → push K up (slide jusqu'à (4,1))
  '002-glace': ['right', 'right', 'up', 'down', 'right', 'up'],
}

describe('niveaux Sokomot : intégrité', () => {
  for (const [levelId, moves] of Object.entries(SOLUTIONS)) {
    it(`${levelId} est résoluble en ${moves.length} coups`, () => {
      const level = findLevel(levelId)
      expect(level, `Niveau ${levelId} introuvable`).toBeDefined()
      let state = loadLevel(level!)
      for (const move of moves) {
        state = applyMove(state, move)
      }
      expect(isWon(state)).toBe(true)
    })

    it(`${levelId} respecte parMoves`, () => {
      const level = findLevel(levelId)!
      if (level.parMoves !== undefined) {
        expect(
          moves.length,
          `La solution doit tenir dans parMoves (${level.parMoves})`,
        ).toBeLessThanOrEqual(level.parMoves)
      }
    })
  }
})
