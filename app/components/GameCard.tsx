import { Link } from 'react-router'
import { ChevronRight } from './icons'
import { Thumbnail } from './Thumbnail'
import type { GameDescriptor } from '~/lib/games-registry'

export function GameCard({ game }: { game: GameDescriptor }) {
  return (
    <Link
      to={game.href}
      data-nav-item=""
      className="animate-fade-in-up group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white/80 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/70 dark:shadow-black/40 dark:hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 dark:focus-visible:ring-gray-100 dark:focus-visible:ring-offset-gray-950"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${game.accentClass}`}
        aria-hidden="true"
      />
      <div className="relative aspect-3/2 overflow-hidden bg-linear-to-br from-gray-50 to-gray-100 transition-transform duration-500 group-hover:scale-[1.03] dark:from-gray-800 dark:to-gray-900">
        <Thumbnail gameId={game.id} className="h-full w-full" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">{game.name}</h2>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{game.tagline}</p>
        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {game.description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-gray-900 transition-transform group-hover:translate-x-1 dark:text-gray-100">
          Jouer
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}
