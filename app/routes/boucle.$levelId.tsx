import { Link, useParams } from 'react-router'
import { GameLayout } from '~/components/GameLayout'
import { Board } from '~/games/boucle/Board'
import { loadLevel } from '~/games/boucle/engine'
import { findLevel } from '~/games/boucle/levels'

export default function BouclePlay() {
  const { levelId } = useParams<{ levelId: string }>()
  const level = levelId ? findLevel(levelId) : undefined

  if (!level) {
    return (
      <GameLayout title="Niveau introuvable" backHref="/boucle">
        <p className="text-gray-600 dark:text-gray-300">
          Ce niveau n'existe pas.{' '}
          <Link to="/boucle" className="underline">
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
      title={`Boucle · ${level.name}`}
      subtitle="Trace une boucle fermée pour encercler le mot caché."
      backHref="/boucle"
      backLabel="← Niveaux"
    >
      <Board state={state} />
    </GameLayout>
  )
}
