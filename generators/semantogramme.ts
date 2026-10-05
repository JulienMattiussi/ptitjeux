import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Rng } from '~/lib/random'
import type { Level } from '~/games/semantogramme/types'
import {
  LEVELS,
  REUSE_GAP,
  loadCuration,
  revealsTheme,
  type Curation,
  type ThemeLevel,
} from './semantogramme-curation'
import { normalizeWord, sameFamily } from './semantogramme-rules'

/** Taille de grille et nombre de cases « thème », tiré dans [nMin, nMax]. */
const GRID: Record<ThemeLevel, { size: number; nMin: number; nMax: number }> = {
  1: { size: 4, nMin: 7, nMax: 10 },
  2: { size: 5, nMin: 11, nMax: 15 },
  3: { size: 6, nMin: 14, nMax: 18 },
  4: { size: 7, nMin: 15, nMax: 19 },
}

const MAX_SHUFFLES = 1000

/** Domaine de sens → thèmes (tous niveaux confondus), voir `semantogramme-curation/`. */
export type Domains = Record<string, string[]>

let plan: Map<string, Level> | undefined

/**
 * Niveau Sémantogramme d'une date. Toute l'année est planifiée d'un coup
 * (`planYear`) : les mots hors thème d'un jour dépendent de ceux des jours
 * précédents (règle 3), un niveau ne se génère donc pas isolément.
 */
export function generateSemantogrammeLevel(date: string, index: 1 | 2 | 3 | 4): Level {
  plan ??= planYear(loadCuration(), loadDomains())
  const level = plan.get(`${date}-${index}`)
  if (!level) throw new Error(`Sémantogramme : aucun thème curé le ${date} au niveau ${index}`)
  return level
}

export function loadDomains(): Domains {
  const file = join(import.meta.dirname, 'semantogramme-curation', 'domains.json')
  return JSON.parse(readFileSync(file, 'utf-8')) as Domains
}

/**
 * Planifie tous les niveaux du calendrier, jour après jour. Les mots hors
 * thème sont piochés parmi les mots des autres thèmes et respectent :
 * - règle 2 : tous les mots d'un jour sont différents, et différents des thèmes du jour ;
 * - règle 3 : aucun mot commun avec les deux jours précédents ni les deux suivants ;
 * - règle 4 : pas deux mots de la même famille dans une grille, ni un mot qui trahit le thème ;
 * - règle 5 (approchée) : pas de mot d'un thème du même domaine de sens, ni d'un
 *   thème lié (dont la liste contient le thème courant, ou l'inverse).
 */
