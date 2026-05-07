import { describe, expect, it } from 'vitest'
import { Rng } from '~/lib/random'

describe('lib/random', () => {
  it('produit la même séquence pour le même seed', () => {
    const a = new Rng('hello')
    const b = new Rng('hello')
    for (let i = 0; i < 50; i++) {
      expect(a.next()).toBe(b.next())
    }
  })

  it('produit des séquences différentes pour des seeds différents', () => {
    const a = new Rng('hello')
    const b = new Rng('world')
    let differ = false
    for (let i = 0; i < 50; i++) {
      if (a.next() !== b.next()) {
        differ = true
        break
      }
    }
    expect(differ).toBe(true)
  })

  it('random() reste dans [0, 1)', () => {
    const rng = new Rng('seed')
    for (let i = 0; i < 1000; i++) {
      const r = rng.random()
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThan(1)
    }
  })

  it('nextInt(max) reste dans [0, max)', () => {
    const rng = new Rng('seed')
    for (let i = 0; i < 1000; i++) {
      const v = rng.nextInt(10)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(10)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('pick choisit un élément du tableau', () => {
    const rng = new Rng('seed')
    const items = ['a', 'b', 'c'] as const
    for (let i = 0; i < 50; i++) {
      expect(items).toContain(rng.pick(items))
    }
  })

  it('shuffle préserve les éléments', () => {
    const rng = new Rng('seed')
    const original = [1, 2, 3, 4, 5, 6]
    const shuffled = rng.shuffle([...original])
    expect(shuffled.slice().sort()).toEqual(original)
  })

  it("shuffle finit par changer l'ordre", () => {
    let changed = false
    for (let s = 0; s < 10; s++) {
      const rng = new Rng(`seed-${s}`)
      const original = [1, 2, 3, 4, 5, 6]
      const shuffled = rng.shuffle([...original])
      if (shuffled.some((v, i) => v !== original[i])) {
        changed = true
        break
      }
    }
    expect(changed).toBe(true)
  })
})
