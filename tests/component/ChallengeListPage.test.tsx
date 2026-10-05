import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { ChallengeListPage } from '~/components/ChallengeListPage'
import { findGame } from '~/lib/games-registry'
import { levelKey, recordWin } from '~/lib/localStorage'

/** Jour fixe dans le calendrier publié : les défis suivants sont masqués. */
const TODAY = '2026-10-03'

function renderPage(initialUrl = '/sokomot') {
  render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <ChallengeListPage gameId="sokomot" firstDate="2026-09-01" lastDate="2027-09-30" />
    </MemoryRouter>,
  )
}

describe('ChallengeListPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 3))
  })
  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('affiche le nom, la tagline et la description du jeu', () => {
    renderPage()
    const game = findGame('sokomot')
    expect(screen.getByRole('heading', { name: game.name })).toBeInTheDocument()
    expect(screen.getByText(game.tagline)).toBeInTheDocument()
    expect(screen.getByText(game.description)).toBeInTheDocument()
  })

  it('masque les défis à venir', () => {
    renderPage('/sokomot?from=2026-10-02')
    expect(
      screen.queryAllByRole('link').some((a) => a.getAttribute('href')?.includes('2026-10-04')),
    ).toBe(false)
  })

  it('affiche une section « Défi du jour » avec 4 niveaux', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Défi du jour/ })).toBeInTheDocument()
    expect(screen.getAllByText(/Niveau \d/).length).toBeGreaterThanOrEqual(4)
  })

  it('verrouille les niveaux 2..4 du jour tant que le précédent est non résolu', () => {
    renderPage()
    // Le niveau 1 est jouable, 2, 3 et 4 verrouillés (aucune progression).
    expect(screen.getByLabelText(/Niveau 2 verrouillé/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Niveau 3 verrouillé/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Niveau 4 verrouillé/)).toBeInTheDocument()
  })

  it('déverrouille le niveau 2 quand le niveau 1 est résolu', () => {
    recordWin('sokomot', levelKey(TODAY, 1), 'solved')
    renderPage()
    expect(screen.queryByLabelText(/Niveau 2 verrouillé/)).toBeNull()
  })

  it('affiche la section Archives', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Archives/ })).toBeInTheDocument()
  })

  it("ouvre le mois correspondant à ?from=YYYY-MM-DD à l'arrivée", async () => {
    renderPage('/sokomot?from=2026-09-15')
    // Le mois de septembre doit être ouvert : on retrouve une ligne pour la date.
    // dateLabelShort produit « mar. 15 ».
    expect(await screen.findByText(/mar\. 15/)).toBeInTheDocument()
  })

  it("affiche les 4 tuiles de niveau pour chaque jour d'archive", () => {
    renderPage()
    // L'archive du mois en cours est ouverte par défaut. On cherche un lien
    // niveau pour une date d'archive (≠ today) du dataset.
    const archive = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('/sokomot/2026-10-02/'))
    expect(archive).toHaveLength(4)
  })

  it('couronne « perfect » au header du jour si tous les niveaux du jour sont parfaits', () => {
    for (const i of [1, 2, 3, 4]) recordWin('sokomot', levelKey(TODAY, i), 'perfect')
    renderPage()
    const dailyHeader = screen.getByRole('heading', { name: /Défi du jour/ })
    // CheckMark rend un span décoratif avec la classe d'accent perfect (vert).
    const badge = dailyHeader.querySelector('span.bg-emerald-500')
    expect(badge).not.toBeNull()
  })
})
