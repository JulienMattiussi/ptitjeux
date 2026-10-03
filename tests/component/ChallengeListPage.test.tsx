import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { ChallengeListPage } from '~/components/ChallengeListPage'
import { writeLevelProgress } from '~/lib/localStorage'
import { levelKey } from '~/lib/useLocalProgress'

function renderPage(initialUrl = '/sokomot') {
  // On utilise des dates qui existent dans le dataset commité — sinon
  // `getLevelParMoves` retourne `undefined` partout et `LevelTile` n'a
  // pas de quoi calculer un statut perfect/solved.
  const dates = [
    '2026-09-01',
    '2026-09-15',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03', // = today (fourni par currentDate de la session)
  ]
  render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <ChallengeListPage
        gameId="sokomot"
        title="Sokomot"
        tagline="Pousse les lettres"
        description="Description du jeu Sokomot."
        dates={dates}
      />
    </MemoryRouter>,
  )
}

describe('ChallengeListPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    window.localStorage.clear()
  })

  it('affiche le titre, la tagline et la description', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Sokomot' })).toBeInTheDocument()
    expect(screen.getByText('Pousse les lettres')).toBeInTheDocument()
    expect(screen.getByText('Description du jeu Sokomot.')).toBeInTheDocument()
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
    writeLevelProgress('sokomot', levelKey('2026-10-03', 1), { completed: true, bestMoves: 100 })
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

  it('replie/déplie un mois au clic sur son entête', async () => {
    const user = userEvent.setup()
    renderPage()
    // Plusieurs mois affichés, le plus récent (octobre 2026) ouvert par défaut.
    const octoberHeader = screen.getByRole('button', { name: /octobre 2026/i })
    expect(octoberHeader).toHaveAttribute('aria-expanded', 'true')
    await user.click(octoberHeader)
    expect(octoberHeader).toHaveAttribute('aria-expanded', 'false')
  })

  it('ouvre un seul mois à la fois (accordéon mutuellement exclusif)', async () => {
    const user = userEvent.setup()
    renderPage()
    const octoberHeader = screen.getByRole('button', { name: /octobre 2026/i })
    const septemberHeader = screen.getByRole('button', { name: /septembre 2026/i })
    expect(octoberHeader).toHaveAttribute('aria-expanded', 'true')
    expect(septemberHeader).toHaveAttribute('aria-expanded', 'false')
    await user.click(septemberHeader)
    expect(septemberHeader).toHaveAttribute('aria-expanded', 'true')
    expect(octoberHeader).toHaveAttribute('aria-expanded', 'false')
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
    // Marque les 4 niveaux comme perfect (bestMoves = 1 ≤ parMoves).
    for (const i of [1, 2, 3, 4]) {
      writeLevelProgress('sokomot', levelKey('2026-10-03', i), {
        completed: true,
        bestMoves: 1,
      })
    }
    renderPage()
    const dailyHeader = screen.getByRole('heading', { name: /Défi du jour/ })
    // CheckMark rend un span décoratif avec la classe d'accent perfect (vert).
    const badge = dailyHeader.querySelector('span.bg-emerald-500')
    expect(badge).not.toBeNull()
  })
})
