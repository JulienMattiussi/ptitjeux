import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Board } from '~/games/sokomot/Board'
import { applyMove, loadLevel } from '~/games/sokomot/engine'
import type { Level } from '~/games/sokomot/types'

// Niveau minimal : grille 5x3, joueur en (0,1), un bloc « A » en (1,1)
// à pousser sur la case cible (3,1). Aucune glace, aucun mur.
const LEVEL: Level = {
  id: 'test',
  name: 'Test',
  width: 5,
  height: 3,
  player: [0, 1],
  walls: [],
  ice: [],
  blocks: [{ id: 'a', letter: 'A', pos: [1, 1] }],
  target: { word: 'A', cells: [[3, 1]] },
  parMoves: 2,
}

describe('sokomot/Board', () => {
  it('rend le plateau avec un rôle application et un nom accessible', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} />)
    expect(screen.getByRole('application', { name: /Plateau Test/i })).toBeInTheDocument()
  })

  it('rend une case cible avec la lettre attendue (en filigrane) tant que le bloc n\'y est pas', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} />)
    // Le filigrane de cible a aria-hidden, mais on peut le trouver par texte.
    expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(1)
  })

  it('rend le crayon (player) avec une orientation par défaut « right »', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} />)
    expect(screen.getByRole('img', { name: /Crayon orienté right/i })).toBeInTheDocument()
  })

  it('met à jour l\'orientation du crayon après un déplacement', () => {
    let state = loadLevel(LEVEL)
    state = applyMove(state, 'down')
    render(<Board state={state} />)
    expect(screen.getByRole('img', { name: /Crayon orienté down/i })).toBeInTheDocument()
  })

  it('rend autant de gridcell que de cases (width × height)', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} />)
    expect(screen.getAllByRole('gridcell')).toHaveLength(LEVEL.width * LEVEL.height)
  })
})
