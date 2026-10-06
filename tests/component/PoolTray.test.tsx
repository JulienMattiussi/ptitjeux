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
  // Les deux vues (liste sur ordinateur, décompte sur mobile) sont rendues, le CSS choisit.
  it('une ligne par type encore à placer, avec le nombre restant', () => {
    render(<PoolTray state={state({ simple: 2, angle: 0, oppose: 1 })} />)
    expect(screen.getAllByLabelText('Vigiles à placer, type simple : 2')).toHaveLength(2)
    expect(screen.getAllByLabelText('Vigiles à placer, type opposé : 1')).toHaveLength(2)
  })

  it('sur mobile, un vigile par type du lot avec son nombre restant', () => {
    render(<PoolTray state={state({ simple: 7, angle: 0, oppose: 3 })} />)
    expect(screen.getByText('× 7')).toBeInTheDocument()
    expect(screen.getByText('× 3')).toBeInTheDocument()
    expect(screen.queryByText('× 0')).not.toBeInTheDocument()
  })

  it('sur mobile, un type épuisé reste affiché, grisé, à 0', () => {
    render(<PoolTray state={placeGuard(state({ simple: 1, angle: 0, oppose: 2 }), 1, 1)} />)
    const exhausted = screen.getByLabelText('Vigiles à placer, type simple : 0')
    expect(exhausted).toHaveTextContent('× 0')
    expect(exhausted).toHaveClass('grayscale')
  })

  it('annonce quand tous les vigiles sont placés', () => {
    render(<PoolTray state={placeGuard(state({ simple: 1, angle: 0, oppose: 0 }), 1, 1)} />)
    expect(screen.getByText('Tous les vigiles sont placés.')).toBeInTheDocument()
  })
})
