import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isWon } from '~/games/sokomot/engine'
import { useSolutionReplay } from '~/games/sokomot/useSolutionReplay'
import { committedChallenges } from '../helpers/levels'

const level = committedChallenges('sokomot').getLevel('2026-09-01', 1)!

describe('useSolutionReplay', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reste au départ tant que la solution est cachée', () => {
    const { result } = renderHook(() => useSolutionReplay(level, false))
    act(() => vi.advanceTimersByTime(10_000))
    expect(result.current.step).toBe(0)
  })

  it("rejoue toute la solution puis s'arrête sur la grille gagnée", () => {
    const { result } = renderHook(() => useSolutionReplay(level, true))
    for (let i = 0; i < level.solution.length; i++) act(() => vi.advanceTimersByTime(400))
    expect(result.current.step).toBe(level.solution.length)
    expect(result.current.playing).toBe(false)
    expect(isWon(result.current.state)).toBe(true)
  })

  it("coup suivant met en pause et avance d'un coup", () => {
    const { result } = renderHook(() => useSolutionReplay(level, true))
    act(() => result.current.next())
    act(() => vi.advanceTimersByTime(10_000))
    expect(result.current.step).toBe(1)
    expect(result.current.playing).toBe(false)
  })

  it('rouvrir la solution la rejoue depuis le début', () => {
    const { result, rerender } = renderHook(({ active }) => useSolutionReplay(level, active), {
      initialProps: { active: true },
    })
    act(() => result.current.next())
    rerender({ active: false })
    rerender({ active: true })
    expect(result.current.step).toBe(0)
    expect(result.current.playing).toBe(true)
  })
})
