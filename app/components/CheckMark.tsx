import { CheckIcon } from './icons'

type Size = 'sm' | 'md' | 'lg'
export type CheckVariant = 'perfect' | 'solved'

const WRAP: Record<Size, string> = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
}

const INNER: Record<Size, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
}

const VARIANT_BG: Record<CheckVariant, string> = {
  perfect: 'bg-emerald-500',
  solved: 'bg-amber-500',
}

/**
 * Pastille colorée avec coche, en trois tailles et deux variantes :
 * - `perfect` (vert) : niveau résolu en respectant l'objectif de coups
 * - `solved` (ambre) : niveau résolu mais au-dessus de l'objectif
 */
export function CheckMark({
  size = 'sm',
  variant = 'perfect',
}: {
  size?: Size
  variant?: CheckVariant
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
