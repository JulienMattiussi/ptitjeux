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
 * Pas autorisés pour la marche aléatoire des cibles : la lettre suivante
 * peut être à droite, en bas, en bas-à-droite ou en haut-à-droite. Jamais à
 * gauche, jamais directement au-dessus.
 */
const SOKOMOT_STEPS: readonly Coord[] = [
  [1, 0], // droite
  [0, 1], // bas
  [1, 1], // bas-droite
  [1, -1], // haut-droite
] as const

/**
 * Génère un niveau Sokomot pour une date et un index donnés.
 *
 * Tous les niveaux utilisent désormais le **layout libre** :
 * - Cibles disposées par marche aléatoire (4 pas autorisés ci-dessus).
 * - Pour chaque cible, direction de poussée choisie parmi les 4.
 * - Niveaux glace (2, 4) : entre le bloc et la cible se trouvent des cases
 *   gelées de longueur de glissade `slideLength`. Le bloc poussé glisse à
 *   travers ces cases et s'immobilise sur la cible (qui n'est pas gelée).
 * - Niveaux classiques (1, 3) : pas de glace, bloc adjacent à la cible.
 * - Obstacles internes aléatoires sur les cases qui ne sont pas sur la
 *   trajectoire de la solution.
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

  const slideLength = isIce ? 2 : 1
  const obstacleCount = isIce ? 0 : index + 1

  // Niveau 4 : entièrement glace, cibles le long d'un mur, joueur glisse partout
  // et utilise les blocs comme points d'appui.
  if (index === 4) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const attemptRng = new Rng(`sokomot:${date}:${index}:fullice:${attempt}`)
      const candidate = tryGenerateFullIce(attemptRng, word, width, height)
      if (candidate) return finalize(candidate, date, index, word, entry.canonical, true)
    }
    // En cas d'échec rare, on retombera sur le freeform glace standard ci-dessous.
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    const attemptRng = new Rng(`sokomot:${date}:${index}:freeform:${attempt}`)
    const candidate = tryGenerateFreeform(
      attemptRng,
      word,
      width,
      height,
      slideLength,
      obstacleCount,
    )
    if (candidate) return finalize(candidate, date, index, word, entry.canonical, isIce)
  }
  // Filet de sécurité.
  return finalize(
    buildLinearFallback(word, width, height, isIce),
    date,
    index,
    word,
    entry.canonical,
    isIce,
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
  isIce: boolean,
): Level {
  const { width, height } = inferSize(draft.walls)
  return {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height}${isIce ? ' · glace' : ''}`,
    width,
    height,
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

function inferSize(cells: Coord[]): { width: number; height: number } {
  let mx = 0
  let my = 0
  for (const c of cells) {
    if (c[0] > mx) mx = c[0]
    if (c[1] > my) my = c[1]
  }
  return { width: mx + 1, height: my + 1 }
}

// ---------- Helpers ----------

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
 * Pour chaque cible, choisit une direction de poussée et calcule :
 * - la position du bloc à `slideLength` cases avant la cible
 * - les cases de glace intermédiaires (si slideLength > 1)
 * - la position de poussée (case où le joueur se tient pour pousser)
 *
 * Renvoie `null` si une cible ne peut pas être placée sans conflit.
 */
