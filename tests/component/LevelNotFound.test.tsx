import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { LevelNotFound } from '~/components/LevelNotFound'

describe('LevelNotFound', () => {
  it('affiche un titre, un message et un lien de retour vers backHref', () => {
    render(
      <MemoryRouter>
        <LevelNotFound backHref="/sokomot" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /introuvable/i })).toBeInTheDocument()
    expect(screen.getByText(/n'existe pas/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /^retour$/i })
    expect(link).toHaveAttribute('href', '/sokomot')
  })
})
