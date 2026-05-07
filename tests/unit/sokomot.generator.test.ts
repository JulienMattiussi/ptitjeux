import { describe, expect, it } from 'vitest'
import { applyMove, isWon, loadLevel } from '~/games/sokomot/engine'
import { generateSokomotLevel, isIceIndex } from '~/games/sokomot/generator'

describe('sokomot/generator', () => {
  it('isIceIndex cible niveaux 2 et 4 uniquement', () => {
    expect(isIceIndex(1)).toBe(false)
    expect(isIceIndex(2)).toBe(true)
    expect(isIceIndex(3)).toBe(false)
    expect(isIceIndex(4)).toBe(true)
  })

  it('niveau 1 : 7×6 sans glace, mot de 3 lettres', () => {
    const level = generateSokomotLevel('2026-05-07', 1)
    expect(level.width).toBe(7)
    expect(level.height).toBe(6)
    expect(level.ice).toEqual([])
    expect(level.target.word.length).toBe(3)
    expect(level.target.cells.length).toBe(3)
    expect(level.blocks.length).toBe(3)
  })

  it('niveau 2 : 8×7 avec glace, mot de 4 lettres', () => {
    const level = generateSokomotLevel('2026-05-07', 2)
    expect(level.width).toBe(8)
    expect(level.height).toBe(7)
    expect(level.ice.length).toBeGreaterThan(0)
    expect(level.target.word.length).toBe(4)
    expect(level.name).toMatch(/glace/)
  })

  it('niveau 4 : 10×9 avec glace plus longue', () => {
    const l2 = generateSokomotLevel('2026-05-07', 2)
    const l4 = generateSokomotLevel('2026-05-07', 4)
    expect(l4.width).toBe(10)
    expect(l4.height).toBe(9)
    expect(l4.ice.length).toBeGreaterThan(l2.ice.length)
    expect(l4.target.word.length).toBe(6)
  })

  it('génération déterministe (même date+index → même niveau)', () => {
    const a = generateSokomotLevel('2026-05-07', 2)
    const b = generateSokomotLevel('2026-05-07', 2)
    expect(a.target.word).toBe(b.target.word)
    expect(a.solution).toEqual(b.solution)
  })

  it('génération diverge selon la date', () => {
    let differ = 0
    for (let i = 0; i < 5; i++) {
      const a = generateSokomotLevel(`2026-04-0${i + 1}`, 1)
      const b = generateSokomotLevel(`2026-05-0${i + 1}`, 1)
      if (a.target.word !== b.target.word) differ++
    }
    expect(differ).toBeGreaterThan(0)
  })

  it('la solution stockée résout effectivement le niveau', () => {
    for (const idx of [1, 2, 3, 4] as const) {
      const level = generateSokomotLevel('2026-05-07', idx)
      let state = loadLevel(level)
      for (const move of level.solution!) {
        state = applyMove(state, move)
      }
      expect(isWon(state), `niveau ${idx} non résolu`).toBe(true)
    }
  })
})
