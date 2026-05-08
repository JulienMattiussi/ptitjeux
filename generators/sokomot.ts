import { Rng } from '~/lib/random'
import type { Block, Coord, Direction, Level } from '~/games/sokomot/types'
import { WORDS_BY_LENGTH } from './wordlists'

/** Niveaux 2 et 4 : mécanique de glace. */
export function isIceIndex(index: 1 | 2 | 3 | 4): boolean {
  return index === 2 || index === 4
}

const DIRECTIONS: Array<{ dir: Direction; vec: Coord }> = [
  { dir: 'up', vec: [0, -1] },
  { dir: 'down', vec: [0, 1] },
  { dir: 'left', vec: [-1, 0] },
  { dir: 'right', vec: [1, 0] },
]

const cellKey = (c: Coord): string => `${c[0]},${c[1]}`
const eq = (a: Coord, b: Coord): boolean => a[0] === b[0] && a[1] === b[1]

/**
 * Génère un niveau Sokomot pour une date et un index donnés.
 *
 * Niveaux glace (2, 4) : layout linéaire fixe (cible adossée au mur du haut,
 * blocs au bas, glace entre les deux pour que le bloc glisse jusqu'à la cible).
 *
 * Niveaux classiques (1, 3) : disposition **libre** des cases cibles. On fait
 * une marche aléatoire dans la grille pour les positionner (les lettres
 * peuvent former une diagonale, un zig-zag ou n'importe quoi). Pour chaque
 * cible, on choisit une direction de poussée libre parmi les 4. Un solveur
 * BFS calcule le chemin du joueur. Si la configuration générée n'est pas
 * solvable, on retente avec une autre graine.
 *
 * Tailles : 7×6, 8×7, 9×8, 10×9 — mots de 3 à 6 lettres.
 */
export function generateSokomotLevel(date: string, index: 1 | 2 | 3 | 4): Level {
  const isIce = isIceIndex(index)
  const width = 6 + index
  const height = 5 + index
  const wordLen = 2 + index
  const rng = new Rng(`sokomot:${date}:${index}`)
  const words = WORDS_BY_LENGTH[wordLen] ?? []
  const entry = rng.pick(words)
  const word = entry.display

  if (isIce) {
    return buildIceLevel(date, index, word, entry.canonical, width, height)
  }

  // Nombre d'obstacles aléatoires sur les niveaux non-glace : plus le niveau
  // est avancé, plus on en met. Toujours sur des cases qui ne perturbent pas
  // la solution.
  const obstacleCount = Math.max(0, index - 1)

  // Tentatives successives de génération libre. Reseed à chaque essai pour
  // diverger sans casser le déterminisme global (le premier succès est fixe).
  for (let attempt = 0; attempt < 30; attempt++) {
    const attemptRng = new Rng(`sokomot:${date}:${index}:freeform:${attempt}`)
    const candidate = tryGenerateFreeform(attemptRng, word, width, height, obstacleCount)
    if (candidate) {
      return finalize(candidate, date, index, word, entry.canonical)
    }
  }
  // Filet de sécurité : layout linéaire (toujours résoluble).
  return finalize(
    buildLinearFreeformFallback(word, width, height),
    date,
    index,
    word,
    entry.canonical,
  )
}

type LevelDraft = {
  walls: Coord[]
  ice: Coord[]
  player: Coord
  blocks: Block[]
  targets: Coord[]
  solution: Direction[]
}

