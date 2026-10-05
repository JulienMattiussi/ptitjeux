/**
 * Outils partagés par les recherches Sokomot (solveurs A* et génération à
 * rebours du niveau 4) : clé d'état, tas binaire, heuristique d'appariement.
 */
import type { Coord } from '~/games/sokomot/types'

/**
 * Clé d'un état : position du joueur et blocs triés. Deux blocs de même
 * lettre sont interchangeables pour la victoire, donc confondus ici.
 */
export function stateKey(
  player: Coord,
  blocks: ReadonlyArray<{ letter: string; pos: Coord }>,
): string {
  const items = blocks.map((b) => `${b.letter}:${b.pos[0]},${b.pos[1]}`).sort()
  return `${player[0]},${player[1]}|${items.join(';')}`
}

/**
 * Tas binaire d'indices, ordonnés par `compare`. Les égalités se départagent
 * toujours de la même façon : les solutions trouvées, donc les niveaux
 * produits, en dépendent.
 */
export function createMinHeap(compare: (a: number, b: number) => number) {
  const heap: number[] = []
  const swap = (i: number, j: number) => {
    const t = heap[i]
    heap[i] = heap[j]
    heap[j] = t
  }
  return {
    get size() {
      return heap.length
    },
    push(idx: number): void {
      heap.push(idx)
      let i = heap.length - 1
      while (i > 0) {
        const p = (i - 1) >> 1
        if (compare(heap[i], heap[p]) >= 0) break
        swap(i, p)
        i = p
      }
    },
    pop(): number {
      const top = heap[0]
      const last = heap.pop()!
      if (heap.length > 0) {
        heap[0] = last
        let i = 0
        for (;;) {
          const l = 2 * i + 1
          const r = 2 * i + 2
          let best = i
          if (l < heap.length && compare(heap[l], heap[best]) < 0) best = l
          if (r < heap.length && compare(heap[r], heap[best]) < 0) best = r
          if (best === i) break
          swap(i, best)
          i = best
        }
      }
      return top
    },
  }
}

/**
 * Minimum, sur tous les appariements bloc → cible de même lettre, de la
 * somme des distances de Manhattan. Le plus proche d'abord (glouton) pourrait
 * surestimer et rendre A* non optimal ; le minimum exact reste admissible
 * tant qu'un coup déplace un bloc d'une case au plus. `Infinity` si aucun
 * appariement n'existe. Énumération par retour arrière : au plus 6! cas.
 */
export function matchingDistance(
  blocks: readonly Coord[],
  blockLetters: readonly string[],
  targets: readonly Coord[],
  targetLetters: readonly string[],
): number {
  const n = blocks.length
  if (n !== targets.length) return Infinity
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(Infinity))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (blockLetters[i] !== targetLetters[j]) continue
      dist[i][j] = Math.abs(blocks[i][0] - targets[j][0]) + Math.abs(blocks[i][1] - targets[j][1])
    }
  }
  let best = Infinity
  const used = new Array<boolean>(n).fill(false)
  const rec = (i: number, sum: number): void => {
    if (sum >= best) return
    if (i === n) {
      best = sum
      return
    }
    for (let j = 0; j < n; j++) {
      if (used[j] || !Number.isFinite(dist[i][j])) continue
      used[j] = true
      rec(i + 1, sum + dist[i][j])
      used[j] = false
    }
  }
  rec(0, 0)
  return best
}