function placeBlocksWithSlide(
  rng: Rng,
  targets: Coord[],
  slideLength: number,
  width: number,
  height: number,
): {
  blocks: Coord[]
  pushDirs: Direction[]
  pushers: Coord[]
  ice: Coord[]
} | null {
  const targetSet = new Set(targets.map(cellKey))
  const usedBlocks = new Set<string>()
  const allIceSet = new Set<string>()
  const allIce: Coord[] = []
  const blocks: Coord[] = []
  const pushDirs: Direction[] = []
  const pushers: Coord[] = []

  for (const t of targets) {
    let placed = false
    const order = rng.shuffle([...DIRECTIONS])
    for (const { dir, vec } of order) {
      const block: Coord = [t[0] - slideLength * vec[0], t[1] - slideLength * vec[1]]
      const pusher: Coord = [
        t[0] - (slideLength + 1) * vec[0],
        t[1] - (slideLength + 1) * vec[1],
      ]
      if (!inInterior(block, width, height)) continue
      if (!inInterior(pusher, width, height)) continue

      // Cases de glace intermédiaires (target - i*vec pour i = 1..slideLength-1).
      const iceForThis: Coord[] = []
      let valid = true
      for (let i = 1; i < slideLength; i++) {
        const c: Coord = [t[0] - i * vec[0], t[1] - i * vec[1]]
        if (!inInterior(c, width, height)) {
          valid = false
          break
        }
        if (targetSet.has(cellKey(c))) {
          valid = false
          break
        }
        if (usedBlocks.has(cellKey(c))) {
          valid = false
          break
        }
        iceForThis.push(c)
      }
      if (!valid) continue

      const blockKey = cellKey(block)
      const pusherKey = cellKey(pusher)
      // Le bloc ne peut être sur une autre cible, un autre bloc, ou une glace
      // existante (player atterrirait sur la glace après poussée et glisserait).
      if (targetSet.has(blockKey)) continue
      if (usedBlocks.has(blockKey)) continue
      if (allIceSet.has(blockKey)) continue
      // Le pousseur ne peut être sur un autre bloc, ni sur de la glace
      // (le joueur glisserait et ne pourrait pas pousser).
      if (usedBlocks.has(pusherKey)) continue
      if (allIceSet.has(pusherKey)) continue

      blocks.push(block)
      pushDirs.push(dir)
      pushers.push(pusher)
      usedBlocks.add(blockKey)
      for (const c of iceForThis) {
        const k = cellKey(c)
        if (!allIceSet.has(k)) {
          allIce.push(c)
          allIceSet.add(k)
        }
      }
      placed = true
      break
    }
    if (!placed) return null
  }
  return { blocks, pushDirs, pushers, ice: allIce }
}

/** BFS standard : chemin du joueur sur la grille, en évitant `obstacles`. */
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
 * Résout le niveau dans l'ordre naturel des cibles. Le joueur navigue jusqu'au
 * pousseur de chaque cible (en évitant murs, blocs et glace), puis effectue la
 * poussée. Renvoie null si la navigation échoue à un moment.
 */
function solveInOrder(
  initialPlayer: Coord,
  initialBlocks: Coord[],
  pushDirs: Direction[],
  pushers: Coord[],
  targets: Coord[],
  walls: Set<string>,
  ice: Set<string>,
  width: number,
  height: number,
): Direction[] | null {
  let player = initialPlayer
  const currentBlocks = initialBlocks.slice()
  const moves: Direction[] = []

  for (let i = 0; i < currentBlocks.length; i++) {
    const obstacles = new Set<string>(walls)
    for (const c of ice) obstacles.add(c)
    for (let j = 0; j < currentBlocks.length; j++) {
      obstacles.add(cellKey(currentBlocks[j]))
    }
    const pusher = pushers[i]
    const path = bfsPath(player, pusher, obstacles, width, height)
    if (!path) return null
    moves.push(...path)
    player = pusher
    moves.push(pushDirs[i])
    player = currentBlocks[i] // post-push, player atterrit où était le bloc
    currentBlocks[i] = targets[i]
  }
  return moves
}

