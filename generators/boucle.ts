import { Rng } from '~/lib/random'
import type { Coord, Level } from '~/games/boucle/types'
import { WORDS_BY_LENGTH } from './wordlists'

const FILLER_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ'.split('')

const cellKey = (c: Coord): string => `${c[0]},${c[1]}`

/**
 * Pas autorisés pour la marche aléatoire des cases du mot dans Boucle :
 * uniquement à droite ou en bas. Pourquoi ces deux uniquement ?
 *
 * - Pour que la lecture en ordre normal (haut-bas, gauche-droite) du mot
 *   encerclé corresponde à l'ordre des lettres écrites dans la grille.
 * - Pour que les cases du mot soient **edge-connectées** (chaque pas
 *   orthogonal de 1 case), donc qu'on puisse toutes les enclore avec une
 *   seule boucle simple sans inclure de filler.
 *
 * Sokomot autorise aussi les diagonales (TR / BR) mais Boucle s'y limite à
 * cause de la contrainte de connexité.
 */
const BOUCLE_STEPS: readonly Coord[] = [
  [1, 0], // droite
  [0, 1], // bas
] as const

function inInterior(c: Coord, width: number, height: number): boolean {
  return c[0] >= 0 && c[0] < width && c[1] >= 0 && c[1] < height
}

/**
 * Marche aléatoire connexe (droite + bas) pour positionner les cases du mot.
 * Renvoie `null` si la marche sort de la grille avant la fin.
 */
function placeWordCells(
  rng: Rng,
  wordLen: number,
  width: number,
  height: number,
): Coord[] | null {
  const used = new Set<string>()
  const cells: Coord[] = []
  // Position de départ dans le quart haut-gauche, marge pour grandir.
  let cur: Coord = [
    rng.nextInt(Math.max(1, Math.floor(width / 2))),
    rng.nextInt(Math.max(1, Math.floor(height / 2))),
  ]
  cells.push(cur)
  used.add(cellKey(cur))

  for (let i = 1; i < wordLen; i++) {
    let placed = false
    for (let attempt = 0; attempt < 30; attempt++) {
      const [dx, dy] = rng.pick(BOUCLE_STEPS)
      const next: Coord = [cur[0] + dx, cur[1] + dy]
      if (!inInterior(next, width, height)) continue
      if (used.has(cellKey(next))) continue
      cells.push(next)
      used.add(cellKey(next))
      cur = next
      placed = true
      break
    }
    if (!placed) return null
  }
  return cells
}

/**
 * Calcule la liste des arêtes du périmètre d'un ensemble de cases connexes.
 * Une arête est sur le périmètre si elle sépare une case « dedans » d'une
 * case « dehors » (ou du bord de la grille).
 */
function perimeterEdges(insideCells: Coord[]): Set<string> {
  const insideSet = new Set(insideCells.map(cellKey))
  const edges = new Set<string>()
  for (const [cx, cy] of insideCells) {
    // Top : H(cx, cy)
    if (!insideSet.has(cellKey([cx, cy - 1]))) edges.add(`H:${cx},${cy}`)
    // Bottom : H(cx, cy+1)
    if (!insideSet.has(cellKey([cx, cy + 1]))) edges.add(`H:${cx},${cy + 1}`)
    // Left : V(cx, cy)
    if (!insideSet.has(cellKey([cx - 1, cy]))) edges.add(`V:${cx},${cy}`)
    // Right : V(cx+1, cy)
    if (!insideSet.has(cellKey([cx + 1, cy]))) edges.add(`V:${cx + 1},${cy}`)
  }
  return edges
}

/**
 * Pour une case donnée, compte combien de ses 4 arêtes sont dans la boucle.
 * C'est le nombre d'indice qu'on affiche dans le Slitherlink.
 */
function clueForCell(cell: Coord, perimeter: Set<string>): number {
  const [cx, cy] = cell
  let count = 0
  if (perimeter.has(`H:${cx},${cy}`)) count++
  if (perimeter.has(`H:${cx},${cy + 1}`)) count++
  if (perimeter.has(`V:${cx},${cy}`)) count++
  if (perimeter.has(`V:${cx + 1},${cy}`)) count++
  return count
}

