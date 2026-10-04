import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { loadLevel, placeGuard } from '~/games/anglemort/engine'
import { GuardTypePicker } from '~/games/anglemort/GuardTypePicker'
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
  }
  return loadLevel(level)
}

describe('GuardTypePicker', () => {
  it("n'apparaît pas quand le lot n'a qu'un type", () => {
    const { container } = render(
      <GuardTypePicker
        state={state({ simple: 3, angle: 0, oppose: 0 })}
        selected="simple"
        onSelect={() => {}}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('annonce le type sélectionné', () => {
    render(
      <GuardTypePicker
        state={state({ simple: 2, angle: 1, oppose: 1 })}
        selected="angle"
        onSelect={() => {}}
      />,
    )
    expect(screen.getByRole('radio', { name: /en angle/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('choisit un type au clic', async () => {
    const onSelect = vi.fn()
    render(
      <GuardTypePicker
        state={state({ simple: 2, angle: 1, oppose: 1 })}
        selected="simple"
        onSelect={onSelect}
      />,
    )
    await userEvent.click(screen.getByRole('radio', { name: /opposé/i }))
    expect(onSelect).toHaveBeenCalledWith('oppose')
  })

  it('désactive un type dont la réserve est vide', () => {
    const s = placeGuard(state({ simple: 1, angle: 1, oppose: 0 }), 2, 1, 'angle')
    render(<GuardTypePicker state={s} selected="simple" onSelect={() => {}} />)
    expect(screen.getByRole('radio', { name: /en angle/i })).toBeDisabled()
  })
})
