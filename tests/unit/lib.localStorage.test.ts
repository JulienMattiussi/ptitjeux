import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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

  it('recordWin enregistre le statut de la victoire', () => {
    recordWin('sokomot', '2026-05-07-1', 'solved')
    const progress = readGameProgress('sokomot')['2026-05-07-1']
    expect(progress.status).toBe('solved')
    expect(progress.lastPlayedAt).toBeTruthy()
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

  it('isole les jeux dans le storage', () => {
    recordWin('sokomot', '2026-05-07-1', 'solved')
    recordWin('boucle', '2026-05-07-1', 'perfect')
    expect(readGameProgress('sokomot')['2026-05-07-1'].status).toBe('solved')
    expect(readGameProgress('boucle')['2026-05-07-1'].status).toBe('perfect')
    expect(readGameProgress('semantogramme')['2026-05-07-1']).toBeUndefined()
  })

  it('readGameProgress renvoie {} pour un jeu inconnu', () => {
    expect(readGameProgress('inconnu')).toEqual({})
  })

  it('survit à un JSON corrompu en localStorage', () => {
    window.localStorage.setItem('ptitjeux.progress', 'pas-du-json{')
    expect(readAllProgress()).toEqual({})
  })
})
