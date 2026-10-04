/**
 * Règles de la curation Sémantogramme (`generators/semantogramme-curation/`).
 *
 * Source unique : le test d'intégrité de la curation, le script de contrôle
 * et l'outil de remplissage appellent tous ces fonctions, pour qu'aucun mot
 * n'entre dans le corpus sans passer les mêmes règles.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { familyPairs, normalizeWord, sameFamily } from './semantogramme-rules'

export type ThemeLevel = '1' | '2' | '3' | '4'
export type ScheduledTheme = { date: string; word: string; category: string }
export type Schedule = Record<ThemeLevel, ScheduledTheme[]>
/** Clé `niveau|thème` → mots du thème. */
export type ThemeWords = Record<string, string[]>
/**
 * Exceptions validées à la main :
 * - `words` : mots en minuscules absents du dictionnaire mais admis (wifi, selfie…) ;
 * - `pairs` : couples `thème|mot` que `revealsTheme` signale à tort (thé|menthe) ;
 * - `banned` : couples `thème|mot` refusés à la main (dérivés directs : chien|chiot,
 *   musique|musicien), pour qu'un remplissage ne les réintroduise jamais.
 */
export type Allowed = { words: string[]; pairs: string[]; banned: string[] }
export type Curation = { schedule: Schedule; words: ThemeWords; allowed: Allowed }

export const LEVELS: readonly ThemeLevel[] = ['1', '2', '3', '4']
export const MEMBER_COUNT: Record<ThemeLevel, number> = { 1: 10, 2: 15, 3: 18, 4: 19 }
/** Au-delà, le mot déborde de sa case dans une grille 7 × 7. */
export const MAX_LENGTH = 14
/** Un mot ne sert pas dans deux thèmes à moins de 3 jours d'écart (règle 3 : ±2 jours). */
export const REUSE_GAP = 3

const CURATION_DIR = join(import.meta.dirname, 'semantogramme-curation')
const DICTIONARY = join(import.meta.dirname, 'words-fr-raw.json')

export function loadCuration(dir: string = CURATION_DIR): Curation {
  const read = <T>(file: string): T => JSON.parse(readFileSync(join(dir, file), 'utf-8')) as T
  const words: ThemeWords = {}
  for (const file of readdirSync(join(dir, 'words')).sort()) {
    Object.assign(words, read<ThemeWords>(join('words', file)))
  }
  return {
    schedule: read<Schedule>('schedule.json'),
    words,
    allowed: read<Allowed>('allowed.json'),
  }
}

export function loadDictionary(): Set<string> {
  const list = JSON.parse(readFileSync(DICTIONARY, 'utf-8')) as string[]
  return new Set(list.map((w) => w.toLowerCase()))
}

const VERB_ENDINGS = ['er', 'ir', 're', 'oir']

/**
 * Le mot trahit-il le thème ? Couvre les cas qui échappent à `sameFamily` :
 * thème caché au milieu (bonsoir, autobus, parapluie), dans un composant
 * (presse-ail, cocotte-minute), ou radical d'un verbe (sautiller, coureur).
 */
