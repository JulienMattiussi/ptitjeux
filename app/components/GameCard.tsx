import { Link } from 'react-router'
import { THUMBNAILS } from './Thumbnails'
import type { GameDescriptor } from '~/lib/games-registry'

type Props = {
  game: GameDescriptor
  completedCount?: number
  totalLevels?: number
}

export function GameCard({ game, completedCount, totalLevels }: Props) {
  const Thumbnail = THUMBNAILS[game.id]

  return (
    <Link
      to={game.href}
      className="animate-fade-in-up group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white/80 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-gray-700"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${game.accentClass}`}
        aria-hidden="true"
      />
      {Thumbnail && (
        <div className="relative aspect-3/2 overflow-hidden bg-linear-to-br from-gray-50 to-gray-100 transition-transform duration-500 group-hover:scale-[1.03] dark:from-gray-900 dark:to-gray-950">
          <Thumbnail className="h-full w-full" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight">{game.name}</h2>
          {typeof totalLevels === 'number' && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {completedCount ?? 0} / {totalLevels}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{game.tagline}</p>
        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {game.description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-gray-900 transition-transform group-hover:translate-x-1 dark:text-gray-100">
          Jouer
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 5 3 L 11 8 L 5 13" />
          </svg>
        </span>
      </div>
    </Link>
  )
}
