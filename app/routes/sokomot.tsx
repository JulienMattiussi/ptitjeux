import { GameLayout } from '~/components/GameLayout'
import { LevelCard } from '~/components/LevelCard'
import { findGame } from '~/lib/games-registry'
import { levels } from '~/games/sokomot/levels'

export default function SokomotIndex() {
  const game = findGame('sokomot')!
  return (
    <GameLayout title={game.name} subtitle={game.tagline}>
      <p className="mb-8 max-w-2xl text-gray-600 dark:text-gray-300">{game.description}</p>
      <ul className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level, index) => (
          <li key={level.id} className="animate-fade-in-up">
            <LevelCard
              to={`/sokomot/${level.id}`}
              index={index + 1}
              name={level.name}
              meta={`${level.width} × ${level.height}${level.ice.length > 0 ? ' · avec glace' : ''}`}
              accent="sokomot"
            />
          </li>
        ))}
      </ul>
    </GameLayout>
  )
}
