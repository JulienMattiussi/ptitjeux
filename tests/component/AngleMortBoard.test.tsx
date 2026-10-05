import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Board } from '~/games/anglemort/Board'
import { loadLevel, placeGuard } from '~/games/anglemort/engine'
import type { Level } from '~/games/anglemort/types'

const LEVEL: Level = {
  id: 'test',
  name: 'Test',
  width: 4,
  height: 3,
  pillars: [[1, 2]],
  mirrors: [],
  door: [0, 0],
  diamond: [3, 0],
  clues: { '1,1': 1 },
  pool: { simple: 2, angle: 0, oppose: 0 },
  parMoves: 2,
  solution: [],
}

function renderBoard(state = loadLevel(LEVEL)) {
  const onCellClick = vi.fn()
  const onCellRemove = vi.fn()
  render(<Board state={state} onCellClick={onCellClick} onCellRemove={onCellRemove} />)
  return { onCellClick, onCellRemove }
}

describe('anglemort/Board', () => {
  it('nomme la porte, le diamant et les piliers', () => {
    renderBoard()
    expect(screen.getByRole('button', { name: "Case d'entrée" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Diamant' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Pilier' })).toBeInTheDocument()
  })

  it("accorde le libellé d'un indice à un seul vigile", () => {
    renderBoard()
    expect(
      screen.getByRole('button', { name: /Indice : 1 vigile doit éclairer cette case/ }),
    ).toBeInTheDocument()
  })

  it("annonce l'orientation d'un vigile posé", () => {
    renderBoard(placeGuard(loadLevel(LEVEL), 0, 1, 'simple'))
    expect(screen.getByRole('button', { name: /Vigile tourné vers/ })).toBeInTheDocument()
  })

  it('clic : pose ou pivote sur la case visée', async () => {
    const user = userEvent.setup()
    const { onCellClick } = renderBoard()
    await user.click(screen.getByRole('button', { name: 'Diamant' }))
    expect(onCellClick).toHaveBeenCalledWith(3, 0)
  })

  it('clic droit : retire le vigile de la case', async () => {
    const user = userEvent.setup()
    const { onCellRemove } = renderBoard(placeGuard(loadLevel(LEVEL), 0, 1, 'simple'))
    await user.pointer({
      keys: '[MouseRight]',
      target: screen.getByRole('button', { name: /Vigile tourné vers/ }),
    })
    expect(onCellRemove).toHaveBeenCalledWith(0, 1)
  })
})
