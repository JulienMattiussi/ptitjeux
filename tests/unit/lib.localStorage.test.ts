import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  countCompleted,
  readAllProgress,
  readGameProgress,
  writeLevelProgress,
} from '~/lib/localStorage'

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

  it('writeLevelProgress puis readGameProgress renvoie le statut', () => {
    writeLevelProgress('sokomot', '2026-05-07-1', { completed: true, bestMoves: 12 })
    const progress = readGameProgress('sokomot')
    expect(progress['2026-05-07-1'].completed).toBe(true)
    expect(progress['2026-05-07-1'].bestMoves).toBe(12)
    expect(progress['2026-05-07-1'].lastPlayedAt).toBeTruthy()
  })

  it('writeLevelProgress merge avec les valeurs existantes', () => {
    writeLevelProgress('sokomot', '2026-05-07-1', { completed: true, bestMoves: 20 })
    writeLevelProgress('sokomot', '2026-05-07-1', { bestMoves: 15 })
    const progress = readGameProgress('sokomot')
    expect(progress['2026-05-07-1'].completed).toBe(true) // conservé
    expect(progress['2026-05-07-1'].bestMoves).toBe(15) // mis à jour
  })

  it('isole les jeux dans le storage', () => {
    writeLevelProgress('sokomot', '2026-05-07-1', { completed: true })
    writeLevelProgress('boucle', '2026-05-07-1', { completed: true })
    expect(readGameProgress('sokomot')['2026-05-07-1'].completed).toBe(true)
    expect(readGameProgress('boucle')['2026-05-07-1'].completed).toBe(true)
    expect(readGameProgress('semantogramme')['2026-05-07-1']).toBeUndefined()
  })

  it('readGameProgress renvoie {} pour un jeu inconnu', () => {
    expect(readGameProgress('inconnu')).toEqual({})
  })

  it('countCompleted compte uniquement les niveaux résolus', () => {
    writeLevelProgress('sokomot', '2026-05-07-1', { completed: true })
    writeLevelProgress('sokomot', '2026-05-07-2', { completed: false })
    writeLevelProgress('sokomot', '2026-05-07-3', { completed: true })
    expect(countCompleted('sokomot')).toBe(2)
  })

  it('survit à un JSON corrompu en localStorage', () => {
    window.localStorage.setItem('secretgame.progress', 'pas-du-json{')
    expect(readAllProgress()).toEqual({})
  })
})
