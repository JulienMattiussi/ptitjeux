import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LONG_PRESS_MS, useLongPress } from '~/lib/useLongPress'

function press(pointerType: string) {
  return { pointerType } as React.PointerEvent
}

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('déclenche après un appui long au doigt, et marque le clic qui suit comme consommé', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))
    act(() => result.current.handlers.onPointerDown(press('touch')))
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS))
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(result.current.consume()).toBe(true)
  })

  it('un appui bref ne déclenche rien et laisse passer le clic', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))
    act(() => result.current.handlers.onPointerDown(press('touch')))
    act(() => result.current.handlers.onPointerUp())
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS))
    expect(onLongPress).not.toHaveBeenCalled()
    expect(result.current.consume()).toBe(false)
  })

  it('ignore la souris, qui garde le clic droit', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))
    act(() => result.current.handlers.onPointerDown(press('mouse')))
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it("un menu contextuel émis pendant l'appui annule le minuteur : une seule action", () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))
    act(() => result.current.handlers.onPointerDown(press('touch')))
    expect(result.current.consume()).toBe(false)
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS))
    expect(onLongPress).not.toHaveBeenCalled()
  })
})
