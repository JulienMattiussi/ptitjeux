export type Coord = [number, number]

/**
 * Une arête sur le quadrillage des coins de cases.
 *
 * Convention pour une grille `width` × `height` :
 * - Une arête horizontale `(x, y)` relie les sommets `(x, y)` et `(x+1, y)`,
 *   avec `0 ≤ x < width` et `0 ≤ y ≤ height`.
 *   Elle borde la case `(x, y)` au-dessus (côté haut) et la case `(x, y-1)` en dessous.
 * - Une arête verticale `(x, y)` relie les sommets `(x, y)` et `(x, y+1)`,
 *   avec `0 ≤ x ≤ width` et `0 ≤ y < height`.
 *   Elle borde la case `(x, y)` à droite (côté gauche) et la case `(x-1, y)` à gauche.
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
  /** Cases qui doivent finir à l'intérieur de la boucle, en ordre lecture. Utilisé par les tests. */
  solutionInsideCells?: Coord[]
  /** Nombre maximum de toggles d'arêtes pour que la résolution soit considérée « parfaite ». */
  parMoves?: number
  /** Forme canonique du mot solution (avec accents) pour la recherche Wiktionnaire. */
  canonicalWord?: string
}

export type GameState = {
  level: Level
  edges: Edge[]
  /** Nombre total de toggles d'arêtes effectués par le joueur. */
  moves: number
}
