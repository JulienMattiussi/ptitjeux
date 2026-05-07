import { Link } from 'react-router'
import type { GameDescriptor } from '~/lib/games-registry'

type Props = {
  game: GameDescriptor
  completedCount?: number
  totalLevels?: number
}

export function GameCard({ game, completedCount, totalLevels }: Props) {
  return (
    <Link
      to={game.href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accentClass}`}
        aria-hidden="true"
      />
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">{game.name}</h2>
        {typeof totalLevels === 'number' && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {completedCount ?? 0} / {totalLevels} niveaux
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{game.tagline}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{game.description}</p>
      <span className="mt-2 text-sm font-medium text-gray-900 transition group-hover:translate-x-0.5 dark:text-gray-100">
        Jouer →
      </span>
    </Link>
  )
}
