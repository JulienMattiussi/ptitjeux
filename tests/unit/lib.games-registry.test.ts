import { describe, expect, it } from 'vitest'
import { GAME_IDS } from '~/lib/game-styles'
import { findGame, games } from '~/lib/games-registry'

describe('lib/games-registry', () => {
  it('contient les 4 jeux attendus', () => {
    expect(games.map((g) => g.id).sort()).toEqual([
      'anglemort',
      'boucle',
      'semantogramme',
      'sokomot',
    ])
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

  it.each(GAME_IDS)('findGame trouve %s', (id) => {
    expect(findGame(id).id).toBe(id)
  })
})
