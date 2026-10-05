import type { ReactNode } from 'react'
import type { Hint } from '~/lib/useHint'

type Props = {
  hint: Hint
  /** Libellé de l'aide révélée (« Mot à encercler »). */
  label: string
  /** Valeur révélée, en gras sous le libellé : une valeur longue garde sa ligne. */
  children?: ReactNode
}

/** Bouton « Coincé ? », à côté du compteur de coups (prop `hint` de `MovesCard`). */
export function HintButton({ hint, label, children }: Props) {
  if (!hint.available) return null
  if (hint.revealed) {
    return (
      <div className="animate-pop max-w-40 text-right text-xs text-gray-600 dark:text-gray-300">
        <div>{label}</div>
        {children && <div className="font-bold break-words">{children}</div>}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={hint.reveal}
      className="animate-pop max-w-32 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
    >
      Coincé ? Un peu d'aide ?
    </button>
  )
}
