import { describe, expect, it } from 'vitest'
import { freshWords } from '../../generators/wordlists'

describe('generators/wordlists', () => {
  it('donne des mots ASCII en majuscules de la longueur voulue', () => {
    const words = freshWords(5)
    expect(words.length).toBeGreaterThan(0)
    expect(words.every((w) => /^[A-Z]{5}$/.test(w.display))).toBe(true)
  })

  it('garde la forme accentuée pour le Wiktionnaire', () => {
    expect(freshWords(5).find((w) => w.display === 'ETAPE')?.canonical).toBe('étape')
  })

  it('écarte les mots déjà publiés', () => {
    const all = freshWords(4)
    const used = new Set(all.slice(0, 10).map((w) => w.display))
    const fresh = freshWords(4, used)
    expect(fresh).toHaveLength(all.length - 10)
    expect(fresh.some((w) => used.has(w.display))).toBe(false)
  })

  it('échoue quand plus aucun mot neuf ne reste', () => {
    const used = new Set(freshWords(3).map((w) => w.display))
    expect(() => freshWords(3, used)).toThrow('Plus aucun mot neuf de 3 lettres')
  })

  it('échoue pour une longueur hors des listes', () => {
    expect(() => freshWords(12)).toThrow()
  })
})
