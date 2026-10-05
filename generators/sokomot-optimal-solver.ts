/**
 * Solveur optimal Sokomot : A* sur les coups du joueur.
 *
 * Les transitions passent par `applyMove` du moteur : la recherche voit
 * exactement ce que verra le joueur. Heuristique : `matchingDistance`, admissible
 * et cohérente quand un coup déplace un bloc d'une case au plus. Avec de la
 * glace, une glissade couvre plusieurs cases en un coup : l'heuristique n'est
 * plus admissible et la recherche se fait en largeur (h = 0), ce qui reste
 * optimal. Les niveaux de glace sont courts (20 coups au plus), la largeur
 * suffit.
 */
import { applyMove, isWon, loadLevel } from '~/games/sokomot/engine'
import type { GameState, Level } from '~/games/sokomot/types'
import type { Direction } from '~/games/sokomot/types'
import { DIRECTIONS } from './sokomot-grid'
import { createMinHeap, matchingDistance, stateKey } from './sokomot-search'

function heuristic(level: Level, state: GameState): number {
  if (level.ice.length > 0) return 0
  return matchingDistance(
    state.blocks.map((b) => b.pos),
    state.blocks.map((b) => b.letter),
    level.target.cells,
    level.target.word.split(''),
  )
}

type Node = {
  /** Libéré (`null`) une fois le nœud développé, pour ménager la mémoire. */
  state: GameState | null
  parent: number
  dir: Direction | null
  g: number
  f: number
}

/**
 * Séquence de coups la plus courte, ou `null` au-delà de `maxStates` états
 * créés.
 */
export function solveOptimalSokomot(level: Level, maxStates: number): Direction[] | null {
  const initial = loadLevel(level)
  if (isWon(initial)) return []

  const nodes: Node[] = [
    { state: initial, parent: -1, dir: null, g: 0, f: heuristic(level, initial) },
  ]
  const heap = createMinHeap((a, b) => nodes[a].f - nodes[b].f)
  heap.push(0)
  const bestG = new Map<string, number>()
  bestG.set(stateKey(initial.player, initial.blocks), 0)

  while (heap.size > 0) {
    if (nodes.length > maxStates) return null
    const cur = heap.pop()
    const node = nodes[cur]
    const curState = node.state
    // Nœud déjà développé, remis dans le tas avec un meilleur coût.
    if (!curState) continue

    for (const { dir } of DIRECTIONS) {
      const newState = applyMove(curState, dir)
      if (newState === curState) continue

      const k = stateKey(newState.player, newState.blocks)
      const newG = node.g + 1
      const prevG = bestG.get(k)
      if (prevG !== undefined && prevG <= newG) continue
      bestG.set(k, newG)

      const h = heuristic(level, newState)
      if (!Number.isFinite(h)) continue
      const idx = nodes.length
      nodes.push({ state: newState, parent: cur, dir, g: newG, f: newG + h })

      // Test de victoire à la création : sûr ici, car chaque coup coûte 1 et
      // l'heuristique est cohérente.
      if (isWon(newState)) {
        const path: Direction[] = []
        for (let i = idx; i > 0; i = nodes[i].parent) path.unshift(nodes[i].dir!)
        return path
      }
      heap.push(idx)
    }
    node.state = null
  }
  return null
}
