import type { ReactNode } from 'react'
import { EyeIcon } from './icons'
import { OutlineButton } from './OutlineButton'
import type { Solution } from '~/lib/useSolution'

type Props = {
  solution: Solution
  /** Réponse affichée avec la solution (mot, définition). */
  children?: ReactNode
}

/** Bouton « Voir la solution » d'un jour passé, puis la réponse et le retour à la partie. */
export function SolutionCard({ solution, children }: Props) {
  if (!solution.available) return null
  if (!solution.shown) {
    return (
      <OutlineButton
        onClick={solution.toggle}
        className="flex items-center justify-center gap-2 whitespace-nowrap"
      >
        <EyeIcon />
        Voir la solution
      </OutlineButton>
    )
  }
  return (
    <div className="animate-pop rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/60">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-sky-900 dark:text-sky-200">
        <EyeIcon />
        Solution
      </div>
      {children && <div className="text-sm text-gray-700 dark:text-gray-200">{children}</div>}
      <OutlineButton onClick={solution.toggle} className="mt-3 w-full whitespace-nowrap">
        Revenir à ma partie
      </OutlineButton>
    </div>
  )
}