function finalize(
  draft: LevelDraft,
  date: string,
  index: 1 | 2 | 3 | 4,
  word: string,
  canonical: string,
): Level {
  return {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${draft.walls[0] !== undefined ? 'salle' : ''}`.trim(),
    width: maxX(draft.walls) + 1,
    height: maxY(draft.walls) + 1,
    player: draft.player,
    walls: draft.walls,
    ice: draft.ice,
    blocks: draft.blocks,
    target: { word, cells: draft.targets },
    parMoves: draft.solution.length + 2,
    solution: draft.solution,
    canonicalWord: canonical,
  }
}

function maxX(cells: Coord[]): number {
  let m = 0
  for (const c of cells) if (c[0] > m) m = c[0]
  return m
}
function maxY(cells: Coord[]): number {
  let m = 0
  for (const c of cells) if (c[1] > m) m = c[1]
  return m
}

// ---------- Niveau glace : layout linéaire fixe ----------

function buildIceLevel(
  date: string,
  index: 1 | 2 | 3 | 4,
  word: string,
  canonical: string,
  width: number,
  height: number,
): Level {
  const wordLen = word.length
  const targetRow = 1
  const blockRow = height - 3
  const playerRow = height - 2
  const pushRow = blockRow + 1
  const leftStart = Math.floor((width - wordLen) / 2)

  const walls = buildBorderWalls(width, height)

  const ice: Coord[] = []
  for (let y = targetRow; y < blockRow; y++) {
    for (let x = 1; x < width - 1; x++) ice.push([x, y])
  }

  const targets: Coord[] = []
  const blocks: Block[] = []
  for (let i = 0; i < wordLen; i++) {
    const col = leftStart + i
    targets.push([col, targetRow])
    blocks.push({ id: `b${i + 1}`, letter: word[i], pos: [col, blockRow] })
  }

  const player: Coord = [1, playerRow]
  const solution: Direction[] = []
  let pos: Coord = [...player] as Coord
  while (pos[1] > pushRow) {
    solution.push('up')
    pos = [pos[0], pos[1] - 1]
  }
  blocks.forEach((b, i) => {
    while (pos[0] < b.pos[0]) {
      solution.push('right')
      pos = [pos[0] + 1, pos[1]]
    }
    while (pos[0] > b.pos[0]) {
      solution.push('left')
      pos = [pos[0] - 1, pos[1]]
    }
    solution.push('up')
    pos = [pos[0], pos[1] - 1]
    if (i < blocks.length - 1) {
      solution.push('down')
      pos = [pos[0], pos[1] + 1]
    }
  })

  return {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height} · glace`,
    width,
    height,
    player,
    walls,
    ice,
    blocks,
    target: { word, cells: targets },
    parMoves: solution.length + 2,
    solution,
    canonicalWord: canonical,
  }
}

// ---------- Génération libre ----------

