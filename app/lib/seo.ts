import type { MetaDescriptor } from 'react-router'
import { dateLabel } from './dates'
import type { GameId } from './game-styles'
import { findGame } from './games-registry'

/** Adresse publique du site : base des URL canoniques et des aperçus de partage. */
const SITE_URL = 'https://ptitjeux.yavadeus.dev'
export const SITE_NAME = "P'titjeux"

/** Aperçu de partage : capture de l'accueil, au format paysage des réseaux sociaux. */
const SHARE_IMAGE = { path: '/og.png', width: 1200, height: 630 }

type PageMeta = {
  title: string
  description: string
  /** Chemin de la page, à partir de la racine (ex. `/boucle`). */
  path: string
  /** `false` : page exclue des moteurs de recherche (liens suivis quand même). */
  indexable?: boolean
}

/** Titre, description, URL canonique et aperçu de partage (Open Graph, Twitter). */
export function pageMeta({
  title,
  description,
  path,
  indexable = true,
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
  ]
}

/** Page « liste des niveaux » d'un jeu. */
export function gameListMeta(gameId: GameId): MetaDescriptor[] {
  const game = findGame(gameId)
  return pageMeta({
    title: `${game.name} : ${game.tagline.replace(/\.$/, '')} | ${SITE_NAME}`,
    description: game.description,
    path: game.href,
  })
}

/**
 * Page d'un niveau. Exclue des moteurs : des centaines de pages quasi
 * identiques (et des défis à venir) diluent le site sans rien apporter ; la
 * liste des niveaux du jeu est la page à référencer.
 */
export function gamePlayMeta(gameId: GameId, date = '', index = ''): MetaDescriptor[] {
  const game = findGame(gameId)
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? dateLabel(date) : date
  return pageMeta({
    title: `${game.name} · ${day} · niveau ${index} | ${SITE_NAME}`,
    description: `${game.tagline} ${game.description}`,
    path: `${game.href}/${date}/${index}`,
    indexable: false,
  })
}
