import type { Dir, GameState, Guard, GuardType, Level, MirrorKind, Pos } from './types'

const DIRS: readonly Dir[] = ['N', 'E', 'S', 'W']

export const DELTA: Record<Dir, Pos> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }

export const CLOCKWISE: Record<Dir, Dir> = { N: 'E', E: 'S', S: 'W', W: 'N' }

export const OPPOSITE: Record<Dir, Dir> = { N: 'S', E: 'W', S: 'N', W: 'E' }

export const REFLECT: Record<MirrorKind, Record<Dir, Dir>> = {
  '/': { E: 'N', N: 'E', W: 'S', S: 'W' },
  '\\': { E: 'S', S: 'E', W: 'N', N: 'W' },
}

/** Ordre de pose et du sélecteur : du plus simple au plus puissant. */
export const GUARD_TYPES: readonly GuardType[] = ['simple', 'angle', 'oppose']

/** Les vigiles `oppose` n'ont que 2 orientations distinctes (━ et ┃). */
export const FACINGS: Record<GuardType, readonly Dir[]> = {
  simple: DIRS,
  angle: DIRS,
  oppose: ['N', 'E'],
}

/** Orientation d'un vigile présenté hors de la grille (réserve, sélecteur de type). */
export function restFacing(type: GuardType): Dir {
  return type === 'oppose' ? 'E' : 'N'
}

/** Côté du mur d'enceinte où s'ouvre la porte (elle est toujours sur le bord). */
export function doorSide(level: Level): Dir {
  const [x, y] = level.door
  if (x === 0) return 'W'
  if (x === level.width - 1) return 'E'
  if (y === 0) return 'N'
  return 'S'
}

/** Direction d'un pas entre deux cases voisines. */
export function stepDir([fx, fy]: Pos, [tx, ty]: Pos): Dir {
  if (tx > fx) return 'E'
  if (tx < fx) return 'W'
  return ty > fy ? 'S' : 'N'
}

export function key(x: number, y: number): string {
  return `${x},${y}`
}

/** Case d'une clé `"x,y"` (inverse de `key`). */
export function parseKey(k: string): Pos {
  const [x, y] = k.split(',').map(Number)
  return [x, y]
}

export function guardDirs(guard: Pick<Guard, 'type' | 'facing'>): Dir[] {
  switch (guard.type) {
    case 'simple':
      return [guard.facing]
    case 'angle':
      return [guard.facing, CLOCKWISE[guard.facing]]
    case 'oppose':
      return [guard.facing, OPPOSITE[guard.facing]]
  }
}

function inBounds(level: Level, x: number, y: number): boolean {
  return x >= 0 && x < level.width && y >= 0 && y < level.height
}

export function samePos(a: Pos, x: number, y: number): boolean {
  return a[0] === x && a[1] === y
}

function isPillar(level: Level, x: number, y: number): boolean {
  return level.pillars.some((p) => samePos(p, x, y))
}

function mirrorAt(level: Level, x: number, y: number): MirrorKind | undefined {
  return level.mirrors.find((m) => samePos(m.pos, x, y))?.kind
}

/** Case de sol : ni pilier ni miroir. */
export function isFloor(level: Level, x: number, y: number): boolean {
  return inBounds(level, x, y) && !isPillar(level, x, y) && mirrorAt(level, x, y) === undefined
}

/** Case de sol qui peut recevoir un vigile : ni porte, ni diamant, ni indice. */
export function isPlaceable(level: Level, x: number, y: number): boolean {
  return (
    isFloor(level, x, y) &&
    !samePos(level.door, x, y) &&
    !samePos(level.diamond, x, y) &&
    level.clues[key(x, y)] === undefined
  )
}

export function guardAt(state: GameState, x: number, y: number): Guard | undefined {
  return state.guards.find((g) => samePos(g.pos, x, y))
}

export function loadLevel(level: Level): GameState {
  return { level, guards: [], moves: 0 }
}

function reset(state: GameState): GameState {
  return loadLevel(state.level)
}

function countPlaced(guards: Guard[], type: GuardType): number {
  return guards.filter((g) => g.type === type).length
}

export function remaining(state: GameState, type: GuardType): number {
  return state.level.pool[type] - countPlaced(state.guards, type)
}

/** Types de vigiles présents dans le lot, dans l'ordre du sélecteur (touches 1, 2, 3). */
export function pickableTypes(state: GameState): GuardType[] {
  return GUARD_TYPES.filter((t) => state.level.pool[t] > 0)
}

/**
 * Une lampe ne peut pas être braquée directement contre le mur d'enceinte ou
 * un pilier : chaque direction du vigile doit donner sur une case de la salle.
 */
export function isFacingAllowed(level: Level, guard: Guard): boolean {
  return guardDirs(guard).every((d) => {
    const x = guard.pos[0] + DELTA[d][0]
    const y = guard.pos[1] + DELTA[d][1]
    return inBounds(level, x, y) && !isPillar(level, x, y)
  })
}

