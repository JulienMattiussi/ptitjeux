/**
 * Les 8 symétries d'une grille Angle mort (4 rotations × miroir), pour tirer
 * 8 niveaux d'une même grille de base. Une symétrie préserve tout : couloir,
 * éclairage, solutions (donc l'unicité). Les quarts de tour échangent largeur
 * et hauteur (versions portrait).
 */
import { CLOCKWISE, FACINGS, guardDirs } from '~/games/anglemort/engine'
import type { Dir, Guard, Level, MirrorKind, Pos } from '~/games/anglemort/types'
import { parseKey } from './anglemort-grid'

/** 0..7 : `variant % 4` quarts de tour horaires, précédés d'un miroir gauche-droite si `variant >= 4`. */
export type Variant = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export const VARIANTS: readonly Variant[] = [0, 1, 2, 3, 4, 5, 6, 7]

const FLIP: Record<Dir, Dir> = { N: 'N', S: 'S', E: 'W', W: 'E' }

type Transform = {
  pos: (p: Pos) => Pos
  dir: (d: Dir) => Dir
  width: number
  height: number
  /** Chaque miroir ou quart de tour inverse le sens d'un miroir ╱ ╲. */
  swapsMirrors: boolean
}

function makeTransform(width: number, height: number, variant: Variant): Transform {
  const flip = variant >= 4
  const turns = variant % 4
  const pos = ([x0, y0]: Pos): Pos => {
    let x = flip ? width - 1 - x0 : x0
    let y = y0
    let w = width
    let h = height
    for (let i = 0; i < turns; i++) {
      ;[x, y] = [h - 1 - y, x]
      ;[w, h] = [h, w]
    }
    return [x, y]
  }
  const dir = (d0: Dir): Dir => {
    let d = flip ? FLIP[d0] : d0
    for (let i = 0; i < turns; i++) d = CLOCKWISE[d]
    return d
  }
  const odd = turns % 2 === 1
  return {
    pos,
    dir,
    width: odd ? height : width,
    height: odd ? width : height,
    swapsMirrors: (turns + (flip ? 1 : 0)) % 2 === 1,
  }
}

/** Orientation qui produit les mêmes directions éclairées après transformation. */
function transformGuard(t: Transform, guard: Guard): Guard {
  const dirs = new Set(guardDirs(guard).map(t.dir))
  const facing = FACINGS[guard.type].find((f) => {
    const candidate = guardDirs({ type: guard.type, facing: f })
    return candidate.length === dirs.size && candidate.every((d) => dirs.has(d))
  }) as Dir
  return { pos: t.pos(guard.pos), type: guard.type, facing }
}

const SWAPPED: Record<MirrorKind, MirrorKind> = { '/': '\\', '\\': '/' }

export function transformLevel(level: Level, variant: Variant): Level {
  const t = makeTransform(level.width, level.height, variant)
  const index = level.name.match(/Niveau (\d)/)?.[1] ?? '?'
  return {
    ...level,
    name: `Niveau ${index} · ${t.width}×${t.height}`,
    width: t.width,
    height: t.height,
    pillars: level.pillars.map(t.pos),
    mirrors: level.mirrors.map((m) => ({
      pos: t.pos(m.pos),
      kind: t.swapsMirrors ? SWAPPED[m.kind] : m.kind,
    })),
    door: t.pos(level.door),
    diamond: t.pos(level.diamond),
    clues: Object.fromEntries(
      Object.entries(level.clues).map(([k, v]) => {
        const [x, y] = t.pos(parseKey(k))
        return [`${x},${y}`, v]
      }),
    ),
    solution: level.solution.map((g) => transformGuard(t, g)),
  }
}
