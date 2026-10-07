import { describe, expect, it } from 'vitest'
import { isWon, loadLevel, placeGuard, rotateGuard, solvedState } from '~/games/anglemort/engine'
import { hasUniqueCorridor, originalLevels } from '../helpers/anglemort'
import { byId, committedChallenges, committedLevels } from '../helpers/levels'

const challenges = committedChallenges('anglemort')

const PROOF_TIMEOUT = 60_000

describe('niveaux Angle mort : intégrité', () => {
  const levels = committedLevels(challenges)

  it('chaque jour publié a ses 4 niveaux', () => {
    const dates = challenges.getAllDates()
    expect(dates.length).toBeGreaterThan(0)
    expect(levels).toHaveLength(dates.length * 4)
  })

  it.each(byId(levels))(
    '%s : la solution, jouée pose par pose, gagne en au plus parMoves poses',
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
      expect(state.moves).toBeLessThanOrEqual(level.parMoves)
    },
  )

  it.each(byId(levels))('%s : la solution affichée des jours passés est gagnante', (_, level) => {
    expect(isWon(solvedState(level))).toBe(true)
  })

  // Chaque grille de base sert 8 fois (symétries) ; une symétrie conserve
  // l'unicité du couloir (cf. anglemort.symmetry.test.ts). Ici, chaque grille
  // d'origine ; `make verify-levels` repasse sur toutes les versions.
  it.each(byId(originalLevels(levels)))(
    '%s : le couloir est unique',
    (_, level) => {
      expect(hasUniqueCorridor(level)).toBe(true)
    },
    PROOF_TIMEOUT,
  )
})
