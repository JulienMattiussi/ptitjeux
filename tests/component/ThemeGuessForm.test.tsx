import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeGuessForm } from '~/games/semantogramme/ThemeGuessForm'

function renderForm(error = false) {
  const onChange = vi.fn()
  const onSubmit = vi.fn()
  render(<ThemeGuessForm value="" onChange={onChange} onSubmit={onSubmit} error={error} />)
  return { onChange, onSubmit }
}

describe('ThemeGuessForm', () => {
  it('transmet la saisie', async () => {
    const user = userEvent.setup()
    const { onChange } = renderForm()
    await user.type(screen.getByLabelText(/Quel est le thème/), 'c')
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('valide avec Entrée', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()
    await user.type(screen.getByLabelText(/Quel est le thème/), '{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('signale une mauvaise proposition', () => {
    renderForm(true)
    expect(screen.getByText(/Pas tout à fait/)).toBeInTheDocument()
  })
})
