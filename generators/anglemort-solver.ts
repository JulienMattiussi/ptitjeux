/**
 * Solveur Angle mort, build-time uniquement : cherche les poses du lot
 * **entier** qui respectent les indices et laissent un couloir unique.
 *
 * Les bornes d'éclairage et la propagation vivent dans
 * `anglemort-propagate.ts`. Le branchement se fait **par case** (une variante
 * de vigile, ou aucun vigile), ce qui partitionne l'espace : chaque solution
 * est trouvée une seule fois, donc on peut compter. La validation finale
 * passe par le moteur du jeu.
 */
import {
  GUARD_TYPES,
  areCluesSatisfied,
  computeVision,
  isSinglePath,
  unseenCells,
} from '~/games/anglemort/engine'
import type { Guard, Level, Pos } from '~/games/anglemort/types'
import {
  type Ctx,
  type Node,
  choose,
  cloneNode,
  coverers,
  forcePath,
  makeCtx,
  needsCover,
  propagate,
} from './anglemort-propagate'

export type SolveOptions = {
  /** Cases imposées sur le chemin (la porte et le diamant le sont toujours). */
  forcedPath?: Pos[]
  /** Cases imposées hors du chemin (donc vigile ou éclairées). */
  forbiddenPath?: Pos[]
  /** Arrêt dès que ce nombre de solutions est atteint. */
  limit: number
  /** Budget de nœuds explorés ; au-delà, la recherche est déclarée incomplète. */
  maxNodes: number
}

export type SolveResult = {
  /** Solutions distinctes à l'écran (cf. `visibleKey`). */
  solutions: Guard[][]
  /** `false` si le budget a été épuisé avant la fin de l'exploration. */
  complete: boolean
}

type Search = {
  ctx: Ctx
  options: SolveOptions
  nodes: number
  aborted: boolean
  solutions: Guard[][]
  seenKeys: Set<string>
}

function chosenGuards(ctx: Ctx, n: Node): Guard[] {
  const out: Guard[] = []
  ctx.cands.forEach((c, k) => {
    if (n.cand[k] === 1) {
      out.push({ pos: [c.pos % ctx.w, Math.floor(c.pos / ctx.w)], type: c.type, facing: c.facing })
    }
  })
  return out
}

function isSolution(ctx: Ctx, n: Node): boolean {
  if (GUARD_TYPES.some((t) => n.chosen[t] !== ctx.level.pool[t])) return false
  const { level } = ctx
  const guards = chosenGuards(ctx, n)
  const vision = computeVision(level, guards)
  return (
    areCluesSatisfied(level, vision) &&
    isSinglePath(unseenCells(level, guards, vision), level.door, level.diamond)
  )
}

/**
 * Ce que voit le joueur : cases et types des vigiles, plus l'éclairage de
 * chaque case. Deux placements qui ne diffèrent que par l'orientation d'une
 * lampe braquée sur un mur donnent le même plateau : ils comptent pour une
 * seule solution, puisque aucun indice ne pourrait les départager.
 */
function visibleKey(level: Level, guards: Guard[]): string {
  const placed = guards.map((g) => `${g.pos[0]},${g.pos[1]}:${g.type}`).sort()
  return `${placed.join(';')}|${computeVision(level, guards).seen.join(';')}`
}

function record(s: Search, n: Node): void {
  if (!isSolution(s.ctx, n)) return
  const guards = chosenGuards(s.ctx, n)
  const k = visibleKey(s.ctx.level, guards)
  if (s.seenKeys.has(k)) return
  s.seenKeys.add(k)
  s.solutions.push(guards)
}

function spend(s: Search): boolean {
  if (s.aborted || s.solutions.length >= s.options.limit) return false
  if (++s.nodes > s.options.maxNodes) {
    s.aborted = true
    return false
  }
  return true
}

/**
 * Toutes les cases sont décidées. Il peut rester des vigiles du lot sans rôle
 * de couverture : on les ajoute par indices croissants pour énumérer chaque
 * complément une seule fois.
 */
