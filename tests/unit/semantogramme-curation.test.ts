import { describe, expect, it } from 'vitest'
import {
  buildIndex,
  checkCuration,
  loadCuration,
  loadDictionary,
  neighbourIssues,
  revealsTheme,
  wordIssues,
  type Curation,
} from '../../generators/semantogramme-curation'

const dictionary = loadDictionary()
const noException = { words: [], pairs: [], banned: [] }

describe('revealsTheme', () => {
  it.each([
    ['bonsoir', 'soir'],
    ['autobus', 'bus'],
    ['presse-ail', 'ail'],
    ['coupe-ongles', 'ongle'],
    ['cocotte-minute', 'minute'],
    ['Fantaisie-Impromptu', 'impromptu'],
    ['Vieux-Colombier', 'colombier'],
    ['parapluie', 'pluie'],
    ['survoler', 'voler'],
    ['sautiller', 'sauter'],
    ['coureur', 'courir'],
    ['ossements', 'os'],
  ])('signale « %s » pour le thème %s', (word, theme) => {
    expect(revealsTheme(word, theme)).toBe(true)
  })

  it.each([
    ['kiosque', 'os'],
    ['tempête', 'thé'],
    ['marteau', 'mer'],
  ])('ne signale pas « %s » pour le thème %s', (word, theme) => {
    expect(revealsTheme(word, theme)).toBe(false)
  })
})

describe('wordIssues', () => {
  const issues = (word: string, theme = 'test') => wordIssues(word, theme, dictionary, noException)

  it('accepte un mot du dictionnaire sans lien de forme avec le thème', () => {
    expect(issues('nuage', 'pluie')).toEqual([])
  })

  it('accepte un nom propre absent du dictionnaire', () => {
    expect(issues('Molière', 'théâtre')).toEqual([])
  })

  it.each(['foie gras', 'Queen Mary'])('refuse l’espace dans « %s »', (word) => {
    expect(issues(word)).toContain('contient une espace')
  })

  it.each(['1914', 'R2-D2'])('refuse le chiffre dans « %s »', (word) => {
    expect(issues(word)).toContain('contient un chiffre')
  })

  it('refuse un mot de plus de 14 caractères', () => {
    expect(issues('électroencéphalogramme')).toContain('plus de 14 caractères')
  })

  it.each(['feeling', 'groove', 'foie-gras', 'étoile-filante', 'accalmir'])(
    'refuse « %s », hors dictionnaire et non admis',
    (word) => {
      expect(issues(word)).toContain('hors dictionnaire (ni dans allowed.json)')
    },
  )

  it('accepte un mot hors dictionnaire inscrit dans allowed.json', () => {
    expect(
      wordIssues('wifi', 'internet', dictionary, { words: ['wifi'], pairs: [], banned: [] }),
    ).toEqual([])
  })

  it('refuse un mot qui trahit le thème', () => {
    expect(issues('parapluie', 'pluie')).toContain('trahit le thème')
  })

  it('accepte un couple thème|mot validé à la main', () => {
    const allowed = { words: [], pairs: ['vis|tournevis'], banned: [] }
    expect(wordIssues('tournevis', 'vis', dictionary, allowed)).toEqual([])
  })
})

describe('checkCuration', () => {
  const tiny = (words: Curation['words']): Curation => ({
    schedule: {
      '1': [
        { date: '2026-09-01', word: 'chat', category: 'animal' },
        { date: '2026-09-02', word: 'fleur', category: 'nature' },
      ],
      '2': [],
      '3': [],
      '4': [],
    },
    words,
    allowed: noException,
  })
  const ten = (prefix: string[]) => [...prefix, ...'abcdefghij'.split('')].slice(0, 10)

  it('signale une liste de la mauvaise taille', () => {
    const issues = checkCuration(
      tiny({ '1|chat': ['souris'], '1|fleur': ten(['rose']) }),
      dictionary,
    )
    expect(issues).toContain('1|chat : 1 mots au lieu de 10')
  })

  it('signale deux mots de la même famille dans une liste', () => {
    const issues = checkCuration(tiny({ '1|chat': ten(['jardin', 'jardinier']) }), dictionary)
    expect(issues.some((i) => i.includes('« jardin » et « jardinier »'))).toBe(true)
  })

  it('signale un même mot dans deux thèmes à moins de 3 jours', () => {
    const issues = checkCuration(
      tiny({ '1|chat': ten(['moustache']), '1|fleur': ten(['moustache']) }),
      dictionary,
    )
    expect(issues.some((i) => i.includes('« moustache » déjà dans 1|chat'))).toBe(true)
  })

  it('signale un mot égal au thème d’un jour voisin', () => {
    const issues = checkCuration(tiny({ '1|chat': ten(['fleur']) }), dictionary)
    expect(issues.some((i) => i.includes("« fleur » thème d'un jour voisin"))).toBe(true)
  })
})

describe('neighbourIssues', () => {
  it('voit, dans les deux sens, une collision avec un jour suivant', () => {
    const curation: Curation = {
      schedule: {
        '1': [
          { date: '2026-09-01', word: 'chat', category: 'animal' },
          { date: '2026-09-02', word: 'fleur', category: 'nature' },
        ],
        '2': [],
        '3': [],
        '4': [],
      },
      words: { '1|chat': [], '1|fleur': ['jardin'] },
      allowed: noException,
    }
    const index = buildIndex(curation)
    expect(neighbourIssues('jardin', '1|chat', index)).toEqual([])
    expect(neighbourIssues('jardin', '1|chat', index, true)).toEqual(['déjà dans 1|fleur (1 j)'])
  })
})

describe('corpus de curation', () => {
  it('respecte toutes les règles automatiques', () => {
    expect(checkCuration(loadCuration(), dictionary)).toEqual([])
  })
})
