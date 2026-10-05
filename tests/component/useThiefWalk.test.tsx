import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useThiefWalk } from '~/games/anglemort/useThiefWalk'

describe('useThiefWalk', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("reste hors du couloir tant que la partie n'est pas gagnée", () => {
    const { result } = renderHook(() => useThiefWalk(false, 3, 100))
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current).toEqual({ step: -1, done: false })
  })

  it("avance d'une case par pas", () => {
    const { result } = renderHook(() => useThiefWalk(true, 3, 100))
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toEqual({ step: 1, done: false })
  })

  it('annonce la fin un pas après la dernière case', () => {
    const { result } = renderHook(() => useThiefWalk(true, 3, 100))
    act(() => vi.advanceTimersByTime(300))
    expect(result.current.done).toBe(false)
    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toEqual({ step: 2, done: true })
  })

  it('repart de zéro quand la victoire est annulée', () => {
    const { result, rerender } = renderHook(({ active }) => useThiefWalk(active, 3, 100), {
      initialProps: { active: true },
    })
    act(() => vi.advanceTimersByTime(400))
    rerender({ active: false })
    expect(result.current).toEqual({ step: -1, done: false })
  })
})
