/**
 * Propagation du solveur Angle mort : règles de déduction sur les bornes
 * d'éclairage (`anglemort-bounds.ts`), appliquées jusqu'au point fixe.
 */
import { GUARD_TYPES } from '~/games/anglemort/engine'
import {
  type Bounds,
  type Ctx,
  type Node,
  computeBounds,
  coverers,
  forcePath,
  needsCover,
  surelyLights,
} from './anglemort-bounds'

/**
 * Une règle de déduction : `true` si elle a changé le nœud, `false` sinon,
 * `null` sur une contradiction.
 */
type Rule = (ctx: Ctx, n: Node, b: Bounds) => boolean | null

/** Le lot doit être posé en entier : assez de cases pour chaque type restant. */
const poolStillFits: Rule = (ctx, n) => {
  for (const type of GUARD_TYPES) {
    const missing = ctx.level.pool[type] - n.chosen[type]
    if (missing === 0) continue
    const positions = new Set<number>()
    ctx.cands.forEach((c, k) => c.type === type && n.cand[k] === 0 && positions.add(c.pos))
    if (positions.size < missing) return null
  }
  return false
}

/** Chaque indice reste entre l'éclairage sûr et l'éclairage possible. */
const cluesInBounds: Rule = (ctx, _n, b) => {
  for (const [i, clue] of ctx.clues) {
    if (b.sure[i] > clue || b.sure[i] + b.maybe[i] < clue) return null
  }
  return false
}

/** Une case éclairée sort du chemin ; une case que rien ne peut éclairer ni occuper y entre. */
const lightDecidesPath: Rule = (ctx, n, b) => {
  let changed = false
  for (let i = 0; i < ctx.size; i++) {
    if (!ctx.floor[i] || b.guardAt[i]) continue
    const lit = b.sure[i] > 0
    if (n.path[i] === 1 && lit) return null
    if (lit && n.path[i] === 0) {
      n.path[i] = -1
      changed = true
    }
    if (!lit && b.maybe[i] === 0 && !b.canGuard[i]) {
      if (n.path[i] === -1) return null
      if (n.path[i] === 0) {
        if (!forcePath(ctx, n, i)) return null
        changed = true
      }
    }
  }
  return changed
}

/** Une case du chemin a deux voisines sur le chemin (une seule aux extrémités). */
const pathDegrees: Rule = (ctx, n, b) => {
  let changed = false
  for (let i = 0; i < ctx.size; i++) {
    if (n.path[i] !== 1) continue
    const needed = ctx.ends.has(i) ? 1 : 2
    let onPath = 0
    const open: number[] = []
    for (const j of ctx.neighbours[i]) {
      if (n.path[j] === 1) onPath++
      else if (n.path[j] === 0 && !b.guardAt[j] && b.sure[j] === 0) open.push(j)
    }
    if (onPath > needed || onPath + open.length < needed) return null
    if (open.length > 0 && onPath === needed) {
      for (const j of open) n.path[j] = -1
      changed = true
    } else if (open.length > 0 && onPath + open.length === needed) {
      for (const j of open) if (!forcePath(ctx, n, j)) return null
      changed = true
    }
  }
  return changed
}

/** Interdit les candidats qui éclaireraient à coup sûr le chemin ou un indice déjà atteint. */
const forbidHarmful: Rule = (ctx, n, b) => {
  let changed = false
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] !== 0) return
    for (const ray of c.rays) {
      for (const i of ray) {
        if (b.guardAt[i]) break
        const saturated = ctx.clues.has(i) && b.sure[i] >= (ctx.clues.get(i) as number)
        if ((n.path[i] === 1 || saturated) && surelyLights(ctx, b, k, i)) {
          n.cand[k] = -1
          changed = true
          return
        }
        if (b.canGuard[i]) break
      }
    }
  })
  return changed
}

/**
 * Le couloir relie la porte au diamant par des cases qui peuvent encore être
 * dans l'ombre. Les cases indécises hors de portée sortent du couloir. Compte
 * aussi comme changement tout ce que les règles précédentes ont modifié du
 * chemin depuis le calcul des bornes.
 */
const connectCorridor: Rule = (ctx, n, b) => {
  const open = (i: number) => ctx.floor[i] && !b.guardAt[i] && n.path[i] !== -1 && b.sure[i] === 0
  const [door, diamond] = [...ctx.ends]
  const reached = new Uint8Array(ctx.size)
  const queue = [door]
  reached[door] = 1
  while (queue.length > 0) {
    const i = queue.pop() as number
    for (const j of ctx.neighbours[i]) {
      if (!reached[j] && open(j)) {
        reached[j] = 1
        queue.push(j)
      }
    }
  }
  if (!reached[diamond]) return null
  for (let i = 0; i < ctx.size; i++) {
    if (n.path[i] === 1 && !reached[i]) return null
    if (n.path[i] === 0 && open(i) && !reached[i]) n.path[i] = -1
  }
  return n.path.some((v, i) => v !== b.pathSnapshot[i])
}

/**
 * Une case hors chemin qu'une seule case candidate peut encore éclairer :
 * seules les variantes de cette case qui l'éclairent restent permises.
 */
const singleCoverer: Rule = (ctx, n, b) => {
  let changed = false
  for (let u = 0; u < ctx.size; u++) {
    if (!needsCover(ctx, n, b, u) || n.path[u] !== -1) continue
    const { cands, uncertain } = coverers(ctx, n, b, u)
    if (uncertain || cands.length === 0) continue
    const pos = ctx.cands[cands[0]].pos
    if (cands.some((k) => ctx.cands[k].pos !== pos)) continue
    for (const k of ctx.candsAt[pos]) {
      if (n.cand[k] === 0 && !cands.includes(k)) {
        n.cand[k] = -1
        changed = true
      }
    }
  }
  return changed
}

/** Ordre fixe : il conditionne le parcours de la recherche. */
const RULES: readonly Rule[] = [
  poolStillFits,
  cluesInBounds,
  lightDecidesPath,
  pathDegrees,
  forbidHarmful,
  connectCorridor,
  singleCoverer,
]

/** Propagation jusqu'au point fixe. Renvoie les bornes, ou `null` si contradiction. */
export function propagate(ctx: Ctx, n: Node): Bounds | null {
  for (;;) {
    const b = computeBounds(ctx, n)
    let changed = false
    for (const rule of RULES) {
      const result = rule(ctx, n, b)
      if (result === null) return null
      if (result) changed = true
    }
    if (!changed) return b
  }
}
