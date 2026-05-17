import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Board } from '~/games/semantogramme/Board'
import { cycleCellStatus, loadLevel } from '~/games/semantogramme/engine'
import type { Level } from '~/games/semantogramme/types'

const LEVEL: Level = {
  id: 'test',
  name: 'Test',
  width: 2,
  height: 2,
  words: [
    ['chat', 'pomme'],
    ['table', 'lion'],
  ],
  rowClues: [1, 1],
  colClues: [1, 1],
  themeWord: 'animal',
  solution: [
    [true, false],
    [false, true],
  ],
}

describe('semantogramme/Board', () => {
  it('rend une case par mot du niveau (avec aria-label)', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} onCellClick={() => {}} />)
    expect(screen.getByRole('button', { name: /Case chat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Case pomme/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Case table/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Case lion/i })).toBeInTheDocument()
  })

  it('affiche les indices de ligne et de colonne (0/N à l\'état initial)', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} onCellClick={() => {}} />)
    // 2 lignes + 2 colonnes = 4 affichages « 0 / 1 ».
    expect(screen.getAllByText('0 / 1')).toHaveLength(4)
  })

  it('déclenche onCellClick avec les coordonnées de la case cliquée', async () => {
    const user = userEvent.setup()
    const onCellClick = vi.fn()
    const state = loadLevel(LEVEL)
    render(<Board state={state} onCellClick={onCellClick} />)
    await user.click(screen.getByRole('button', { name: /Case chat/i }))
    expect(onCellClick).toHaveBeenCalledWith(0, 0)
  })

  it('reflète le statut « in » via aria-pressed=true', () => {
    let state = loadLevel(LEVEL)
    state = cycleCellStatus(state, 0, 0) // unmarked → in
    render(<Board state={state} onCellClick={() => {}} />)
    const chat = screen.getByRole('button', { name: /Case chat/i })
    expect(chat).toHaveAttribute('aria-pressed', 'true')
  })

  it('marque la case sélectionnée avec un anneau ring-2', () => {
    const state = loadLevel(LEVEL)
    render(<Board state={state} onCellClick={() => {}} selected={{ x: 1, y: 0 }} />)
    const pomme = screen.getByRole('button', { name: /Case pomme/i })
    expect(pomme.className).toMatch(/ring-2/)
  })

  it('appelle onHoverCell quand la souris survole une case', async () => {
    const user = userEvent.setup()
    const onHoverCell = vi.fn()
    const state = loadLevel(LEVEL)
    render(<Board state={state} onCellClick={() => {}} onHoverCell={onHoverCell} />)
    await user.hover(screen.getByRole('button', { name: /Case lion/i }))
    expect(onHoverCell).toHaveBeenCalledWith(1, 1)
  })
})
