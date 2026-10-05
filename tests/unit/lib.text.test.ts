import { describe, expect, it } from 'vitest'
import { plural, stripAccents } from '~/lib/text'

describe('lib/text', () => {
  it('stripAccents retire accents et cédilles en gardant la casse', () => {
    expect(stripAccents('Élève façade NOËL')).toBe('Eleve facade NOEL')
  })

  it('plural laisse le mot au singulier pour 0 et 1', () => {
    expect(plural(0, 'coup')).toBe('0 coup')
    expect(plural(1, 'coup')).toBe('1 coup')
  })

  it('plural accorde au-delà de 1', () => {
    expect(plural(3, 'coup')).toBe('3 coups')
  })
})
