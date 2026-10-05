import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { shortestTurn, useHeading } from '~/games/anglemort/useHeading'

describe('shortestTurn', () => {
  it("tourne dans le sens horaire quand c'est le plus court", () => {
    expect(shortestTurn(270, 0)).toBe(90)
  })

  it("tourne dans le sens antihoraire quand c'est le plus court", () => {
    expect(shortestTurn(0, 270)).toBe(-90)
  })

  it('préfère le sens horaire pour un demi-tour', () => {
    expect(shortestTurn(0, 180)).toBe(180)
  })
})

describe('useHeading', () => {
  it("cumule l'angle pour passer de l'ouest au nord par un quart de tour", () => {
    const { result, rerender } = renderHook(({ target }) => useHeading(target), {
      initialProps: { target: 270 },
    })
    rerender({ target: 0 })
    expect(result.current).toBe(360)
  })
})
