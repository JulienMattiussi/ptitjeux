import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recordWin } from '~/lib/localStorage'
import { useLocalProgress } from '~/lib/useLocalProgress'

describe('useLocalProgress', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('lit la progression au montage', () => {
    recordWin('sokomot', '2026-05-07-1', 'perfect')
    const { result } = renderHook(() => useLocalProgress('sokomot'))
    expect(result.current['2026-05-07-1']?.status).toBe('perfect')
  })

  it('renvoie un objet vide si rien dans localStorage', () => {
    const { result } = renderHook(() => useLocalProgress('boucle'))
    expect(result.current).toEqual({})
  })

  it('isole les jeux : ne lit que le sien', () => {
    recordWin('sokomot', '2026-05-07-1', 'solved')
    recordWin('boucle', '2026-05-07-1', 'solved')
    const { result } = renderHook(() => useLocalProgress('semantogramme'))
    expect(result.current).toEqual({})
  })

  it('se met à jour quand un autre onglet écrit dans localStorage', () => {
    // Simule l'écriture par un autre onglet : changement direct du
    // localStorage suivi de l'événement `storage` (que le navigateur émet
    // seulement aux autres onglets, jamais à celui qui écrit).
    const { result } = renderHook(() => useLocalProgress('sokomot'))
    expect(result.current).toEqual({})
    act(() => {
      window.localStorage.setItem(
        'ptitjeux.progress',
        JSON.stringify({
          sokomot: {
            '2026-05-07-1': { status: 'solved', lastPlayedAt: '' },
          },
        }),
      )
      window.dispatchEvent(new StorageEvent('storage', { key: 'ptitjeux.progress' }))
    })
    expect(result.current['2026-05-07-1']?.status).toBe('solved')
  })

  it("ignore les événements storage d'une autre clé", () => {
    const { result } = renderHook(() => useLocalProgress('sokomot'))
    act(() => {
      // La progression a changé, mais l'événement annonce une autre clé.
      recordWin('sokomot', '2026-05-07-1', 'solved')
      window.dispatchEvent(new StorageEvent('storage', { key: 'autre.cle' }))
    })
    expect(result.current).toEqual({})
  })

  it("retire l'écoute des autres onglets au démontage", () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useLocalProgress('sokomot'))
    unmount()
    expect(remove).toHaveBeenCalledWith('storage', expect.any(Function))
  })
})
