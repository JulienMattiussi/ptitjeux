import { describe, expect, it } from 'vitest'
import { computeVision, isWon } from '~/games/anglemort/engine'
import type { Level } from '~/games/anglemort/types'
import { solveAngleMort } from '../../generators/anglemort-solver'
import { VARIANTS, transformLevel } from '../../generators/anglemort-symmetry'

/**
 * .  .  .  ←      Le vigile en angle (2,1) regarde à l'est et au sud ; son
 * █  💎 ┗  .      faisceau sud est renvoyé vers l'est par le miroir \ en
 * 🚪 .  \  .      (2,2). Couloir : 🚪 → (1,2) → 💎.
 */
const level: Level = {
  id: 'base',
  name: 'Niveau 4 · 4×3',
  width: 4,
  height: 3,
  pillars: [[0, 1]],
  mirrors: [{ pos: [2, 2], kind: '\\' }],
  door: [0, 2],
  diamond: [1, 1],
  clues: {},
  pool: { simple: 1, angle: 1, oppose: 0 },
  solution: [
    { pos: [3, 0], type: 'simple', facing: 'W' },
    { pos: [2, 1], type: 'angle', facing: 'E' },
  ],
}

describe('anglemort : symétries', () => {
  it('le niveau de base est gagnant avec sa solution', () => {
    expect(isWon({ level, guards: level.solution, moves: 2 })).toBe(true)
  })

  it.each(VARIANTS)('la version %s reste gagnante avec la solution transformée', (v) => {
    const t = transformLevel(level, v)
    expect(isWon({ level: t, guards: t.solution, moves: 2 })).toBe(true)
  })

  it('les quarts de tour donnent des versions portrait', () => {
    const t = transformLevel(level, 1)
    expect([t.width, t.height, t.name]).toEqual([3, 4, 'Niveau 4 · 3×4'])
  })

  it('les 8 versions sont toutes différentes', () => {
    const keys = VARIANTS.map((v) => {
      const t = transformLevel(level, v)
      return JSON.stringify([t.width, t.door, t.diamond, t.pillars, t.mirrors])
    })
    expect(new Set(keys).size).toBe(8)
  })

  it('une symétrie conserve l éclairage total et le nombre de solutions', () => {
    const base = solveAngleMort(level, { exactPool: true, limit: 10, maxNodes: 100_000 })
    for (const v of VARIANTS) {
      const t = transformLevel(level, v)
      const lit = (l: Level) =>
        computeVision(l, l.solution)
          .seen.flat()
          .reduce((a, b) => a + b, 0)
      expect(lit(t)).toBe(lit(level))
      expect(
        solveAngleMort(t, { exactPool: true, limit: 10, maxNodes: 100_000 }).solutions,
      ).toHaveLength(base.solutions.length)
    }
  })
})
