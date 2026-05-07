import { ArchiveAccordion } from './ArchiveAccordion'
import { GameLayout } from './GameLayout'
import { CheckMark, LevelTile } from './LevelTile'
import { dateLabel, todayString } from '~/lib/dates'
import { useLocalProgress, levelKey } from '~/lib/useLocalProgress'

type GameId = 'sokomot' | 'boucle' | 'semantogramme'

type Props = {
  gameId: GameId
  title: string
  tagline: string
  description: string
  dates: string[]
}

const SIZE_FORMULA: Record<GameId, (index: number) => { width: number; height: number }> = {
  sokomot: (i) => ({ width: 6 + i, height: 5 + i }),
  boucle: (i) => ({ width: 3 + i, height: 3 + i }),
  semantogramme: (i) => ({ width: 3 + i, height: 3 + i }),
}

export function ChallengeListPage({
  gameId,
  title,
  tagline,
  description,
  dates,
}: Props) {
  const sortedDates = dates.slice().sort()
  const lastAvailable = sortedDates[sortedDates.length - 1]
  const today = todayString(lastAvailable)
  const todayIsAvailable = sortedDates.includes(today)
  const dailyDate = todayIsAvailable ? today : lastAvailable
  const archiveDates = sortedDates.filter((d) => d !== dailyDate)

  const progress = useLocalProgress(gameId)

  const dailyAllCompleted =
    !!dailyDate && [1, 2, 3, 4].every((i) => progress[levelKey(dailyDate, i)]?.completed)

  return (
    <GameLayout title={title} subtitle={tagline}>
      <p className="mb-8 max-w-2xl text-gray-600 dark:text-gray-300">{description}</p>

      {dailyDate && (
        <section className="mb-12">
          <header className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
              Défi du jour
              {dailyAllCompleted && <CheckMark size="md" />}
            </h2>
            <span className="text-sm capitalize text-gray-500 dark:text-gray-400">
              {dateLabel(dailyDate)}
            </span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => {
              const size = SIZE_FORMULA[gameId](i)
              const completed = !!progress[levelKey(dailyDate, i)]?.completed
              const previousCompleted =
                i === 1 || !!progress[levelKey(dailyDate, i - 1)]?.completed
              const locked = !previousCompleted
              const iceMode = gameId === 'sokomot' && (i === 2 || i === 4)
              return (
                <LevelTile
                  key={i}
                  gameId={gameId}
                  date={dailyDate}
                  index={i}
                  width={size.width}
                  height={size.height}
                  locked={locked}
                  completed={completed}
                  variant="daily"
                  iceMode={iceMode}
                />
              )
            })}
          </div>
        </section>
      )}

      <section>
        <header className="mb-4">
          <h2 className="font-display text-xl font-bold tracking-tight">Archives</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tous les défis précédents : pioche ce que tu veux.
          </p>
        </header>
        <ArchiveAccordion gameId={gameId} dates={archiveDates} progress={progress} />
      </section>
    </GameLayout>
  )
}
