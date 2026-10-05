import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as SokomotPlay from '~/routes/sokomot.$date.$index'
import * as BouclePlay from '~/routes/boucle.$date.$index'
import * as SemantogrammePlay from '~/routes/semantogramme.$date.$index'
import * as AngleMortPlay from '~/routes/anglemort.$date.$index'
import Home from '~/routes/home'
import * as SokomotIndex from '~/routes/sokomot'
import * as BoucleIndex from '~/routes/boucle'
import * as SemantogrammeIndex from '~/routes/semantogramme'
import * as AngleMortIndex from '~/routes/anglemort'
import { games } from '~/lib/games-registry'
import { renderRoute } from '../helpers/routes'

// Date qui existe dans le dataset commité — chaque jeu a 4 niveaux.
const DATE = '2026-10-01'

describe('Routes de jeu — smoke', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // Empêche les requêtes Wiktionnaire en arrière-plan : on n'a rien à
    // tester côté définition ici, c'est couvert ailleurs.
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))
    // Les listes masquent les défis à venir : jour fixe dans le calendrier publié.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 5))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  describe('sokomot.$date.$index', () => {
    it('rend la page avec le titre, le mot cible et un plateau', async () => {
      renderRoute('/sokomot/:date/:index', `/sokomot/${DATE}/1`, {
        Component: SokomotPlay.default,
        loader: SokomotPlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByText(/Sokomot/)).toBeInTheDocument()
      expect(screen.getByText(/niveau 1/)).toBeInTheDocument()
      expect(screen.getByText(/Mot à former/)).toBeInTheDocument()
      expect(screen.getByRole('application')).toBeInTheDocument()
    })

    it('affiche les contrôles Annuler et Recommencer', async () => {
      renderRoute('/sokomot/:date/:index', `/sokomot/${DATE}/1`, {
        Component: SokomotPlay.default,
        loader: SokomotPlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Recommencer/i })).toBeInTheDocument()
    })

    it('affiche LevelNotFound pour une date inexistante', async () => {
      renderRoute('/sokomot/:date/:index', `/sokomot/2099-01-01/1`, {
        Component: SokomotPlay.default,
        loader: SokomotPlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByRole('heading', { name: /introuvable/i })).toBeInTheDocument()
    })
  })

  describe('boucle.$date.$index', () => {
    it('rend la page avec le titre, le sous-titre et un plateau', async () => {
      renderRoute('/boucle/:date/:index', `/boucle/${DATE}/1`, {
        Component: BouclePlay.default,
        loader: BouclePlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      // Le titre h1 contient « Boucle · … · niveau 1 ».
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Boucle/)
      expect(screen.getByText(/niveau 1/)).toBeInTheDocument()
      expect(screen.getByText(/lettres à encercler/)).toBeInTheDocument()
    })

    it('affiche LevelNotFound pour un index hors plage', async () => {
      renderRoute('/boucle/:date/:index', `/boucle/${DATE}/9`, {
        Component: BouclePlay.default,
        loader: BouclePlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByRole('heading', { name: /introuvable/i })).toBeInTheDocument()
    })
  })

  describe('semantogramme.$date.$index', () => {
    it("rend la page avec le titre et l'aide IN/OUT", async () => {
      renderRoute('/semantogramme/:date/:index', `/semantogramme/${DATE}/1`, {
        Component: SemantogrammePlay.default,
        loader: SemantogrammePlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByText(/Sémantogramme/)).toBeInTheDocument()
      expect(screen.getByText(/niveau 1/)).toBeInTheDocument()
      // L'encart d'aide contient les pastilles IN et OUT.
      expect(screen.getByText('IN')).toBeInTheDocument()
      expect(screen.getByText('OUT')).toBeInTheDocument()
    })

    it("affiche LevelNotFound quand l'URL ne fournit pas d'index valide", async () => {
      renderRoute('/semantogramme/:date/:index', `/semantogramme/${DATE}/0`, {
        Component: SemantogrammePlay.default,
        loader: SemantogrammePlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByRole('heading', { name: /introuvable/i })).toBeInTheDocument()
    })
  })

  describe('anglemort.$date.$index', () => {
    it('rend la page avec le titre, le compteur de poses et la réserve de vigiles', async () => {
      renderRoute('/anglemort/:date/:index', `/anglemort/${DATE}/1`, {
        Component: AngleMortPlay.default,
        loader: AngleMortPlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Angle mort/)
      expect(screen.getByText('Poses')).toBeInTheDocument()
      expect(screen.getByText('Vigiles à placer')).toBeInTheDocument()
    })

    it('affiche LevelNotFound pour une date inexistante', async () => {
      renderRoute('/anglemort/:date/:index', `/anglemort/2099-01-01/1`, {
        Component: AngleMortPlay.default,
        loader: AngleMortPlay.loader,
      })
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByRole('heading', { name: /introuvable/i })).toBeInTheDocument()
    })
  })

  describe("page d'accueil", () => {
    it('présente les quatre jeux', () => {
      renderRoute('/', '/', { Component: Home })
      for (const game of games) {
        expect(screen.getByRole('heading', { name: game.name })).toBeInTheDocument()
      }
    })
  })

  describe('listes des niveaux', () => {
    it.each([
      ['sokomot', SokomotIndex],
      ['boucle', BoucleIndex],
      ['semantogramme', SemantogrammeIndex],
      ['anglemort', AngleMortIndex],
    ] as const)('/%s affiche le défi du jour et les archives', async (id, module) => {
      renderRoute(`/${id}`, `/${id}`, { Component: module.default, loader: module.loader })
      expect(await screen.findByRole('heading', { name: /Défi du jour/ })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Archives' })).toBeInTheDocument()
    })
  })
})
