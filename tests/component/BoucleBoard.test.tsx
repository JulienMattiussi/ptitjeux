import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Board } from '~/games/boucle/Board'
import { loadLevel, toggleEdge } from '~/games/boucle/engine'
import type { Level } from '~/games/boucle/types'

// Grille 3x3 avec un mot trivial. Pas de clues pour simplifier l'arbre rendu.
const LEVEL: Level = {
  id: 'test',
  name: 'Test',
  width: 3,
  height: 3,
  letters: [
    ['A', 'B', 'C'],
    ['D', 'E', 'F'],
    ['G', 'H', 'I'],
  ],
  clues: { '1,1': 2 },
  solutionWord: 'E',
}

describe('boucle/Board', () => {
  it('rend le plateau avec un rôle application et un nom accessible', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} onToggleEdge={() => {}} />)
    expect(screen.getByRole('application', { name: /Plateau Test/i })).toBeInTheDocument()
  })

  it('affiche toutes les lettres de la grille', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} onToggleEdge={() => {}} />)
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']) {
      expect(screen.getByText(letter)).toBeInTheDocument()
    }
  })

  it('affiche la valeur de chaque indice', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} onToggleEdge={() => {}} />)
    // Indice « 2 » pour la case (1,1).
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('déclenche onToggleEdge au clic sur une arête', async () => {
    const user = userEvent.setup()
    const onToggleEdge = vi.fn()
    const state = loadLevel(LEVEL)
    const { container } = render(<Board state={state} onToggleEdge={onToggleEdge} />)
    // Les zones cliquables sont les lignes transparentes (strokeWidth=20).
    const hitLines = container.querySelectorAll('line[stroke="transparent"]')
    expect(hitLines.length).toBeGreaterThan(0)
    await user.click(hitLines[0])
    expect(onToggleEdge).toHaveBeenCalledOnce()
  })

  it('met en évidence les cases intérieures quand une boucle valide est tracée', () => {
    // Boucle autour de la case (1,1) : 4 arêtes formant un carré.
    let state = loadLevel(LEVEL)
    state = toggleEdge(state, { x: 1, y: 1, orientation: 'horizontal' })
    state = toggleEdge(state, { x: 1, y: 2, orientation: 'horizontal' })
    state = toggleEdge(state, { x: 1, y: 1, orientation: 'vertical' })
    state = toggleEdge(state, { x: 2, y: 1, orientation: 'vertical' })

    const { container } = render(<Board state={state} onToggleEdge={() => {}} />)
    // Le surlignage intérieur est un <rect> avec la classe fill-emerald-200/60.
    const insideRect = container.querySelector('rect.fill-emerald-200\\/60')
    expect(insideRect).not.toBeNull()
  })
})
