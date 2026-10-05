import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MovesCard } from '~/components/MovesCard'

describe('MovesCard', () => {
  it("affiche le compteur et l'objectif", () => {
    render(<MovesCard moves={7} parMoves={12} />)
    expect(screen.getByText('Coups')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Objectif : 12')).toBeInTheDocument()
  })

  it('reprend le libellé propre au jeu', () => {
    render(<MovesCard moves={0} parMoves={4} label="Poses" />)
    expect(screen.getByText('Poses')).toBeInTheDocument()
  })

  it("affiche l'aide et les extras du jeu", () => {
    render(
      <MovesCard moves={0} parMoves={4} hint={<span>aide</span>}>
        <span>extra</span>
      </MovesCard>,
    )
    expect(screen.getByText('aide')).toBeInTheDocument()
    expect(screen.getByText('extra')).toBeInTheDocument()
  })
})
