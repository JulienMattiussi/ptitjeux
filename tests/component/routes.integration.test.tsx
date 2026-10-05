import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as SokomotPlay from '~/routes/sokomot.$date.$index'
import { readGameProgress } from '~/lib/localStorage'
import type { Direction } from '~/games/sokomot/types'
import { committedChallenges } from '../helpers/levels'
import { renderRoute as renderAt } from '../helpers/routes'

const DATE = '2026-10-01'
const LEVEL = committedChallenges('sokomot').getLevel(DATE, 1)!

const KEY_BY_DIRECTION: Record<Direction, string> = {
  up: '{ArrowUp}',
  down: '{ArrowDown}',
  left: '{ArrowLeft}',
  right: '{ArrowRight}',
}

async function renderRoute(url: string) {
  renderAt('/sokomot/:date/:index', url, {
    Component: SokomotPlay.default,
    loader: SokomotPlay.loader,
  })
  await screen.findByText('Coups')
}

describe('routes (intégration) : Sokomot, partie complète jouer → gagner → progression', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // Wiktionnaire : fetch suspendu pour ne pas générer de bruit.
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('appliquer la solution au clavier déclenche la victoire et écrit la progression', async () => {
    const user = userEvent.setup()
    await renderRoute(`/sokomot/${DATE}/1`)

    expect(screen.queryByText(/Niveau parfait|Niveau résolu/)).not.toBeInTheDocument()

    for (const move of LEVEL.solution) {
      await user.keyboard(KEY_BY_DIRECTION[move])
    }

    // L'overlay attend la fin du glissement des blocs (280 ms) avant d'apparaître.
    expect(await screen.findByText(/Niveau parfait|Niveau résolu/)).toBeInTheDocument()

    const progress = readGameProgress('sokomot')
    expect(progress[`${DATE}-1`]?.status).toBe('perfect')
  })

  it('le bouton Recommencer remet les coups à 0', async () => {
    const user = userEvent.setup()
    await renderRoute(`/sokomot/${DATE}/1`)
    // Le premier coup de la solution est forcément jouable.
    await user.keyboard(KEY_BY_DIRECTION[LEVEL.solution[0]])
    const counter = screen.getByText('Coups').nextElementSibling
    expect(counter).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: /Recommencer/i }))
    expect(counter).toHaveTextContent('0')
  })

  it('Ctrl+Z annule le dernier coup', async () => {
    const user = userEvent.setup()
    await renderRoute(`/sokomot/${DATE}/1`)
    await user.keyboard(KEY_BY_DIRECTION[LEVEL.solution[0]])
    await user.keyboard('{Control>}z{/Control}')
    expect(screen.getByText('Coups').nextElementSibling).toHaveTextContent('0')
  })
})
