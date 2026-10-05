/**
 * Briques communes aux générateurs Sokomot : directions, clés de case, murs
 * d'enceinte, placement des cibles et des obstacles, marche du joueur.
 */
import type { Block, Coord, Direction } from '~/games/sokomot/types'
import type { Rng } from './random'

/** Ordre fixe : il conditionne les tirages et les chemins, donc les niveaux produits. */
export const DIRECTIONS: ReadonlyArray<{ dir: Direction; vec: Coord }> = [
  { dir: 'up', vec: [0, -1] },
  { dir: 'down', vec: [0, 1] },
  { dir: 'left', vec: [-1, 0] },
  { dir: 'right', vec: [1, 0] },
]

/** Niveau en cours de construction, avant le calcul de `parMoves` par les solveurs. */
export type LevelDraft = {
  walls: Coord[]
  ice: Coord[]
  player: Coord
  blocks: Block[]
  targets: Coord[]
  solution: Direction[]
}

export const cellKey = (c: Coord): string => `${c[0]},${c[1]}`
export const eq = (a: Coord, b: Coord): boolean => a[0] === b[0] && a[1] === b[1]

export function vectorOf(dir: Direction): Coord {
  return DIRECTIONS.find((d) => d.dir === dir)!.vec
}

/**
 * Pas autorisés pour la marche aléatoire des cibles : la lettre suivante
 * peut être à droite, en bas, en bas-à-droite ou en haut-à-droite. Jamais à
 * gauche, jamais directement au-dessus, pour que le mot se lise de gauche à
 * droite.
 */
const TARGET_STEPS: readonly Coord[] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
]

export function buildBorderWalls(width: number, height: number): Coord[] {
  const walls: Coord[] = []
  for (let x = 0; x < width; x++) {
    walls.push([x, 0])
    walls.push([x, height - 1])
  }
  for (let y = 1; y < height - 1; y++) {
    walls.push([0, y])
    walls.push([width - 1, y])
  }
  return walls
}

export function inInterior(c: Coord, width: number, height: number): boolean {
  return c[0] >= 1 && c[0] <= width - 2 && c[1] >= 1 && c[1] <= height - 2
}

export function inferSize(cells: Coord[]): { width: number; height: number } {
  let mx = 0
  let my = 0
  for (const c of cells) {
    if (c[0] > mx) mx = c[0]
    if (c[1] > my) my = c[1]
  }
  return { width: mx + 1, height: my + 1 }
}

export function letterBlocks(word: string, positions: Coord[]): Block[] {
  return positions.map((pos, i) => ({ id: `b${i + 1}`, letter: word[i], pos }))
}

export function placeTargetsRandomWalk(
  rng: Rng,
  wordLen: number,
  width: number,
  height: number,
): Coord[] | null {
  const used = new Set<string>()
  const targets: Coord[] = []
  // Départ dans le quart haut-gauche, pour laisser le mot grandir vers la
  // droite et le bas.
  let cur: Coord = [
    1 + rng.nextInt(Math.max(1, Math.floor((width - 1) / 2))),
    1 + rng.nextInt(Math.max(1, Math.floor((height - 1) / 2))),
  ]
  targets.push(cur)
  used.add(cellKey(cur))

  for (let i = 1; i < wordLen; i++) {
    let placed = false
    for (let attempt = 0; attempt < 50; attempt++) {
      const [dx, dy] = rng.pick(TARGET_STEPS)
      const next: Coord = [cur[0] + dx, cur[1] + dy]
      if (!inInterior(next, width, height)) continue
      if (used.has(cellKey(next))) continue
      targets.push(next)
      used.add(cellKey(next))
      cur = next
      placed = true
      break
    }
    if (!placed) return null
  }
  return targets
}

/** Obstacles tirés parmi les cases intérieures hors de `forbidden`. */
export function placeRandomObstacles(
  rng: Rng,
  count: number,
  forbidden: Set<string>,
  width: number,
  height: number,
): Coord[] {
  if (count <= 0) return []
  const candidates: Coord[] = []
  for (let y = 1; y <= height - 2; y++) {
    for (let x = 1; x <= width - 2; x++) {
      if (!forbidden.has(cellKey([x, y]))) candidates.push([x, y])
    }
  }
  rng.shuffle(candidates)
  return candidates.slice(0, Math.min(count, candidates.length))
}

/** Cases visitées par le joueur pendant `moves`, départ compris. */
export function tracePlayerCells(start: Coord, moves: Direction[]): Set<string> {
  const cells = new Set<string>([cellKey(start)])
  let pos = start
  for (const m of moves) {
    const vec = vectorOf(m)
    pos = [pos[0] + vec[0], pos[1] + vec[1]]
    cells.add(cellKey(pos))
  }
  return cells
}

/**
 * Plus court chemin du joueur, un pas par coup, sans glissade ni poussée :
 * `null` si `goal` est inaccessible en évitant `obstacles`.
 */
export function walkPath(
  start: Coord,
  goal: Coord,
  obstacles: ReadonlySet<string>,
  width: number,
  height: number,
): Direction[] | null {
  if (eq(start, goal)) return []
  type Node = { pos: Coord; parent: number; dir: Direction | null }
  const nodes: Node[] = [{ pos: start, parent: -1, dir: null }]
  const visited = new Set<string>([cellKey(start)])
  let head = 0
  while (head < nodes.length) {
    const node = nodes[head++]
    for (const { dir, vec } of DIRECTIONS) {
      const next: Coord = [node.pos[0] + vec[0], node.pos[1] + vec[1]]
      if (next[0] < 0 || next[0] >= width || next[1] < 0 || next[1] >= height) continue
      const nk = cellKey(next)
      if (obstacles.has(nk) || visited.has(nk)) continue
      visited.add(nk)
      nodes.push({ pos: next, parent: head - 1, dir })
      if (eq(next, goal)) {
        const path: Direction[] = []
        for (let i = nodes.length - 1; i > 0; i = nodes[i].parent) path.unshift(nodes[i].dir!)
        return path
      }
    }
  }
  return null
}
