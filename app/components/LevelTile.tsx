import { Link } from 'react-router'
import { CheckMark } from './CheckMark'
import { ChevronRight, LockIcon } from './icons'
import { THUMBNAILS } from './Thumbnails'
import type { CompletionStatus } from '~/lib/completion'
import { GAME_ACCENT, type GameId } from '~/lib/game-styles'

type Props = {
  gameId: GameId
  date: string
  index: number
  width: number
  height: number
  locked: boolean
  /** Statut de complétion : non résolu / résolu / parfait (objectif respecté). */
  status: CompletionStatus
  /** `daily` = grande tuile avec libellé « Niveau N ». `archive` = compact, sans libellé. */
  variant?: 'daily' | 'archive'
  /** Affiche un badge « Glace » (mécanique de glissade dans Sokomot). */
  iceMode?: boolean
}

export function LevelTile({
  gameId,
  date,
  index,
  width,
  height,
  locked,
  status,
  variant = 'daily',
  iceMode = false,
}: Props) {
  const c = GAME_ACCENT[gameId]
  const compact = variant === 'archive'
  const completed = status !== 'unsolved'
  const checkVariant = status === 'perfect' ? 'perfect' : 'solved'

  const sizeBadgeBase = `font-display font-extrabold tracking-tight rounded-full border-2 bg-white/95 backdrop-blur dark:bg-gray-900/95 ${c.badgeBorder} ${c.text}`
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
          {completed && <CheckMark size="sm" variant={checkVariant} />}
        </div>
      )}

      <div className="relative aspect-3/2 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-950">
        {(() => {
          const Thumbnail = THUMBNAILS[gameId]
          return <Thumbnail className="h-full w-full opacity-80" />
        })()}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={sizeBadgeClass}>
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
            <LockIcon className="h-6 w-6 text-white drop-shadow" />
          </div>
        )}
      </div>

      {variant === 'daily' && (
        <div className="mt-3 flex items-center justify-between text-sm">
          {locked ? (
            <span className="text-gray-400 dark:text-gray-500">Verrouillé</span>
          ) : status === 'perfect' ? (
            <span className="text-emerald-600 dark:text-emerald-400">Rejouer</span>
          ) : status === 'solved' ? (
            <span className="text-amber-600 dark:text-amber-400">Améliorer</span>
          ) : (
            <span className={`font-medium ${c.text}`}>Jouer</span>
          )}
          {!locked && (
            <ChevronRight
              className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${c.text}`}
            />
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

