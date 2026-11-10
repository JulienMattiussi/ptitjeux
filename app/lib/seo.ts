import type { MetaDescriptor } from 'react-router'
import { dateLabel, type DateString } from './dates'
import type { GameId } from './game-styles'
import { findGame, games } from './games-registry'

/** Adresse publique du site : base des URL canoniques et des aperçus de partage. */
const SITE_URL = 'https://ptitjeux.yavadeus.dev'
export const SITE_NAME = "P'titjeux"

/** Aperçu de partage : capture de l'accueil, au format paysage des réseaux sociaux. */
const SHARE_IMAGE = { path: '/og.png', width: 1200, height: 630 }

const AUTHOR = {
  '@type': 'Person',
  name: 'Julien Mattiussi',
  alternateName: 'yavadeus',
  url: 'https://yavadeus.dev/',
}

type PageMeta = {
  title: string
  description: string
  /** Chemin de la page, à partir de la racine (ex. `/boucle`). */
  path: string
  /** `false` : page exclue des moteurs de recherche (liens suivis quand même). */
  indexable?: boolean
  /** Données structurées schema.org, rendues en `<script type="application/ld+json">`. */
  jsonLd?: Record<string, unknown>
}

/** Titre, description, URL canonique et aperçu de partage (Open Graph, Twitter). */
export function pageMeta({
  title,
  description,
  path,
  indexable = true,
  jsonLd,
}: PageMeta): MetaDescriptor[] {
  const url = `${SITE_URL}${path}`
  const image = `${SITE_URL}${SHARE_IMAGE.path}`
  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    ...(indexable ? [] : [{ name: 'robots', content: 'noindex, follow' }]),
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: String(SHARE_IMAGE.width) },
    { property: 'og:image:height', content: String(SHARE_IMAGE.height) },
    { name: 'twitter:card', content: 'summary_large_image' },
    ...(jsonLd ? [{ 'script:ld+json': { '@context': 'https://schema.org', ...jsonLd } }] : []),
  ]
}

/** Page d'accueil : le site et ses jeux. */
export function homeMeta(title: string, description: string): MetaDescriptor[] {
  return pageMeta({
    title,
    description,
    path: '/',
    jsonLd: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description,
      inLanguage: 'fr',
      author: AUTHOR,
      hasPart: games.map((game) => ({
        '@type': 'VideoGame',
        name: game.name,
        url: `${SITE_URL}${game.href}`,
      })),
    },
  })
}

/** Pas de majuscule après « : » dans un titre. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

/** Page « liste des niveaux » d'un jeu. */
export function gameListMeta(gameId: GameId): MetaDescriptor[] {
  const game = findGame(gameId)
  return pageMeta({
    title: `${game.name} : ${lowerFirst(game.tagline.replace(/\.$/, ''))} | ${SITE_NAME}`,
    description: game.description,
    path: game.href,
    jsonLd: {
      '@type': 'VideoGame',
      name: game.name,
      url: `${SITE_URL}${game.href}`,
      description: `${game.tagline} ${game.description}`,
      image: `${SITE_URL}${SHARE_IMAGE.path}`,
      genre: game.genre,
      gamePlatform: 'Navigateur web',
      inLanguage: 'fr',
      isAccessibleForFree: true,
      author: AUTHOR,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
    },
  })
}

/**
 * Page d'un niveau. Exclue des moteurs : des centaines de pages quasi
 * identiques (et des défis à venir) diluent le site sans rien apporter ; la
 * liste des niveaux du jeu est la page à référencer.
 */
export function gamePlayMeta(
  gameId: GameId,
  date = '',
  index = '',
  found = true,
): MetaDescriptor[] {
  const game = findGame(gameId)
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? dateLabel(date) : date
  return pageMeta({
    title: found
      ? `${game.name} · ${day} · niveau ${index} | ${SITE_NAME}`
      : `${game.name} · niveau introuvable | ${SITE_NAME}`,
    description: `${game.tagline} ${game.description}`,
    path: `${game.href}/${date}/${index}`,
    indexable: false,
  })
}

/**
 * Sitemap : l'accueil et la liste de chaque jeu (les pages de niveau sont hors
 * index). Le défi change chaque jour, d'où `lastmod` à la date du jour : Google
 * ignore `changefreq` mais tient compte de `lastmod`.
 */
export function sitemapXml(today: DateString): string {
  const paths = ['/', ...games.map((game) => game.href)]
  const urls = paths
    .map((path) => `  <url><loc>${SITE_URL}${path}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}
