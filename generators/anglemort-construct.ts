/**
 * Construction d'une grille Angle mort autour d'un couloir : tracé du
 * couloir, couverture gloutonne par les vigiles, piliers qui en réduisent le
 * nombre, diamant collé à un mur, miroirs.
 */
import {
  FACINGS,
  computeVision,
  isFacingAllowed,
  isFloor,
  isPlaceable,
  key,
  samePos,
  unseenCells,
} from '~/games/anglemort/engine'
import type { Guard, GuardType, Level, Pos } from '~/games/anglemort/types'
import type { Rng } from './random'

const PATH_STEPS = 4_000
/** Marge de score acceptée dans le choix glouton (variété des niveaux). */
const GREEDY_SLACK = 1
/** Densité maximale de piliers (piliers ÷ cases de la salle). */
const MAX_PILLAR_RATIO = 0.18
/** Essais de pilier par niveau pendant la phase de réduction. */
const PILLAR_TRIALS = 80

const STEPS: readonly Pos[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]

/** Types de vigiles disponibles pour la construction, et plafond de doubles. */
export type GuardKit = { types: readonly GuardType[]; maxDoubles: number }

/** Une grille en cours de construction et ses vigiles. */
export type Layout = { level: Level; guards: Guard[] }

export function doubles(guards: Guard[]): number {
  return guards.filter((g) => g.type !== 'simple').length
}

export function borderCells(width: number, height: number): Pos[] {
  const out: Pos[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) out.push([x, y])
    }
  }
  return out
}

export function offCorridor(level: Level, onPath: Set<string>): Pos[] {
  const cells: Pos[] = []
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (isFloor(level, x, y) && !onPath.has(key(x, y))) cells.push([x, y])
    }
  }
  return cells
}

function pathKeys(path: Pos[]): Set<string> {
  return new Set(path.map((p) => key(...p)))
}

function countTurns(path: Pos[]): number {
  let turns = 0
  for (let i = 2; i < path.length; i++) {
    const d1 = [path[i - 1][0] - path[i - 2][0], path[i - 1][1] - path[i - 2][1]]
    const d2 = [path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]]
    if (d1[0] !== d2[0] || d1[1] !== d2[1]) turns++
  }
  return turns
}

/**
 * Couloir **induit** depuis la porte : chaque nouvelle case ne touche aucune
 * case déjà posée sauf la précédente (sinon les cases dans l'ombre formeraient
 * un embranchement ou un bloc). Recherche en profondeur avec retour arrière,
 * voisins mélangés, jusqu'à la longueur visée avec au moins `minTurns`
 * virages ; `null` si le budget de pas est épuisé.
 */
export function randomPath(rng: Rng, level: Level, length: number, minTurns: number): Pos[] | null {
  const path: Pos[] = [level.door]
  const used = new Set([key(...level.door)])
  let budget = PATH_STEPS

  const extend = (): boolean => {
    if (path.length === length) return countTurns(path) >= minTurns
    if (--budget < 0) return false
    const [cx, cy] = path[path.length - 1]
    const options = rng.shuffle(
      STEPS.map(([dx, dy]): Pos => [cx + dx, cy + dy]).filter(([x, y]) => {
        if (!isFloor(level, x, y) || used.has(key(x, y))) return false
        return STEPS.every(([dx, dy]) => {
          const k = key(x + dx, y + dy)
          return k === key(cx, cy) || !used.has(k)
        })
      }),
    )
    for (const next of options) {
      path.push(next)
      used.add(key(...next))
      if (extend()) return true
      path.pop()
      used.delete(key(...next))
    }
    return false
  }

  return extend() ? path : null
}

/** Vrai si ces vigiles laissent dans l'ombre exactement les cases du couloir. */
function keepsCorridor(level: Level, path: Pos[], guards: Guard[]): boolean {
  const expected = pathKeys(path)
  const cells = unseenCells(level, guards, computeVision(level, guards))
  return cells.length === expected.size && cells.every((c) => expected.has(key(...c)))
}

/**
 * Retire les vigiles dont la pièce peut se passer : leurs cases restent
 * éclairées par les autres et le couloir ne change pas. Un vigile superflu
 * pourrait sinon être posé ailleurs, ce qui casserait l'unicité.
 */
function pruneRedundant(level: Level, path: Pos[], guards: Guard[]): Guard[] {
  let current = guards
  for (const guard of guards) {
    const rest = current.filter((g) => g !== guard)
    if (keepsCorridor(level, path, rest)) current = rest
  }
  return current
}

/** Cases hors couloir couvertes : éclairées ou occupées par un vigile. */
function coveredCount(level: Level, onPath: Set<string>, guards: Guard[]): number | null {
  const { seen } = computeVision(level, guards)
  const occupied = new Set(guards.map((g) => key(...g.pos)))
  let covered = 0
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (!isFloor(level, x, y)) continue
      const k = key(x, y)
      if (onPath.has(k)) {
        if (seen[y][x] > 0) return null
      } else if (seen[y][x] > 0 || occupied.has(k)) {
        covered++
      }
    }
  }
  return covered
}

