import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { LevelTile } from '~/components/LevelTile'
import { games } from '~/lib/games-registry'

const GAME_IDS = games.map((g) => g.id)

function renderTile(overrides: Partial<React.ComponentProps<typeof LevelTile>> = {}) {
  const props: React.ComponentProps<typeof LevelTile> = {
    gameId: 'sokomot',
    date: '2026-05-08',
    index: 1,
    locked: false,
    status: 'unsolved',
    ...overrides,
  }
  render(
    <MemoryRouter>
      <LevelTile {...props} />
    </MemoryRouter>,
  )
}

describe('LevelTile', () => {
  it('non verrouillé : rend un lien vers le niveau', () => {
    renderTile()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/sokomot/2026-05-08/1')
    expect(screen.getByText('7 × 6')).toBeInTheDocument()
    expect(screen.getByText('Niveau 1')).toBeInTheDocument()
  })

  it('jour passé en archive : un œil ouvre le niveau avec sa solution', () => {
    renderTile({ variant: 'archive', revealed: true })
    expect(
      screen.getByRole('link', { name: 'Solution du niveau 1 du 8 mai 2026' }),
    ).toHaveAttribute('href', '/sokomot/2026-05-08/1?solution')
  })

  it('sans révélation : pas de lien vers la solution', () => {
    renderTile({ variant: 'archive' })
    expect(screen.queryByRole('link', { name: /Solution/ })).toBeNull()
  })

  it('verrouillé : pas de lien, message de verrouillage et infobulle', () => {
    renderTile({ locked: true, index: 3 })
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Verrouillé')).toBeInTheDocument()
    const disabled = screen.getByLabelText(/Niveau 3 verrouillé/)
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    expect(disabled.getAttribute('title')).toContain('niveau 2')
  })

  it('perfect : libellé Rejouer', () => {
    renderTile({ status: 'perfect' })
    expect(screen.getByText('Rejouer')).toBeInTheDocument()
  })

  it('solved : libellé Améliorer', () => {
    renderTile({ status: 'solved' })
    expect(screen.getByText('Améliorer')).toBeInTheDocument()
  })

  it('unsolved : libellé Jouer', () => {
    renderTile({ status: 'unsolved' })
    expect(screen.getByText('Jouer')).toBeInTheDocument()
  })

  it('variante archive : pas de libellé Niveau N ni de statut texte', () => {
    renderTile({ variant: 'archive', status: 'perfect' })
    expect(screen.queryByText('Niveau 1')).toBeNull()
    expect(screen.queryByText('Rejouer')).toBeNull()
  })

  it.each(GAME_IDS)('génère le bon href pour %s', (gameId) => {
    renderTile({ gameId, index: 2 })
    expect(screen.getByRole('link')).toHaveAttribute('href', `/${gameId}/2026-05-08/2`)
  })

  it('variante archive : le lien nomme le niveau, sa date et son statut', () => {
    renderTile({ variant: 'archive', status: 'perfect', index: 2 })
    expect(
      screen.getByRole('link', { name: 'Niveau 2 du 8 mai 2026, parfait' }),
    ).toBeInTheDocument()
  })
})
