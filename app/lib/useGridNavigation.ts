import { useEffect } from 'react'
import { pickInDirection } from './spatialFocus'
import { keyDirection } from './useGameKeyboard'
import { useLatestRef } from './useLatestRef'

/** Attribut qui rend un lien ou un bouton atteignable aux flèches (à poser dans le JSX). */
const NAV_ITEM = 'data-nav-item'

type Options = {
  enabled?: boolean
  /** Retour arrière ou Échap : page précédente. */
  onBack?: () => void
  /** Élément focalisé à la première flèche, quand rien n'a encore le focus. */
  initialFocus?: () => HTMLElement | null
}

function visibleItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[${NAV_ITEM}]`)).filter(
    (el) => el.getClientRects().length > 0,
  )
}

/**
 * Navigation au clavier hors des pages de jeu : les flèches (ou ZQSD / WASD)
 * déplacent le focus vers l'élément `[data-nav-item]` le plus proche à
 * l'écran, Entrée ou Espace l'active, Retour arrière ou Échap revient à la
 * page précédente. Indépendant de la mise en page (colonnes, accordéons).
 */
export function useGridNavigation({ enabled = true, onBack, initialFocus }: Options = {}): void {
  const onBackRef = useLatestRef(onBack)
  const initialRef = useLatestRef(initialFocus)

  useEffect(() => {
    if (!enabled) return
    function handleKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const active = document.activeElement
      const items = visibleItems()
      const focused = items.find((el) => el === active)

      if ((event.key === 'Escape' || event.key === 'Backspace') && onBackRef.current) {
        event.preventDefault()
        onBackRef.current()
        return
      }

      // Un lien ne s'active pas nativement à l'Espace (contrairement aux boutons).
      if (event.key === ' ' && focused instanceof HTMLAnchorElement) {
        event.preventDefault()
        focused.click()
        return
      }

      const direction = keyDirection(event)
      if (!direction) return
      event.preventDefault()
      if (!focused) {
        ;(initialRef.current?.() ?? items[0])?.focus()
        return
      }
      const others = items.filter((el) => el !== focused)
      const next = pickInDirection(
        focused.getBoundingClientRect(),
        others.map((el) => el.getBoundingClientRect()),
        direction,
      )
      if (next >= 0) {
        others[next].focus()
        others[next].scrollIntoView?.({ block: 'nearest' })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [enabled, onBackRef, initialRef])
}
