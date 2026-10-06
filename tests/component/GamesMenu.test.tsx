import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { GamesMenu } from '~/components/GamesMenu'
import { games } from '~/lib/games-registry'

function renderMenu() {
  render(
    <MemoryRouter>
      <GamesMenu />
    </MemoryRouter>,
  )
}

describe('GamesMenu', () => {
  it('est fermé au départ', () => {
    renderMenu()
    expect(screen.getByRole('button', { name: /ouvrir le menu/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('liste un lien vers chaque jeu une fois ouvert', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: /ouvrir le menu/i }))
    for (const game of games) {
      expect(screen.getByRole('link', { name: new RegExp(game.name) })).toHaveAttribute(
        'href',
        game.href,
      )
    }
  })

  it('se ferme avec Échap', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: /ouvrir le menu/i }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('se ferme sur un clic en dehors', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: /ouvrir le menu/i }))
    await userEvent.click(document.body)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
