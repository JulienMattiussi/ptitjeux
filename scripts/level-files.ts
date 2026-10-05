/** Fichiers de niveaux vus par `generate-levels.ts` : nettoyage et mots déjà publiés. */
import fs from 'node:fs/promises'
import path from 'node:path'
import type { LevelIndex } from '../app/games/types.js'
import type { GameId } from '../app/lib/game-styles.js'
import { stripAccents } from '../app/lib/text.js'
import { isFixedBaseLevel } from '../generators/anglemort-schedule.js'
import { levelFile } from '../generators/calendar.js'

type KeepRule = (date: string, index: LevelIndex) => boolean

/**
 * Niveaux que `--clean` ne supprime jamais : toutes les grilles Sémantogramme
 * (relues et jouées, elles ne se régénèrent pas) et les grilles de base
 * fixées d'Angle mort (relues par le générateur lui-même).
 */
export function keptOnClean(game: GameId): KeepRule {
  if (game === 'semantogramme') return () => true
  if (game === 'anglemort') return isFixedBaseLevel
  return () => false
}

/** Fichiers que `--clean` supprime : chaque niveau du filtre, sauf ceux que `keep` protège. */
export function filesToClean(
  dates: readonly string[],
  levels: readonly LevelIndex[],
  keep: KeepRule = () => false,
): string[] {
  return dates.flatMap((date) =>
    levels.filter((index) => !keep(date, index)).map((index) => levelFile(date, index)),
  )
}

/** Champs d'un niveau qui portent son mot à trouver, selon le jeu. */
type LevelWords = { solutionWord?: string; target?: { word: string }; themeWord?: string }

export type WordOf = (level: LevelWords) => string

/** Forme affichée d'un mot : sans accents, en majuscules. */
export function displayWord(word: string): string {
  return stripAccents(word).toUpperCase()
}

/**
 * Mots à trouver de tous les niveaux d'un dossier `challenges/`, sauf les
 * fichiers `skip` (chemins relatifs, ceux qu'on s'apprête à régénérer).
 */
export async function publishedWords(
  root: string,
  wordOf: WordOf,
  skip: ReadonlySet<string>,
): Promise<Set<string>> {
  const words = new Set<string>()
  for (const month of await fs.readdir(root)) {
    if (!/^\d{4}-\d{2}$/.test(month)) continue
    for (const file of await fs.readdir(path.join(root, month))) {
      if (!file.endsWith('.json') || skip.has(`${month}/${file}`)) continue
      const level = JSON.parse(await fs.readFile(path.join(root, month, file), 'utf-8'))
      words.add(displayWord(wordOf(level)))
    }
  }
  return words
}

/** Mots à trouver des niveaux publiés d'une date dans un dossier `challenges/`. */
export async function wordsOfDate(
  root: string,
  wordOf: WordOf,
  date: string,
  levels: readonly LevelIndex[],
): Promise<string[]> {
  const words: string[] = []
  for (const index of levels) {
    const raw = await fs
      .readFile(path.join(root, levelFile(date, index)), 'utf-8')
      .catch(() => null)
    if (raw) words.push(displayWord(wordOf(JSON.parse(raw))))
  }
  return words
}
