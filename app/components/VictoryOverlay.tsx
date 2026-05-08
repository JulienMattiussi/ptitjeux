import { Link } from 'react-router'
import type { ReactNode } from 'react'

export type VictoryVariant = 'perfect' | 'solved'

type Props = {
  show: boolean
  title: string
  detail?: ReactNode
  onReset: () => void
  backHref: string
  backLabel?: string
  /**
   * Si défini, affiche un bouton « Niveau suivant → » comme action principale,
   * et reléguer « Rejouer » en action secondaire. Doit pointer vers le niveau
   * suivant (par exemple `/sokomot/2026-05-08/2`).
   */
  nextHref?: string
  /**
   * `perfect` (vert) : objectif de coups atteint.
   * `solved` (ambre) : niveau résolu mais au-dessus de l'objectif.
   */
  variant?: VictoryVariant
}

const STYLES: Record<
  VictoryVariant,
  {
    border: string
    cardBg: string
    shadow: string
    title: string
    detail: string
    primaryBtn: string
    secondaryBtn: string
  }
> = {
  perfect: {
    border: 'border-emerald-300 dark:border-emerald-700',
    cardBg:
      'from-white via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-emerald-950 dark:to-teal-950',
    shadow: 'shadow-emerald-400/30 dark:shadow-emerald-900/40',
    title: 'text-emerald-800 dark:text-emerald-100',
    detail: 'text-emerald-700 dark:text-emerald-300',
    primaryBtn:
      'bg-emerald-600 shadow-emerald-500/30 hover:bg-emerald-500 dark:shadow-emerald-900/40',
    secondaryBtn:
      'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200',
  },
  solved: {
    border: 'border-amber-300 dark:border-amber-700',
    cardBg:
      'from-white via-amber-50 to-orange-50 dark:from-gray-900 dark:via-amber-950 dark:to-orange-950',
    shadow: 'shadow-amber-400/30 dark:shadow-amber-900/40',
    title: 'text-amber-800 dark:text-amber-100',
    detail: 'text-amber-700 dark:text-amber-300',
    primaryBtn:
      'bg-amber-600 shadow-amber-500/30 hover:bg-amber-500 dark:shadow-amber-900/40',
    secondaryBtn:
      'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-200',
  },
}

/**
 * Overlay de victoire commun. Couvre intégralement la `GameFrame` parente
 * (qui doit être en `position: relative`) avec un voile flou et une carte
 * centrée. Bloque les interactions sous-jacentes ; les seuls choix possibles
 * sont « Rejouer » ou retourner à la liste des niveaux.
 *
 * Deux variantes :
 * - `perfect` (vert) : objectif de coups atteint — célébration maximale.
 * - `solved` (ambre) : niveau résolu mais au-dessus de l'objectif —
 *   on félicite plus discrètement.
 */
export function VictoryOverlay({
  show,
  title,
  detail,
  onReset,
  backHref,
  backLabel = '← Niveaux',
  nextHref,
  variant = 'perfect',
}: Props) {
  if (!show) return null
  const s = STYLES[variant]
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
      className="animate-fade-in-up absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-white/70 p-4 backdrop-blur-sm dark:bg-gray-950/70"
    >
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

      <div
        className={`animate-pop relative w-full max-w-md rounded-3xl border bg-linear-to-br p-8 text-center shadow-2xl ${s.border} ${s.cardBg} ${s.shadow}`}
      >
        <div className="text-6xl drop-shadow-md" aria-hidden="true">
          {variant === 'perfect' ? '🎉' : '👍'}
        </div>
        <h2
          id="victory-title"
          className={`mt-3 font-display text-3xl font-bold tracking-tight ${s.title}`}
        >
          {title}
        </h2>
        {detail && <div className={`mt-2 text-base ${s.detail}`}>{detail}</div>}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            to={backHref}
            className={`rounded-lg border bg-white px-6 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-gray-900 ${s.secondaryBtn}`}
          >
            {backLabel}
          </Link>
          <button
            type="button"
            onClick={onReset}
            autoFocus={!nextHref}
            className={
              nextHref
                ? `rounded-lg border bg-white px-6 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-gray-900 ${s.secondaryBtn}`
                : `rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${s.primaryBtn}`
            }
          >
            Rejouer
          </button>
          {nextHref ? (
            <Link
              to={nextHref}
              autoFocus
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${s.primaryBtn}`}
            >
              Suivant →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
