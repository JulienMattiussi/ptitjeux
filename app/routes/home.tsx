import { GameCard } from '~/components/GameCard'
import { games } from '~/lib/games-registry'
import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Secretgame' },
    {
      name: 'description',
      content: 'Mini-jeux logico-spatiaux : Sokomot, Boucle, Sémantogramme.',
    },
  ]
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <header className="mb-10 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Secretgame</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Trois mini-jeux logico-spatiaux à explorer. Chaque jeu propose ses propres niveaux.
            Aucun compte requis, ta progression reste sur ton appareil.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </main>
  )
}
