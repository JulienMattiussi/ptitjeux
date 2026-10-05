/**
 * Repérage des cases d'une grille Angle mort pour les générateurs : clés
 * d'indice et voisinage des cases de sol, en indices `y * width + x`.
 */
import { isFloor } from '~/games/anglemort/engine'
import type { Level, Pos } from '~/games/anglemort/types'

/** Case d'une clé d'indice `"x,y"`. */
export function parseKey(k: string): Pos {
  const [x, y] = k.split(',').map(Number)
  return [x, y]
}

/** Indices du niveau, par indice de case. */
export function clueEntries(level: Level): [number, number][] {
  return Object.entries(level.clues).map(([k, v]) => {
    const [x, y] = parseKey(k)
    return [y * level.width + x, v]
  })
}

/** Voisines de sol de chaque case (gauche, droite, haut, bas). */
export function floorNeighbours(level: Level): number[][] {
  const w = level.width
  const h = level.height
  return Array.from({ length: w * h }, (_, i) => {
    const x = i % w
    const y = Math.floor(i / w)
    const list: number[] = []
    if (x > 0) list.push(i - 1)
    if (x < w - 1) list.push(i + 1)
    if (y > 0) list.push(i - w)
    if (y < h - 1) list.push(i + w)
    return list.filter((n) => isFloor(level, n % w, Math.floor(n / w)))
  })
}
