import { Link } from 'react-router'
import type { ReactNode } from 'react'

type Props = {
  show: boolean
  title: string
  detail?: ReactNode
  onReset: () => void
  backHref: string
  backLabel?: string
}

/**
 * Overlay de victoire commun. Couvre intégralement la `GameFrame` parente
 * (qui doit être en `position: relative`) avec un voile flou et une carte
 * centrée. Bloque les interactions sous-jacentes ; les seuls choix possibles
 * sont « Rejouer » ou retourner à la liste des niveaux.
 */
export function VictoryOverlay({
  show,
  title,
  detail,
  onReset,
  backHref,
  backLabel = '← Niveaux',
}: Props) {
  if (!show) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
      className="animate-fade-in-up absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-white/70 p-4 backdrop-blur-sm dark:bg-gray-950/70"
    >
      {/* Étincelles décoratives autour de la carte */}
      <span
        className="animate-float pointer-events-none absolute left-[18%] top-[14%] text-3xl"
        aria-hidden="true"
      >
        ✨
      </span>
      <span
        className="animate-float pointer-events-none absolute right-[16%] top-[20%] text-2xl"
        style={{ animationDelay: '0.5s' }}
        aria-hidden="true"
      >
        🌟
      </span>
      <span
        className="animate-float pointer-events-none absolute bottom-[18%] right-[22%] text-2xl"
        style={{ animationDelay: '1s' }}
        aria-hidden="true"
      >
        💫
      </span>

      <div className="animate-pop relative w-full max-w-md rounded-3xl border border-emerald-300 bg-linear-to-br from-white via-emerald-50 to-teal-50 p-8 text-center shadow-2xl shadow-emerald-400/30 dark:border-emerald-700 dark:from-gray-900 dark:via-emerald-950 dark:to-teal-950 dark:shadow-emerald-900/40">
        <div className="text-6xl drop-shadow-md" aria-hidden="true">
          🎉
        </div>
        <h2
          id="victory-title"
          className="mt-3 font-display text-3xl font-bold tracking-tight text-emerald-800 dark:text-emerald-100"
        >
          {title}
        </h2>
        {detail && (
          <div className="mt-2 text-base text-emerald-700 dark:text-emerald-300">
            {detail}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onReset}
            autoFocus
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-lg dark:shadow-emerald-900/40"
          >
            Rejouer
          </button>
          <Link
            to={backHref}
            className="rounded-lg border border-emerald-300 bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-gray-900 dark:text-emerald-200 dark:hover:bg-gray-800"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