/**
 * Reconstitue les cellules visitées par le joueur durant la solution (pour
 * exclure ces cases lors du placement d'obstacles aléatoires).
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
  slideLength: number,
  obstacleCount: number,
): LevelDraft | null {
  const targets = placeTargetsRandomWalk(rng, word.length, width, height)
  if (!targets) return null

  const placement = placeBlocksWithSlide(rng, targets, slideLength, width, height)
  if (!placement) return null

  const walls = buildBorderWalls(width, height)
  const wallSet = new Set(walls.map(cellKey))
  const targetSet = new Set(targets.map(cellKey))
  const blockSet = new Set(placement.blocks.map(cellKey))
  const iceSet = new Set(placement.ice.map(cellKey))

  // Position de départ du joueur : pousseur du 1er bloc s'il est libre, sinon
  // première case intérieure libre (et non-glace).
  let player: Coord | null = null
  const firstPusherKey = cellKey(placement.pushers[0])
  if (
    !targetSet.has(firstPusherKey) &&
    !blockSet.has(firstPusherKey) &&
    !wallSet.has(firstPusherKey) &&
    !iceSet.has(firstPusherKey)
  ) {
    player = placement.pushers[0]
  } else {
    for (let y = 1; y <= height - 2; y++) {
      for (let x = 1; x <= width - 2; x++) {
        const k = cellKey([x, y])
        if (
          wallSet.has(k) ||
          targetSet.has(k) ||
          blockSet.has(k) ||
          iceSet.has(k)
        ) {
          continue
        }
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
    iceSet,
    width,
    height,
  )
  if (!solution) return null

  // Cellules « intouchables » par les obstacles aléatoires.
  const forbidden = new Set<string>()
  targets.forEach((t) => forbidden.add(cellKey(t)))
  placement.blocks.forEach((b) => forbidden.add(cellKey(b)))
  placement.pushers.forEach((p) => forbidden.add(cellKey(p)))
  placement.ice.forEach((c) => forbidden.add(cellKey(c)))
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
    ice: placement.ice,
    player,
    blocks,
    targets,
    solution,
  }
}

// ---------- Niveau 4 : génération « entièrement glace » ----------

/**
 * Pour le niveau 4, on dispose toutes les cibles le long d'un seul mur (le mur
 * sert d'ancre pour arrêter chaque bloc poussé vers lui). L'intérieur entier
 * est gelé : le joueur glisse à chaque déplacement et doit s'appuyer sur les
 * blocs et les murs pour s'arrêter aux bonnes positions.
 *
 * Approche **rétrograde** : on part de l'état résolu (chaque bloc sur sa
 * cible) et on applique un certain nombre de coups inversés aléatoires.
 * Chaque inverse part d'un état (joueur, blocs) et produit un état antérieur
 * tel que le coup avant ramène à l'état actuel. La séquence inverse, lue à
 * l'envers, est donc une solution forward valide par construction.
 *
 * Avantage : pas de recherche d'état dans un espace immense ; on construit
 * directement une trajectoire prouvée résoluble.
 */
function tryGenerateFullIce(
  rng: Rng,
  word: string,
  width: number,
  height: number,
): LevelDraft | null {
  // Placement des cibles : alignées le long d'un mur. Le mur sert d'ancre
  // commune pour arrêter les blocs poussés vers lui : tous les blocs peuvent
  // être réinsérés sur leurs cibles via une poussée dans la direction du mur.
  // Avec des cibles dispersées (marche aléatoire), beaucoup de cibles n'ont
  // pas d'ancre exploitable et la BFS rétrograde ne trouve aucun état initial
  // exploitable.
  const targets = pickWallAlignedPath(rng, word.length, width, height)
  if (!targets) return null

  const walls = buildBorderWalls(width, height)
  const wallSet = new Set(walls.map(cellKey))

  const ice: Coord[] = []
  for (let y = 1; y <= height - 2; y++) {
    for (let x = 1; x <= width - 2; x++) ice.push([x, y])
  }

  const letters = word.split('').map((l) => l.toUpperCase())
  const targetSet = new Set(targets.map(cellKey))
  const freeAtSolved = ice.filter((c) => !targetSet.has(cellKey(c)))
  if (freeAtSolved.length === 0) return null

  // BFS rétrograde depuis l'état résolu pour trouver une initiale où tous les
  // blocs sont décollés de leurs cibles. On essaie quelques positions de
  // joueur dans l'état résolu jusqu'à trouver un démarrage qui aboutit.
  const orderedStarts = rng.shuffle(freeAtSolved.slice()).slice(0, 6)
  for (const startPlayer of orderedStarts) {
    const initialState: RevState = {
      player: startPlayer,
      blocks: targets.map((t, i) => ({ pos: t, letter: letters[i] })),
    }
    const found = backwardBFS(
      initialState,
      targets,
      letters,
      wallSet,
      width,
      height,
      80,
      15_000,
      Math.max(2, Math.ceil(word.length / 2)),
    )
    if (!found) continue
    const solution = found.directions.slice().reverse()
    return {
      walls,
      ice,
      player: found.state.player,
      blocks: found.state.blocks.map((b, i) => ({
        id: `b${i + 1}`,
        letter: word[i],
        pos: b.pos,
      })),
      targets,
      solution,
    }
  }
  return null
}

/**
 * BFS rétrograde : depuis l'état résolu (passé en paramètre), explore les
 * états antérieurs en appliquant des coups inversés. Retourne en priorité
 * un état où aucune cible n'est satisfaite par sa lettre attendue. Si la
 * BFS s'épuise avant, retourne l'état avec le plus de blocs décollés trouvé,
 * à condition qu'il dépasse `minOffTarget`.
 */
