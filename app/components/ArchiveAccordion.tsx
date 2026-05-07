import { useState } from 'react'
import { CheckMark, LevelTile } from './LevelTile'
import { dateLabelShort, monthKey, monthLabel } from '~/lib/dates'
import type { GameProgress } from '~/lib/localStorage'
import { levelKey } from '~/lib/useLocalProgress'

type GameId = 'sokomot' | 'boucle' | 'semantogramme'

type Props = {
  gameId: GameId
  dates: string[]
  progress: GameProgress
}

const SIZE_FORMULA: Record<GameId, (i: number) => { width: number; height: number }> = {
  sokomot: (i) => ({ width: 6 + i, height: 5 + i }),
  boucle: (i) => ({ width: 3 + i, height: 3 + i }),
  semantogramme: (i) => ({ width: 3 + i, height: 3 + i }),
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

function isDateFullyDone(progress: GameProgress, date: string): boolean {
  return [1, 2, 3, 4].every((i) => progress[levelKey(date, i)]?.completed)
}

export function ArchiveAccordion({ gameId, dates, progress }: Props) {
  const grouped = groupByMonth(dates)
  const months = Array.from(grouped.keys()).sort().reverse()
  const [openMonth, setOpenMonth] = useState<string | null>(months[0] ?? null)

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
        const monthFullyDone = monthDates.every((d) => isDateFullyDone(progress, d))
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
                {monthFullyDone && <CheckMark size="sm" />}
              </span>
              <span className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {monthDates.length} jour{monthDates.length > 1 ? 's' : ''}
                </span>
                <svg
                  viewBox="0 0 16 16"
                  className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M 5 3 L 11 8 L 5 13" />
                </svg>
              </span>
            </button>
            {isOpen && (
              <ul className="divide-y divide-gray-200 border-t border-gray-200 bg-gray-50/40 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-950/40">
                {monthDates.map((date) => {
                  const dateFullyDone = isDateFullyDone(progress, date)
                  return (
                    <li
                      key={date}
                      className="flex items-center gap-3 px-4 py-3 sm:gap-4"
                    >
                      <div className="flex w-20 shrink-0 items-center gap-1.5 sm:w-24">
                        <span className="font-mono text-sm capitalize text-gray-700 dark:text-gray-200">
                          {dateLabelShort(date)}
                        </span>
                        {dateFullyDone && <CheckMark size="sm" />}
                      </div>
                      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => {
                          const size = SIZE_FORMULA[gameId](i)
                          const iceMode = gameId === 'sokomot' && (i === 2 || i === 4)
                          return (
                            <LevelTile
                              key={i}
                              gameId={gameId}
                              date={date}
                              index={i}
                              width={size.width}
                              height={size.height}
                              locked={false}
                              completed={!!progress[levelKey(date, i)]?.completed}
                              variant="archive"
                              iceMode={iceMode}
                            />
                          )
                        })}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
