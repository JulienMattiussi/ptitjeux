import { Rng } from '~/lib/random'
import { WORDS_BY_LENGTH } from '../words'
import type { Coord, Level } from './types'

const FILLER_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ'.split('')

/**
 * Génère un niveau Boucle pour une date et un index donnés.
 *
 * Template (toujours résoluble) :
 * - Grille carrée width × height, où width = height = 3 + index (donc 4..7).
 * - Le mot solution occupe la colonne 0, ligne par ligne (un mot vertical lu de haut en bas).
 * - La boucle attendue est le rectangle qui entoure cette colonne.
 * - Indices Slitherlink placés stratégiquement pour suggérer la solution :
 *   coin haut-gauche (3), milieux gauche (2), coin bas-gauche (3), une case voisine (1).
 * - Cases hors-thème remplies de lettres aléatoires.
 */
export function generateBoucleLevel(date: string, index: 1 | 2 | 3 | 4): Level {
  const size = 3 + index // 4, 5, 6, 7
  const width = size
  const height = size
  const wordLen = size
  const rng = new Rng(`boucle:${date}:${index}`)
  const words = WORDS_BY_LENGTH[wordLen] ?? []
  const word = rng.pick(words)

  const letters: string[][] = []
  const insideCells: Coord[] = []
  for (let y = 0; y < height; y++) {
    const row: string[] = []
    for (let x = 0; x < width; x++) {
      if (x === 0 && y < wordLen) {
        row.push(word[y])
        insideCells.push([x, y])
      } else {
        row.push(rng.pick(FILLER_LETTERS))
      }
    }
    letters.push(row)
  }

  // Indices : pour la boucle = rectangle entourant la colonne 0 :
  // - case (0, 0) : top + left + right → 3
  // - cases (0, y) avec 0<y<height-1 : left + right → 2
  // - case (0, height-1) : left + right + bottom → 3
  // - case (1, 0) : left → 1 (donne un repère sur la limite droite de la boucle)
  // - case (1, height-1) : left → 1
  const clues: Record<string, number> = {
    '0,0': 3,
    [`0,${height - 1}`]: 3,
  }
  // Indices intermédiaires : on en met sur ~30% des cases du milieu de la colonne 0,
  // et un repère sur la colonne voisine.
  for (let y = 1; y < height - 1; y++) {
    clues[`0,${y}`] = 2
  }
  clues['1,0'] = 1
  clues[`1,${height - 1}`] = 1

  // Périmètre de la boucle solution = nombre minimal de toggles d'arêtes.
  // On accorde une petite tolérance pour considérer la résolution parfaite.
  const perimeter = 2 * (1 + wordLen)
  const parMoves = perimeter + 4

  return {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height}`,
    width,
    height,
    letters,
    clues,
    solutionWord: word,
    solutionInsideCells: insideCells,
    parMoves,
  }
}