function backwardBFS(
  initial: RevState,
  targets: Coord[],
  letters: string[],
  wallSet: Set<string>,
  width: number,
  height: number,
  maxDepth: number,
  maxStates: number,
  minOffTarget: number,
): { state: RevState; directions: Direction[] } | null {
  const targetKeys = targets.map(cellKey)
  const offTargetCount = (state: RevState): number => {
    let count = 0
    for (let i = 0; i < targets.length; i++) {
      const tk = targetKeys[i]
      const blockHere = state.blocks.find((b) => cellKey(b.pos) === tk)
      if (!blockHere || blockHere.letter !== letters[i]) count++
    }
    return count
  }

  const stateKeyFor = (state: RevState): string => {
    // Les blocs portent une lettre ; ceux de même lettre sont interchangeables
    // pour la victoire — donc pour la déduplication BFS aussi.
    const items = state.blocks.map((b) => `${b.letter}:${b.pos[0]},${b.pos[1]}`)
    items.sort()
    return `${state.player[0]},${state.player[1]}|${items.join(';')}`
  }

  type Node = { state: RevState; directions: Direction[] }
  const visited = new Set<string>([stateKeyFor(initial)])
  const queue: Node[] = [{ state: initial, directions: [] }]
  let best: Node | null = null
  let bestCount = -1

  while (queue.length > 0) {
    if (visited.size > maxStates) break
    const node = queue.shift()!
    if (node.directions.length >= maxDepth) continue
    const moves = computeReverseMoves(node.state, wallSet, width, height)
    for (const move of moves) {
      const k = stateKeyFor(move.newState)
      if (visited.has(k)) continue
      visited.add(k)
      const newNode: Node = {
        state: move.newState,
        directions: [...node.directions, move.direction],
      }
      const cnt = offTargetCount(move.newState)
      if (cnt === targets.length) return newNode
      if (cnt > bestCount) {
        bestCount = cnt
        best = newNode
      }
      queue.push(newNode)
    }
  }
  if (best && bestCount >= minOffTarget) return best
  return null
}

/**
 * Renvoie un chemin de `wordLen` cellules adjacentes le long d'un seul mur.
 * Choisit un mur (haut, bas, gauche, droite) puis une position de départ. Le
 * mur correspondant servira d'ancre pour stopper les blocs poussés.
 */
function pickWallAlignedPath(
  rng: Rng,
  wordLen: number,
  width: number,
  height: number,
): Coord[] | null {
  const interiorMaxX = width - 2
  const interiorMaxY = height - 2
  const candidates: Coord[][] = []
  for (let sx = 1; sx <= interiorMaxX - wordLen + 1; sx++) {
    const path: Coord[] = []
    for (let i = 0; i < wordLen; i++) path.push([sx + i, 1])
    candidates.push(path)
    const path2: Coord[] = []
    for (let i = 0; i < wordLen; i++) path2.push([sx + i, interiorMaxY])
    candidates.push(path2)
  }
  for (let sy = 1; sy <= interiorMaxY - wordLen + 1; sy++) {
    const path: Coord[] = []
    for (let i = 0; i < wordLen; i++) path.push([1, sy + i])
    candidates.push(path)
    const path2: Coord[] = []
    for (let i = 0; i < wordLen; i++) path2.push([interiorMaxX, sy + i])
    candidates.push(path2)
  }
  if (candidates.length === 0) return null
  return rng.pick(candidates)
}

type RevBlock = { pos: Coord; letter: string }
type RevState = { player: Coord; blocks: RevBlock[] }
type RevMove = { direction: Direction; newState: RevState }

/**
 * Énumère tous les coups rétrogrades valides depuis l'état courant.
 * Un coup rétrograde dans la direction D produit un état antérieur tel que
 * `applyMove(prior, D)` reproduit l'état courant sur un plateau entièrement
 * glacé (la dynamique : le joueur glisse jusqu'au prochain obstacle, ou
 * pousse un bloc qui glisse à son tour).
 *
 * Deux types :
 * - **Sans poussée** : le joueur a glissé depuis A jusqu'à P sans toucher
 *   un bloc. A est sur la ligne P ← D, et P+D est mur ou bloc (sinon le
 *   glissement aurait continué).
 * - **Avec poussée** : le bloc actuellement à B_block a glissé depuis P
 *   (case actuelle du joueur) en direction D. Le joueur venait de A = P-D.
 */
