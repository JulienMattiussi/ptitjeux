import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { dominantDirection, SWIPE_MIN_PX, useSwipe } from '~/lib/useSwipe'

function at(x: number, y: number) {
  return { clientX: x, clientY: y } as React.PointerEvent
}

describe('dominantDirection', () => {
  it.each([
    [30, 5, 'right'],
    [-30, 5, 'left'],
    [5, 30, 'down'],
    [5, -30, 'up'],
  ] as const)('(%i, %i) donne %s', (dx, dy, direction) => {
    expect(dominantDirection(dx, dy)).toBe(direction)
  })
})

describe('useSwipe', () => {
  it('un glissé suffisamment long donne sa direction dominante', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerDown(at(100, 100)))
    act(() => result.current.onPointerUp(at(100, 100 - SWIPE_MIN_PX - 1)))
    expect(onSwipe).toHaveBeenCalledWith('up')
  })

  it('un geste trop court est une touche, au point relâché', () => {
    const onSwipe = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() => useSwipe(onSwipe, onTap))
    act(() => result.current.onPointerDown(at(100, 100)))
    act(() => result.current.onPointerUp(at(103, 102)))
    expect(onSwipe).not.toHaveBeenCalled()
    expect(onTap).toHaveBeenCalledWith({ x: 103, y: 102 })
  })

  it('un geste annulé par le navigateur ne déclenche rien', () => {
    const onSwipe = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() => useSwipe(onSwipe, onTap))
    act(() => result.current.onPointerDown(at(100, 100)))
    act(() => result.current.onPointerCancel())
    act(() => result.current.onPointerUp(at(200, 100)))
    expect(onSwipe).not.toHaveBeenCalled()
    expect(onTap).not.toHaveBeenCalled()
  })
})