/** Variantes (type, orientation) autorisées sur une case, dans l'ordre de cycle. */
function allowedVariants(level: Level, pos: Pos, types: readonly GuardType[]) {
  return types
    .flatMap((type) => FACINGS[type].map((facing) => ({ type, facing })))
    .filter((v) => isFacingAllowed(level, { pos, ...v }))
}

/**
 * Pose un vigile du type demandé (choisi dans le sélecteur), ou à défaut du
 * premier type encore disponible dans le lot.
 */
export function placeGuard(state: GameState, x: number, y: number, type?: GuardType): GameState {
  if (!isPlaceable(state.level, x, y) || guardAt(state, x, y)) return state
  const available = type
    ? remaining(state, type) > 0
      ? [type]
      : []
    : GUARD_TYPES.filter((t) => remaining(state, t) > 0)
  const [variant] = allowedVariants(state.level, [x, y], available)
  if (!variant) return state
  const guard: Guard = { pos: [x, y], ...variant }
  return { ...state, guards: [...state.guards, guard], moves: state.moves + 1 }
}

export function removeGuard(state: GameState, x: number, y: number): GameState {
  if (!guardAt(state, x, y)) return state
  return { ...state, guards: state.guards.filter((g) => !samePos(g.pos, x, y)) }
}

export function toggleGuard(state: GameState, x: number, y: number, type?: GuardType): GameState {
  return guardAt(state, x, y) ? removeGuard(state, x, y) : placeGuard(state, x, y, type)
}

/**
 * Passe à l'orientation autorisée suivante du vigile, sans changer son type
 * (le type se choisit au sélecteur avant la pose).
 */
export function rotateGuard(state: GameState, x: number, y: number): GameState {
  const current = guardAt(state, x, y)
  if (!current) return state
  const variants = allowedVariants(state.level, current.pos, [current.type])
  if (variants.length === 0) return state
  const index = variants.findIndex((v) => v.type === current.type && v.facing === current.facing)
  const next = variants[(index + 1) % variants.length]
  const guards = state.guards.map((g) => (g === current ? { ...g, ...next } : g))
  return { ...state, guards }
}

/** Moitié d'une case de miroir, de part et d'autre de la diagonale. */
export type MirrorHalf = 'NW' | 'NE' | 'SE' | 'SW'

export type Vision = {
  /** Nombre de vigiles qui voient chaque case, indexé `[y][x]`. */
  seen: number[][]
  /** Moitiés de miroir touchées par un faisceau, indexées par `key(x, y)`. */
  litMirrors: Record<string, MirrorHalf[]>
}

/** Moitié du miroir par laquelle entre un faisceau qui avance vers `dir`. */
function mirrorHalf(kind: MirrorKind, dir: Dir): MirrorHalf {
  if (kind === '/') return dir === 'E' || dir === 'S' ? 'NW' : 'SE'
  return dir === 'W' || dir === 'S' ? 'NE' : 'SW'
}

type BeamStep = {
  pos: Pos
  mirror?: MirrorKind
  /** Direction du faisceau en entrant dans la case. */
  dir: Dir
  /** Direction en sortant (différente après un miroir). */
  out: Dir
}

/**
 * Un faisceau avance case par case, s'arrête au bord, sur un pilier ou sur un
 * vigile (qui fait de l'ombre derrière lui, y compris le sien au retour d'une
 * boucle de miroirs), et est dévié par les miroirs. La réflexion est
 * réversible : un faisceau ne boucle donc jamais ailleurs que sur son vigile.
 */
function beamSteps(level: Level, occupied: Set<string>, from: Pos, start: Dir): BeamStep[] {
  const steps: BeamStep[] = []
  let [x, y] = from
  let dir = start
  for (;;) {
    x += DELTA[dir][0]
    y += DELTA[dir][1]
    if (!inBounds(level, x, y) || isPillar(level, x, y) || occupied.has(key(x, y))) break
    const mirror = mirrorAt(level, x, y)
    const out = mirror ? REFLECT[mirror][dir] : dir
    steps.push({ pos: [x, y], mirror, dir, out })
    dir = out
  }
  return steps
}

export function computeVision(level: Level, guards: Guard[]): Vision {
  const seen = Array.from({ length: level.height }, () => Array<number>(level.width).fill(0))
  const litMirrors: Record<string, MirrorHalf[]> = {}
  const occupied = new Set(guards.map((g) => key(...g.pos)))

  for (const guard of guards) {
    const counted = new Set<string>()
    for (const start of guardDirs(guard)) {
      for (const { pos, mirror, dir } of beamSteps(level, occupied, guard.pos, start)) {
        const k = key(...pos)
        if (mirror) {
          const half = mirrorHalf(mirror, dir)
          const halves = (litMirrors[k] ??= [])
          if (!halves.includes(half)) halves.push(half)
          continue
        }
        // Un vigile à 2 champs qui voit une case par ses deux regards (via un
        // miroir) ne la surveille qu'une fois.
        if (!counted.has(k)) {
          counted.add(k)
          seen[pos[1]][pos[0]]++
        }
      }
    }
  }

  return { seen, litMirrors }
}

