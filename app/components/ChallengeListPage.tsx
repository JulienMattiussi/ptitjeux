import { useNavigate, useSearchParams } from 'react-router'
import { ArchiveAccordion } from './ArchiveAccordion'
import { CheckMark } from './CheckMark'
import { GameLayout } from './GameLayout'
import { LevelTile } from './LevelTile'
import { LEVEL_INDICES } from '~/games/types'
import { aggregateCompletion, dayStatuses } from '~/lib/completion'
import { dateLabel, dateRange, shouldShowFutureDates, todayString } from '~/lib/dates'
import type { GameId } from '~/lib/game-styles'
import { findGame } from '~/lib/games-registry'
import type { CalendarRange } from '~/lib/levelRoute'
import { useGridNavigation } from '~/lib/useGridNavigation'
import { useLocalProgress } from '~/lib/useLocalProgress'

/** Page « liste des niveaux » d'un jeu : défi du jour, puis archives par mois. */
export function ChallengeListPage({
  gameId,
  firstDate,
  lastDate,
}: { gameId: GameId } & CalendarRange) {
  const { name, tagline, description } = findGame(gameId)
  const allSorted = firstDate && lastDate ? dateRange(firstDate, lastDate) : []
  // Sans le flag dev `VITE_SHOW_FUTURE_DAYS=1`, on masque les défis dont la
  // date est postérieure à aujourd'hui pour ne pas spoiler le contenu non
  // encore publié. On calcule « aujourd'hui » sans `lastAvailableDate` ici :
  // sinon, avec `VITE_FREEZE_TODAY=last-available`, le freeze sauterait à la
  // dernière date du dataset et tout serait considéré comme déjà publié.
  const showFuture = shouldShowFutureDates()
  const realToday = todayString()
  const sortedDates = showFuture ? allSorted : allSorted.filter((d) => d <= realToday)
  const lastAvailable = sortedDates[sortedDates.length - 1]
  const today = todayString(lastAvailable)
  const todayIsAvailable = sortedDates.includes(today)
  const dailyDate = todayIsAvailable ? today : lastAvailable
  const archiveDates = sortedDates.filter((d) => d !== dailyDate)

  const progress = useLocalProgress(gameId)

  // Quand on revient d'un niveau via `?from=YYYY-MM-DD`, on demande à
  // l'accordéon d'ouvrir le mois correspondant et de scroller jusqu'à la ligne.
  const [searchParams] = useSearchParams()
  const fromDate = searchParams.get('from') ?? undefined
  // Si la date d'origine est la date du défi du jour, pas besoin d'ouvrir
  // les archives : la ligne est déjà visible en haut.
  const focusArchiveDate = fromDate && fromDate !== dailyDate ? fromDate : undefined

  // Au clavier, la première flèche se pose sur le jour d'où l'on revient, ou
  // sur le défi du jour ; Retour arrière / Échap ramène à l'accueil.
  const navigate = useNavigate()
  useGridNavigation({
    onBack: () => navigate('/'),
    initialFocus: () =>
      document.querySelector<HTMLElement>(`[data-nav-item][data-date="${fromDate ?? dailyDate}"]`),
  })

  const dailyStatuses = dailyDate ? dayStatuses(dailyDate, progress) : []
  const dailyAggregate = aggregateCompletion(dailyStatuses)

  return (
    <GameLayout title={name} subtitle={tagline}>
      <p className="mb-8 max-w-2xl text-gray-600 dark:text-gray-300">{description}</p>

      {dailyDate && (
        <section className="mb-12">
          <header className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
              Défi du jour
              {dailyAggregate !== 'unsolved' && <CheckMark size="md" variant={dailyAggregate} />}
            </h2>
            <span className="text-sm capitalize text-gray-500 dark:text-gray-400">
              {dateLabel(dailyDate)}
            </span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LEVEL_INDICES.map((i) => (
              <LevelTile
                key={i}
                gameId={gameId}
                date={dailyDate}
                index={i}
                locked={i > 1 && dailyStatuses[i - 2] === 'unsolved'}
                status={dailyStatuses[i - 1]}
                variant="daily"
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <header className="mb-4">
          <h2 className="font-display text-xl font-bold tracking-tight">Archives</h2>
        </header>
        <ArchiveAccordion
          gameId={gameId}
          dates={archiveDates}
          progress={progress}
          focusDate={focusArchiveDate}
        />
      </section>
    </GameLayout>
  )
}
