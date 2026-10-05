import { ThumbnailArt as AngleMortArt } from './anglemort/Thumbnail'
import { ThumbnailArt as BoucleArt } from './boucle/Thumbnail'
import { ThumbnailArt as SemantogrammeArt } from './semantogramme/Thumbnail'
import { ThumbnailArt as SokomotArt } from './sokomot/Thumbnail'
import type { GameId } from '~/lib/game-styles'

type GameThumbnail = {
  /** Nom accessible de l'aperçu. */
  label: string
  /** Contenu du dessin, dans un repère de 120 × 80. */
  Art: () => React.JSX.Element
}

/** Mini-illustration qui résume la mécanique de chaque jeu (accueil, tuiles de niveau). */
export const THUMBNAILS: Record<GameId, GameThumbnail> = {
  sokomot: { label: 'Aperçu de Sokomot', Art: SokomotArt },
  boucle: { label: 'Aperçu de Boucle', Art: BoucleArt },
  semantogramme: { label: 'Aperçu de Sémantogramme', Art: SemantogrammeArt },
  anglemort: { label: "Aperçu d'Angle mort", Art: AngleMortArt },
}
