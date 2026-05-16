import { GameCard } from '~/components/GameCard'
import { games } from '~/lib/games-registry'
import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Ptitjeux — mini-jeux logico-spatiaux' },
    {
      name: 'description',
      content: 'Mini-jeux logico-spatiaux : Sokomot, Boucle, Sémantogramme.',
    },
  ]
}

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <header className="animate-fade-in-up mb-10 flex flex-col items-center gap-8 text-center sm:flex-row sm:items-center sm:gap-10 sm:text-left">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-4 rounded-3xl bg-linear-to-br from-fuchsia-300/40 via-amber-200/30 to-emerald-300/40 blur-2xl dark:from-fuchsia-700/40 dark:via-amber-700/30 dark:to-emerald-700/40"
              aria-hidden="true"
            />
            <img
              src="/cerveau.jpeg"
              alt=""
              aria-hidden="true"
              className="animate-float relative h-32 w-32 rounded-3xl shadow-xl shadow-fuchsia-500/10 ring-1 ring-white/40 sm:h-40 sm:w-40 dark:shadow-fuchsia-900/30 dark:ring-white/10"
            />
          </div>
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400">
              mini-jeux cérébraux
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
              P'tit
              <span className="bg-linear-to-r from-fuchsia-600 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                jeux
              </span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Des casse-tête logico-spatiaux à explorer. Aucun compte requis, ta progression
              reste sur ton appareil.
            </p>
          </div>
        </header>

        <div className="stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </main>
  )
}
