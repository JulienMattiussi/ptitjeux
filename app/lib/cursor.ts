import type { GameKeyDirection } from './useGameKeyboard'

export type CellCursor = { x: number; y: number }

/**
 * Déplace un curseur de case (x, y) dans la direction donnée et le borne aux
 * limites de la grille. Utilisé par Sémantogramme pour la navigation clavier.
 */
export function moveCellCursor(
  cursor: CellCursor,
  direction: GameKeyDirection,
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
