import { describe, expect, it } from 'vitest'
import type { Level, Pos } from '~/games/anglemort/types'
import {
  checkRival,
  compatibleCorridors,
  corridorCells,
  corridorId,
  isCorridorUnique,
  poseFitsClues,
  rivalStatus,
} from '../../generators/anglemort-corridors'

// Salle 3×2, porte en haut à gauche, diamant en haut à droite. Deux couloirs
// induits : tout droit sur la rangée du haut, ou le détour par celle du bas.
const STRAIGHT: Pos[] = [
  [0, 0],
  [1, 0],
  [2, 0],
]
const DETOUR: Pos[] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [2, 0],
]

function room(clues: Record<string, number> = {}): Level {
  return {
    id: 'test',
    name: 'test',
    width: 3,
    height: 2,
    pillars: [],
    mirrors: [],
    door: [0, 0],
    diamond: [2, 0],
    clues,
    pool: { simple: 1, angle: 0, oppose: 0 },
    solution: [{ pos: [0, 1], type: 'simple', facing: 'E' }],
    parMoves: 1,
  }
}

function ids(level: Level, maxCorridors = 100): string[] {
  return compatibleCorridors(level, maxCorridors).corridors.map(corridorId).sort()
}

const id = (cells: Pos[]) => corridorId(corridorCells(room(), cells))

describe('compatibleCorridors', () => {
  it('liste les chemins induits de la porte au diamant', () => {
    expect(ids(room())).toEqual([id(STRAIGHT), id(DETOUR)].sort())
  })

  it('un « 0 » impose sa case au couloir', () => {
    expect(ids(room({ '1,1': 0 }))).toEqual([id(DETOUR)])
  })

  it('un indice positif interdit sa case au couloir', () => {
    expect(ids(room({ '1,1': 1 }))).toEqual([id(STRAIGHT)])
  })

  it('signale une énumération arrêtée au plafond', () => {
    expect(compatibleCorridors(room(), 1).complete).toBe(false)
  })
})

describe('rivalStatus', () => {
  it('possible si une pose du lot produit ce couloir', () => {
    expect(rivalStatus(room(), corridorCells(room(), STRAIGHT), 10_000)).toBe('possible')
  })

  it('impossible si aucune pose ne le produit (le vigile éclairerait le couloir)', () => {
    expect(rivalStatus(room(), corridorCells(room(), DETOUR), 10_000)).toBe('impossible')
  })
})

describe('checkRival', () => {
  it('renvoie une pose qui produit le couloir réalisable', () => {
    const check = checkRival(room(), corridorCells(room(), STRAIGHT), 10_000)
    expect(check).toEqual({
      status: 'possible',
      pose: [{ pos: [0, 1], type: 'simple', facing: 'E' }],
    })
  })

  it('non tranché quand le budget est épuisé', () => {
    expect(checkRival(room(), corridorCells(room(), STRAIGHT), 0).status).toBe('unknown')
  })
})

describe('poseFitsClues', () => {
  const pose = room().solution

  it('vrai si chaque indice est compté juste', () => {
    expect(poseFitsClues(room({ '2,1': 1 }), pose)).toBe(true)
  })

  it('faux si un indice est compté faux', () => {
    expect(poseFitsClues(room({ '2,1': 2 }), pose)).toBe(false)
  })

  it("faux si un vigile occupe une case d'indice", () => {
    expect(poseFitsClues(room({ '0,1': 0 }), pose)).toBe(false)
  })
})

describe('isCorridorUnique', () => {
  it('vrai quand chaque concurrent est impossible', () => {
    expect(isCorridorUnique(room(), STRAIGHT, { maxCorridors: 100, maxNodes: 10_000 })).toBe(true)
  })

  it('faux quand un concurrent est réalisable', () => {
    expect(isCorridorUnique(room(), DETOUR, { maxCorridors: 100, maxNodes: 10_000 })).toBe(false)
  })

  it("faux quand l'énumération est incomplète", () => {
    expect(isCorridorUnique(room(), STRAIGHT, { maxCorridors: 1, maxNodes: 10_000 })).toBe(false)
  })
})
