import { useRef } from 'react'

/** Durée d'un appui long au doigt, comme les menus contextuels des téléphones. */
export const LONG_PRESS_MS = 500

/**
 * Appui long au doigt, pour les actions réservées au clic droit sur ordinateur.
 * `consume` dit si le geste qui s'achève a déjà déclenché l'appui long : le
 * clic (ou le menu contextuel, que certains téléphones émettent aussi) qui le
 * suit doit alors être ignoré, pour ne pas agir deux fois.
 */
export function useLongPress(onLongPress: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const fired = useRef(false)
  const cancel = () => clearTimeout(timer.current)
  return {
    handlers: {
      onPointerDown: (event: React.PointerEvent) => {
        if (event.pointerType !== 'touch') return
        fired.current = false
        timer.current = setTimeout(() => {
          fired.current = true
          onLongPress()
        }, LONG_PRESS_MS)
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
    },
    consume: (): boolean => {
      cancel()
      const done = fired.current
      fired.current = false
      return done
    },
  }
}
