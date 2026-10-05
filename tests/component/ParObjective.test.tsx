import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ParObjective } from '~/components/ParObjective'

describe('ParObjective', () => {
  it('annonce un objectif atteint', () => {
    render(<ParObjective parMoves={8} variant="perfect" />)
    expect(screen.getByText(/Objectif/)).toHaveTextContent('Objectif 8 atteint.')
  })

  it('annonce un objectif dépassé', () => {
    render(<ParObjective parMoves={8} variant="solved" />)
    expect(screen.getByText(/Objectif/)).toHaveTextContent('Objectif 8 dépassé.')
  })
})
