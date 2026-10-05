export type Coord = [number, number]

/**
 * Une arête sur le quadrillage des coins de cases.
 *
 * Convention pour une grille `width` × `height` :
 * - Une arête horizontale `(x, y)` relie les sommets `(x, y)` et `(x+1, y)`,
 *   avec `0 ≤ x < width` et `0 ≤ y ≤ height`.
 *   C'est le côté haut de la case `(x, y)` et le côté bas de `(x, y-1)`.
 * - Une arête verticale `(x, y)` relie les sommets `(x, y)` et `(x, y+1)`,
 *   avec `0 ≤ x ≤ width` et `0 ≤ y < height`.
 *   C'est le côté gauche de la case `(x, y)` et le côté droit de `(x-1, y)`.
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
  solutionInsideCells: Coord[]
  /** Nombre maximum de bascules d'arêtes pour que la résolution soit considérée « parfaite ». */
  parMoves: number
  /** Forme canonique du mot solution (avec accents) pour la recherche Wiktionnaire. */
  canonicalWord: string
}

export type GameState = {
  level: Level
  edges: Edge[]
  /** Nombre total de bascules d'arêtes effectuées par le joueur. */
  moves: number
}
