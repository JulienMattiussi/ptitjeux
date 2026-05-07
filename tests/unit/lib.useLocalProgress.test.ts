import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { writeLevelProgress } from '~/lib/localStorage'
import { levelKey, useLocalProgress } from '~/lib/useLocalProgress'

describe('lib/useLocalProgress', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('levelKey concatène date et index avec un tiret', () => {
    expect(levelKey('2026-05-07', 1)).toBe('2026-05-07-1')
    expect(levelKey('2026-04-15', 4)).toBe('2026-04-15-4')
  })

  it('lit la progression au montage', () => {
    writeLevelProgress('sokomot', '2026-05-07-1', { completed: true, bestMoves: 8 })
    const { result } = renderHook(() => useLocalProgress('sokomot'))
    expect(result.current['2026-05-07-1']?.completed).toBe(true)
    expect(result.current['2026-05-07-1']?.bestMoves).toBe(8)
  })

  it('renvoie un objet vide si rien dans localStorage', () => {
    const { result } = renderHook(() => useLocalProgress('boucle'))
    expect(result.current).toEqual({})
  })

  it('isole les jeux : ne lit que le sien', () => {
    writeLevelProgress('sokomot', '2026-05-07-1', { completed: true })
    writeLevelProgress('boucle', '2026-05-07-1', { completed: true })
    const { result } = renderHook(() => useLocalProgress('semantogramme'))
    expect(result.current).toEqual({})
  })
})
