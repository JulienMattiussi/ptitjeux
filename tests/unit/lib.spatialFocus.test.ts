import { describe, expect, it } from 'vitest'
import { pickInDirection, type Box } from '~/lib/spatialFocus'

const box = (left: number, top: number): Box => ({ left, top, width: 10, height: 10 })

/**
 *   A  B  C
 *   D  E  F      (pas de 20 px, origine en haut à gauche)
 */
const grid = [box(0, 0), box(20, 0), box(40, 0), box(0, 20), box(20, 20), box(40, 20)]
const [, B, , , E] = grid

describe('lib/spatialFocus', () => {
  it('vers la droite, choisit le voisin sur la même ligne', () => {
    expect(pickInDirection(B, grid, 'right')).toBe(2)
  })

  it('vers le bas, choisit le voisin sur la même colonne', () => {
    expect(pickInDirection(B, grid, 'down')).toBe(4)
  })

  it('vers la gauche, choisit le voisin sur la même ligne', () => {
    expect(pickInDirection(E, grid, 'left')).toBe(3)
  })

  it('vers le haut, choisit le voisin sur la même colonne', () => {
    expect(pickInDirection(E, grid, 'up')).toBe(1)
  })

  it('préfère un voisin aligné à un voisin plus proche en diagonale', () => {
    const aligned = box(60, 0)
    const diagonal = box(25, 25)
    expect(pickInDirection(box(0, 0), [diagonal, aligned], 'right')).toBe(1)
  })

  it('renvoie -1 quand rien ne se trouve dans la direction', () => {
    expect(pickInDirection(box(40, 0), grid, 'right')).toBe(-1)
  })
})
