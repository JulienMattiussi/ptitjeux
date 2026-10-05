import { describe, expect, it } from 'vitest'
import { findGame } from '~/lib/games-registry'
import { gameListMeta, gamePlayMeta, pageMeta, SITE_NAME } from '~/lib/seo'

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

  it('gameListMeta titre la page avec le nom et la tagline du jeu', () => {
    const game = findGame('boucle')
    expect(gameListMeta('boucle')[0]).toEqual({
      title: `${game.name} : ${game.tagline.replace(/\.$/, '')} | ${SITE_NAME}`,
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
})
