/**
 * Règles de variété des grilles Sémantogramme, partagées par le générateur
 * et les tests d'intégrité.
 */
import { stripAccents } from '~/lib/text'

/** Forme de comparaison : sans accents, en minuscules. */
export function normalizeWord(word: string): string {
  return stripAccents(word).toLowerCase()
}

/**
 * Heuristique « même famille » : un long début commun (jardin / jardinier,
 * sombre / sombrer, magie / magique). Volontairement large : elle signale
 * aussi quelques paires sans lien (couler / couleur), qu'il est sans
 * conséquence d'éviter.
 */
export function sameFamily(a: string, b: string): boolean {
  const x = normalizeWord(a)
  const y = normalizeWord(b)
  if (x === y) return true
  let n = 0
  while (n < x.length && n < y.length && x[n] === y[n]) n++
  return n >= 5 || (n >= 4 && n >= Math.min(x.length, y.length) - 1)
}

/** Paires de mots de la même famille dans une liste. */
export function familyPairs(words: readonly string[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      if (sameFamily(words[i], words[j])) pairs.push([words[i], words[j]])
    }
  }
  return pairs
}
