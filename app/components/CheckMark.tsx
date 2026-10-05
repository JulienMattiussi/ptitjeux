import type { SolvedStatus } from '~/lib/completion'
import { CheckIcon } from './icons'

type Size = 'sm' | 'md'

const WRAP: Record<Size, string> = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
}

const INNER: Record<Size, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
}

const VARIANT_BG: Record<SolvedStatus, string> = {
  perfect: 'bg-emerald-500',
  solved: 'bg-amber-500',
}

/**
 * Pastille colorée avec coche, en deux tailles et deux variantes :
 * - `perfect` (vert) : niveau résolu en respectant l'objectif de coups
 * - `solved` (ambre) : niveau résolu mais au-dessus de l'objectif
 */
export function CheckMark({
  size = 'sm',
  variant = 'perfect',
}: {
  size?: Size
  variant?: SolvedStatus
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-sm ${WRAP[size]} ${VARIANT_BG[variant]}`}
      aria-hidden="true"
    >
      <CheckIcon className={INNER[size]} />
    </span>
  )
}
