import { describe, expect, it } from 'vitest'
import type { Level, Pool, Pos } from '~/games/anglemort/types'
import { minimalPose, poolSize } from '../../generators/anglemort-minpose'

// Salle 3×2, porte en haut à gauche, diamant en haut à droite, couloir sur la
// rangée du haut : la rangée du bas doit être éclairée, sans faisceau vers le
// haut.
const CORRIDOR: Pos[] = [
  [0, 0],
  [1, 0],
  [2, 0],
]

function room(pool: Partial<Pool>, extra: Partial<Level> = {}): Level {
  return {
    id: 'test',
    name: 'Niveau 1 · 3×2',
    width: 3,
    height: 2,
    pillars: [],
    mirrors: [],
    door: [0, 0],
    diamond: [2, 0],
    clues: {},
    pool: { simple: 0, angle: 0, oppose: 0, ...pool },
    solution: [],
    parMoves: 0,
    ...extra,
  }
}

describe('minimalPose', () => {
  it('trouve la pose la plus courte, plus petite que le lot quand un vigile est inutile', async () => {
    const result = await minimalPose(room({ simple: 2 }), CORRIDOR)
    expect(result.status === 'optimal' && result.pose.length).toBe(1)
  })

  it("rend une pose de la taille du lot quand aucun vigile n'est inutile", async () => {
    const level = room({ simple: 1 })
    const result = await minimalPose(level, CORRIDOR)
    expect(result.status === 'optimal' && result.pose.length).toBe(poolSize(level))
  })

  it('compte chaque indice juste, quitte à poser plus de vigiles', async () => {
    const result = await minimalPose(room({ simple: 3 }, { clues: { '1,1': 2 } }), CORRIDOR)
    expect(result.status === 'optimal' && result.pose.length).toBe(2)
  })

  it('suit la déviation des miroirs', async () => {
    // Un vigile en (0, 1) tourné vers l'est verrait, via le miroir, le diamant.
    const level = room({ simple: 1 }, { mirrors: [{ pos: [2, 1], kind: '/' }] })
    const result = await minimalPose(level, CORRIDOR)
    expect(result).toEqual({
      status: 'optimal',
      pose: [{ pos: [1, 1], type: 'simple', facing: 'W' }],
    })
  })

  it('déclare impossible un couloir que le lot ne peut pas produire', async () => {
    // Un vigile d'angle de la rangée du bas regarde forcément vers le haut ou dehors.
    expect(await minimalPose(room({ angle: 1 }), CORRIDOR)).toEqual({ status: 'infeasible' })
  })

  it('déclare impossible un couloir sans vigile possible', async () => {
    expect(await minimalPose(room({}), CORRIDOR)).toEqual({ status: 'infeasible' })
  })
})
