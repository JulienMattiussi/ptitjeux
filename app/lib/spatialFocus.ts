import type { Direction } from './cursor'

export type Box = { left: number; top: number; width: number; height: number }

/** Tolérance (px) pour considérer qu'un élément est bien « dans » la direction. */
const EPSILON = 1

/**
 * Indice de l'élément le plus proche de `from` dans la direction donnée, ou -1.
 * On compare les centres : seuls comptent les éléments situés du bon côté, et
 * l'écart latéral pèse double pour préférer l'élément aligné (même ligne ou
 * même colonne) à un voisin en diagonale.
 */
export function pickInDirection(from: Box, candidates: Box[], direction: Direction): number {
  const cx = from.left + from.width / 2
  const cy = from.top + from.height / 2
  let best = -1
  let bestScore = Infinity
  candidates.forEach((box, i) => {
    const dx = box.left + box.width / 2 - cx
    const dy = box.top + box.height / 2 - cy
    const [primary, lateral] =
      direction === 'right'
        ? [dx, dy]
        : direction === 'left'
          ? [-dx, dy]
          : direction === 'down'
            ? [dy, dx]
            : [-dy, dx]
    if (primary <= EPSILON) return
    const score = primary + 2 * Math.abs(lateral)
    if (score < bestScore) {
      best = i
      bestScore = score
    }
  })
  return best
}
