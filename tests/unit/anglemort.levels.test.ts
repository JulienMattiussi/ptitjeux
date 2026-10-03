import { describe, expect, it } from 'vitest'
import { getAllDates, getChallenge } from '~/games/anglemort/challenges'
import { isWon, loadLevel, placeGuard, rotateGuard } from '~/games/anglemort/engine'
import type { Level } from '~/games/anglemort/types'
import { solveAngleMort } from '../../generators/anglemort-solver'

/**
 * Les défis Angle mort peuvent être partiels pendant la mise au point du jeu :
 * on vérifie chaque niveau présent, quel que soit son index.
 */
function committedLevels(): Level[] {
  return getAllDates().flatMap((date) => (getChallenge(date) ?? []).filter(Boolean))
}

describe('niveaux Angle mort : intégrité', () => {
  const levels = committedLevels()

  it('au moins un niveau est généré', () => {
    expect(levels.length).toBeGreaterThan(0)
  })

  it.each(levels.map((l) => [l.id, l] as const))(
    '%s : la solution, jouée pose par pose, gagne en parMoves poses',
    (_, level) => {
      let state = loadLevel(level)
      for (const guard of level.solution) {
        const [x, y] = guard.pos
        state = placeGuard(state, x, y)
        // Au plus 10 variantes (4 simples + 4 angles + 2 opposés).
        for (let i = 0; i < 10; i++) {
          const placed = state.guards.find((g) => g.pos[0] === x && g.pos[1] === y)
          if (placed?.type === guard.type && placed.facing === guard.facing) break
          state = rotateGuard(state, x, y)
        }
      }
      expect(isWon(state)).toBe(true)
      expect(state.moves).toBeLessThanOrEqual(level.parMoves ?? Infinity)
    },
  )

  it.each(levels.map((l) => [l.id, l] as const))('%s : la solution est unique', (_, level) => {
    const result = solveAngleMort(level, { exactPool: true, limit: 2, maxNodes: 200_000 })
    expect(result.complete).toBe(true)
    expect(result.solutions).toHaveLength(1)
  })
})
