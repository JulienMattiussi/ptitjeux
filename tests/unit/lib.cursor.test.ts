import { describe, expect, it } from 'vitest'
import { moveCellCursor } from '~/lib/cursor'

describe('moveCellCursor', () => {
  it('flèches déplacent le curseur dans les 4 directions', () => {
    const start = { x: 2, y: 2 }
    expect(moveCellCursor(start, 'left', 5, 5)).toEqual({ x: 1, y: 2 })
    expect(moveCellCursor(start, 'right', 5, 5)).toEqual({ x: 3, y: 2 })
    expect(moveCellCursor(start, 'up', 5, 5)).toEqual({ x: 2, y: 1 })
    expect(moveCellCursor(start, 'down', 5, 5)).toEqual({ x: 2, y: 3 })
  })

  it('clampe aux bords gauche et haut', () => {
    expect(moveCellCursor({ x: 0, y: 0 }, 'left', 4, 4)).toEqual({ x: 0, y: 0 })
    expect(moveCellCursor({ x: 0, y: 0 }, 'up', 4, 4)).toEqual({ x: 0, y: 0 })
  })

  it('clampe aux bords droit et bas', () => {
    expect(moveCellCursor({ x: 3, y: 3 }, 'right', 4, 4)).toEqual({ x: 3, y: 3 })
    expect(moveCellCursor({ x: 3, y: 3 }, 'down', 4, 4)).toEqual({ x: 3, y: 3 })
  })
})
