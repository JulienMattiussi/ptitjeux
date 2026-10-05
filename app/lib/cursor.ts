/** Direction d'un déplacement au clavier, commune à tous les jeux. */
export type Direction = 'up' | 'down' | 'left' | 'right'

export type CellCursor = { x: number; y: number }

/**
 * Déplace un curseur de case (x, y) dans la direction donnée et le borne aux
 * limites de la grille (Sémantogramme, Angle mort).
 */
export function moveCellCursor(
  cursor: CellCursor,
  direction: Direction,
  width: number,
  height: number,
): CellCursor {
  switch (direction) {
    case 'left':
      return { x: Math.max(0, cursor.x - 1), y: cursor.y }
    case 'right':
      return { x: Math.min(width - 1, cursor.x + 1), y: cursor.y }
    case 'up':
      return { x: cursor.x, y: Math.max(0, cursor.y - 1) }
    case 'down':
      return { x: cursor.x, y: Math.min(height - 1, cursor.y + 1) }
  }
}
