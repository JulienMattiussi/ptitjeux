/**
 * Parsing du dump plain-text renvoyé par l'API MediaWiki `query+extracts`
 * du Wiktionnaire francophone, pour en extraire **la première définition utile
 * en français**.
 *
 * Indépendant de React : pure fonction, donc testable hors DOM.
 */

const MAX_LENGTH = 280

/**
 * Priorité d'extraction : on préfère le nom commun ; à défaut on accepte
 * verbe, adjectif, forme conjuguée, etc. Les noms propres vivent sur les
 * pages capitalisées du Wiktionnaire (qu'on n'interroge pas).
 */
const SECTION_PRIORITY: readonly RegExp[] = [
  /^===\s*Nom\s+commun/,
  /^===\s*(Adjectif|Verbe|Adverbe|Forme|Pronom|Interjection|Locution|Préposition|Conjonction|Article|Déterminant|Onomatopée|Numéral|Symbole)/,
] as const

/**
 * Lit la réponse brute de `action=query&prop=extracts` et renvoie le texte
 * de la première page non manquante. `null` si la page n'existe pas.
 */
export function extractPageText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const query = (data as Record<string, unknown>).query
  if (!query || typeof query !== 'object') return null
  const pages = (query as Record<string, unknown>).pages
  if (!pages || typeof pages !== 'object') return null
  for (const page of Object.values(pages)) {
    if (!page || typeof page !== 'object') continue
    const p = page as Record<string, unknown>
    if (p.missing !== undefined) return null
    const extract = p.extract
    if (typeof extract === 'string' && extract.trim()) return extract
  }
  return null
}

/**
 * Extrait la première définition française utile, en testant les patterns
 * de section dans l'ordre de priorité. Renvoie `null` si rien d'exploitable.
 */
export function parseFrenchDefinition(raw: string): string | null {
  for (const sectionPattern of SECTION_PRIORITY) {
    const result = findDefinitionInSection(raw, sectionPattern)
    if (result) return shortenToSentence(result, MAX_LENGTH)
  }
  return null
}

function findDefinitionInSection(raw: string, sectionPattern: RegExp): string | null {
  const frIdx = raw.indexOf('== Français ==')
  if (frIdx < 0) return null
  const frSection = raw.slice(frIdx + '== Français =='.length)
  const lines = frSection.split('\n')

  let inSection = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('== ')) break // changement de langue → on s'arrête
    if (trimmed.startsWith('===')) {
      inSection = sectionPattern.test(trimmed)
      continue
    }
    if (!inSection || !trimmed) continue
    if (/\\/.test(trimmed)) continue // ligne d'inflection / prononciation (\pron\)
    if (trimmed.length < 6) continue
    return trimmed
  }
  return null
}

/**
 * Tronque à la première phrase complète sous `max` caractères ; si aucune
 * frontière de phrase ne rentre, coupe et ajoute « … ».
 */
export function shortenToSentence(s: string, max: number = MAX_LENGTH): string {
  if (s.length <= max) return s
  const slice = s.slice(0, max)
  const lastPunct = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
  )
  if (lastPunct > max / 2) return slice.slice(0, lastPunct + 1)
  return slice.slice(0, max - 1).trimEnd() + '…'
}
