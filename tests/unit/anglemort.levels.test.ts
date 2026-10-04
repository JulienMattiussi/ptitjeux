import { describe, expect, it } from 'vitest'
import { getAllDates, getChallenge } from '~/games/anglemort/challenges'
import { isWon, loadLevel, placeGuard, rotateGuard } from '~/games/anglemort/engine'
import type { Level } from '~/games/anglemort/types'
import { hasUniqueCorridor, originalLevels } from '../levels/anglemort.helpers'

const PROOF_TIMEOUT = 60_000

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
        state = placeGuard(state, x, y, guard.type)
        // Au plus 4 orientations par type.
        for (let i = 0; i < 4; i++) {
          const placed = state.guards.find((g) => g.pos[0] === x && g.pos[1] === y)
          if (placed?.type === guard.type && placed.facing === guard.facing) break
          state = rotateGuard(state, x, y)
        }
      }
      expect(isWon(state)).toBe(true)
      expect(state.moves).toBeLessThanOrEqual(level.parMoves ?? Infinity)
    },
  )

  // Chaque grille de base sert 8 fois (symétries) ; une symétrie conserve
  // l'unicité du couloir (cf. anglemort.symmetry.test.ts). Ici, chaque grille
  // d'origine ; `make verify-levels` repasse sur toutes les versions.
  it.each(originalLevels(levels).map((l) => [l.id, l] as const))(
    '%s : le couloir est unique',
    (_, level) => {
      expect(hasUniqueCorridor(level)).toBe(true)
    },
    PROOF_TIMEOUT,
  )
})
