import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlayControls } from '~/components/PlayControls'

describe('PlayControls', () => {
  it('Annuler et Recommencer appellent leurs actions', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    const onReset = vi.fn()
    render(<PlayControls onUndo={onUndo} onReset={onReset} />)
    await user.click(screen.getByRole('button', { name: /Annuler/ }))
    await user.click(screen.getByRole('button', { name: /Recommencer/ }))
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it("désactive Annuler quand il n'y a rien à annuler", () => {
    render(<PlayControls onUndo={() => {}} onReset={() => {}} undoDisabled />)
    expect(screen.getByRole('button', { name: /Annuler/ })).toBeDisabled()
  })
})
