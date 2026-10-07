import type { Block, Coord, Direction, GameState, Level } from './types'

const DIRECTIONS: Record<Direction, Coord> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

function eq(a: Coord, b: Coord): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

function add(a: Coord, d: Coord): Coord {
  return [a[0] + d[0], a[1] + d[1]]
}

function inBounds(level: Level, [x, y]: Coord): boolean {
  return x >= 0 && y >= 0 && x < level.width && y < level.height
}

export function isWall(level: Level, c: Coord): boolean {
  return level.walls.some((w) => eq(w, c))
}

export function isIce(level: Level, c: Coord): boolean {
  return level.ice.some((i) => eq(i, c))
}

export function blockAt(blocks: Block[], c: Coord): Block | undefined {
  return blocks.find((b) => eq(b.pos, c))
}

/** Rang de la case `c` dans le mot cible, -1 hors cible. */
export function targetIndexAt(level: Level, c: Coord): number {
  return level.target.cells.findIndex((t) => eq(t, c))
}

export function loadLevel(level: Level): GameState {
  return {
    level,
    player: level.player,
    blocks: level.blocks.map((b) => ({ ...b, pos: [...b.pos] as Coord })),
    moves: 0,
    lastDirection: 'right',
  }
}

/**
 * Sur la glace, une entité glisse jusqu'au premier obstacle (`isBlocking`, ou
 * bord de grille) ou jusqu'à la première case sans glace, où elle s'arrête.
 */
function slideUntilBlocked(
  level: Level,
  from: Coord,
  dir: Coord,
  isBlocking: (c: Coord) => boolean,
): Coord {
  let pos: Coord = from
  while (true) {
    const next = add(pos, dir)
    if (!inBounds(level, next) || isBlocking(next)) return pos
    pos = next
    if (!isIce(level, pos)) return pos
  }
}

export function applyMove(state: GameState, direction: Direction): GameState {
  const dir = DIRECTIONS[direction]
  const { level } = state
  const startTarget = add(state.player, dir)

  if (!inBounds(level, startTarget) || isWall(level, startTarget)) return state

  const pushed = blockAt(state.blocks, startTarget)

  let newBlocks = state.blocks
  let newPlayer: Coord

  if (pushed) {
    const behind = add(pushed.pos, dir)
    if (!inBounds(level, behind) || isWall(level, behind) || blockAt(state.blocks, behind)) {
      return state
    }
    let blockRest: Coord = behind
    if (isIce(level, behind)) {
      blockRest = slideUntilBlocked(level, behind, dir, (c) => {
        if (isWall(level, c)) return true
        return state.blocks.some((b) => b.id !== pushed.id && eq(b.pos, c))
      })
    }
    newBlocks = state.blocks.map((b) => (b.id === pushed.id ? { ...b, pos: blockRest } : b))
    newPlayer = pushed.pos
  } else {
    newPlayer = startTarget
    if (isIce(level, startTarget)) {
      newPlayer = slideUntilBlocked(level, startTarget, dir, (c) => {
        if (isWall(level, c)) return true
        return state.blocks.some((b) => eq(b.pos, c))
      })
    }
  }

  return {
    ...state,
    player: newPlayer,
    blocks: newBlocks,
    moves: state.moves + 1,
    lastDirection: direction,
  }
}

function reset(state: GameState): GameState {
  return loadLevel(state.level)
}

/** Grille résolue : la solution enregistrée rejouée (test d'intégrité, solution d'un jour passé). */
export function solvedState(level: Level): GameState {
  return level.solution.reduce(applyMove, loadLevel(level))
}

export function isWon(state: GameState): boolean {
  const { target } = state.level
  if (target.cells.length !== target.word.length) return false
  return target.cells.every((_, index) => isCellFilled(state, index))
}

/** La case cible n° `index` porte la bonne lettre. */
export function isCellFilled(state: GameState, index: number): boolean {
  const block = blockAt(state.blocks, state.level.target.cells[index])
  return block?.letter.toUpperCase() === state.level.target.word[index].toUpperCase()
}

/**
 * Rang de placement (1 = première posée) de chaque lettre du mot cible, dans
 * l'ordre de la solution enregistrée : une lettre compte comme posée au dernier
 * coup qui l'amène sur sa case, puisqu'elle n'en bouge plus ensuite.
 */
export function placementOrder(level: Level): number[] {
  const placedAt = level.target.cells.map(() => -1)
  let state = loadLevel(level)
  level.solution.forEach((direction, step) => {
    state = applyMove(state, direction)
    placedAt.forEach((at, i) => {
      if (!isCellFilled(state, i)) placedAt[i] = -1
      else if (at === -1) placedAt[i] = step
    })
  })
  const sorted = placedAt.map((at, i) => ({ at, i })).sort((a, b) => a.at - b.at || a.i - b.i)
  const ranks = placedAt.map(() => 0)
  sorted.forEach(({ i }, rank) => (ranks[i] = rank + 1))
  return ranks
}

export type Action = { type: 'move'; direction: Direction } | { type: 'reset' }

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'move':
      return applyMove(state, action.direction)
    case 'reset':
      return reset(state)
  }
}