export function revealsTheme(word: string, theme: string): boolean {
  const w = normalizeWord(word)
  const t = normalizeWord(theme)
  if (sameFamily(word, theme)) return true
  if (w.split(/[-' ]/).some((part) => part.length >= 2 && sameFamily(part, theme))) return true
  // Un thème court (os, bus, ail) se retrouve par hasard au milieu de
  // nombreux mots : on ne regarde alors que le début et la fin.
  if (t.length >= 4 ? w.includes(t) : w.startsWith(t) || w.endsWith(t)) return true
  const ending = VERB_ENDINGS.find((e) => t.endsWith(e) && t.length - e.length >= 4)
  return !!ending && w.includes(t.slice(0, -ending.length))
}

/** Problèmes d'un mot pris isolément, au regard de son thème. */
export function wordIssues(
  word: string,
  theme: string,
  dictionary: Set<string>,
  allowed: Allowed,
): string[] {
  const issues: string[] = []
  if (/\s/.test(word)) issues.push('contient une espace')
  if (word.length > MAX_LENGTH) issues.push(`plus de ${MAX_LENGTH} caractères`)
  if (/\d/.test(word)) issues.push('contient un chiffre')
  if (/[^\p{L}'-]/u.test(word)) issues.push('caractère interdit')
  if (normalizeWord(word) === normalizeWord(theme)) issues.push('égal au thème')
  else if (revealsTheme(word, theme) && !allowed.pairs.includes(`${theme}|${word}`)) {
    issues.push('trahit le thème')
  }
  if (allowed.banned.includes(`${theme}|${word}`)) issues.push('refusé (allowed.json, banned)')
  const lower = word.toLowerCase()
  if (word[0] === lower[0] && !dictionary.has(lower) && !allowed.words.includes(word)) {
    issues.push('hors dictionnaire (ni dans allowed.json)')
  }
  return issues
}

/** Numéro de jour depuis le début du calendrier. */
function dayIndex(date: string, origin: string): number {
  return Math.round((Date.parse(date) - Date.parse(origin)) / 86_400_000)
}

/**
 * Contexte de voisinage : pour chaque mot (normalisé), les jours où il sert ;
 * pour chaque jour, ses thèmes. Sert au contrôle global comme au remplissage.
 */
export function buildIndex(curation: Curation) {
  const origin = curation.schedule['1'][0].date
  const dayOfKey = new Map<string, number>()
  const themesOfDay = new Map<number, string[]>()
  for (const level of LEVELS) {
    for (const t of curation.schedule[level]) {
      const day = dayIndex(t.date, origin)
      dayOfKey.set(`${level}|${t.word}`, day)
      themesOfDay.set(day, [...(themesOfDay.get(day) ?? []), normalizeWord(t.word)])
    }
  }
  const usage = new Map<string, { key: string; day: number }[]>()
  for (const [key, words] of Object.entries(curation.words)) {
    const day = dayOfKey.get(key)
    if (day === undefined) continue
    for (const w of words) {
      const n = normalizeWord(w)
      usage.set(n, [...(usage.get(n) ?? []), { key, day }])
    }
  }
  return { dayOfKey, themesOfDay, usage }
}

export type CurationIndex = ReturnType<typeof buildIndex>

/**
 * Problèmes de voisinage d'un mot placé dans le thème `key`. Par défaut, une
 * collision n'est signalée que depuis le thème le plus tardif (pour le rapport
 * global) ; `bothWays` la signale dans les deux sens (pour tester un ajout).
 */
export function neighbourIssues(
  word: string,
  key: string,
  index: CurationIndex,
  bothWays = false,
): string[] {
  const day = index.dayOfKey.get(key)
  if (day === undefined) return []
  const n = normalizeWord(word)
  const issues: string[] = []
  for (let d = day - REUSE_GAP + 1; d <= day + REUSE_GAP - 1; d++) {
    if ((index.themesOfDay.get(d) ?? []).includes(n))
      issues.push(`thème d'un jour voisin (${d - day} j)`)
  }
  for (const other of index.usage.get(n) ?? []) {
    const earlier = other.day < day || (other.day === day && other.key < key)
    if (other.key !== key && (bothWays || earlier) && Math.abs(day - other.day) < REUSE_GAP) {
      issues.push(`déjà dans ${other.key} (${Math.abs(other.day - day)} j)`)
    }
  }
  return issues
}

/** Contrôle complet du corpus. Liste vide = corpus conforme. */
export function checkCuration(curation: Curation, dictionary: Set<string>): string[] {
  const issues: string[] = []
  const index = buildIndex(curation)
  const themes = LEVELS.flatMap((l) => curation.schedule[l].map((t) => ({ level: l, ...t })))
  const seen = new Set<string>()
  for (const { level, word: theme } of themes) {
    const key = `${level}|${theme}`
    if (seen.has(normalizeWord(theme))) issues.push(`${key} : thème en double`)
    seen.add(normalizeWord(theme))
    if (!dictionary.has(theme.toLowerCase())) issues.push(`${key} : thème hors dictionnaire`)
    const words = curation.words[key]
    if (!words) {
      issues.push(`${key} : aucun mot`)
      continue
    }
    if (words.length !== MEMBER_COUNT[level]) {
      issues.push(`${key} : ${words.length} mots au lieu de ${MEMBER_COUNT[level]}`)
    }
    const normalized = words.map(normalizeWord)
    normalized.forEach((n, i) => {
      if (normalized.indexOf(n) !== i) issues.push(`${key} : « ${words[i]} » en double`)
    })
    for (const w of words) {
      for (const p of [
        ...wordIssues(w, theme, dictionary, curation.allowed),
        ...neighbourIssues(w, key, index),
      ]) {
        issues.push(`${key} : « ${w} » ${p}`)
      }
    }
    for (const [a, b] of familyPairs([...new Set(words)])) {
      issues.push(`${key} : « ${a} » et « ${b} » de la même famille`)
    }
  }
  for (const key of Object.keys(curation.words)) {
    if (!index.dayOfKey.has(key)) issues.push(`${key} : thème absent du calendrier`)
  }
  return issues
}
