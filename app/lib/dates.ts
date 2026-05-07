/**
 * Format ISO `YYYY-MM-DD`. Les dates des défis sont toujours dans ce format.
 */
export type DateString = string

const PAD = (n: number) => n.toString().padStart(2, '0')

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
  const months = [
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
  return `${months[m - 1]} ${y}`
}

/** Étiquette française courte d'une date complète. Ex. « 7 mai 2026 ». */
export function dateLabel(date: DateString): string {
  const d = parseDate(date)
  const months = [
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
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/** Étiquette compacte « ven. 07 ». */
export function dateLabelShort(date: DateString): string {
  const d = parseDate(date)
  const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
  return `${days[d.getDay()]} ${PAD(d.getDate())}`
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
