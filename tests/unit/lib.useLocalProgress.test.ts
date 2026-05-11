import { act, renderHook } from '@testing-library/react'
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

  it('se met à jour quand un autre onglet écrit dans localStorage', () => {
    // Simule l'écriture par un autre onglet : changement direct du
    // localStorage suivi de l'event `storage` (que le navigateur émet
    // seulement aux autres onglets, jamais à celui qui écrit).
    const { result } = renderHook(() => useLocalProgress('sokomot'))
    expect(result.current).toEqual({})
    act(() => {
      window.localStorage.setItem(
        'secretgame.progress',
        JSON.stringify({
          sokomot: {
            '2026-05-07-1': { completed: true, bestMoves: 5, lastPlayedAt: '' },
          },
        }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'secretgame.progress' }),
      )
    })
    expect(result.current['2026-05-07-1']?.completed).toBe(true)
    expect(result.current['2026-05-07-1']?.bestMoves).toBe(5)
  })

  it("ignore les events storage d'une autre clé", () => {
    const { result } = renderHook(() => useLocalProgress('sokomot'))
    act(() => {
      window.localStorage.setItem('autre.cle', 'x')
      window.dispatchEvent(new StorageEvent('storage', { key: 'autre.cle' }))
    })
    expect(result.current).toEqual({})
  })

  it('cleanup : retire le listener au démontage', () => {
    const { unmount } = renderHook(() => useLocalProgress('sokomot'))
    unmount()
    // Si le listener n'avait pas été retiré, l'event ci-dessous ferait
    // appel à setProgress sur un composant démonté → React loggue un
    // warning. Le test passe tant qu'on n'a pas de "Can't perform a
    // React state update on an unmounted component".
    window.localStorage.setItem(
      'secretgame.progress',
      JSON.stringify({ sokomot: {} }),
    )
    window.dispatchEvent(new StorageEvent('storage', { key: 'secretgame.progress' }))
  })
})
