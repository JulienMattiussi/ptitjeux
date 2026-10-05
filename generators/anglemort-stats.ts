/**
 * Instrumentation du générateur Angle mort : statistiques et événements de
 * génération, pour mesurer et régler le générateur. Ne change rien au niveau
 * produit. Module à part pour que les étapes (`anglemort-clues.ts`) les
 * remplissent sans importer le générateur qui les appelle.
 */

/** Étape à laquelle une tentative de génération a échoué. */
type FailureStage = 'path' | 'construct' | 'pillars' | 'diamond' | 'types' | 'mirror' | 'clues'

/** Étapes d'une tentative, dans l'ordre, pour en mesurer la durée. */
export type GenerationStep =
  'path' | 'anchor' | 'cover' | 'pillars' | 'diamond' | 'mirror' | 'seed' | 'unique'

/** Événement de génération, pour suivre en direct où part le temps. */
type GenerationEvent =
  | { type: 'attempt'; attempt: number }
  | { type: 'failure'; stage: FailureStage }
  | { type: 'unique'; ms: number; complete: boolean; rivals: number; clues: number }
  | { type: 'step'; step: GenerationStep; ms: number }
  | { type: 'success'; clues: number; guards: number }

export type GenerationStats = {
  attempts: number
  failures: Record<FailureStage, number>
  constructMs: number
  uniqueMs: number
  uniqueCalls: number
  /** Vérifications d'unicité interrompues faute de budget. */
  uniqueAborted: number
  /** Abonné aux événements de génération (facultatif). */
  onEvent?: (event: GenerationEvent) => void
}

export function emptyStats(): GenerationStats {
  return {
    attempts: 0,
    failures: { path: 0, construct: 0, pillars: 0, diamond: 0, types: 0, mirror: 0, clues: 0 },
    constructMs: 0,
    uniqueMs: 0,
    uniqueCalls: 0,
    uniqueAborted: 0,
  }
}

/** Compte l'échec d'une tentative ; renvoie `null` pour l'abandonner d'un `return`. */
export function fail(stats: GenerationStats, stage: FailureStage): null {
  stats.failures[stage]++
  stats.onEvent?.({ type: 'failure', stage })
  return null
}
