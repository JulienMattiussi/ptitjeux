import { Rng } from '~/lib/random'
import { FILLER_WORDS, THEMES } from './themes'
import type { Level } from './types'

/**
 * Génère un niveau Sémantogramme pour une date et un index donnés.
 *
 * Template :
 * - Grille N × N (4..7).
 * - Choisit un thème déterministe d'après la date+index.
 * - Pose ~50 % de cases « thème » (avec mots du thème, possiblement répétés)
 *   et ~50 % de cases « hors thème » (mots filler).
 * - Calcule rowClues et colClues à partir de la matrice solution.
 */
export function generateSemantogrammeLevel(date: string, index: 1 | 2 | 3 | 4): Level {
  const size = 3 + index // 4, 5, 6, 7
  const width = size
  const height = size
  const rng = new Rng(`semantogramme:${date}:${index}`)
  const theme = rng.pick(THEMES)

  // Solution : ~50 % de cases thème. On garantit au moins 1 case thème par
  // ligne et par colonne pour que le puzzle soit informatif.
  const solution: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => rng.random() < 0.5),
  )
  // Au moins une case « thème » par ligne et par colonne (sinon clue 0 partout) :
  for (let y = 0; y < height; y++) {
    if (!solution[y].some((v) => v)) {
      solution[y][rng.nextInt(width)] = true
    }
  }
  for (let x = 0; x < width; x++) {
    let any = false
    for (let y = 0; y < height; y++) {
      if (solution[y][x]) {
        any = true
        break
      }
    }
    if (!any) solution[rng.nextInt(height)][x] = true
  }

  // Au moins une case « hors thème » par ligne (sinon clue = width partout, pas marrant) :
  for (let y = 0; y < height; y++) {
    if (solution[y].every((v) => v)) {
      solution[y][rng.nextInt(width)] = false
    }
  }

  // Pose les mots
  const words: string[][] = []
  for (let y = 0; y < height; y++) {
    const row: string[] = []
    for (let x = 0; x < width; x++) {
      if (solution[y][x]) {
        row.push(rng.pick(theme.members))
      } else {
        row.push(rng.pick(FILLER_WORDS))
      }
    }
    words.push(row)
  }

  // Clues
  const rowClues = solution.map((row) => row.filter(Boolean).length)
  const colClues: number[] = []
  for (let x = 0; x < width; x++) {
    let count = 0
    for (let y = 0; y < height; y++) {
      if (solution[y][x]) count++
    }
    colClues.push(count)
  }

  // Le minimum de clics pour résoudre = nombre de cases « in », puisqu'il
  // suffit de marquer ces cases (les non-thème peuvent rester vides).
  // On accorde une tolérance pour gérer un ou deux cas hésitants.
  const inCount = solution.flat().filter(Boolean).length
  const parMoves = inCount + 3

  return {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height}`,
    width,
    height,
    words,
    rowClues,
    colClues,
    themeWord: theme.word,
    solution,
    parMoves,
  }
}
