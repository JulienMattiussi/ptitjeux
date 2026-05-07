export type Coord = [number, number]

/**
 * Une arête horizontale est identifiée par sa case de gauche `[x, y]`
 * et son orientation. Une arête verticale par sa case du dessus.
 */
export type Edge = {
  x: number
  y: number
  orientation: 'horizontal' | 'vertical'
}

export type Level = {
  id: string
  name: string
  width: number
  height: number
  letters: string[][]
  /** Indice numérique par case : "x,y" -> nombre d'arêtes utilisées (0..3). */
  clues: Record<string, number>
  solutionWord: string
  /** Cases à l'intérieur de la boucle dans l'ordre de lecture. */
  enclosedCells: Coord[]
}

export type GameState = {
  level: Level
  edges: Edge[]
}
