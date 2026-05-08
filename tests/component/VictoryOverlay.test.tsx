import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { VictoryOverlay } from '~/components/VictoryOverlay'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderOverlay(props: Partial<React.ComponentProps<typeof VictoryOverlay>> = {}) {
  const onReset = vi.fn()
  const allProps: React.ComponentProps<typeof VictoryOverlay> = {
    show: true,
    title: 'Niveau résolu',
    onReset,
    backHref: '/sokomot',
    ...props,
  }
  render(
    <MemoryRouter initialEntries={['/sokomot/2026-05-08/1']}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <VictoryOverlay {...allProps} />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
  return { onReset }
}

describe('VictoryOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("ne rend rien quand show est false", () => {
    render(
      <MemoryRouter>
        <VictoryOverlay show={false} title="X" onReset={vi.fn()} backHref="/sokomot" />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('rend titre, détail et boutons', () => {
    renderOverlay({
      detail: <p>Détail de victoire</p>,
      nextHref: '/sokomot/2026-05-08/2',
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Niveau résolu' })).toBeInTheDocument()
    expect(screen.getByText('Détail de victoire')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Niveaux' })).toHaveAttribute('href', '/sokomot')
    expect(screen.getByRole('button', { name: 'Rejouer' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Suivant →' })).toHaveAttribute(
      'href',
      '/sokomot/2026-05-08/2',
    )
  })

  it('omet le bouton Suivant quand nextHref est absent', () => {
    renderOverlay()
    expect(screen.queryByRole('link', { name: 'Suivant →' })).toBeNull()
  })

  it('appelle onReset au clic sur Rejouer', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onReset } = renderOverlay()
    await user.click(screen.getByRole('button', { name: 'Rejouer' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it("Entrée déclenche onReset (jamais le bouton focalisé)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onReset } = renderOverlay({ nextHref: '/sokomot/2026-05-08/2' })
    await user.keyboard('{Enter}')
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('Espace déclenche aussi onReset', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onReset } = renderOverlay()
    await user.keyboard(' ')
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('flèche gauche / Backspace / Échap navigue vers backHref', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderOverlay()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByTestId('location')).toHaveTextContent('/sokomot')
  })

  it('Backspace navigue aussi vers backHref', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderOverlay()
    await user.keyboard('{Backspace}')
    expect(screen.getByTestId('location')).toHaveTextContent('/sokomot')
  })

  it('Échap navigue aussi vers backHref', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderOverlay()
    await user.keyboard('{Escape}')
    expect(screen.getByTestId('location')).toHaveTextContent('/sokomot')
  })

  it('flèche droite navigue vers nextHref si défini', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderOverlay({ nextHref: '/sokomot/2026-05-08/2' })
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('location')).toHaveTextContent('/sokomot/2026-05-08/2')
  })

  it('flèche droite est ignorée sans nextHref', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderOverlay()
    await user.keyboard('{ArrowRight}')
    // Pas de navigation : on reste sur la route initiale.
    expect(screen.getByTestId('location')).toHaveTextContent('/sokomot/2026-05-08/1')
  })

  it("ne réagit plus au clavier après show=false (cleanup du listener)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onReset = vi.fn()
    function Wrapper({ show }: { show: boolean }) {
      return <VictoryOverlay show={show} title="X" onReset={onReset} backHref="/sokomot" />
    }
    const { rerender } = render(
      <MemoryRouter>
        <Wrapper show={true} />
      </MemoryRouter>,
    )
    rerender(
      <MemoryRouter>
        <Wrapper show={false} />
      </MemoryRouter>,
    )
    await user.keyboard('{Enter}')
    expect(onReset).not.toHaveBeenCalled()
  })
})
