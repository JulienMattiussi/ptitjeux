import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readGameProgress, recordWin } from '~/lib/localStorage'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'

function inRouter({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

const BASE = {
  gameId: 'sokomot',
  idx: 1,
  lastDate: '2027-09-30',
  won: false,
  moves: 0,
  parMoves: 10,
} as const

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

  it("enregistre une victoire au-delà de l'objectif comme résolue", () => {
    renderHook(() => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', won: true, moves: 12 }), {
      wrapper: inRouter,
    })
    expect(readGameProgress('sokomot')['2026-09-01-1'].status).toBe('solved')
  })

  it('garde un statut parfait quand on rejoue moins bien', () => {
    recordWin('sokomot', '2026-09-01-1', 'perfect')
    renderHook(() => useLevelPlayLifecycle({ ...BASE, date: '2026-09-01', won: true, moves: 12 }), {
      wrapper: inRouter,
    })
    expect(readGameProgress('sokomot')['2026-09-01-1'].status).toBe('perfect')
  })

  it('goBack ramène à la liste des niveaux, ouverte sur le jour joué', () => {
    let goBack = () => {}
    function Play() {
      goBack = useLevelPlayLifecycle({ ...BASE, date: '2026-09-01' }).goBack
      return null
    }
    function Where() {
      const { pathname, search } = useLocation()
      return <div data-testid="where">{pathname + search}</div>
    }
    render(
      <MemoryRouter initialEntries={['/sokomot/2026-09-01/1']}>
        <Routes>
          <Route path="/sokomot/:date/:index" element={<Play />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    )
    act(() => goBack())
    expect(screen.getByTestId('where')).toHaveTextContent('/sokomot?from=2026-09-01')
  })
})
