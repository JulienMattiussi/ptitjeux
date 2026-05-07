import { ArchiveAccordion } from './ArchiveAccordion'
import { CheckMark } from './CheckMark'
import { GameLayout } from './GameLayout'
import { LevelTile } from './LevelTile'
import { getLevelParMoves } from '~/games'
import { completionStatus } from '~/lib/completion'
import { dateLabel, todayString } from '~/lib/dates'
import { GAME_SIZE, isIceLevel, type GameId } from '~/lib/game-styles'
import { useLocalProgress, levelKey } from '~/lib/useLocalProgress'

type Props = {
  gameId: GameId
  title: string
  tagline: string
  description: string
  dates: string[]
}

export function ChallengeListPage({ gameId, title, tagline, description, dates }: Props) {
  const sortedDates = dates.slice().sort()
  const lastAvailable = sortedDates[sortedDates.length - 1]
  const today = todayString(lastAvailable)
  const todayIsAvailable = sortedDates.includes(today)
  const dailyDate = todayIsAvailable ? today : lastAvailable
  const archiveDates = sortedDates.filter((d) => d !== dailyDate)

  const progress = useLocalProgress(gameId)

  const dailyAllPerfect =
    !!dailyDate &&
    [1, 2, 3, 4].every(
      (i) =>
        completionStatus(
          progress[levelKey(dailyDate, i)],
          getLevelParMoves(gameId, dailyDate, i),
        ) === 'perfect',
    )
  const dailyAllSolved =
    !!dailyDate &&
    [1, 2, 3, 4].every(
      (i) =>
        completionStatus(
          progress[levelKey(dailyDate, i)],
          getLevelParMoves(gameId, dailyDate, i),
        ) !== 'unsolved',
    )

  const dailyHeaderCheck = dailyAllPerfect ? 'perfect' : dailyAllSolved ? 'solved' : null

  return (
    <GameLayout title={title} subtitle={tagline}>
      <p className="mb-8 max-w-2xl text-gray-600 dark:text-gray-300">{description}</p>

      {dailyDate && (
        <section className="mb-12">
          <header className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
              Défi du jour
              {dailyHeaderCheck && <CheckMark size="md" variant={dailyHeaderCheck} />}
            </h2>
            <span className="text-sm capitalize text-gray-500 dark:text-gray-400">
              {dateLabel(dailyDate)}
            </span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => {
              const size = GAME_SIZE[gameId](i)
              const status = completionStatus(
                progress[levelKey(dailyDate, i)],
                getLevelParMoves(gameId, dailyDate, i),
              )
              const previousStatus =
                i === 1
                  ? 'solved'
                  : completionStatus(
                      progress[levelKey(dailyDate, i - 1)],
                      getLevelParMoves(gameId, dailyDate, i - 1),
                    )
              const locked = previousStatus === 'unsolved'
              return (
                <LevelTile
                  key={i}
                  gameId={gameId}
                  date={dailyDate}
                  index={i}
                  width={size.width}
                  height={size.height}
                  locked={locked}
                  status={status}
                  variant="daily"
                  iceMode={isIceLevel(gameId, i)}
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
