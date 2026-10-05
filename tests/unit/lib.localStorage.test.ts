import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { levelKey, readAllProgress, readGameProgress, recordWin } from '~/lib/localStorage'

describe('lib/localStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('readAllProgress renvoie {} quand vide', () => {
    expect(readAllProgress()).toEqual({})
  })

  it('levelKey concatène date et index avec un tiret', () => {
    expect(levelKey('2026-05-07', 1)).toBe('2026-05-07-1')
  })

  it('recordWin enregistre le statut et la date de la victoire', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-07T10:00:00Z'))
    recordWin('sokomot', '2026-05-07-1', 'solved')
    vi.useRealTimers()
    expect(readGameProgress('sokomot')['2026-05-07-1']).toEqual({
      status: 'solved',
      lastPlayedAt: '2026-05-07T10:00:00.000Z',
    })
  })

  it('recordWin garde un statut parfait quand on rejoue moins bien', () => {
    recordWin('sokomot', '2026-05-07-1', 'perfect')
    recordWin('sokomot', '2026-05-07-1', 'solved')
    expect(readGameProgress('sokomot')['2026-05-07-1'].status).toBe('perfect')
  })

  it('recordWin passe à parfait quand on fait mieux', () => {
    recordWin('sokomot', '2026-05-07-1', 'solved')
    recordWin('sokomot', '2026-05-07-1', 'perfect')
    expect(readGameProgress('sokomot')['2026-05-07-1'].status).toBe('perfect')
  })

  it('isole les jeux dans le stockage', () => {
    recordWin('sokomot', '2026-05-07-1', 'solved')
    recordWin('boucle', '2026-05-07-1', 'perfect')
    expect(readGameProgress('sokomot')['2026-05-07-1'].status).toBe('solved')
    expect(readGameProgress('boucle')['2026-05-07-1'].status).toBe('perfect')
    expect(readGameProgress('semantogramme')['2026-05-07-1']).toBeUndefined()
  })

  it('readGameProgress renvoie {} pour un jeu inconnu', () => {
    expect(readGameProgress('inconnu')).toEqual({})
  })

  it.each(['42', 'null'])("ignore une sauvegarde qui n'est pas un objet (%s)", (raw) => {
    window.localStorage.setItem('ptitjeux.progress', raw)
    expect(readAllProgress()).toEqual({})
  })

  it('survit à un JSON corrompu en localStorage', () => {
    window.localStorage.setItem('ptitjeux.progress', 'pas-du-json{')
    expect(readAllProgress()).toEqual({})
  })
})