/**
 * Couverture gloutonne : tant qu'une case hors couloir reste dans l'ombre, on
 * pose le vigile qui couvre le plus de cases en plus, sans jamais éclairer le
 * couloir (un nouveau vigile peut aussi masquer des cases, le décompte en
 * tient compte). Choix tiré au hasard parmi les meilleurs pour varier les
 * niveaux. Part des vigiles déjà posés, ce qui sert aussi à réparer une
 * couverture abîmée par un nouveau pilier.
 */
export function greedyCover(
  rng: Rng,
  level: Level,
  path: Pos[],
  kit: GuardKit,
  initial: Guard[],
): Guard[] | null {
  const onPath = pathKeys(path)
  const target = offCorridor(level, onPath).length
  let guards = initial
  let covered = coveredCount(level, onPath, guards)
  if (covered === null) return null
  const maxSteps = level.width * level.height
  for (let step = 0; step < maxSteps && covered < target; step++) {
    const occupied = new Set(guards.map((g) => key(...g.pos)))
    const types = doubles(guards) >= kit.maxDoubles ? (['simple'] as const) : kit.types
    const options: { guard: Guard; covered: number }[] = []
    for (const [x, y] of offCorridor(level, onPath)) {
      if (!isPlaceable(level, x, y) || occupied.has(key(x, y))) continue
      for (const type of types) {
        for (const facing of FACINGS[type]) {
          const guard: Guard = { pos: [x, y], type, facing }
          if (!isFacingAllowed(level, guard)) continue
          const next = coveredCount(level, onPath, [...guards, guard])
          if (next !== null && next > covered) options.push({ guard, covered: next })
        }
      }
    }
    if (options.length === 0) return null
    options.sort((a, b) => b.covered - a.covered)
    const best = options.filter((o) => o.covered >= options[0].covered - GREEDY_SLACK)
    const pick = rng.pick(best)
    guards = [...guards, pick.guard]
    covered = pick.covered
  }
  if (covered < target) return null
  return pruneRedundant(level, path, guards)
}

/**
 * Ajoute un pilier en `pos` et répare la couverture. Un vigile dont la lampe
 * se retrouve contre le pilier aurait une orientation interdite : on le
 * retire, la réparation le remplace au besoin. `null` si la couverture ne se
 * répare pas.
 */
function withPillar(
  rng: Rng,
  { level, guards }: Layout,
  path: Pos[],
  kit: GuardKit,
  pos: Pos,
): Layout | null {
  const candidate: Level = { ...level, pillars: [...level.pillars, pos] }
  const kept = guards.filter((g) => !samePos(g.pos, ...pos) && isFacingAllowed(candidate, g))
  const repaired = greedyCover(rng, candidate, path, kit, pruneRedundant(candidate, path, kept))
  return repaired ? { level: candidate, guards: repaired } : null
}

/**
 * Ajoute des piliers un par un pour faire baisser le nombre de vigiles, et
 * jusqu'au minimum de piliers du niveau : on pose un pilier (de préférence sur
 * un vigile, qu'il remplace en bloquant la lumière comme lui), on répare la
 * couverture, et on garde le pilier si le total de vigiles a baissé.
 */
export function reduceWithPillars(
  rng: Rng,
  start: Layout,
  path: Pos[],
  kit: GuardKit,
  {
    targetGuards,
    minPillars,
    maxPillars,
  }: { targetGuards: number; minPillars: number; maxPillars: number },
): Layout {
  const onPath = pathKeys(path)
  const { width, height } = start.level
  const pillarCap = Math.min(maxPillars, Math.floor(width * height * MAX_PILLAR_RATIO))
  let current = start
  const unfinished = () =>
    current.guards.length > targetGuards || current.level.pillars.length < minPillars
  for (let trial = 0; trial < PILLAR_TRIALS && unfinished(); trial++) {
    const { level, guards } = current
    if (level.pillars.length >= pillarCap) break
    const onGuard = rng.nextInt(3) > 0 && guards.length > 0
    const pos = onGuard ? rng.pick(guards).pos : rng.pick(offCorridor(level, onPath))
    if (samePos(pos, ...level.door) || samePos(pos, ...level.diamond)) continue
    const next = withPillar(rng, current, path, kit, pos)
    // Sous le minimum de piliers, un pilier qui ne fait pas grimper le nombre
    // de vigiles est gardé aussi.
    const needPillar = level.pillars.length < minPillars
    if (
      next &&
      (next.guards.length < guards.length || (needPillar && next.guards.length <= guards.length))
    ) {
      current = next
    }
  }
  return current
}

/** Vrai si une case voisine du diamant est hors de la salle ou un pilier. */
function diamondAgainstWall(level: Level): boolean {
  const [x, y] = level.diamond
  return STEPS.some(([dx, dy]) => {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return true
    return level.pillars.some((p) => p[0] === nx && p[1] === ny)
  })
}

