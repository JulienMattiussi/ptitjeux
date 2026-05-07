import { Link } from 'react-router'
import { THUMBNAILS } from './Thumbnails'

type GameId = 'sokomot' | 'boucle' | 'semantogramme'

type Props = {
  gameId: GameId
  date: string
  index: number
  width: number
  height: number
  locked: boolean
  completed: boolean
  /** `daily` = grande tuile avec libellé « Niveau N ». `archive` = compact, sans libellé. */
  variant?: 'daily' | 'archive'
  /** Affiche un badge « Glace » (mécanique de glissade dans Sokomot). */
  iceMode?: boolean
}

const ACCENT: Record<
  GameId,
  { bar: string; ring: string; text: string; badgeBorder: string; badgeText: string }
> = {
  sokomot: {
    bar: 'from-sky-400 to-indigo-600',
    ring: 'hover:border-sky-400 dark:hover:border-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-500/70 dark:border-sky-400/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  boucle: {
    bar: 'from-emerald-400 to-teal-600',
    ring: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-500/70 dark:border-emerald-400/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  semantogramme: {
    bar: 'from-amber-400 to-orange-600',
    ring: 'hover:border-amber-400 dark:hover:border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-500/70 dark:border-amber-400/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
}

export function CheckMark({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const wrap =
    size === 'lg' ? 'h-7 w-7' : size === 'md' ? 'h-6 w-6' : 'h-5 w-5'
  const inner =
    size === 'lg' ? 'h-4 w-4' : size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ${wrap}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 12 12"
        className={inner}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 2 6 L 5 9 L 10 3" />
      </svg>
    </span>
  )
}

export function LevelTile({
  gameId,
  date,
  index,
  width,
  height,
  locked,
  completed,
  variant = 'daily',
  iceMode = false,
}: Props) {
  const Thumbnail = THUMBNAILS[gameId]
  const c = ACCENT[gameId]
  const compact = variant === 'archive'

  const sizeBadgeBase = `font-display font-extrabold tracking-tight rounded-full border-2 bg-white/95 backdrop-blur dark:bg-gray-900/95 shadow-lg ${c.badgeBorder} ${c.badgeText}`
  const sizeBadgeClass = compact
    ? `${sizeBadgeBase} px-3 py-0.5 text-base shadow-md`
    : `${sizeBadgeBase} px-4 py-1.5 text-2xl shadow-xl`

  const padding = compact ? 'p-2.5' : 'p-4'

  const lockTitle = locked ? `Termine d'abord le niveau ${index - 1}` : undefined

  const inner = (
    <>
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${c.bar}`}
        aria-hidden="true"
      />

      {variant === 'daily' && (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Niveau {index}
          </span>
          {completed && <CheckMark size="sm" />}
        </div>
      )}

      <div className="relative aspect-3/2 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-950">
        <Thumbnail className="h-full w-full opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${sizeBadgeClass} ${c.text}`}>
            {width} × {height}
          </span>
        </div>
        {iceMode && (
          <div
            className={`absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-sky-100/95 ${
              compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
            } font-bold uppercase tracking-wide text-sky-700 ring-1 ring-sky-400/60 backdrop-blur dark:bg-sky-900/80 dark:text-sky-200 dark:ring-sky-500/50`}
            title="Mode glace : tout glisse jusqu'au prochain obstacle"
          >
            <span aria-hidden="true">❄</span>
            <span>Glace</span>
          </div>
        )}
        {compact && completed && (
          <div className="absolute right-1.5 top-1.5">
            <CheckMark size="sm" />
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/45 backdrop-blur-[1px]">
            <svg
              viewBox="0 0 16 16"
              className="h-6 w-6 text-white drop-shadow"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5 7V5a3 3 0 1 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v4A1.5 1.5 0 0 1 11.5 14h-7A1.5 1.5 0 0 1 3 12.5v-4A1.5 1.5 0 0 1 4.5 7H5zm1.5 0h3V5a1.5 1.5 0 1 0-3 0v2z" />
            </svg>
          </div>
        )}
      </div>

      {variant === 'daily' && (
        <div className="mt-3 flex items-center justify-between text-sm">
          {locked ? (
            <span className="text-gray-400 dark:text-gray-500">Verrouillé</span>
          ) : completed ? (
            <span className="text-emerald-600 dark:text-emerald-400">Rejouer</span>
          ) : (
            <span className={`font-medium ${c.text}`}>Jouer</span>
          )}
          {!locked && (
            <svg
              viewBox="0 0 16 16"
              className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${c.text}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M 5 3 L 11 8 L 5 13" />
            </svg>
          )}
        </div>
      )}
    </>
  )

  const baseClass = `group relative flex flex-col rounded-xl border bg-white/80 ${padding} backdrop-blur transition-all duration-200 dark:bg-gray-900/70 ${
    locked
      ? 'cursor-not-allowed border-gray-200 dark:border-gray-800'
      : `border-gray-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 ${c.ring}`
  }`

  if (locked) {
    return (
      <div
        className={baseClass}
        title={lockTitle}
        aria-disabled="true"
        aria-label={`Niveau ${index} verrouillé. ${lockTitle}`}
      >
        {inner}
      </div>
    )
  }

  return (
    <Link to={`/${gameId}/${date}/${index}`} className={baseClass}>
      {inner}
    </Link>
  )
}
