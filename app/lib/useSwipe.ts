import { useRef } from 'react'
import type { Direction } from './cursor'

/** Distance minimale (px) pour qu'un geste compte comme un glissé plutôt qu'une touche. */
export const SWIPE_MIN_PX = 24

/** Direction dominante d'un déplacement (dx, dy), en pixels écran (y vers le bas). */
export function dominantDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
  return dy >= 0 ? 'down' : 'up'
}

type Point = { x: number; y: number }

/**
 * Glissé du doigt (ou de la souris) sur un élément : `onSwipe` reçoit la
 * direction dominante du geste. Un geste trop court est une touche : `onTap`
 * reçoit le point touché, en coordonnées écran.
 */
export function useSwipe(onSwipe: (direction: Direction) => void, onTap?: (point: Point) => void) {
  const start = useRef<Point | null>(null)
  return {
    onPointerDown: (event: React.PointerEvent) => {
      start.current = { x: event.clientX, y: event.clientY }
    },
    onPointerUp: (event: React.PointerEvent) => {
      const from = start.current
      start.current = null
      if (!from) return
      const dx = event.clientX - from.x
      const dy = event.clientY - from.y
      if (Math.hypot(dx, dy) >= SWIPE_MIN_PX) onSwipe(dominantDirection(dx, dy))
      else onTap?.({ x: event.clientX, y: event.clientY })
    },
    onPointerCancel: () => {
      start.current = null
    },
  }
}
