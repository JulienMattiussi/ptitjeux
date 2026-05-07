import { Link, useParams } from 'react-router'
import { GameLayout } from '~/components/GameLayout'
import { Board } from '~/games/semantogramme/Board'
import { loadLevel } from '~/games/semantogramme/engine'
import { findLevel } from '~/games/semantogramme/levels'

export default function SemantogrammePlay() {
  const { levelId } = useParams<{ levelId: string }>()
  const level = levelId ? findLevel(levelId) : undefined

  if (!level) {
    return (
      <GameLayout title="Niveau introuvable" backHref="/semantogramme">
        <p className="text-gray-600 dark:text-gray-300">
          Ce niveau n'existe pas.{' '}
          <Link to="/semantogramme" className="underline">
            Retour à la liste
          </Link>
          .
        </p>
      </GameLayout>
    )
  }

  const state = loadLevel(level)

  return (
    <GameLayout
      title={`Sémantogramme · ${level.name}`}
      subtitle="Identifie les mots liés au thème caché."
      backHref="/semantogramme"
      backLabel="← Niveaux"
    >
      <Board state={state} />
    </GameLayout>
  )
}
