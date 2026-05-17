import { useEffect, useRef, useState } from 'react'
import { CheckMark } from './CheckMark'
import { ChevronRight } from './icons'
import { LevelTile } from './LevelTile'
import { getLevelParMoves } from '~/games'
import { aggregateCompletion, completionStatus, type CompletionStatus } from '~/lib/completion'
import { dateLabelShort, monthKey, monthLabel } from '~/lib/dates'
import { GAME_SIZE, type GameId } from '~/lib/game-styles'
import type { GameProgress } from '~/lib/localStorage'
import { levelKey } from '~/lib/useLocalProgress'

type Props = {
  gameId: GameId
  dates: string[]
  progress: GameProgress
  /**
   * Si fournie, ouvre le mois correspondant à cette date au montage et
   * scrolle jusqu'à la ligne du jour. Utilisé pour ramener le joueur à
   * l'endroit d'où il vient quand il quitte un niveau.
   */
  focusDate?: string
}

function groupByMonth(dates: string[]): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const d of dates) {
    const k = monthKey(d)
    const list = m.get(k) ?? []
    list.push(d)
    m.set(k, list)
  }
  return m
}

function dayStatuses(
  gameId: GameId,
  date: string,
  progress: GameProgress,
): CompletionStatus[] {
  return [1, 2, 3, 4].map((i) =>
    completionStatus(progress[levelKey(date, i)], getLevelParMoves(gameId, date, i)),
  )
}


export function ArchiveAccordion({ gameId, dates, progress, focusDate }: Props) {
  const grouped = groupByMonth(dates)
  const months = Array.from(grouped.keys()).sort().reverse()
  // Si une focusDate est fournie ET que sa date est dans les archives, on
  // ouvre directement le mois correspondant. Sinon on retombe sur le mois
  // le plus récent.
  const focusMonth = focusDate ? monthKey(focusDate) : null
  const initialOpen =
    focusMonth && months.includes(focusMonth) ? focusMonth : (months[0] ?? null)
  const [openMonth, setOpenMonth] = useState<string | null>(initialOpen)

  // Scroll vers la ligne après le premier rendu (le mois est déjà ouvert).
  const focusRowRef = useRef<HTMLLIElement | null>(null)
  useEffect(() => {
    if (focusDate && focusRowRef.current) {
      focusRowRef.current.scrollIntoView({ behavior: 'auto', block: 'center' })
    }
  }, [focusDate])

  if (dates.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Aucun défi archivé pour le moment.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {months.map((month) => {
        const isOpen = openMonth === month
        const monthDates = (grouped.get(month) ?? []).slice().sort().reverse()
        const monthAggregate = aggregateCompletion(
          monthDates.flatMap((d) => dayStatuses(gameId, d, progress)),
        )
        return (
          <div
            key={month}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white/70 backdrop-blur dark:border-gray-800 dark:bg-gray-900/60"
          >
            <button
              type="button"
              onClick={() => setOpenMonth(isOpen ? null : month)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <span className="flex items-center gap-2 font-display text-base font-semibold capitalize">
                {monthLabel(month)}
                {monthAggregate !== 'unsolved' && (
                  <CheckMark
                    size="sm"
                    variant={monthAggregate === 'perfect' ? 'perfect' : 'solved'}
                  />
                )}
              </span>
              <span className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {monthDates.length} jour{monthDates.length > 1 ? 's' : ''}
                </span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
              </span>
            </button>
            {isOpen && (
              <ul className="divide-y divide-gray-200 border-t border-gray-200 bg-gray-50/40 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-950/40">
                {monthDates.map((date) => (
                  <ArchiveDayRow
                    key={date}
                    gameId={gameId}
                    date={date}
                    progress={progress}
                    rowRef={date === focusDate ? focusRowRef : null}
                  />
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

type DayRowProps = {
  gameId: GameId
  date: string
  progress: GameProgress
  rowRef?: React.RefObject<HTMLLIElement | null> | null
}

function ArchiveDayRow({ gameId, date, progress, rowRef }: DayRowProps) {
  const statuses = dayStatuses(gameId, date, progress)
  const aggregate = aggregateCompletion(statuses)
  return (
    <li
      ref={rowRef ?? undefined}
      className="flex items-center gap-3 px-4 py-3 sm:gap-4"
    >
      <div className="flex w-20 shrink-0 items-center gap-1.5 sm:w-24">
        <span className="font-mono text-sm capitalize text-gray-700 dark:text-gray-200">
          {dateLabelShort(date)}
        </span>
        {aggregate !== 'unsolved' && (
          <CheckMark size="sm" variant={aggregate === 'perfect' ? 'perfect' : 'solved'} />
        )}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => {
          const size = GAME_SIZE[gameId](i)
          return (
            <LevelTile
              key={i}
              gameId={gameId}
              date={date}
              index={i}
              width={size.width}
              height={size.height}
              locked={false}
              status={statuses[i - 1]}
              variant="archive"
            />
          )
        })}
      </div>
    </li>
  )
}
