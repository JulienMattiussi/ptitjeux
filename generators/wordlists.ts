/**
 * Filtre le dictionnaire français brut (`words-fr-raw.json`, ~336 k entrées)
 * pour produire des listes par longueur, prêtes à être consommées par les
 * générateurs Sokomot et Boucle.
 *
 * Chaque mot est conservé sous deux formes :
 * - `display` : majuscules ASCII sans accents, utilisé pour l'affichage sur
 *   les blocs Sokomot et la grille Boucle (qui ne supportent que A-Z).
 * - `canonical` : forme originale du dictionnaire (minuscules, accents
 *   conservés). Utilisé pour la recherche sur le Wiktionnaire qui est
 *   sensible aux accents (`âtre` ≠ `atre`).
 *
 * Build-time uniquement : ce module n'est jamais importé par le runtime de
 * l'application (les niveaux sont précalculés en JSON statique).
 */
import rawWords from './words-fr-raw.json'

export type WordEntry = {
  display: string
  canonical: string
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function buildLists(): Record<number, readonly WordEntry[]> {
  const seen = new Set<string>()
  const byLen: Record<number, WordEntry[]> = { 3: [], 4: [], 5: [], 6: [], 7: [] }
  for (const word of rawWords as readonly string[]) {
    const ascii = stripDiacritics(word).toUpperCase()
    if (!/^[A-Z]+$/.test(ascii)) continue
    const len = ascii.length
    if (len < 3 || len > 7) continue
    if (seen.has(ascii)) continue
    seen.add(ascii)
    byLen[len].push({ display: ascii, canonical: word })
  }
  return byLen
}

export const WORDS_BY_LENGTH: Record<number, readonly WordEntry[]> = buildLists()
