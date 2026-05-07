import { GameLayout } from '~/components/GameLayout'
import { LevelCard } from '~/components/LevelCard'
import { findGame } from '~/lib/games-registry'
import { levels } from '~/games/boucle/levels'

export default function BoucleIndex() {
  const game = findGame('boucle')!
  return (
    <GameLayout title={game.name} subtitle={game.tagline}>
      <p className="mb-8 max-w-2xl text-gray-600 dark:text-gray-300">{game.description}</p>
      <ul className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level, index) => (
          <li key={level.id} className="animate-fade-in-up">
            <LevelCard
              to={`/boucle/${level.id}`}
              index={index + 1}
              name={level.name}
              meta={`${level.width} × ${level.height} · ${level.solutionWord.length} lettres`}
              accent="boucle"
            />
          </li>
        ))}
      </ul>
    </GameLayout>
  )
}
