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
 * Le défi change à minuit, heure de Paris, pour tout le monde : le serveur
 * (souvent en UTC) et le navigateur calculent ainsi le même jour, sans quoi
 * le rendu serveur et l'hydratation divergeraient la nuit.
 */
const PARIS_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' })

/**
 * Date du défi du jour, au format `YYYY-MM-DD`.
 *
 * En mode développement, on peut figer la « date du jour » à la date du dernier
 * niveau disponible : utile pour tester l'expérience sans avoir à attendre.
 *
 * Active le mode en posant `VITE_FREEZE_TODAY=last-available` dans `.env.local`.
 * `lastAvailableDate` est alors utilisé comme date du jour.
 */
export function todayString(lastAvailableDate?: DateString): DateString {
  if (import.meta.env?.VITE_FREEZE_TODAY === 'last-available' && lastAvailableDate) {
    return lastAvailableDate
  }
  return PARIS_DAY.format(new Date())
}

/**
 * Flag dev : si vrai, l'archive affiche aussi les défis dont la date est
 * dans le futur (mois à venir). Sinon on les masque pour ne pas spoiler le
 * contenu non encore publié.
 *
 * Active le mode en posant `VITE_SHOW_FUTURE_DAYS=1` dans `.env.local`.
 */
export function shouldShowFutureDates(): boolean {
  return import.meta.env?.VITE_SHOW_FUTURE_DAYS === '1'
}

/**
 * Les réponses d'un défi sont publiées le lendemain : on ne peut voir la
 * solution que d'un jour passé, jamais celle du défi du jour. Toujours le
 * vrai jour, même avec `VITE_FREEZE_TODAY`, comme la publication des défis.
 */
export function isRevealed(date: DateString): boolean {
  return date < todayString()
}

/** Nombre de jours de `from` à `to` (négatif si `to` précède `from`). */
export function daysBetween(from: DateString, to: DateString): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
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

/** Étiquette française longue d'une date (« 7 mai 2026 »). */
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
  for (let d = new Date(startDate); d.getTime() <= endDate.getTime(); d.setDate(d.getDate() + 1)) {
    result.push(formatDate(d))
  }
  return result
}
