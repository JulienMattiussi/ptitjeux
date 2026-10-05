import type { GuardType } from './types'

/** Nom de chaque type de vigile, commun au sélecteur et à la réserve. */
export const GUARD_LABEL: Record<GuardType, string> = {
  simple: 'Simple',
  angle: 'En angle',
  oppose: 'Opposé',
}
