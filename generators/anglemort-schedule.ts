/**
 * Calendrier Angle mort. Chaque grille de base sert 8 fois (ses 8 symétries) :
 * le jour n°t du calendrier utilise la base `t mod BASES` dans la version
 * `⌊t / BASES⌋`. Deux usages d'une même base sont espacés de `BASES` jours
 * (50), donc jamais dans le même mois.
 */
import { readFileSync } from 'node:fs'
import type { Level } from '~/games/anglemort/types'
import type { LevelIndex } from '~/games/types'
import { daysBetween } from '~/lib/dates'
import type { Variant } from './anglemort-symmetry'
import { CALENDAR_START, challengeFile } from './calendar'

/**
 * Longueur du cycle (du 2026-09-01 au 2027-09-30) et nombre de bases
 * (⌈395 / 8⌉), figés : les déduire de `CALENDAR_END` ferait, à chaque
 * prolongation du calendrier, changer la base et la symétrie de chaque date,
 * donc tous les niveaux publiés, et décalerait les `FIXED_BASES`.
 */
export const SCHEDULE_DAYS = 395
export const BASES = 50

export function levelOrigin(date: string): { base: number; variant: Variant } {
  const day = daysBetween(CALENDAR_START, date)
  const t = ((day % SCHEDULE_DAYS) + SCHEDULE_DAYS) % SCHEDULE_DAYS
  return { base: t % BASES, variant: Math.floor(t / BASES) as Variant }
}

/**
 * Grilles de base écrites une fois pour toutes, jamais régénérées : chaque
 * niveau publié est la version d'origine (variante 0) de sa base, relu au
 * lieu d'être recalculé. Clé `niveau-base`, valeur : date du niveau publié.
 * - base 33 : la grille d'essai du niveau 4, validée par Julien ;
 * - bases 1, 9, 11, 27, 48 : gardées telles qu'avant le plafond de piliers
 *   (`maxPillars`), qui décalait leur tirage sans les concerner.
 */
const FIXED_BASES: Record<string, string> = {
  '4-1': '2026-09-02',
  '4-9': '2026-09-10',
  '4-11': '2026-09-12',
  '4-27': '2026-09-28',
  '4-33': '2026-10-04',
  '4-48': '2026-10-19',
}

/** Vrai si ce niveau publié porte une grille de base fixée : à ne jamais supprimer. */
export function isFixedBaseLevel(date: string, index: LevelIndex): boolean {
  return FIXED_BASES[`${index}-${levelOrigin(date).base}`] === date
}

export function loadFixedBase(file: string, base: number): Level {
  const level = JSON.parse(readFileSync(file, 'utf-8')) as Level
  const origin = levelOrigin(level.id.slice(0, 10))
  if (origin.base !== base || origin.variant !== 0) {
    throw new Error(`Angle mort : ${level.id} n'est pas la version d'origine de la base ${base}`)
  }
  return level
}

/** Grille de base fixée du niveau, ou `null` si elle se génère. */
export function fixedBase(index: LevelIndex, base: number): Level | null {
  const date = FIXED_BASES[`${index}-${base}`]
  return date ? loadFixedBase(challengeFile('anglemort', date, index), base) : null
}