function computeReverseMoves(
  state: RevState,
  wallSet: Set<string>,
  width: number,
  height: number,
): RevMove[] {
  const moves: RevMove[] = []
  const blockPosSet = new Set(state.blocks.map((b) => cellKey(b.pos)))

  const isWallOrBlock = (c: Coord): boolean => {
    if (c[0] < 0 || c[1] < 0 || c[0] >= width || c[1] >= height) return true
    const k = cellKey(c)
    return wallSet.has(k) || blockPosSet.has(k)
  }

  for (const { dir, vec } of DIRECTIONS) {
    // ---- Sans poussée ----
    // Pour que le glissement se soit arrêté à P, la case P+D doit être un mur
    // ou un bloc. (Sinon le joueur aurait continué à glisser.)
    const ahead: Coord = [state.player[0] + vec[0], state.player[1] + vec[1]]
    if (isWallOrBlock(ahead)) {
      // A peut être n'importe quelle case sur la ligne P + (-D), tant qu'elle
      // n'est ni mur ni bloc, et que les cases entre A+D et P sont libres.
      let cur: Coord = state.player
      while (true) {
        const A: Coord = [cur[0] - vec[0], cur[1] - vec[1]]
        if (A[0] < 0 || A[1] < 0 || A[0] >= width || A[1] >= height) break
        const ak = cellKey(A)
        if (wallSet.has(ak)) break
        if (blockPosSet.has(ak)) break
        moves.push({
          direction: dir,
          newState: { player: A, blocks: state.blocks },
        })
        cur = A
      }
    }

    // ---- Avec poussée ----
    // Le joueur venait de A = P - D, a poussé un bloc qui glissait depuis P
    // jusqu'à B_block dans la direction D. On cherche le 1er bloc rencontré
    // en suivant D depuis P.
    const A: Coord = [state.player[0] - vec[0], state.player[1] - vec[1]]
    if (
      A[0] >= 0 &&
      A[1] >= 0 &&
      A[0] < width &&
      A[1] < height &&
      !wallSet.has(cellKey(A)) &&
      !blockPosSet.has(cellKey(A))
    ) {
      let cur: Coord = [state.player[0] + vec[0], state.player[1] + vec[1]]
      while (
        cur[0] >= 0 &&
        cur[1] >= 0 &&
        cur[0] < width &&
        cur[1] < height &&
        !wallSet.has(cellKey(cur))
      ) {
        if (blockPosSet.has(cellKey(cur))) {
          // Bloc trouvé à cur. Vérifier qu'il s'est bien arrêté ici : cur+D
          // doit être mur ou bloc dans l'état courant.
          const next: Coord = [cur[0] + vec[0], cur[1] + vec[1]]
          if (isWallOrBlock(next)) {
            const blockIdx = state.blocks.findIndex((b) => eq(b.pos, cur))
            const newBlocks = state.blocks.map((b, i) =>
              i === blockIdx ? { pos: state.player, letter: b.letter } : b,
            )
            moves.push({
              direction: dir,
              newState: { player: A, blocks: newBlocks },
            })
          }
          break
        }
        cur = [cur[0] + vec[0], cur[1] + vec[1]]
      }
    }
  }
  return moves
}

/**
 * Filet de sécurité utilisé si toutes les tentatives de génération libre
 * échouent : layout linéaire historique.
 */
function buildLinearFallback(
  word: string,
  width: number,
  height: number,
  isIce: boolean,
): LevelDraft {
  const wordLen = word.length
  const targetRow = isIce ? 1 : 2
  const blockRow = isIce ? height - 3 : 3
  const playerRow = height - 2
  const pushRow = blockRow + 1
  const leftStart = Math.floor((width - wordLen) / 2)

  const walls = buildBorderWalls(width, height)
  const ice: Coord[] = []
  if (isIce) {
    for (let y = targetRow; y < blockRow; y++) {
      for (let x = 1; x < width - 1; x++) ice.push([x, y])
    }
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

  return { walls, ice, player, blocks, targets, solution }
}
