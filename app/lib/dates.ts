/**
 * Format ISO `YYYY-MM-DD`. Les dates des défis sont toujours dans ce format.
 */
export type DateString = string

const PAD = (n: number) => n.toString().padStart(2, '0')

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

const DAYS_FR_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

export function formatDate(d: Date): DateString {
  return `${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())}`
}

export function parseDate(s: DateString): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Renvoie la date d'aujourd'hui pour le visiteur, au format `YYYY-MM-DD`.
 *
 * En mode développement, on peut figer la « date du jour » à la date du dernier
 * niveau disponible : utile pour tester l'expérience sans avoir à attendre.
 *
 * Active le mode en posant `VITE_FREEZE_TODAY=last-available` dans `.env`.
 * `lastAvailableDate` est alors utilisé comme date du jour.
 */
export function todayString(lastAvailableDate?: DateString): DateString {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_FREEZE_TODAY === 'last-available' &&
    lastAvailableDate
  ) {
    return lastAvailableDate
  }
  return formatDate(new Date())
}

/**
 * Flag dev : si vrai, l'archive affiche aussi les défis dont la date est
 * dans le futur (mois à venir). Sinon on les masque pour ne pas spoiler le
 * contenu non encore publié.
 *
 * Active le mode en posant `VITE_SHOW_FUTURE_DAYS=1` dans `.env`.
 */
export function shouldShowFutureDates(): boolean {
  return (
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOW_FUTURE_DAYS === '1'
  )
}

/** Compare deux dates ISO comme des chaînes — l'ordre lexicographique correspond à l'ordre chronologique. */
export function compareDates(a: DateString, b: DateString): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Mois clé pour grouper : `YYYY-MM`. */
export function monthKey(date: DateString): string {
  return date.slice(0, 7)
}

/** Étiquette française d'un mois `YYYY-MM`. */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS_FR[m - 1]} ${y}`
}

/** Étiquette française courte d'une date complète. Ex. « 7 mai 2026 ». */
export function dateLabel(date: DateString): string {
  const d = parseDate(date)
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`
}

/** Étiquette compacte « ven. 07 ». */
export function dateLabelShort(date: DateString): string {
  const d = parseDate(date)
  return `${DAYS_FR_SHORT[d.getDay()]} ${PAD(d.getDate())}`
}

/** Énumère les dates inclusives entre `start` et `end`. */
export function dateRange(start: DateString, end: DateString): DateString[] {
  const result: DateString[] = []
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  for (
    let d = new Date(startDate);
    d.getTime() <= endDate.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    result.push(formatDate(d))
  }
  return result
}
