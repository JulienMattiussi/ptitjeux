import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { ArchiveAccordion } from '~/components/ArchiveAccordion'
import { writeLevelProgress } from '~/lib/localStorage'
import type { GameProgress } from '~/lib/localStorage'
import { levelKey } from '~/lib/useLocalProgress'

function renderArchive(props: Partial<React.ComponentProps<typeof ArchiveAccordion>> = {}) {
  const defaults: React.ComponentProps<typeof ArchiveAccordion> = {
    gameId: 'sokomot',
    dates: ['2026-09-01', '2026-09-15', '2026-10-01', '2026-10-02'],
    progress: {} as GameProgress,
    ...props,
  }
  render(
    <MemoryRouter>
      <ArchiveAccordion {...defaults} />
    </MemoryRouter>,
  )
}

describe('ArchiveAccordion', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    window.localStorage.clear()
  })

  it("rend un message vide quand il n'y a aucune archive", () => {
    renderArchive({ dates: [] })
    expect(screen.getByText(/Aucun défi archivé/)).toBeInTheDocument()
  })

  it('groupe les dates par mois et ouvre le plus récent par défaut', () => {
    renderArchive()
    const octoberHeader = screen.getByRole('button', { name: /octobre 2026/i })
    const septemberHeader = screen.getByRole('button', { name: /septembre 2026/i })
    expect(octoberHeader).toHaveAttribute('aria-expanded', 'true')
    expect(septemberHeader).toHaveAttribute('aria-expanded', 'false')
  })

  it('affiche le nombre de jours par mois', () => {
    renderArchive()
    // Octobre et septembre ont 2 jours chacun → 2 occurrences.
    expect(screen.getAllByText('2 jours')).toHaveLength(2)
  })

  it('focusDate ouvre le mois correspondant en priorité', () => {
    renderArchive({ focusDate: '2026-09-15' })
    const octoberHeader = screen.getByRole('button', { name: /octobre 2026/i })
    const septemberHeader = screen.getByRole('button', { name: /septembre 2026/i })
    expect(septemberHeader).toHaveAttribute('aria-expanded', 'true')
    expect(octoberHeader).toHaveAttribute('aria-expanded', 'false')
  })

  it('rend 4 tuiles de niveau pour chaque jour ouvert', () => {
    renderArchive()
    // Octobre est ouvert : 2 jours × 4 niveaux = 8 liens vers /sokomot/2026-10-*/N.
    const links = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.startsWith('/sokomot/2026-10-'))
    expect(links).toHaveLength(8)
  })

  it('replie le mois ouvert quand on reclique dessus', async () => {
    const user = userEvent.setup()
    renderArchive()
    const octoberHeader = screen.getByRole('button', { name: /octobre 2026/i })
    await user.click(octoberHeader)
    expect(octoberHeader).toHaveAttribute('aria-expanded', 'false')
  })

  it('ouvre un autre mois ferme le précédent (mutuellement exclusif)', async () => {
    const user = userEvent.setup()
    renderArchive()
    const octoberHeader = screen.getByRole('button', { name: /octobre 2026/i })
    const septemberHeader = screen.getByRole('button', { name: /septembre 2026/i })
    await user.click(septemberHeader)
    expect(septemberHeader).toHaveAttribute('aria-expanded', 'true')
    expect(octoberHeader).toHaveAttribute('aria-expanded', 'false')
  })

  it('affiche une coche perfect sur le mois si tous ses jours sont parfaits', () => {
    // Marque tous les niveaux d'octobre comme perfect.
    const progress: GameProgress = {}
    for (const date of ['2026-10-01', '2026-10-02']) {
      for (const i of [1, 2, 3, 4]) {
        progress[levelKey(date, i)] = {
          completed: true,
          bestMoves: 1,
          lastPlayedAt: '',
        }
      }
    }
    renderArchive({ progress })
    const octoberHeader = screen.getByRole('button', { name: /octobre 2026/i })
    expect(octoberHeader.querySelector('span.bg-emerald-500')).not.toBeNull()
  })

  it('affiche une coche solved (ambre) si tous résolus mais pas tous parfaits', () => {
    const progress: GameProgress = {}
    for (const date of ['2026-10-01', '2026-10-02']) {
      for (const i of [1, 2, 3, 4]) {
        // bestMoves très haut = au-dessus du parMoves → solved
        progress[levelKey(date, i)] = {
          completed: true,
          bestMoves: 10000,
          lastPlayedAt: '',
        }
      }
    }
    renderArchive({ progress })
    const octoberHeader = screen.getByRole('button', { name: /octobre 2026/i })
    expect(octoberHeader.querySelector('span.bg-amber-500')).not.toBeNull()
  })

  it("ne sert pas writeLevelProgress (sanity check : pas d'effet de bord)", () => {
    writeLevelProgress('sokomot', '2026-10-02-1', { completed: true })
    renderArchive()
    expect(screen.getByRole('button', { name: /octobre 2026/i })).toBeInTheDocument()
  })
})