/** Voisines de sol du diamant hors du couloir. */
function besideDiamond(level: Level, path: Pos[]): Pos[] {
  const onPath = pathKeys(path)
  const [x, y] = level.diamond
  return STEPS.map(([dx, dy]): Pos => [x + dx, y + dy]).filter(
    ([nx, ny]) => isFloor(level, nx, ny) && !onPath.has(key(nx, ny)),
  )
}

/**
 * Colle le diamant à un pilier s'il ne touche pas déjà le mur : on essaie un
 * pilier sur chaque case voisine hors couloir, en réparant la couverture des
 * vigiles. `null` si aucune case ne convient.
 */
export function placeDiamondAgainstWall(
  rng: Rng,
  layout: Layout,
  path: Pos[],
  kit: GuardKit,
): Layout | null {
  if (diamondAgainstWall(layout.level)) return layout
  for (const pos of rng.shuffle(besideDiamond(layout.level, path))) {
    const next = withPillar(rng, layout, path, kit, pos)
    if (next) return next
  }
  return null
}

/**
 * Niveau 4 : colle le diamant à un pilier dès le tracé du couloir, avant de
 * poser les vigiles, s'il ne touche pas déjà le mur. Le chemin étant induit,
 * le diamant a toujours une voisine libre hors couloir.
 */
export function anchorDiamond(rng: Rng, level: Level, path: Pos[]): Level {
  if (diamondAgainstWall(level)) return level
  const options = besideDiamond(level, path)
  return options.length > 0 ? { ...level, pillars: [...level.pillars, rng.pick(options)] } : level
}

/**
 * Niveau 4 : piliers dans `count` coudes du couloir, avant de poser les
 * vigiles. La case intérieure d'un virage touche le couloir sur deux côtés :
 * toute ligne qui la traverse traverse aussi le couloir, seul un vigile posé
 * dessus pourrait la couvrir. Un pilier fait l'économie de ce vigile.
 */
export function cornerPillars(rng: Rng, level: Level, path: Pos[], count: number): Level {
  const blocked = new Set([...path, ...level.pillars].map((p) => key(...p)))
  const inner = new Map<string, Pos>()
  for (let i = 1; i < path.length - 1; i++) {
    const [a, p, b] = [path[i - 1], path[i], path[i + 1]]
    if (a[0] === b[0] || a[1] === b[1]) continue
    const c: Pos = [a[0] + b[0] - p[0], a[1] + b[1] - p[1]]
    if (isFloor(level, ...c) && !blocked.has(key(...c))) inner.set(key(...c), c)
  }
  const picked = rng.shuffle([...inner.values()]).slice(0, count)
  return { ...level, pillars: [...level.pillars, ...picked] }
}

/**
 * Vrai si chaque miroir est indispensable : remplacé par un pilier, il
 * laisserait des cases hors du couloir dans l'ombre. Un miroir qui ne renvoie
 * la lumière que dans le mur ne serait qu'un pilier déguisé.
 */
function mirrorsEssential({ level, guards }: Layout, path: Pos[]): boolean {
  return level.mirrors.every((m) => {
    const walled: Level = {
      ...level,
      mirrors: level.mirrors.filter((o) => o !== m),
      pillars: [...level.pillars, m.pos],
    }
    return !keepsCorridor(walled, path, guards)
  })
}

/**
 * Vigile à une lampe sur la case duquel tombe le faisceau d'un autre vigile :
 * seul candidat à céder sa place à un miroir. Un vigile bloque la lumière, on
 * regarde donc si sa case serait éclairée sans lui.
 */
function isTargeted({ level, guards }: Layout, guard: Guard): boolean {
  if (guard.type !== 'simple') return false
  const [x, y] = guard.pos
  return (
    computeVision(
      level,
      guards.filter((g) => g !== guard),
    ).seen[y][x] > 0
  )
}

/**
 * Remplace jusqu'à `count` vigiles par des miroirs. Un vigile qui reçoit un
 * faisceau par le côté peut céder sa place à un miroir qui renvoie ce faisceau
 * sur sa propre ligne : ses cases restent éclairées, avec un vigile de moins.
 * On essaie chaque vigile dans les deux sens de miroir, et on garde le
 * remplacement si le couloir est intact et chaque miroir indispensable.
 */
export function replaceGuardsWithMirrors(
  rng: Rng,
  layout: Layout,
  path: Pos[],
  count: number,
): Layout {
  let current = layout
  for (let placed = 0; placed < count; placed++) {
    const targets = current.guards.filter((g) => isTargeted(current, g))
    const options = rng.shuffle(
      targets.flatMap((g) => (['/', '\\'] as const).map((kind) => ({ g, kind }))),
    )
    const next = options
      .map(({ g, kind }) => ({
        level: { ...current.level, mirrors: [...current.level.mirrors, { pos: g.pos, kind }] },
        guards: current.guards.filter((o) => o !== g),
      }))
      .find((c) => keepsCorridor(c.level, path, c.guards) && mirrorsEssential(c, path))
    if (!next) break
    current = next
  }
  return current
}
