import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { LevelTile } from '~/components/LevelTile'

function renderTile(overrides: Partial<React.ComponentProps<typeof LevelTile>> = {}) {
  const props: React.ComponentProps<typeof LevelTile> = {
    gameId: 'sokomot',
    date: '2026-05-08',
    index: 1,
    width: 7,
    height: 6,
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

  it('verrouillé : pas de lien, message de verrouillage et tooltip', () => {
    renderTile({ locked: true, index: 3 })
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Verrouillé')).toBeInTheDocument()
    // aria-label contient l'instruction sur le niveau précédent.
    const disabled = screen.getByLabelText(/Niveau 3 verrouillé/)
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    expect(disabled.getAttribute('title')).toContain('niveau 2')
  })

  it("perfect : libellé Rejouer", () => {
    renderTile({ status: 'perfect' })
    expect(screen.getByText('Rejouer')).toBeInTheDocument()
  })

  it("solved : libellé Améliorer", () => {
    renderTile({ status: 'solved' })
    expect(screen.getByText('Améliorer')).toBeInTheDocument()
  })

  it("unsolved : libellé Jouer", () => {
    renderTile({ status: 'unsolved' })
    expect(screen.getByText('Jouer')).toBeInTheDocument()
  })

  it('iceMode : badge Glace visible', () => {
    renderTile({ iceMode: true })
    expect(screen.getByText('Glace')).toBeInTheDocument()
  })

  it('iceMode désactivé : pas de badge Glace', () => {
    renderTile({ iceMode: false })
    expect(screen.queryByText('Glace')).toBeNull()
  })

  it("variant archive : pas de libellé Niveau N ni de statut texte", () => {
    renderTile({ variant: 'archive', status: 'perfect' })
    expect(screen.queryByText('Niveau 1')).toBeNull()
    expect(screen.queryByText('Rejouer')).toBeNull()
  })

  it('génère le bon href pour chaque jeu', () => {
    for (const gameId of ['sokomot', 'boucle', 'semantogramme'] as const) {
      const { unmount } = render(
        <MemoryRouter>
          <LevelTile
            gameId={gameId}
            date="2026-05-08"
            index={2}
            width={5}
            height={5}
            locked={false}
            status="unsolved"
          />
        </MemoryRouter>,
      )
      expect(screen.getByRole('link')).toHaveAttribute('href', `/${gameId}/2026-05-08/2`)
      unmount()
    }
  })
})
