import { THUMBNAILS } from '~/games/thumbnails'
import type { GameId } from '~/lib/game-styles'

const VIEW_BOX = '0 0 120 80'

function symbolId(gameId: GameId): string {
  return `thumbnail-${gameId}`
}

/** Miniature dessinée sur place : pour une page qui ne l'affiche qu'une fois (accueil). */
export function Thumbnail({ gameId, className }: { gameId: GameId; className?: string }) {
  const { label, Art } = THUMBNAILS[gameId]
  return (
    <svg viewBox={VIEW_BOX} className={className} role="img" aria-label={label}>
      <Art />
    </svg>
  )
}

/**
 * Dessin de la miniature, déclaré une fois par page : les tuiles d'une liste y
 * renvoient (`ThumbnailRef`) au lieu de répéter le SVG, et les identifiants de
 * ses dégradés restent uniques dans la page.
 */
export function ThumbnailSymbol({ gameId }: { gameId: GameId }) {
  const { Art } = THUMBNAILS[gameId]
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <symbol id={symbolId(gameId)} viewBox={VIEW_BOX}>
        <Art />
      </symbol>
    </svg>
  )
}

/** Miniature qui renvoie au dessin déclaré par `ThumbnailSymbol`. */
export function ThumbnailRef({ gameId, className }: { gameId: GameId; className?: string }) {
  return (
    <svg viewBox={VIEW_BOX} className={className} role="img" aria-label={THUMBNAILS[gameId].label}>
      <use href={`#${symbolId(gameId)}`} />
    </svg>
  )
}
