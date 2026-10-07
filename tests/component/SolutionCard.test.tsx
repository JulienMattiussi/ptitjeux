import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SolutionCard } from '~/components/SolutionCard'
import { useSolution } from '~/lib/useSolution'

function Harness({ revealed }: { revealed: boolean }) {
  const solution = useSolution(revealed)
  return (
    <>
      <p>{solution.shown ? 'plateau résolu' : 'ma partie'}</p>
      <SolutionCard solution={solution}>Le mot était CHAT.</SolutionCard>
    </>
  )
}

function renderAt(url: string, revealed: boolean) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Harness revealed={revealed} />
    </MemoryRouter>,
  )
}

describe('SolutionCard', () => {
  it('défi du jour : aucun bouton de solution', () => {
    renderAt('/boucle/2026-10-05/1', false)
    expect(screen.queryByRole('button', { name: /solution/ })).toBeNull()
  })

  it('défi du jour : `?solution` ne montre rien', () => {
    renderAt('/boucle/2026-10-05/1?solution', false)
    expect(screen.getByText('ma partie')).toBeInTheDocument()
  })

  it('jour passé : le bouton montre la solution, puis ramène à la partie', async () => {
    renderAt('/boucle/2026-10-04/1', true)
    await userEvent.click(screen.getByRole('button', { name: 'Voir la solution' }))
    expect(screen.getByText('plateau résolu')).toBeInTheDocument()
    expect(screen.getByText('Le mot était CHAT.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Revenir à ma partie' }))
    expect(screen.getByText('ma partie')).toBeInTheDocument()
  })

  it('jour passé : `?solution` ouvre directement la solution', () => {
    renderAt('/boucle/2026-10-04/1?solution', true)
    expect(screen.getByText('plateau résolu')).toBeInTheDocument()
  })
})
