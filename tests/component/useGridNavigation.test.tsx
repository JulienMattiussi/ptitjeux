import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useGridNavigation } from '~/lib/useGridNavigation'

/**
 * jsdom ne calcule aucune mise en page : on donne à chaque élément une
 * position fixe (grille 2 × 2) pour que la navigation spatiale ait des
 * coordonnées réalistes.
 */
function place(el: HTMLElement | null, left: number, top: number) {
  if (!el) return
  const rect = {
    left,
    top,
    width: 10,
    height: 10,
    right: left + 10,
    bottom: top + 10,
    x: left,
    y: top,
  }
  el.getBoundingClientRect = () => ({ ...rect, toJSON: () => rect }) as DOMRect
  // Le hook ne lit que `.length` (élément visible ou non) : une liste factice
  // d'un rectangle suffit, d'où ce transtypage.
  el.getClientRects = () => [rect] as unknown as DOMRectList
}

function Grid({ onBack, onOpen }: { onBack?: () => void; onOpen?: (e: React.MouseEvent) => void }) {
  useGridNavigation({ onBack })
  return (
    <div>
      <a href="#a" data-nav-item="" ref={(el) => place(el, 0, 0)} onClick={onOpen}>
        A
      </a>
      <a href="#b" data-nav-item="" ref={(el) => place(el, 20, 0)}>
        B
      </a>
      <button type="button" data-nav-item="" ref={(el) => place(el, 0, 20)}>
        C
      </button>
      <input aria-label="saisie" ref={(el) => place(el, 20, 20)} />
    </div>
  )
}

describe('useGridNavigation', () => {
  it('la première flèche place le focus sur le premier élément', async () => {
    render(<Grid />)
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByText('A')).toHaveFocus()
  })

  it('les flèches déplacent le focus vers le voisin dans la direction', async () => {
    render(<Grid />)
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByText('B')).toHaveFocus()
  })

  it('ZQSD fonctionne aussi (AZERTY)', async () => {
    render(<Grid />)
    await userEvent.keyboard('{ArrowRight}s')
    expect(screen.getByText('C')).toHaveFocus()
  })

  it('Espace active le lien focalisé', async () => {
    // Le clic de jsdom sur un lien tenterait une navigation : on l'intercepte.
    const onOpen = vi.fn((e: React.MouseEvent) => e.preventDefault())
    render(<Grid onOpen={onOpen} />)
    await userEvent.keyboard('{ArrowRight} ')
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('Échap et Retour arrière appellent onBack', async () => {
    const onBack = vi.fn()
    render(<Grid onBack={onBack} />)
    await userEvent.keyboard('{Escape}{Backspace}')
    expect(onBack).toHaveBeenCalledTimes(2)
  })

  it('ignore les frappes dans un champ de saisie', async () => {
    const onBack = vi.fn()
    render(<Grid onBack={onBack} />)
    await userEvent.click(screen.getByLabelText('saisie'))
    await userEvent.keyboard('{Backspace}z')
    expect(onBack).not.toHaveBeenCalled()
    expect(screen.getByLabelText('saisie')).toHaveValue('z')
  })
})
