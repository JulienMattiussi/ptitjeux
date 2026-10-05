import { Thumbnail as AngleMortThumbnail } from './anglemort/Thumbnail'
import { Thumbnail as BoucleThumbnail } from './boucle/Thumbnail'
import { Thumbnail as SemantogrammeThumbnail } from './semantogramme/Thumbnail'
import { Thumbnail as SokomotThumbnail } from './sokomot/Thumbnail'
import type { GameId } from '~/lib/game-styles'

/** Mini-illustration qui résume la mécanique de chaque jeu (accueil, tuiles de niveau). */
export const THUMBNAILS: Record<GameId, (props: { className?: string }) => React.JSX.Element> = {
  sokomot: SokomotThumbnail,
  boucle: BoucleThumbnail,
  semantogramme: SemantogrammeThumbnail,
  anglemort: AngleMortThumbnail,
}
