import { applyMove, isWon, loadLevel } from '~/games/sokomot/engine'
import type { Direction, GameState, Level } from '~/games/sokomot/types'

/**
 * Solveur optimal Sokomot.
 *
 * Réutilise le moteur `applyMove` pour garantir que les transitions
 * explorées sont **strictement identiques** à celles que verra le joueur.
 *
 * Stratégie :
 * - A* avec heuristique « somme des distances de Manhattan, lettre-par-lettre,
 *   appariement greedy minimisant chaque cube » pour les niveaux sans glace.
 *   Manhattan est admissible quand chaque coup déplace au plus une case.
 * - Pour les niveaux avec glace, l'heuristique Manhattan n'est PLUS admissible
 *   (un slide couvre plusieurs cases en 1 coup). On retombe alors sur BFS
 *   (h=0), qui reste optimal. Les puzzles glace ont en pratique une
 *   profondeur petite (<20 coups) donc BFS termine vite malgré l'absence
 *   d'élagage par heuristique.
 */
const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']

function stateKey(state: GameState): string {
  const blocks = state.blocks
    .map((b) => `${b.letter}:${b.pos[0]},${b.pos[1]}`)
    .sort()
    .join(';')
  return `${state.player[0]},${state.player[1]}|${blocks}`
}

/**
 * Heuristique admissible : minimum sur tous les appariements valides
 * (lettre-par-lettre) de la somme des distances de Manhattan cube→cible.
 *
 * Pourquoi pas le greedy (le plus proche d'abord) ? Le greedy peut
 * **surestimer** : ordre [B, A] où B prend la cible que A aurait mieux
 * utilisée. Un coût h > coût réel rend A* non-optimal. Le min sur tous
 * les appariements est ≤ coût optimal réel ⇒ admissible.
 *
 * Pour N ≤ 6 cubes, on énumère N! ≤ 720 permutations — négligeable.
 */
function heuristic(level: Level, state: GameState): number {
  if (level.ice.length > 0) return 0

  const blocks = state.blocks
  const targets = level.target.cells
  const word = level.target.word
  const n = blocks.length
  if (n !== targets.length) return Infinity

  // Matrice de distances : Infinity si lettres incompatibles.
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(Infinity))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (blocks[i].letter.toUpperCase() !== word[j].toUpperCase()) continue
      dist[i][j] = Math.abs(blocks[i].pos[0] - targets[j][0]) + Math.abs(blocks[i].pos[1] - targets[j][1])
    }
  }

  // Backtracking min-assignment avec pruning sur la borne courante.
  let best = Infinity
  const used = new Array<boolean>(n).fill(false)
  function rec(i: number, sum: number) {
    if (sum >= best) return
    if (i === n) {
      best = sum
      return
    }
    for (let j = 0; j < n; j++) {
      if (used[j]) continue
      if (!Number.isFinite(dist[i][j])) continue
      used[j] = true
      rec(i + 1, sum + dist[i][j])
      used[j] = false
    }
  }
  rec(0, 0)
  return Number.isFinite(best) ? best : Infinity
}

type Node = {
  /** GameState compact, libéré (= null) une fois le nœud expansé pour ménager la mémoire. */
  state: GameState | null
  parent: number
  dir: Direction | null
  g: number
  f: number
}

/**
 * Résout le niveau et renvoie la séquence optimale (minimum de coups),
 * ou `null` si le budget d'états est dépassé.
 */
export function solveOptimalSokomot(level: Level, maxStates = 10_000_000): Direction[] | null {
  const initial = loadLevel(level)
  if (isWon(initial)) return []

  const nodes: Node[] = [
    { state: initial, parent: -1, dir: null, g: 0, f: heuristic(level, initial) },
  ]
  const heap: number[] = [0]
  const bestG = new Map<string, number>()
  bestG.set(stateKey(initial), 0)

  const cmp = (a: number, b: number) => nodes[a].f - nodes[b].f
  const push = (idx: number) => {
    heap.push(idx)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (cmp(heap[i], heap[p]) < 0) {
        const t = heap[i]
        heap[i] = heap[p]
        heap[p] = t
        i = p
      } else break
    }
  }
  const pop = (): number => {
    const top = heap[0]
    const last = heap.pop()!
    if (heap.length > 0) {
      heap[0] = last
      let i = 0
      while (true) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        let best = i
        if (l < heap.length && cmp(heap[l], heap[best]) < 0) best = l
        if (r < heap.length && cmp(heap[r], heap[best]) < 0) best = r
        if (best === i) break
        const t = heap[i]
        heap[i] = heap[best]
        heap[best] = t
        i = best
      }
    }
    return top
  }

  while (heap.length > 0) {
    if (nodes.length > maxStates) return null
    const cur = pop()
    const node = nodes[cur]
    const curState = node.state
    if (!curState) continue // déjà expansé (peut arriver si réajout dans le heap)

    for (const dir of DIRECTIONS) {
      const raw = applyMove(curState, dir)
      if (raw === curState) continue // coup bloqué (mur, push impossible)

      // L'engine concatène l'historique à chaque coup — on n'en a pas besoin
      // pour la recherche et il fait exploser la mémoire (O(profondeur²)).
      const newState: GameState = { ...raw, history: [] }

      const k = stateKey(newState)
      const newG = node.g + 1
      const prevG = bestG.get(k)
      if (prevG !== undefined && prevG <= newG) continue
      bestG.set(k, newG)

      const h = heuristic(level, newState)
      if (!Number.isFinite(h)) continue
      const idx = nodes.length
      nodes.push({ state: newState, parent: cur, dir, g: newG, f: newG + h })

      if (isWon(newState)) {
        const path: Direction[] = []
        let i = idx
        while (i > 0) {
          const n = nodes[i]
          if (n.dir) path.unshift(n.dir)
          i = n.parent
        }
        return path
      }
      push(idx)
    }
    // Libère le state du nœud expansé : on a déjà généré tous ses enfants,
    // il ne reste plus que parent/dir pour la reconstruction du chemin final.
    node.state = null
  }
  return null
}
