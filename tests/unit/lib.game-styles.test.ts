import { describe, expect, it } from 'vitest'
import { GAME_ACCENT, GAME_IDS, GAME_SIZE, isIceLevel } from '~/lib/game-styles'

describe('lib/game-styles', () => {
  it('GAME_IDS contient les trois jeux', () => {
    expect(GAME_IDS).toEqual(['sokomot', 'boucle', 'semantogramme'])
  })

  it("GAME_ACCENT a une entrée pour chaque jeu avec toutes les classes requises", () => {
    for (const id of GAME_IDS) {
      const accent = GAME_ACCENT[id]
      expect(accent.bar).toMatch(/from-/)
      expect(accent.bar).toMatch(/to-/)
      expect(accent.text).toMatch(/text-/)
      expect(accent.ring).toMatch(/hover:border-/)
      expect(accent.badgeBorder).toMatch(/border-/)
    }
  })

  it('GAME_SIZE Sokomot croît de +1 en largeur et hauteur', () => {
    expect(GAME_SIZE.sokomot(1)).toEqual({ width: 7, height: 6 })
    expect(GAME_SIZE.sokomot(2)).toEqual({ width: 8, height: 7 })
    expect(GAME_SIZE.sokomot(3)).toEqual({ width: 9, height: 8 })
    expect(GAME_SIZE.sokomot(4)).toEqual({ width: 10, height: 9 })
  })

  it('GAME_SIZE Boucle et Sémantogramme produisent des grilles carrées', () => {
    expect(GAME_SIZE.boucle(1)).toEqual({ width: 4, height: 4 })
    expect(GAME_SIZE.boucle(4)).toEqual({ width: 7, height: 7 })
    expect(GAME_SIZE.semantogramme(1)).toEqual({ width: 4, height: 4 })
    expect(GAME_SIZE.semantogramme(4)).toEqual({ width: 7, height: 7 })
  })

  it('isIceLevel cible uniquement Sokomot niveaux 2 et 4', () => {
    expect(isIceLevel('sokomot', 1)).toBe(false)
    expect(isIceLevel('sokomot', 2)).toBe(true)
    expect(isIceLevel('sokomot', 3)).toBe(false)
    expect(isIceLevel('sokomot', 4)).toBe(true)
    expect(isIceLevel('boucle', 2)).toBe(false)
    expect(isIceLevel('boucle', 4)).toBe(false)
    expect(isIceLevel('semantogramme', 2)).toBe(false)
    expect(isIceLevel('semantogramme', 4)).toBe(false)
  })
})
