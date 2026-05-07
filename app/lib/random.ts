/**
 * PRNG déterministe basé sur un hachage de la chaîne de seed.
 * Implémente xorshift32 après un hachage cyrb53 pour la graine.
 */

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export class Rng {
  private state: number
  constructor(seed: string) {
    const h = cyrb53(seed)
    this.state = (h >>> 0) || 1
  }
  /** Entier 32 bits non signé. */
  next(): number {
    let x = this.state
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.state = x >>> 0
    return this.state
  }
  /** Réel dans [0, 1). */
  random(): number {
    return this.next() / 0x100000000
  }
  /** Entier dans [0, max). */
  nextInt(max: number): number {
    return Math.floor(this.random() * max)
  }
  /** Élément aléatoire d'un tableau. */
  pick<T>(items: readonly T[]): T {
    return items[this.nextInt(items.length)]
  }
  /** Mélange en place puis renvoie. */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1)
      ;[items[i], items[j]] = [items[j], items[i]]
    }
    return items
  }
}
