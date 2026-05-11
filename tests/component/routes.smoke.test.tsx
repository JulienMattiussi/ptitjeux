import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import SokomotPlayRoute from '~/routes/sokomot.$date.$index'
import BouclePlayRoute from '~/routes/boucle.$date.$index'
import SemantogrammePlayRoute from '~/routes/semantogramme.$date.$index'

// Date qui existe dans le dataset commité — chaque jeu a 4 niveaux.
const DATE = '2026-05-01'

function renderRoute(
  path: string,
  url: string,
  Component: React.ComponentType,
) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={path} element={<Component />} />
        <Route path="*" element={<div data-testid="other-route" />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Routes de jeu — smoke', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // Empêche les requêtes Wiktionnaire en arrière-plan : on n'a rien à
    // tester côté définition ici, c'est couvert ailleurs.
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}),
    )
  })
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  describe('sokomot.$date.$index', () => {
    it('rend la page avec le titre, le mot cible et un plateau', () => {
      renderRoute(
        '/sokomot/:date/:index',
        `/sokomot/${DATE}/1`,
        SokomotPlayRoute,
      )
      expect(screen.getByText(/Sokomot/)).toBeInTheDocument()
      expect(screen.getByText(/niveau 1/)).toBeInTheDocument()
      expect(screen.getByText(/Mot à former/)).toBeInTheDocument()
      expect(screen.getByRole('application')).toBeInTheDocument()
    })

    it('affiche les contrôles Annuler et Recommencer', () => {
      renderRoute(
        '/sokomot/:date/:index',
        `/sokomot/${DATE}/1`,
        SokomotPlayRoute,
      )
      expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Recommencer/i })).toBeInTheDocument()
    })

    it("affiche LevelNotFound pour une date inexistante", () => {
      renderRoute(
        '/sokomot/:date/:index',
        `/sokomot/2099-01-01/1`,
        SokomotPlayRoute,
      )
      expect(screen.getByRole('heading', { name: /introuvable/i })).toBeInTheDocument()
    })
  })

  describe('boucle.$date.$index', () => {
    it('rend la page avec le titre, le sous-titre et un plateau', () => {
      renderRoute('/boucle/:date/:index', `/boucle/${DATE}/1`, BouclePlayRoute)
      // Le titre h1 contient « Boucle · … · niveau 1 ».
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Boucle/)
      expect(screen.getByText(/niveau 1/)).toBeInTheDocument()
      expect(screen.getByText(/lettres à encercler/)).toBeInTheDocument()
    })

    it("affiche LevelNotFound pour un index hors plage", () => {
      renderRoute(
        '/boucle/:date/:index',
        `/boucle/${DATE}/9`,
        BouclePlayRoute,
      )
      expect(screen.getByRole('heading', { name: /introuvable/i })).toBeInTheDocument()
    })
  })

  describe('semantogramme.$date.$index', () => {
    it('rend la page avec le titre et l\'aide IN/OUT', () => {
      renderRoute(
        '/semantogramme/:date/:index',
        `/semantogramme/${DATE}/1`,
        SemantogrammePlayRoute,
      )
      expect(screen.getByText(/Sémantogramme/)).toBeInTheDocument()
      expect(screen.getByText(/niveau 1/)).toBeInTheDocument()
      // L'encart d'aide contient les pastilles IN et OUT.
      expect(screen.getByText('IN')).toBeInTheDocument()
      expect(screen.getByText('OUT')).toBeInTheDocument()
    })

    it("affiche LevelNotFound quand l'URL ne fournit pas d'index valide", () => {
      renderRoute(
        '/semantogramme/:date/:index',
        `/semantogramme/${DATE}/0`,
        SemantogrammePlayRoute,
      )
      expect(screen.getByRole('heading', { name: /introuvable/i })).toBeInTheDocument()
    })
  })
})