export function planYear(curation: Curation, domains: Domains): Map<string, Level> {
  const days = curation.schedule['1'].map((t) => t.date)
  const themeOf = (level: ThemeLevel, day: number) => curation.schedule[level][day].word
  const membersOf = (level: ThemeLevel, day: number) =>
    curation.words[`${level}|${themeOf(level, day)}`]

  const domainsOfTheme = new Map<string, string[]>()
  for (const [domain, themes] of Object.entries(domains)) {
    for (const t of themes) domainsOfTheme.set(t, [...(domainsOfTheme.get(t) ?? []), domain])
  }

  const allThemes = LEVELS.flatMap((l) =>
    curation.schedule[l].map((t) => ({
      word: t.word,
      normalized: normalizeWord(t.word),
      list: curation.words[`${l}|${t.word}`].map(normalizeWord),
    })),
  )
  const pool = [...new Set(Object.values(curation.words).flat())]

  /** Mots qu'aucun mot hors thème du thème `key` ne doit être (règle 5 approchée). */
  function relatedWords(level: ThemeLevel, theme: string): Set<string> {
    const t = normalizeWord(theme)
    const own = new Set(curation.words[`${level}|${theme}`].map(normalizeWord))
    const myDomains = new Set(domainsOfTheme.get(theme) ?? [])
    const related = new Set<string>()
    for (const other of allThemes) {
      const sameDomain = (domainsOfTheme.get(other.word) ?? []).some((d) => myDomains.has(d))
      const linked = other.list.includes(t) || own.has(other.normalized)
      if (sameDomain || linked) {
        related.add(other.normalized)
        for (const w of other.list) related.add(w)
      }
    }
    return related
  }

  const fillersOfDay: Set<string>[] = []
  const levels = new Map<string, Level>()

  days.forEach((date, day) => {
    // Réservé : tous les mots et thèmes des jours voisins, plus les mots hors
    // thème déjà posés sur les jours précédents.
    const reserved = new Set<string>()
    for (let d = day - REUSE_GAP + 1; d <= day + REUSE_GAP - 1; d++) {
      if (d < 0 || d >= days.length) continue
      for (const l of LEVELS) {
        reserved.add(normalizeWord(themeOf(l, d)))
        for (const w of membersOf(l, d)) reserved.add(normalizeWord(w))
      }
      for (const w of fillersOfDay[d] ?? []) reserved.add(w)
    }
    fillersOfDay[day] = new Set()

    for (const level of LEVELS) {
      const theme = themeOf(level, day)
      const { size, nMin, nMax } = GRID[level]
      const rng = new Rng(`semantogramme:${date}:${level}`)
      const n = nMin + rng.nextInt(nMax - nMin + 1)
      const members = rng.shuffle(membersOf(level, day).slice()).slice(0, n)

      const related = relatedWords(level, theme)
      const chosen = [...members]
      const fillers: string[] = []
      for (const candidate of rng.shuffle(pool.slice())) {
        if (fillers.length === size * size - n) break
        const c = normalizeWord(candidate)
        if (reserved.has(c) || related.has(c)) continue
        if (revealsTheme(candidate, theme)) continue
        if (chosen.some((w) => sameFamily(w, candidate))) continue
        fillers.push(candidate)
        chosen.push(candidate)
        reserved.add(c)
        fillersOfDay[day].add(c)
      }
      if (fillers.length < size * size - n) {
        throw new Error(`Sémantogramme ${date} L${level} : pas assez de mots hors thème`)
      }
      levels.set(`${date}-${level}`, buildLevel(date, level, theme, members, fillers, rng))
    }
  })
  return levels
}

/**
 * Place les mots dans la grille, en re-mélangeant jusqu'à ce que chaque ligne
 * et chaque colonne ait au moins une case thème et une case hors thème : un
 * indice à 0 ou égal à la largeur appauvrirait le puzzle.
 */
function buildLevel(
  date: string,
  level: ThemeLevel,
  theme: string,
  members: string[],
  fillers: string[],
  rng: Rng,
): Level {
  const size = GRID[level].size
  const cells = [
    ...members.map((word) => ({ word, isIn: true })),
    ...fillers.map((word) => ({ word, isIn: false })),
  ]
  for (let attempt = 0; attempt < MAX_SHUFFLES; attempt++) {
    rng.shuffle(cells)
    const solution = Array.from({ length: size }, (_, y) =>
      cells.slice(y * size, (y + 1) * size).map((c) => c.isIn),
    )
    const rowClues = solution.map((row) => row.filter(Boolean).length)
    const colClues = Array.from({ length: size }, (_, x) => solution.filter((row) => row[x]).length)
    const balanced = [...rowClues, ...colClues].every((c) => c > 0 && c < size)
    if (!balanced) continue
    return {
      id: `${date}-${level}`,
      name: `Niveau ${level} · ${size}×${size}`,
      width: size,
      height: size,
      words: Array.from({ length: size }, (_, y) =>
        cells.slice(y * size, (y + 1) * size).map((c) => c.word),
      ),
      rowClues,
      colClues,
      themeWord: theme,
      solution,
      // Le minimum de clics est le nombre de cases thème : pas de marge.
      parMoves: members.length,
    }
  }
  throw new Error(`Sémantogramme ${date} L${level} : grille équilibrée introuvable`)
}
