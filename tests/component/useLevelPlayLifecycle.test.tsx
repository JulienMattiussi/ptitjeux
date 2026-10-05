import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readGameProgress, writeLevelProgress } from '~/lib/localStorage'
import { useLevelParams, useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'

function inRouter({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

const BASE = { gameId: 'sokomot', idx: 1, won: false, moves: 0, parMoves: 10 } as const

describe('useLevelPlayLifecycle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 5))
  })
  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it("titre « Défi du jour » quand la date jouée est aujourd'hui", () => {
    const { result } = renderHook(
      () => useLevelPlayLifecycle({ ...BASE, date: '2026-10-05', idx: 2 }),
      { wrapper: inRouter },
    )
    expect(result.current.title).toBe('Sokomot · Défi du jour · niveau 2')
  })

  it('titre avec la date en toutes lettres pour un autre jour', () => {
    const { result } = renderHook(() => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01' }), {
      wrapper: inRouter,
    })
    expect(result.current.title).toBe('Sokomot · 1 septembre 2026 · niveau 1')
  })

  it('le retour ramène à la liste, ouverte sur le jour joué', () => {
    const { result } = renderHook(() => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01' }), {
      wrapper: inRouter,
    })
    expect(result.current.backHref).toBe('/sokomot?from=2026-09-01')
  })

  it("nextHref pointe vers le niveau suivant tant qu'on n'est pas au dernier", () => {
    const { result } = renderHook(
      () => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', idx: 2 }),
      { wrapper: inRouter },
    )
    expect(result.current.nextHref).toBe('/sokomot/2026-09-01/3')
  })

  it("nextHref n'existe pas au niveau 4", () => {
    const { result } = renderHook(
      () => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', idx: 4 }),
      { wrapper: inRouter },
    )
    expect(result.current.nextHref).toBeUndefined()
  })

  it("variante parfaite tant que les coups ne dépassent pas l'objectif", () => {
    const { result } = renderHook(
      () => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', moves: 10 }),
      { wrapper: inRouter },
    )
    expect(result.current.variant).toBe('perfect')
  })

  it("variante résolue au-delà de l'objectif", () => {
    const { result } = renderHook(
      () => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', moves: 11 }),
      { wrapper: inRouter },
    )
    expect(result.current.variant).toBe('solved')
  })

  it("n'écrit rien tant que la partie n'est pas gagnée", () => {
    renderHook(() => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', moves: 5 }), {
      wrapper: inRouter,
    })
    expect(readGameProgress('sokomot')).toEqual({})
  })

  it('enregistre la victoire avec son nombre de coups', () => {
    renderHook(() => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', won: true, moves: 12 }), {
      wrapper: inRouter,
    })
    expect(readGameProgress('sokomot')['2026-09-01-1']).toMatchObject({
      completed: true,
      bestMoves: 12,
    })
  })

  it('garde le meilleur score quand on rejoue moins bien', () => {
    writeLevelProgress('sokomot', '2026-09-01-1', { completed: true, bestMoves: 8 })
    renderHook(() => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', won: true, moves: 12 }), {
      wrapper: inRouter,
    })
    expect(readGameProgress('sokomot')['2026-09-01-1'].bestMoves).toBe(8)
  })
})

describe('useLevelParams', () => {
  const getLevel = (date: string, index: number) =>
    date === '2026-09-01' && index === 2 ? { id: 'niveau' } : undefined

  function atUrl(url: string) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/jeu/:date/:index" element={children} />
          </Routes>
        </MemoryRouter>
      )
    }
  }

  it("lit la date, l'index et le niveau dans l'URL", () => {
    const { result } = renderHook(() => useLevelParams(getLevel), {
      wrapper: atUrl('/jeu/2026-09-01/2'),
    })
    expect(result.current).toEqual({ date: '2026-09-01', idx: 2, level: { id: 'niveau' } })
  })

  it('renvoie un niveau indéfini pour une URL qui ne correspond à rien', () => {
    const { result } = renderHook(() => useLevelParams(getLevel), {
      wrapper: atUrl('/jeu/2026-09-01/9'),
    })
    expect(result.current.level).toBeUndefined()
  })
})
