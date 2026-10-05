import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { loadLevel, placeGuard } from '~/games/anglemort/engine'
import { PoolTray } from '~/games/anglemort/PoolTray'
import type { Level, Pool } from '~/games/anglemort/types'

function state(pool: Pool) {
  const level: Level = {
    id: 'test',
    name: 'Test',
    width: 4,
    height: 3,
    pillars: [],
    mirrors: [],
    door: [0, 0],
    diamond: [3, 0],
    clues: {},
    pool,
    solution: [],
    parMoves: 0,
  }
  return loadLevel(level)
}

describe('PoolTray', () => {
  it('une ligne par type encore à placer, avec le nombre restant', () => {
    render(<PoolTray state={state({ simple: 2, angle: 0, oppose: 1 })} />)
    expect(screen.getByLabelText('Vigiles à placer, type simple : 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Vigiles à placer, type opposé : 1')).toBeInTheDocument()
  })

  it('annonce quand tous les vigiles sont placés', () => {
    render(<PoolTray state={placeGuard(state({ simple: 1, angle: 0, oppose: 0 }), 1, 1)} />)
    expect(screen.getByText('Tous les vigiles sont placés.')).toBeInTheDocument()
  })
})
