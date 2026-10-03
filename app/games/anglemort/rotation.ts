import { useState } from 'react'
import type { Dir } from './types'

/** Angle de rotation SVG (degrés, sens horaire) d'un personnage dessiné vers le haut. */
export const ANGLE: Record<Dir, number> = { N: 0, E: 90, S: 180, W: 270 }

/** Écart signé le plus court de `from` vers `to`, dans ]-180, 180]. */
export function shortestTurn(from: number, to: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180
  return delta === -180 ? 180 : delta
}

/**
 * Angle cumulé qui rejoint `target` par le plus court chemin : W → N fait un
 * quart de tour horaire, pas trois quarts en arrière, quand la rotation est
 * animée par une transition CSS.
 */
export function useHeading(target: number): number {
  const [angle, setAngle] = useState(target)
  if ((((angle - target) % 360) + 360) % 360 !== 0) {
    setAngle(angle + shortestTurn(angle, target))
  }
  return angle
}
