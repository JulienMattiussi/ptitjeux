import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { readGameProgress } from '~/lib/localStorage'

describe('useLevelPlayLifecycle', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    window.localStorage.clear()
  })

  it('isToday=true quand date == lastAvailableDate', () => {
    const { result } = renderHook(() =>
      useLevelPlayLifecycle({
        gameId: 'sokomot',
        date: '2026-05-08',
        idx: 1,
        lastAvailableDate: '2026-05-08',
        won: false,
        moves: 0,
      }),
    )
    expect(result.current.isToday).toBe(true)
    expect(result.current.dateChip).toBe('Défi du jour')
  })

  it("isToday=false : dateChip est l'étiquette française", () => {
    const { result } = renderHook(() =>
      useLevelPlayLifecycle({
        gameId: 'boucle',
        date: '2026-05-01',
        idx: 1,
        lastAvailableDate: '2026-05-08',
        won: false,
        moves: 0,
      }),
    )
    expect(result.current.isToday).toBe(false)
    expect(result.current.dateChip).toMatch(/2026/)
  })

  it("nextHref pointe vers le niveau suivant tant qu'on n'est pas au dernier", () => {
    const { result } = renderHook(() =>
      useLevelPlayLifecycle({
        gameId: 'sokomot',
        date: '2026-05-08',
        idx: 2,
        lastAvailableDate: '2026-05-08',
        won: false,
        moves: 0,
      }),
    )
    expect(result.current.nextHref).toBe('/sokomot/2026-05-08/3')
  })

  it('nextHref undefined au dernier niveau (4 par défaut)', () => {
    const { result } = renderHook(() =>
      useLevelPlayLifecycle({
        gameId: 'sokomot',
        date: '2026-05-08',
        idx: 4,
        lastAvailableDate: '2026-05-08',
        won: false,
        moves: 0,
      }),
    )
    expect(result.current.nextHref).toBeUndefined()
  })

  it('totalLevels personnalisable', () => {
    const { result } = renderHook(() =>
      useLevelPlayLifecycle({
        gameId: 'sokomot',
        date: '2026-05-08',
        idx: 2,
        lastAvailableDate: '2026-05-08',
        won: false,
        moves: 0,
        totalLevels: 2,
      }),
    )
    expect(result.current.nextHref).toBeUndefined()
  })

  it('ne touche pas à localStorage tant que won=false', () => {
    renderHook(() =>
      useLevelPlayLifecycle({
        gameId: 'sokomot',
        date: '2026-05-08',
        idx: 1,
        lastAvailableDate: '2026-05-08',
        won: false,
        moves: 5,
      }),
    )
    expect(readGameProgress('sokomot')).toEqual({})
  })

  it('won=true : écrit la progression avec bestMoves', () => {
    renderHook(() =>
      useLevelPlayLifecycle({
        gameId: 'sokomot',
        date: '2026-05-08',
        idx: 1,
        lastAvailableDate: '2026-05-08',
        won: true,
        moves: 12,
      }),
    )
    const progress = readGameProgress('sokomot')
    expect(progress['2026-05-08-1']).toMatchObject({ completed: true, bestMoves: 12 })
  })

  it('date manquante : pas d\'écriture localStorage', () => {
    renderHook(() =>
      useLevelPlayLifecycle({
        gameId: 'sokomot',
        date: '',
        idx: 1,
        lastAvailableDate: '2026-05-08',
        won: true,
        moves: 5,
      }),
    )
    expect(readGameProgress('sokomot')).toEqual({})
  })
})
