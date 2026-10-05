import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useHint } from '~/lib/useHint'

describe('useHint', () => {
  it("n'est pas proposée tant que les coups ne dépassent pas le double de l'objectif", () => {
    const { result } = renderHook(() => useHint(10, 5))
    expect(result.current.available).toBe(false)
  })

  it("est proposée dès que les coups dépassent le double de l'objectif", () => {
    const { result } = renderHook(() => useHint(11, 5))
    expect(result.current.available).toBe(true)
  })

  it("n'est jamais proposée sans objectif", () => {
    const { result } = renderHook(() => useHint(1000, undefined))
    expect(result.current.available).toBe(false)
  })

  it('reste proposée quand les coups redescendent (annuler, recommencer)', () => {
    const { result, rerender } = renderHook(({ moves }) => useHint(moves, 5), {
      initialProps: { moves: 11 },
    })
    rerender({ moves: 0 })
    expect(result.current.available).toBe(true)
  })

  it('est révélée à la demande', () => {
    const { result } = renderHook(() => useHint(11, 5))
    act(() => result.current.reveal())
    expect(result.current.revealed).toBe(true)
  })
})