/**
 * Tracé des faisceaux d'un vigile posé, une ligne brisée par lampe, en
 * coordonnées de case (centre de la case (x, y) en (x, y)). Chaque ligne part
 * du vigile, passe par les miroirs et s'arrête au bord de la case qui la
 * bloque.
 */
export function beamOutlines(level: Level, guards: Guard[], guard: Guard): Pos[][] {
  const occupied = new Set(guards.map((g) => key(...g.pos)))
  return guardDirs(guard).map((start) => {
    const steps = beamSteps(level, occupied, guard.pos, start)
    const corners = steps.filter((s) => s.mirror).map((s) => s.pos)
    const last = steps.at(-1)
    const [lx, ly] = last?.pos ?? guard.pos
    const out = last?.out ?? start
    return [guard.pos, ...corners, [lx + DELTA[out][0] / 2, ly + DELTA[out][1] / 2]]
  })
}

/** Cases de sol sans vigile que personne ne voit : le couloir du cambrioleur. */
export function unseenCells(level: Level, guards: Guard[], vision: Vision): Pos[] {
  const occupied = new Set(guards.map((g) => key(g.pos[0], g.pos[1])))
  const cells: Pos[] = []
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (isFloor(level, x, y) && !occupied.has(key(x, y)) && vision.seen[y][x] === 0) {
        cells.push([x, y])
      }
    }
  }
  return cells
}

/**
 * Vrai si les cases forment un unique chemin sans embranchement de la porte
 * au diamant : extrémités de degré 1, autres cases de degré 2, et connexité.
 */
export function isSinglePath(cells: Pos[], door: Pos, diamond: Pos): boolean {
  const set = new Set(cells.map(([x, y]) => key(x, y)))
  const doorKey = key(door[0], door[1])
  const diamondKey = key(diamond[0], diamond[1])
  if (!set.has(doorKey) || !set.has(diamondKey) || doorKey === diamondKey) return false

  const neighbours = (x: number, y: number) =>
    DIRS.map((d) => key(x + DELTA[d][0], y + DELTA[d][1])).filter((k) => set.has(k))

  for (const [x, y] of cells) {
    const k = key(x, y)
    const expected = k === doorKey || k === diamondKey ? 1 : 2
    if (neighbours(x, y).length !== expected) return false
  }

  const reached = new Set([doorKey])
  const queue: Pos[] = [door]
  while (queue.length > 0) {
    const [x, y] = queue.shift() as Pos
    for (const n of neighbours(x, y)) {
      if (!reached.has(n)) {
        reached.add(n)
        queue.push(parseKey(n))
      }
    }
  }
  return reached.size === set.size
}

/**
 * Cases du couloir dans l'ordre de marche, de la porte au diamant. Suppose un
 * couloir valide (cf. `isSinglePath`) ; s'arrête au premier cul-de-sac sinon.
 */
export function corridorOrder(cells: Pos[], door: Pos): Pos[] {
  const set = new Set(cells.map(([x, y]) => key(x, y)))
  if (!set.has(key(...door))) return []
  const order: Pos[] = [door]
  const visited = new Set([key(...door)])
  for (;;) {
    const [x, y] = order[order.length - 1]
    const next = DIRS.map((d): Pos => [x + DELTA[d][0], y + DELTA[d][1]]).find(
      ([nx, ny]) => set.has(key(nx, ny)) && !visited.has(key(nx, ny)),
    )
    if (!next) return order
    order.push(next)
    visited.add(key(...next))
  }
}

/** Couloir attendu, révélé par l'aide : celui que laisse la solution enregistrée. */
export function expectedCorridor(level: Level): Pos[] {
  return unseenCells(level, level.solution, computeVision(level, level.solution))
}

export function areCluesSatisfied(level: Level, vision: Vision): boolean {
  return Object.entries(level.clues).every(([k, count]) => {
    const [x, y] = parseKey(k)
    return vision.seen[y][x] === count
  })
}

export function isPoolComplete(state: GameState): boolean {
  return GUARD_TYPES.every((t) => remaining(state, t) === 0)
}

export function isWon(state: GameState): boolean {
  if (!isPoolComplete(state)) return false
  const { level, guards } = state
  const vision = computeVision(level, guards)
  return (
    areCluesSatisfied(level, vision) &&
    isSinglePath(unseenCells(level, guards, vision), level.door, level.diamond)
  )
}

export type Action =
  | { type: 'toggle'; x: number; y: number; guardType?: GuardType }
  | { type: 'rotate'; x: number; y: number }
  | { type: 'reset' }

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'toggle':
      return toggleGuard(state, action.x, action.y, action.guardType)
    case 'rotate':
      return rotateGuard(state, action.x, action.y)
    case 'reset':
      return reset(state)
  }
}
