import { Link } from 'react-router'
import { GameLayout } from './GameLayout'

type Props = {
  /** Préfixe de route du jeu, ex. `/sokomot`. */
  backHref: string
}

/**
 * Page d'erreur quand l'URL pointe sur un niveau inexistant.
 * Identique pour les 3 jeux, paramétrée par la route de retour.
 */
export function LevelNotFound({ backHref }: Props) {
  return (
    <GameLayout title="Niveau introuvable" backHref={backHref}>
      <p className="text-gray-600 dark:text-gray-300">
        Ce niveau n'existe pas.{' '}
        <Link to={backHref} className="underline">
          Retour
        </Link>
        .
      </p>
    </GameLayout>
  )
}
