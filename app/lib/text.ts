/** Retire les accents (é → e, ç → c) sans toucher à la casse. */
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/** « 1 coup », « 3 coups » : nombre suivi du mot, au pluriel régulier au-delà de 1. */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`
}
