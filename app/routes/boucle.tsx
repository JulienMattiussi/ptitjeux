import { Link } from 'react-router'
import { GameLayout } from '~/components/GameLayout'
import { findGame } from '~/lib/games-registry'
import { levels } from '~/games/boucle/levels'

export default function BoucleIndex() {
  const game = findGame('boucle')!
  return (
    <GameLayout title={game.name} subtitle={game.tagline}>
      <p className="mb-6 max-w-2xl text-gray-600 dark:text-gray-300">{game.description}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level, index) => (
          <li key={level.id}>
            <Link
              to={`/boucle/${level.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-emerald-400 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-500"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">Niveau {index + 1}</div>
              <div className="mt-1 text-lg font-semibold">{level.name}</div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {level.width} × {level.height}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </GameLayout>
  )
}