/**
 * Choisit un sous-ensemble pertinent de cases pour afficher des indices.
 * On garde toutes les cases avec un indice non nul (cases du mot ou voisines
 * de la boucle), et on ajoute quelques zéros « informatifs » à distance.
 *
 * Tous les indices sont affichés ; cela facilite la résolution. On peut
 * réduire plus tard pour augmenter la difficulté.
 */
function chooseClues(
  insideCells: Coord[],
  width: number,
  height: number,
): Record<string, number> {
  const perimeter = perimeterEdges(insideCells)
  const clues: Record<string, number> = {}
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell: Coord = [x, y]
      const count = clueForCell(cell, perimeter)
      // Cases du mot et leurs voisines reçoivent un indice ; les cases
      // « lointaines » (count=0 et toutes leurs voisines aussi) sont laissées vides.
      if (count > 0) {
        clues[`${x},${y}`] = count
      } else {
        // count 0 : afficher seulement si adjacent à une case du mot
        const insideSet = new Set(insideCells.map(cellKey))
        const adj = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ] as Coord[]
        if (adj.some((c) => insideSet.has(cellKey(c)))) {
          clues[`${x},${y}`] = 0
        }
      }
    }
  }
  return clues
}

/**
 * Génère un niveau Boucle pour une date et un index donnés.
 *
 * Layout :
 * - Grille carrée width × height = 3 + index (donc 4..7).
 * - Les cases du mot suivent une marche aléatoire connexe (droite + bas),
 *   garantissant à la fois la lecture en ordre normal et la possibilité
 *   d'enclore le tout par une seule boucle simple.
 * - La boucle attendue est le **périmètre** de l'ensemble des cases du mot.
 * - Les cases hors-mot sont remplies de lettres aléatoires.
 * - Les indices Slitherlink sont calculés exactement à partir du périmètre.
 */
export function generateBoucleLevel(date: string, index: 1 | 2 | 3 | 4): Level {
  const size = 3 + index // 4..7
  const width = size
  const height = size
  const wordLen = size

  // Tentatives successives jusqu'à obtenir une marche complète qui rentre.
  for (let attempt = 0; attempt < 30; attempt++) {
    const rng = new Rng(`boucle:${date}:${index}:${attempt}`)
    const words = WORDS_BY_LENGTH[wordLen] ?? []
    const entry = rng.pick(words)
    const word = entry.display

    const cells = placeWordCells(rng, wordLen, width, height)
    if (!cells) continue

    // Place les lettres dans la grille. Lecture en ordre normal (y, puis x)
    // doit donner le mot. Vérifions : on trie cells par (y, x) et on compare
    // à l'ordre de marche. Avec des pas droite/bas uniquement, l'ordre de
    // marche EST déjà l'ordre de lecture, donc OK.
    const letters: string[][] = []
    for (let y = 0; y < height; y++) {
      const row: string[] = []
      for (let x = 0; x < width; x++) {
        row.push(rng.pick(FILLER_LETTERS))
      }
      letters.push(row)
    }
    cells.forEach(([cx, cy], i) => {
      letters[cy][cx] = word[i]
    })

    const clues = chooseClues(cells, width, height)

    const perimeterCount = perimeterEdges(cells).size
    const parMoves = perimeterCount + 4

    return {
      id: `${date}-${index}`,
      name: `Niveau ${index} · ${width}×${height}`,
      width,
      height,
      letters,
      clues,
      solutionWord: word,
      solutionInsideCells: cells,
      parMoves,
      canonicalWord: entry.canonical,
    }
  }

  // Filet de sécurité : layout vertical fixe (colonne 0).
  const fallbackRng = new Rng(`boucle:${date}:${index}:fallback`)
  const words = WORDS_BY_LENGTH[wordLen] ?? []
  const entry = fallbackRng.pick(words)
  const word = entry.display

  const letters: string[][] = []
  const cells: Coord[] = []
  for (let y = 0; y < height; y++) {
    const row: string[] = []
    for (let x = 0; x < width; x++) {
      if (x === 0 && y < wordLen) {
        row.push(word[y])
        cells.push([0, y])
      } else {
        row.push(fallbackRng.pick(FILLER_LETTERS))
      }
    }
    letters.push(row)
  }
  const clues = chooseClues(cells, width, height)
  const perimeterCount = perimeterEdges(cells).size
  return {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height}`,
    width,
    height,
    letters,
    clues,
    solutionWord: word,
    solutionInsideCells: cells,
    parMoves: perimeterCount + 4,
    canonicalWord: entry.canonical,
  }
}
