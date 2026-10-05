import { describe, expect, it } from 'vitest'
import type { GameId } from '~/lib/game-styles'
import { findGame, games } from '~/lib/games-registry'

const GAME_IDS = games.map((g) => g.id)

describe('lib/games-registry', () => {
  it('contient les 4 jeux attendus', () => {
    expect(games.map((g) => g.id).sort()).toEqual([
      'anglemort',
      'boucle',
      'semantogramme',
      'sokomot',
    ])
  })

  it('chaque jeu a un nom, une accroche, une description, un lien et un accent', () => {
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

  it('findGame refuse un identifiant absent du catalogue', () => {
    // Impossible à écrire sans forcer le type : le cas protège une URL ou une sauvegarde corrompue.
    expect(() => findGame('inconnu' as GameId)).toThrow('Jeu absent du catalogue')
  })
})
