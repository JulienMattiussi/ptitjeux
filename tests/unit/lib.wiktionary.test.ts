import { describe, expect, it } from 'vitest'
import { extractPageText, parseFrenchDefinition, shortenToSentence } from '~/lib/wiktionary'

describe('lib/wiktionary — extractPageText', () => {
  it('renvoie l\'extrait de la première page non manquante', () => {
    const data = {
      query: {
        pages: {
          '736': { pageid: 736, title: 'maison', extract: 'Hello world' },
        },
      },
    }
    expect(extractPageText(data)).toBe('Hello world')
  })

  it('renvoie null si la page est missing', () => {
    const data = {
      query: { pages: { '-1': { missing: '', title: 'inconnu' } } },
    }
    expect(extractPageText(data)).toBeNull()
  })

  it('renvoie null sur structure inattendue', () => {
    expect(extractPageText(null)).toBeNull()
    expect(extractPageText('string')).toBeNull()
    expect(extractPageText({})).toBeNull()
    expect(extractPageText({ query: {} })).toBeNull()
    expect(extractPageText({ query: { pages: {} } })).toBeNull()
  })

  it('ignore les extraits vides', () => {
    const data = { query: { pages: { '1': { extract: '   ' } } } }
    expect(extractPageText(data)).toBeNull()
  })
})

describe('lib/wiktionary — parseFrenchDefinition', () => {
  it("extrait la première définition d'un nom commun", () => {
    const raw = `
== Français ==

=== Étymologie ===
(Vers 980) Du latin mansio.

=== Nom commun ===

maison \\me.zɔ̃\\ féminin

(Construction) Bâtiment servant de logis, d'habitation, de demeure.
`
    expect(parseFrenchDefinition(raw)).toBe(
      "(Construction) Bâtiment servant de logis, d'habitation, de demeure.",
    )
  })

  it('saute les sections en dehors du français', () => {
    const raw = `
== Conventions internationales ==
=== Symbole ===
(Linguistique) Code ISO du cornique.

== Français ==
=== Nom commun ===

cor \\kɔʁ\\ masculin

(Anatomie) Excroissance dure de la peau.
`
    expect(parseFrenchDefinition(raw)).toBe('(Anatomie) Excroissance dure de la peau.')
  })

  it('priorise « Nom commun » sur les autres catégories', () => {
    const raw = `
== Français ==
=== Adjectif ===

orange \\ɔ.ʁɑ̃ʒ\\ masculin et féminin

D'une couleur entre rouge et jaune.

=== Nom commun ===

orange \\ɔ.ʁɑ̃ʒ\\ féminin

Fruit comestible de l'oranger.
`
    expect(parseFrenchDefinition(raw)).toBe("Fruit comestible de l'oranger.")
  })

  it('retombe sur les autres catégories si pas de nom commun', () => {
    const raw = `
== Français ==
=== Forme de verbe ===

pierrai \\pjɛ.ʁe\\

Première personne du singulier du passé simple du verbe pierrer.
`
    expect(parseFrenchDefinition(raw)).toBe(
      'Première personne du singulier du passé simple du verbe pierrer.',
    )
  })

  it('saute les lignes de prononciation/inflection (avec barres obliques)', () => {
    const raw = `
== Français ==
=== Nom commun ===

auto \\o.to\\ ou \\ɔ.to\\ féminin

Automobile.
`
    expect(parseFrenchDefinition(raw)).toBe('Automobile.')
  })

  it('renvoie null si la section française est absente', () => {
    const raw = '== Anglais ==\n=== Noun ===\nA house.'
    expect(parseFrenchDefinition(raw)).toBeNull()
  })

  it('renvoie null si seules sections étymologie/références sont présentes', () => {
    const raw = `
== Français ==
=== Étymologie ===
Du latin.
=== Références ===
Source bibliographique.
`
    expect(parseFrenchDefinition(raw)).toBeNull()
  })

  it("s'arrête au changement de langue", () => {
    const raw = `
== Français ==
=== Nom commun ===
mot \\m\\
Une définition.

== Anglais ==
=== Noun ===
Another language definition.
`
    expect(parseFrenchDefinition(raw)).toBe('Une définition.')
  })

  it('tronque à la longueur maximale', () => {
    const longSentence = 'A'.repeat(400)
    const raw = `
== Français ==
=== Nom commun ===
foo \\fu\\
${longSentence}
`
    const result = parseFrenchDefinition(raw)
    expect(result).toBeTruthy()
    expect(result!.length).toBeLessThanOrEqual(280)
  })
})

describe('lib/wiktionary — shortenToSentence', () => {
  it('renvoie tel quel sous la limite', () => {
    expect(shortenToSentence('Petit texte.', 50)).toBe('Petit texte.')
  })

  it('coupe à la fin de phrase la plus tardive sous la limite', () => {
    const s = 'Phrase un. Phrase deux. Phrase trois plus longue.'
    // 25 chars : "Phrase un. Phrase deux. " → on garde la 2e phrase complète
    expect(shortenToSentence(s, 25)).toBe('Phrase un. Phrase deux.')
  })

  it('ajoute « … » si aucune coupure de phrase ne convient', () => {
    const s = 'A'.repeat(100)
    const result = shortenToSentence(s, 50)
    expect(result.length).toBeLessThanOrEqual(50)
    expect(result.endsWith('…')).toBe(true)
  })
})
