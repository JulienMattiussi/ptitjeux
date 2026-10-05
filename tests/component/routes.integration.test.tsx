import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import SokomotPlayRoute from '~/routes/sokomot.$date.$index'
import { getLevel } from '~/games/sokomot/challenges'
import { readGameProgress } from '~/lib/localStorage'
import type { Direction } from '~/games/sokomot/types'

const DATE = '2026-10-01'

const KEY_BY_DIRECTION: Record<Direction, string> = {
  up: '{ArrowUp}',
  down: '{ArrowDown}',
  left: '{ArrowLeft}',
  right: '{ArrowRight}',
}

function renderRoute(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/sokomot/:date/:index" element={<SokomotPlayRoute />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('routes (intégration) : Sokomot — flow complet jouer → gagner → progression', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // Wiktionnaire : fetch suspendu pour ne pas générer de bruit.
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('appliquer la solution au clavier déclenche la victoire et écrit la progression', async () => {
    const level = getLevel(DATE, 1)!

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderRoute(`/sokomot/${DATE}/1`)

    // Sanity : l'overlay de victoire n'est pas visible au démarrage.
    expect(screen.queryByText(/Niveau parfait|Niveau résolu/)).not.toBeInTheDocument()

    // Joue la solution stockée.
    for (const move of level.solution) {
      await user.keyboard(KEY_BY_DIRECTION[move])
    }

    // L'overlay attend 280ms avant d'apparaître.
    vi.advanceTimersByTime(300)
    await waitFor(() => {
      expect(screen.getByText(/Niveau parfait|Niveau résolu/)).toBeInTheDocument()
    })

    // La progression a été écrite dans localStorage.
    const progress = readGameProgress('sokomot')
    expect(progress[`${DATE}-1`]?.completed).toBe(true)
    expect(progress[`${DATE}-1`]?.bestMoves).toBe(level.solution.length)
  })

  it('le bouton Recommencer remet les coups à 0', async () => {
    const user = userEvent.setup()
    renderRoute(`/sokomot/${DATE}/1`)
    // Le premier coup de la solution est forcément jouable.
    await user.keyboard(KEY_BY_DIRECTION[getLevel(DATE, 1)!.solution[0]])
    const counter = screen.getByText('Coups').nextElementSibling
    expect(counter).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: /Recommencer/i }))
    expect(counter).toHaveTextContent('0')
  })

  it('Ctrl+Z annule le dernier coup', async () => {
    const user = userEvent.setup()
    renderRoute(`/sokomot/${DATE}/1`)
    await user.keyboard(KEY_BY_DIRECTION[getLevel(DATE, 1)!.solution[0]])
    await user.keyboard('{Control>}z{/Control}')
    expect(screen.getByText('Coups').nextElementSibling).toHaveTextContent('0')
  })
})
