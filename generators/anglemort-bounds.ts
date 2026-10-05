/**
 * Contexte du solveur Angle mort : candidats (case, variante) et leurs
 * faisceaux, nœuds de recherche, bornes d'éclairage. Les règles de déduction
 * qui s'en servent vivent dans `anglemort-propagate.ts`.
 *
 * Un vigile arrête le faisceau des autres : l'éclairage d'une case dépend donc
 * des vigiles posés **plus loin** sur le faisceau. Chaque candidat (case,
 * variante) garde ses faisceaux sous forme de listes ordonnées de cases (ce
 * qu'il éclairerait sans aucun autre vigile), tronquées dynamiquement :
 *
 * - une case est **éclairée à coup sûr** si un vigile posé la voit et qu'aucune
 *   case intermédiaire ne peut encore recevoir de vigile ;
 * - elle est **peut-être éclairée** si un vigile posé ou encore posable peut
 *   l'atteindre sans traverser un vigile déjà posé.
 */
import {
  DELTA,
  FACINGS,
  GUARD_TYPES,
  REFLECT,
  guardDirs,
  isFacingAllowed,
  isFloor,
  isPlaceable,
} from '~/games/anglemort/engine'
import type { Guard, GuardType, Level } from '~/games/anglemort/types'
import { clueEntries, floorNeighbours } from './anglemort-grid'

type Candidate = {
  pos: number
  type: GuardType
  facing: Guard['facing']
  /** Cases de sol traversées par chaque faisceau, dans l'ordre. */
  rays: number[][]
}

export type Node = {
  /** 0 disponible, 1 choisi, -1 interdit. */
  cand: Int8Array
  /** 1 sur le chemin, -1 hors chemin, 0 indécis. */
  path: Int8Array
  chosen: Record<GuardType, number>
}

/** Bornes d'éclairage recalculées à chaque passe de propagation. */
export type Bounds = {
  /** État du chemin au moment du calcul des bornes. */
  pathSnapshot: Int8Array
  guardAt: Uint8Array
  canGuard: Uint8Array
  sure: Int16Array
  maybe: Int16Array
}

/** Données fixes d'une résolution. */
export type Ctx = {
  level: Level
  w: number
  size: number
  floor: boolean[]
  ends: Set<number>
  clues: Map<number, number>
  cands: Candidate[]
  candsAt: number[][]
  neighbours: number[][]
}

function traceRays(level: Level, guard: Guard): number[][] {
  const w = level.width
  const pillars = new Set(level.pillars.map(([x, y]) => y * w + x))
  const mirrors = new Map(level.mirrors.map((m) => [m.pos[1] * w + m.pos[0], m.kind]))
  const start = guard.pos[1] * w + guard.pos[0]
  return guardDirs(guard).map((first) => {
    const ray: number[] = []
    let [x, y] = guard.pos
    let dir = first
    for (;;) {
      x += DELTA[dir][0]
      y += DELTA[dir][1]
      const i = y * w + x
      if (x < 0 || y < 0 || x >= w || y >= level.height || pillars.has(i) || i === start) break
      const mirror = mirrors.get(i)
      if (mirror) {
        dir = REFLECT[mirror][dir]
        continue
      }
      ray.push(i)
    }
    return ray
  })
}

function buildCandidates(level: Level): Candidate[] {
  const out: Candidate[] = []
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (!isPlaceable(level, x, y)) continue
      for (const type of GUARD_TYPES) {
        if (level.pool[type] === 0) continue
        for (const facing of FACINGS[type]) {
          const guard: Guard = { pos: [x, y], type, facing }
          if (!isFacingAllowed(level, guard)) continue
          out.push({ pos: y * level.width + x, type, facing, rays: traceRays(level, guard) })
        }
      }
    }
  }
  return out
}

export function makeCtx(level: Level): Ctx {
  const w = level.width
  const size = w * level.height
  const cands = buildCandidates(level)
  const candsAt: number[][] = Array.from({ length: size }, () => [])
  cands.forEach((c, k) => candsAt[c.pos].push(k))
  return {
    level,
    w,
    size,
    floor: Array.from({ length: size }, (_, i) => isFloor(level, i % w, Math.floor(i / w))),
    ends: new Set([level.door[1] * w + level.door[0], level.diamond[1] * w + level.diamond[0]]),
    clues: new Map(clueEntries(level)),
    cands,
    candsAt,
    neighbours: floorNeighbours(level),
  }
}