function buildBorderWalls(width: number, height: number): Coord[] {
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

function inInterior(c: Coord, width: number, height: number): boolean {
  return c[0] >= 1 && c[0] <= width - 2 && c[1] >= 1 && c[1] <= height - 2
}

/**
 * Pas autorisés pour la marche aléatoire des cibles : la lettre suivante
 * peut être à droite, en bas, en bas-à-droite ou en haut-à-droite. Jamais à
 * gauche, jamais directement au-dessus. Cela donne une lecture cohérente et
 * un layout naturel pour l'œil.
 */
const SOKOMOT_STEPS: readonly Coord[] = [
  [1, 0], // droite
  [0, 1], // bas
  [1, 1], // bas-droite
  [1, -1], // haut-droite
] as const

function placeTargetsRandomWalk(
  rng: Rng,
  wordLen: number,
  width: number,
  height: number,
): Coord[] | null {
  const used = new Set<string>()
  const targets: Coord[] = []
  // Position de départ : aléatoire dans le quart haut-gauche pour laisser
  // place à la croissance vers la droite et le bas.
  let cur: Coord = [
    1 + rng.nextInt(Math.max(1, Math.floor((width - 1) / 2))),
    1 + rng.nextInt(Math.max(1, Math.floor((height - 1) / 2))),
  ]
  targets.push(cur)
  used.add(cellKey(cur))

  for (let i = 1; i < wordLen; i++) {
    let placed = false
    for (let attempt = 0; attempt < 50; attempt++) {
      const [dx, dy] = rng.pick(SOKOMOT_STEPS)
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

/**
 * Pour chaque cible, choisit une direction de poussée et une position de bloc
 * adjacente. Renvoie les blocs initiaux + direction de poussée + position du
 * pousseur (cellule où le joueur doit se trouver pour effectuer la poussée).
 */
function placeBlocksAndPushDirections(
  rng: Rng,
  targets: Coord[],
  width: number,
  height: number,
): { blocks: Coord[]; pushDirs: Direction[]; pushers: Coord[] } | null {
  const targetSet = new Set(targets.map(cellKey))
  const usedBlocks = new Set<string>()
  const blocks: Coord[] = []
  const pushDirs: Direction[] = []
  const pushers: Coord[] = []

  for (const t of targets) {
    let placed = false
    // Essaie les 4 directions dans un ordre randomisé pour varier les niveaux.
    const order = rng.shuffle([...DIRECTIONS])
    for (const { dir, vec } of order) {
      const block: Coord = [t[0] - vec[0], t[1] - vec[1]]
      const pusher: Coord = [t[0] - 2 * vec[0], t[1] - 2 * vec[1]]
      if (!inInterior(block, width, height)) continue
      if (!inInterior(pusher, width, height)) continue
      const bk = cellKey(block)
      const pk = cellKey(pusher)
      // Bloc ne peut être sur une autre cible (elles seront occupées en fin de partie)
      // ni sur un autre bloc déjà placé.
      if (targetSet.has(bk)) continue
      if (usedBlocks.has(bk)) continue
      // Pousseur ne peut être sur un autre bloc (le joueur ne peut pas y entrer).
      if (usedBlocks.has(pk)) continue
      blocks.push(block)
      pushDirs.push(dir)
      pushers.push(pusher)
      usedBlocks.add(bk)
      placed = true
      break
    }
    if (!placed) return null
  }
  return { blocks, pushDirs, pushers }
}

/** BFS sur la grille : chemin du joueur de `start` à `goal`, en évitant les obstacles. */
function bfsPath(
  start: Coord,
  goal: Coord,
  obstacles: Set<string>,
  width: number,
  height: number,
): Direction[] | null {
  if (eq(start, goal)) return []
  const visited = new Set<string>([cellKey(start)])
  const queue: Array<{ pos: Coord; path: Direction[] }> = [{ pos: start, path: [] }]
  while (queue.length > 0) {
    const { pos, path } = queue.shift()!
    for (const { dir, vec } of DIRECTIONS) {
      const next: Coord = [pos[0] + vec[0], pos[1] + vec[1]]
      const nk = cellKey(next)
      if (visited.has(nk)) continue
      if (next[0] < 0 || next[1] < 0 || next[0] >= width || next[1] >= height) continue
      if (obstacles.has(nk)) continue
      visited.add(nk)
      const newPath = [...path, dir]
      if (eq(next, goal)) return newPath
      queue.push({ pos: next, path: newPath })
    }
  }
  return null
}

/**
 * Tente de résoudre le niveau dans l'ordre naturel des cibles : pour chaque
 * cible i, naviguer le joueur jusqu'au pousseur, puis pousser. Retourne null
 * si un déplacement est impossible (bloc bloque le chemin par exemple).
 */
function solveInOrder(
  initialPlayer: Coord,
  initialBlocks: Coord[],
  pushDirs: Direction[],
  pushers: Coord[],
  targets: Coord[],
  walls: Set<string>,
  width: number,
  height: number,
): Direction[] | null {
  let player = initialPlayer
  const currentBlocks = initialBlocks.slice()
  const moves: Direction[] = []

  for (let i = 0; i < currentBlocks.length; i++) {
    const obstacles = new Set<string>(walls)
    for (let j = 0; j < currentBlocks.length; j++) {
      obstacles.add(cellKey(currentBlocks[j]))
    }
    const pusher = pushers[i]
    const path = bfsPath(player, pusher, obstacles, width, height)
    if (!path) return null
    moves.push(...path)
    player = pusher

    // Effectue la poussée : le joueur entre dans la case du bloc, le bloc va sur sa cible.
    moves.push(pushDirs[i])
    player = currentBlocks[i]
    currentBlocks[i] = targets[i]
  }
  return moves
}

/**
 * Reconstitue le chemin du joueur (en cellules) à partir de sa position
 * initiale et d'une suite de directions.
 */
function tracePlayerCells(start: Coord, moves: Direction[]): Set<string> {
  const cells = new Set<string>([cellKey(start)])
  let pos = start
  for (const m of moves) {
    const dir = DIRECTIONS.find((d) => d.dir === m)!
    pos = [pos[0] + dir.vec[0], pos[1] + dir.vec[1]]
    cells.add(cellKey(pos))
  }
  return cells
}

/**
 * Place quelques obstacles internes (murs supplémentaires) sur des cases qui
 * ne sont sur le chemin de personne : ni cible, ni bloc initial, ni pousseur,
 * ni case visitée par le joueur dans la solution. Garantit ainsi que la
 * solution reste valable.
 */
function placeRandomObstacles(
  rng: Rng,
  count: number,
  borderWalls: Coord[],
  forbidden: Set<string>,
  width: number,
  height: number,
): Coord[] {
  if (count <= 0) return []
  const candidates: Coord[] = []
  const wallSet = new Set(borderWalls.map(cellKey))
  for (let y = 1; y <= height - 2; y++) {
    for (let x = 1; x <= width - 2; x++) {
      const k = cellKey([x, y])
      if (wallSet.has(k)) continue
      if (forbidden.has(k)) continue
      candidates.push([x, y])
    }
  }
  rng.shuffle(candidates)
  return candidates.slice(0, Math.min(count, candidates.length))
}

function tryGenerateFreeform(
  rng: Rng,
  word: string,
  width: number,
  height: number,
  obstacleCount: number,
): LevelDraft | null {
  const targets = placeTargetsRandomWalk(rng, word.length, width, height)
  if (!targets) return null

  const placement = placeBlocksAndPushDirections(rng, targets, width, height)
  if (!placement) return null

  const walls = buildBorderWalls(width, height)
  const wallSet = new Set(walls.map(cellKey))
  const targetSet = new Set(targets.map(cellKey))
  const blockSet = new Set(placement.blocks.map(cellKey))

  // Position de départ du joueur : pousseur du 1er bloc s'il est libre, sinon
  // première case intérieure libre.
  let player: Coord | null = null
  const firstPusherKey = cellKey(placement.pushers[0])
  if (
    !targetSet.has(firstPusherKey) &&
    !blockSet.has(firstPusherKey) &&
    !wallSet.has(firstPusherKey)
  ) {
    player = placement.pushers[0]
  } else {
    for (let y = 1; y <= height - 2; y++) {
      for (let x = 1; x <= width - 2; x++) {
        const k = cellKey([x, y])
        if (wallSet.has(k) || targetSet.has(k) || blockSet.has(k)) continue
        player = [x, y]
        break
      }
      if (player) break
    }
  }
  if (!player) return null

  const solution = solveInOrder(
    player,
    placement.blocks,
    placement.pushDirs,
    placement.pushers,
    targets,
    wallSet,
    width,
    height,
  )
  if (!solution) return null

  // Cellules « intouchables » par les obstacles : tout ce qu'on a placé +
  // toutes les cellules visitées par le joueur durant la solution.
  const forbidden = new Set<string>()
  targets.forEach((t) => forbidden.add(cellKey(t)))
  placement.blocks.forEach((b) => forbidden.add(cellKey(b)))
  placement.pushers.forEach((p) => forbidden.add(cellKey(p)))
  forbidden.add(cellKey(player))
  for (const c of tracePlayerCells(player, solution)) forbidden.add(c)

  const obstacles = placeRandomObstacles(rng, obstacleCount, walls, forbidden, width, height)

  const blocks: Block[] = placement.blocks.map((pos, i) => ({
    id: `b${i + 1}`,
    letter: word[i],
    pos,
  }))

  return {
    walls: [...walls, ...obstacles],
    ice: [],
    player,
    blocks,
    targets,
    solution,
  }
}

/**
 * Filet de sécurité utilisé si toutes les tentatives de génération libre
 * échouent. Reproduit le layout linéaire historique (cible row 2, blocs row
 * 3, joueur en bas-gauche).
 */
function buildLinearFreeformFallback(
  word: string,
  width: number,
  height: number,
): LevelDraft {
  const wordLen = word.length
  const targetRow = 2
  const blockRow = 3
  const playerRow = height - 2
  const leftStart = Math.floor((width - wordLen) / 2)

  const walls = buildBorderWalls(width, height)
  const targets: Coord[] = []
  const blocks: Block[] = []
  for (let i = 0; i < wordLen; i++) {
    const col = leftStart + i
    targets.push([col, targetRow])
    blocks.push({ id: `b${i + 1}`, letter: word[i], pos: [col, blockRow] })
  }
  const player: Coord = [1, playerRow]

  const solution: Direction[] = []
  let pos: Coord = [...player] as Coord
  while (pos[1] > blockRow + 1) {
    solution.push('up')
    pos = [pos[0], pos[1] - 1]
  }
  blocks.forEach((b, i) => {
    while (pos[0] < b.pos[0]) {
      solution.push('right')
      pos = [pos[0] + 1, pos[1]]
    }
    while (pos[0] > b.pos[0]) {
      solution.push('left')
      pos = [pos[0] - 1, pos[1]]
    }
    solution.push('up')
    pos = [pos[0], pos[1] - 1]
    if (i < blocks.length - 1) {
      solution.push('down')
      pos = [pos[0], pos[1] + 1]
    }
  })

  return {
    walls,
    ice: [],
    player,
    blocks,
    targets,
    solution,
  }
}
