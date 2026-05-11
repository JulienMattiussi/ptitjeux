import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLatestRef } from '~/lib/useLatestRef'

describe('useLatestRef', () => {
  it('renvoie une ref pointant initialement sur la valeur passée', () => {
    const { result } = renderHook(() => useLatestRef(42))
    expect(result.current.current).toBe(42)
  })

  it('met à jour la ref quand la valeur change entre deux renders', () => {
    const { result, rerender } = renderHook(({ v }: { v: number }) => useLatestRef(v), {
      initialProps: { v: 1 },
    })
    expect(result.current.current).toBe(1)
    rerender({ v: 99 })
    expect(result.current.current).toBe(99)
  })

  it('renvoie le même objet ref entre les renders (identité stable)', () => {
    const { result, rerender } = renderHook(({ v }: { v: number }) => useLatestRef(v), {
      initialProps: { v: 1 },
    })
    const refA = result.current
    rerender({ v: 2 })
    expect(result.current).toBe(refA)
  })
})