function fill(s: Search, n: Node, from: number): void {
  const { ctx } = s
  if (!GUARD_TYPES.some((t) => n.chosen[t] < ctx.level.pool[t])) {
    record(s, n)
    return
  }
  for (let k = from; k < ctx.cands.length; k++) {
    if (n.cand[k] !== 0) continue
    if (!spend(s)) return
    const child = cloneNode(n)
    if (choose(ctx, child, k) && propagate(ctx, child)) fill(s, child, k + 1)
  }
}

/**
 * Borne inférieure du nombre de vigiles encore à poser : des cases à couvrir
 * dont les cases candidates sont deux à deux disjointes exigent chacune un
 * vigile distinct. Ensemble indépendant glouton, des plus contraintes aux
 * moins contraintes.
 */
function guardsNeeded(mandatory: Set<number>[]): number {
  const used = new Set<number>()
  let needed = 0
  for (const positions of [...mandatory].sort((a, c) => a.size - c.size)) {
    if ([...positions].some((p) => used.has(p))) continue
    for (const p of positions) used.add(p)
    needed++
  }
  return needed
}

function guardsLeft(ctx: Ctx, n: Node): number {
  const { pool } = ctx.level
  return (
    pool.simple + pool.angle + pool.oppose - (n.chosen.simple + n.chosen.angle + n.chosen.oppose)
  )
}

/**
 * Branche sur la case à couvrir la moins bien desservie. Ses couvreurs
 * possibles sont ordonnés ; la branche i pose le couvreur i et interdit les
 * précédents, la dernière n'en pose aucun. Chaque solution tombe ainsi dans
 * exactement une branche, même si le blocage empêche finalement un couvreur
 * posé d'éclairer la case.
 */
function search(s: Search, n: Node): void {
  const { ctx } = s
  if (!spend(s)) return
  const b = propagate(ctx, n)
  if (!b) return

  let target = -1
  let options: number[] = []
  let bestScore = Infinity
  const mandatory: Set<number>[] = []
  for (let u = 0; u < ctx.size; u++) {
    if (!needsCover(ctx, n, b, u)) continue
    const { cands, uncertain } = coverers(ctx, n, b, u)
    if (n.path[u] === -1 && !uncertain) {
      mandatory.push(new Set(cands.map((k) => ctx.cands[k].pos)))
    }
    // Sans couvreur à poser, la case se décide via les autres choix (blocage
    // ou chemin) : brancher dessus ne ferait pas avancer la recherche.
    if (cands.length === 0) continue
    const score = cands.length + (uncertain || n.path[u] === 0 ? 1 : 0)
    if (score < bestScore) {
      target = u
      options = cands
      bestScore = score
    }
  }
  if (guardsNeeded(mandatory) > guardsLeft(ctx, n)) return
  if (target === -1) {
    fill(s, n, 0)
    return
  }

  for (let idx = 0; idx < options.length; idx++) {
    const child = cloneNode(n)
    for (let j = 0; j < idx; j++) if (child.cand[options[j]] === 0) child.cand[options[j]] = -1
    if (choose(ctx, child, options[idx])) search(s, child)
    if (s.aborted || s.solutions.length >= s.options.limit) return
  }
  const none = cloneNode(n)
  for (const k of options) if (none.cand[k] === 0) none.cand[k] = -1
  search(s, none)
}

export function solveAngleMort(level: Level, options: SolveOptions): SolveResult {
  const ctx = makeCtx(level)
  const s: Search = { ctx, options, nodes: 0, aborted: false, solutions: [], seenKeys: new Set() }
  const n: Node = {
    cand: new Int8Array(ctx.cands.length),
    path: new Int8Array(ctx.size),
    chosen: { simple: 0, angle: 0, oppose: 0 },
  }
  const forced = [level.door, level.diamond, ...(options.forcedPath ?? [])]
  const ok = forced.every(([x, y]) => forcePath(ctx, n, y * ctx.w + x))
  for (const [x, y] of options.forbiddenPath ?? []) {
    if (n.path[y * ctx.w + x] !== 1) n.path[y * ctx.w + x] = -1
  }
  if (ok) search(s, n)
  return { solutions: s.solutions, complete: !s.aborted }
}
