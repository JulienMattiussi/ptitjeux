import { describe, expect, it } from 'vitest'
import { gameListMeta, gamePlayMeta, homeMeta, pageMeta, SITE_NAME, sitemapXml } from '~/lib/seo'

/** Données structurées d'une page (le bloc `script:ld+json` de ses balises). */
function jsonLd(meta: ReturnType<typeof pageMeta>) {
  const entry = meta.find((m) => 'script:ld+json' in m) as
    { 'script:ld+json': Record<string, unknown> } | undefined
  return entry?.['script:ld+json']
}

function content(meta: ReturnType<typeof pageMeta>, key: string, value: string) {
  return meta.find((m) => (m as Record<string, string>)[key] === value)
}

describe('lib/seo', () => {
  it("pageMeta construit l'URL canonique à partir du chemin", () => {
    const meta = pageMeta({ title: 'T', description: 'D', path: '/boucle' })
    expect(content(meta, 'rel', 'canonical')).toMatchObject({
      href: 'https://ptitjeux.yavadeus.dev/boucle',
    })
  })

  it('pageMeta laisse la page indexable par défaut', () => {
    const meta = pageMeta({ title: 'T', description: 'D', path: '/' })
    expect(content(meta, 'name', 'robots')).toBeUndefined()
  })

  it('pageMeta exclut une page non indexable des moteurs', () => {
    const meta = pageMeta({ title: 'T', description: 'D', path: '/', indexable: false })
    expect(content(meta, 'name', 'robots')).toMatchObject({ content: 'noindex, follow' })
  })

  it("gameListMeta titre la page avec le nom et l'accroche du jeu, sans majuscule après « : »", () => {
    expect(gameListMeta('boucle')[0]).toEqual({
      title: `Boucle : encercle le mot caché | ${SITE_NAME}`,
    })
  })

  it("gamePlayMeta date le titre d'un niveau en toutes lettres", () => {
    expect(gamePlayMeta('sokomot', '2026-09-01', '2')[0]).toEqual({
      title: `Sokomot · 1 septembre 2026 · niveau 2 | ${SITE_NAME}`,
    })
  })

  it("gamePlayMeta exclut les pages de niveau de l'index", () => {
    const meta = gamePlayMeta('sokomot', '2026-09-01', '2')
    expect(content(meta, 'name', 'robots')).toMatchObject({ content: 'noindex, follow' })
  })

  it('gamePlayMeta titre une page de niveau introuvable sans date ni index', () => {
    expect(gamePlayMeta('boucle', 'foo', '0', false)[0]).toEqual({
      title: `Boucle · niveau introuvable | ${SITE_NAME}`,
    })
  })

  it('homeMeta décrit le site et liste ses jeux en données structurées', () => {
    const ld = jsonLd(homeMeta('T', 'D'))
    expect(ld).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: 'https://ptitjeux.yavadeus.dev/',
    })
    expect(ld?.hasPart).toHaveLength(4)
  })

  it('gameListMeta décrit le jeu en données structurées', () => {
    expect(jsonLd(gameListMeta('boucle'))).toMatchObject({
      '@type': 'VideoGame',
      name: 'Boucle',
      url: 'https://ptitjeux.yavadeus.dev/boucle',
    })
  })

  it("les pages de niveau n'ont pas de données structurées", () => {
    expect(jsonLd(gamePlayMeta('boucle', '2026-09-01', '1'))).toBeUndefined()
  })

  it("sitemapXml liste l'accueil et chaque jeu, datés du jour", () => {
    const xml = sitemapXml('2026-11-10')
    expect(xml.match(/<url>/g)).toHaveLength(5)
    expect(xml).toContain(
      '<loc>https://ptitjeux.yavadeus.dev/sokomot</loc><lastmod>2026-11-10</lastmod>',
    )
    expect(xml).not.toMatch(/\/\d{4}-\d{2}-\d{2}\//)
  })
})
