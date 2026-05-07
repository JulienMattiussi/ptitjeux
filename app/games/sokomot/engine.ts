import type { Block, Coord, Direction, GameSnapshot, GameState, Level } from './types'

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

function isWall(level: Level, c: Coord): boolean {
  return level.walls.some((w) => eq(w, c))
}

function isIce(level: Level, c: Coord): boolean {
  return level.ice.some((i) => eq(i, c))
}

function blockAt(blocks: Block[], c: Coord): Block | undefined {
  return blocks.find((b) => eq(b.pos, c))
}

export function loadLevel(level: Level): GameState {
  return {
    level,
    player: level.player,
    blocks: level.blocks.map((b) => ({ ...b, pos: [...b.pos] as Coord })),
    moves: 0,
    history: [],
    lastDirection: 'right',
  }
}

function snapshot(state: GameState): GameSnapshot {
  return {
    player: [...state.player] as Coord,
    blocks: state.blocks.map((b) => ({ ...b, pos: [...b.pos] as Coord })),
    lastDirection: state.lastDirection,
  }
}

/**
 * Slide an entity from `from` toward `dir` until it hits an obstacle.
 * Used on ice. Returns the resting position.
 *
 * `predicateBlocking(c)` is called for each candidate destination ; it must
 * return true if the cell is blocked (wall, another block, out of bounds).
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
    if (
      !inBounds(level, behind) ||
      isWall(level, behind) ||
      blockAt(state.blocks, behind)
    ) {
      // Can't push.
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
    history: [...state.history, snapshot(state)],
    lastDirection: direction,
  }
}

export function undo(state: GameState): GameState {
  if (state.history.length === 0) return state
  const previous = state.history[state.history.length - 1]
  return {
    ...state,
    player: previous.player,
    blocks: previous.blocks,
    moves: Math.max(0, state.moves - 1),
    history: state.history.slice(0, -1),
    lastDirection: previous.lastDirection,
  }
}

export function reset(state: GameState): GameState {
  return loadLevel(state.level)
}

export function isWon(state: GameState): boolean {
  const { target } = state.level
  if (target.cells.length !== target.word.length) return false
  return target.cells.every((cell, index) => {
    const block = blockAt(state.blocks, cell)
    return block?.letter.toUpperCase() === target.word[index].toUpperCase()
  })
}
