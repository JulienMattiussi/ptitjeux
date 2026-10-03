import type { Dir, GameState, Guard, GuardType, Level, MirrorKind, Pos } from './types'

export const DIRS: readonly Dir[] = ['N', 'E', 'S', 'W']

const DELTA: Record<Dir, Pos> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }

const CLOCKWISE: Record<Dir, Dir> = { N: 'E', E: 'S', S: 'W', W: 'N' }

const OPPOSITE: Record<Dir, Dir> = { N: 'S', E: 'W', S: 'N', W: 'E' }

const REFLECT: Record<MirrorKind, Record<Dir, Dir>> = {
  '/': { E: 'N', N: 'E', W: 'S', S: 'W' },
  '\\': { E: 'S', S: 'E', W: 'N', N: 'W' },
}

/** Ordre de pose et de cycle des types : du plus simple au plus puissant. */
export const GUARD_TYPES: readonly GuardType[] = ['simple', 'angle', 'oppose']

/** Les vigiles `oppose` n'ont que 2 orientations distinctes (━ et ┃). */
const FACINGS: Record<GuardType, readonly Dir[]> = {
  simple: DIRS,
  angle: DIRS,
  oppose: ['N', 'E'],
}

export function key(x: number, y: number): string {
  return `${x},${y}`
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

function samePos(a: Pos, x: number, y: number): boolean {
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

export function reset(state: GameState): GameState {
  return loadLevel(state.level)
}

function countPlaced(guards: Guard[], type: GuardType): number {
  return guards.filter((g) => g.type === type).length
}

export function remaining(state: GameState, type: GuardType): number {
  return state.level.pool[type] - countPlaced(state.guards, type)
}

/**
 * Une lampe ne peut pas être braquée directement contre le mur d'enceinte ou
 * un pilier : chaque direction du vigile doit donner sur une case de la salle.
 */
export function isFacingAllowed(level: Level, guard: Omit<Guard, 'pos'> & { pos: Pos }): boolean {
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

export function placeGuard(state: GameState, x: number, y: number): GameState {
  if (!isPlaceable(state.level, x, y) || guardAt(state, x, y)) return state
  const available = GUARD_TYPES.filter((t) => remaining(state, t) > 0)
  const [variant] = allowedVariants(state.level, [x, y], available)
  if (!variant) return state
  const guard: Guard = { pos: [x, y], ...variant }
  return { ...state, guards: [...state.guards, guard], moves: state.moves + 1 }
}

export function removeGuard(state: GameState, x: number, y: number): GameState {
  if (!guardAt(state, x, y)) return state
  return { ...state, guards: state.guards.filter((g) => !samePos(g.pos, x, y)) }
}

export function toggleGuard(state: GameState, x: number, y: number): GameState {
  return guardAt(state, x, y) ? removeGuard(state, x, y) : placeGuard(state, x, y)
}

/**
 * Passe à l'orientation suivante du vigile ; après la dernière orientation de
 * son type, bascule sur le type suivant encore disponible dans le lot. Une
 * seule touche suffit ainsi à parcourir toutes les variantes posables.
 */
export function rotateGuard(state: GameState, x: number, y: number): GameState {
  const current = guardAt(state, x, y)
  if (!current) return state
  const others = state.guards.filter((g) => g !== current)
  const types = GUARD_TYPES.filter(
    (t) => t === current.type || state.level.pool[t] - countPlaced(others, t) > 0,
  )
  const variants = allowedVariants(state.level, current.pos, types)
  if (variants.length === 0) return state
  const index = variants.findIndex((v) => v.type === current.type && v.facing === current.facing)
  const next = variants[(index + 1) % variants.length]
  const guards = state.guards.map((g) => (g === current ? { ...g, ...next } : g))
  return { ...state, guards }
}

export type Vision = {
  /** Nombre de vigiles qui voient chaque case, indexé `[y][x]`. */
  seen: number[][]
}

/**
 * Un faisceau avance case par case, s'arrête au bord, sur un pilier ou sur un
 * autre vigile (qui fait de l'ombre derrière lui), et est dévié par les
 * miroirs.
 */
export function computeVision(level: Level, guards: Guard[]): Vision {
  const seen = Array.from({ length: level.height }, () => Array<number>(level.width).fill(0))
  const occupied = new Set(guards.map((g) => key(...g.pos)))

  for (const guard of guards) {
    const counted = new Set<string>()
    for (const start of guardDirs(guard)) {
      let [x, y] = guard.pos
      let dir = start
      for (;;) {
        x += DELTA[dir][0]
        y += DELTA[dir][1]
        if (!inBounds(level, x, y) || isPillar(level, x, y)) break
        // Couvre aussi le retour sur son propre vigile via les miroirs : la
        // réflexion est réversible, un faisceau ne boucle donc jamais ailleurs.
        if (occupied.has(key(x, y))) break
        const mirror = mirrorAt(level, x, y)
        if (mirror) {
          dir = REFLECT[mirror][dir]
          continue
        }
        // Un vigile à 2 champs qui voit une case par ses deux regards (via un
        // miroir) ne la surveille qu'une fois.
        if (!counted.has(key(x, y))) {
          counted.add(key(x, y))
          seen[y][x]++
        }
      }
    }
  }

  return { seen }
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
        queue.push(n.split(',').map(Number) as Pos)
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

export function areCluesSatisfied(level: Level, vision: Vision): boolean {
  return Object.entries(level.clues).every(([k, count]) => {
    const [x, y] = k.split(',').map(Number)
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
  | { type: 'toggle'; x: number; y: number }
  | { type: 'rotate'; x: number; y: number }
  | { type: 'reset' }

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'toggle':
      return toggleGuard(state, action.x, action.y)
    case 'rotate':
      return rotateGuard(state, action.x, action.y)
    case 'reset':
      return reset(state)
  }
}
