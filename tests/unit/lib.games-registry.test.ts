import { describe, expect, it } from 'vitest'
import { findGame, games } from '~/lib/games-registry'

describe('lib/games-registry', () => {
  it('contient les 3 jeux attendus', () => {
    expect(games.map((g) => g.id).sort()).toEqual(['boucle', 'semantogramme', 'sokomot'])
  })

  it('chaque jeu a un nom, tagline, description, href et accentClass', () => {
    for (const game of games) {
      expect(game.name).toBeTruthy()
      expect(game.tagline).toBeTruthy()
      expect(game.description).toBeTruthy()
      expect(game.href).toMatch(/^\//)
      expect(game.accentClass).toMatch(/from-/)
    }
  })

  it('findGame trouve les jeux existants', () => {
    expect(findGame('sokomot')?.id).toBe('sokomot')
    expect(findGame('boucle')?.id).toBe('boucle')
    expect(findGame('semantogramme')?.id).toBe('semantogramme')
  })

  it('findGame renvoie undefined pour un jeu inconnu', () => {
    expect(findGame('inconnu')).toBeUndefined()
  })
})
