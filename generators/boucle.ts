import type { Coord, Level } from '~/games/boucle/types'
import type { LevelIndex } from '~/games/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { Rng } from './random'
import { freshWords } from './wordlists'

const FILLER_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ'.split('')

const cellKey = (c: Coord): string => `${c[0]},${c[1]}`

/**
 * Pas de la marche des cases du mot : à droite ou en bas seulement. Le mot
 * se lit ainsi dans l'ordre de lecture (haut-bas, gauche-droite), et ses
 * cases, voisines par un côté, s'enclosent d'une seule boucle sans lettre de
 * remplissage. Une telle marche ne repasse jamais sur ses pas.
 */
const BOUCLE_STEPS: readonly Coord[] = [
  [1, 0],
  [0, 1],
]

function inGrid(c: Coord, width: number, height: number): boolean {
  return c[0] >= 0 && c[0] < width && c[1] >= 0 && c[1] < height
}

/**
 * Cases du mot, par marche aléatoire depuis le quart haut-gauche. `null` si
 * aucun pas ne reste dans la grille après 30 tirages (en pratique jamais :
 * partie du quart haut-gauche, la marche n'atteint pas le coin bas-droit
 * avant son dernier pas, il reste donc toujours un pas possible).
 */
function placeWordCells(rng: Rng, wordLen: number, width: number, height: number): Coord[] | null {
  let cur: Coord = [
    rng.nextInt(Math.max(1, Math.floor(width / 2))),
    rng.nextInt(Math.max(1, Math.floor(height / 2))),
  ]
  const cells: Coord[] = [cur]
  for (let i = 1; i < wordLen; i++) {
    let placed = false
    for (let attempt = 0; attempt < 30; attempt++) {
      const [dx, dy] = rng.pick(BOUCLE_STEPS)
      const next: Coord = [cur[0] + dx, cur[1] + dy]
      if (!inGrid(next, width, height)) continue
      cells.push(next)
      cur = next
      placed = true
      break
    }
    if (!placed) return null
  }
  return cells
}

/**
 * Boucle attendue : les arêtes qui séparent une case du mot du reste. Les
 * cases du mot, voisines par un côté et sans trou, n'en forment qu'une seule.
 */
function perimeterEdges(insideCells: Coord[]): Set<string> {
  const insideSet = new Set(insideCells.map(cellKey))
  const edges = new Set<string>()
  // Arête H:x,y = bord haut de la case (x, y) ; V:x,y = bord gauche.
  for (const [cx, cy] of insideCells) {
    if (!insideSet.has(cellKey([cx, cy - 1]))) edges.add(`H:${cx},${cy}`)
    if (!insideSet.has(cellKey([cx, cy + 1]))) edges.add(`H:${cx},${cy + 1}`)
    if (!insideSet.has(cellKey([cx - 1, cy]))) edges.add(`V:${cx},${cy}`)
    if (!insideSet.has(cellKey([cx + 1, cy]))) edges.add(`V:${cx + 1},${cy}`)
  }
  return edges
}

/** Indice Slitherlink d'une case : nombre de ses 4 côtés sur la boucle. */
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
 * Indices affichés : chaque case touchée par la boucle, plus les « 0 »
 * voisins d'une case du mot. Les cases lointaines restent vides.
 */
function chooseClues(insideCells: Coord[], width: number, height: number): Record<string, number> {
  const perimeter = perimeterEdges(insideCells)
  const insideSet = new Set(insideCells.map(cellKey))
  const clues: Record<string, number> = {}
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const count = clueForCell([x, y], perimeter)
      const neighbours: Coord[] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]
      if (count > 0 || neighbours.some((c) => insideSet.has(cellKey(c)))) {
        clues[`${x},${y}`] = count
      }
    }
  }
  return clues
}

export type BoucleOptions = {
  /** Mots (forme affichée) déjà publiés : jamais réutilisés. */
  usedWords?: ReadonlySet<string>
}

/**
 * Niveau Boucle : grille carrée (`GAME_SIZE`), mot aussi long que la grille,
 * posé par une marche aléatoire à droite ou en bas. La boucle attendue est
 * le périmètre des cases du mot ; les autres cases reçoivent des lettres
 * aléatoires, et les indices sont comptés sur ce périmètre.
 */
export function generateBoucleLevel(
  date: string,
  index: LevelIndex,
  { usedWords }: BoucleOptions = {},
): Level {
  const { width, height } = GAME_SIZE.boucle(index)
  const wordLen = width

  for (let attempt = 0; attempt < 30; attempt++) {
    const rng = new Rng(`boucle:${date}:${index}:${attempt}`)
    const entry = rng.pick(freshWords(wordLen, usedWords))
    const word = entry.display

    const cells = placeWordCells(rng, wordLen, width, height)
    if (!cells) continue

    const letters = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => rng.pick(FILLER_LETTERS)),
    )
    cells.forEach(([cx, cy], i) => {
      letters[cy][cx] = word[i]
    })

    return {
      id: `${date}-${index}`,
      name: `Niveau ${index} · ${width}×${height}`,
      width,
      height,
      letters,
      clues: chooseClues(cells, width, height),
      solutionWord: word,
      solutionInsideCells: cells,
      // Le périmètre, plus une marge de 4 clics.
      parMoves: perimeterEdges(cells).size + 4,
      canonicalWord: entry.canonical,
    }
  }
  throw new Error(`Boucle ${date} L${index} : aucune grille en 30 tentatives`)
}