export function cloneNode(n: Node): Node {
  return { cand: n.cand.slice(), path: n.path.slice(), chosen: { ...n.chosen } }
}

function forbidAt(ctx: Ctx, n: Node, i: number): void {
  for (const k of ctx.candsAt[i]) if (n.cand[k] === 0) n.cand[k] = -1
}

export function forcePath(ctx: Ctx, n: Node, i: number): boolean {
  if (n.path[i] === -1) return false
  if (ctx.candsAt[i].some((k) => n.cand[k] === 1)) return false
  n.path[i] = 1
  forbidAt(ctx, n, i)
  return true
}

/** Pose le candidat `k` ; `false` s'il n'est pas posable. */
export function choose(ctx: Ctx, n: Node, k: number): boolean {
  const c = ctx.cands[k]
  if (n.cand[k] !== 0 || n.path[c.pos] === 1) return false
  if (n.chosen[c.type] >= ctx.level.pool[c.type]) return false
  forbidAt(ctx, n, c.pos)
  n.cand[k] = 1
  n.chosen[c.type]++
  n.path[c.pos] = -1
  if (n.chosen[c.type] === ctx.level.pool[c.type]) {
    ctx.cands.forEach((other, j) => {
      if (other.type === c.type && n.cand[j] === 0) n.cand[j] = -1
    })
  }
  return true
}

export function computeBounds(ctx: Ctx, n: Node): Bounds {
  const guardAt = new Uint8Array(ctx.size)
  const canGuard = new Uint8Array(ctx.size)
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] === 1) guardAt[c.pos] = 1
    else if (n.cand[k] === 0) canGuard[c.pos] = 1
  })
  const sure = new Int16Array(ctx.size)
  const maybe = new Int16Array(ctx.size)
  // Un même vigile (ou une même case candidate) ne compte qu'une fois par case.
  const sureMark = new Int32Array(ctx.size).fill(-1)
  const maybeMark = new Int32Array(ctx.size).fill(-1)
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] === -1) return
    const placed = n.cand[k] === 1
    for (const ray of c.rays) {
      let certain = placed
      for (const i of ray) {
        if (guardAt[i]) break
        if (certain) {
          if (sureMark[i] !== c.pos) {
            sureMark[i] = c.pos
            sure[i]++
          }
        } else if (maybeMark[i] !== c.pos) {
          maybeMark[i] = c.pos
          maybe[i]++
        }
        if (canGuard[i]) certain = false
      }
    }
  })
  return { pathSnapshot: n.path.slice(), guardAt, canGuard, sure, maybe }
}

/**
 * Vrai si le candidat éclairerait à coup sûr la case `target` une fois posé :
 * aucune case intermédiaire ne peut plus recevoir de vigile.
 */
export function surelyLights(ctx: Ctx, b: Bounds, k: number, target: number): boolean {
  for (const ray of ctx.cands[k].rays) {
    for (const i of ray) {
      if (b.guardAt[i]) break
      if (i === target) return true
      if (b.canGuard[i]) break
    }
  }
  return false
}

function reaches(ray: number[], target: number, b: Bounds): boolean {
  for (const i of ray) {
    if (b.guardAt[i]) return false
    if (i === target) return true
  }
  return false
}

/** Case de sol ni vigile, ni éclairée à coup sûr, ni sur le chemin. */
export function needsCover(ctx: Ctx, n: Node, b: Bounds, u: number): boolean {
  return ctx.floor[u] && !b.guardAt[u] && b.sure[u] === 0 && n.path[u] !== 1
}

/**
 * Candidats disponibles qui pourraient couvrir `u` (posés dessus, ou dont un
 * faisceau l'atteint sans traverser de vigile posé), et présence d'un vigile
 * déjà posé qui l'éclairera si rien ne s'interpose.
 */
export function coverers(
  ctx: Ctx,
  n: Node,
  b: Bounds,
  u: number,
): { cands: number[]; uncertain: boolean } {
  const cands = ctx.candsAt[u].filter((k) => n.cand[k] === 0)
  let uncertain = false
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] === -1 || c.pos === u) return
    if (!c.rays.some((ray) => reaches(ray, u, b))) return
    if (n.cand[k] === 1) uncertain = true
    else cands.push(k)
  })
  return { cands, uncertain }
}
