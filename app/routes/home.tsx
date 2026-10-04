import { GameCard } from '~/components/GameCard'
import { games } from '~/lib/games-registry'
import { useGridNavigation } from '~/lib/useGridNavigation'
import { pageMeta, SITE_NAME } from '~/lib/seo'

export function meta() {
  return pageMeta({
    title: `${SITE_NAME} : casse-tête logico-spatiaux du jour`,
    description:
      'Des casse-tête logico-spatiaux à explorer chaque jour : Boucle, Angle mort, Sokomot et Sémantogramme. Gratuit, sans compte.',
    path: '/',
  })
}

export default function Home() {
  useGridNavigation()
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
              Des casse-tête logico-spatiaux à explorer chaque jour
            </p>
          </div>
        </header>

        {/* Flex plutôt que grille : la dernière ligne, si elle est incomplète, reste centrée. */}
        <div className="stagger flex flex-wrap justify-center gap-6 *:w-full sm:*:w-[calc((100%-1.5rem)/2)] lg:*:w-[calc((100%-3rem)/3)]">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </main>
  )
}
