import { useEffect } from 'react'

export type GameKeyDirection = 'up' | 'down' | 'left' | 'right'

const KEY_TO_DIRECTION: Record<string, GameKeyDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

const ACTION_KEYS = new Set([' ', 'Spacebar', 'Enter'])

type Options = {
  enabled: boolean
  onDirection?: (direction: GameKeyDirection) => void
  /** Espace ou Entrée — action principale (poser/cycler/basculer). */
  onAction?: () => void
  /** Ctrl+Z / Cmd+Z. */
  onUndo?: () => void
  /** Touche `r`. */
  onReset?: () => void
  /** Ignore les frappes quand le focus est dans un input/textarea. */
  ignoreInputs?: boolean
}

/**
 * Écoute les frappes clavier au niveau `window` et invoque les callbacks
 * adéquats. Centralise le pattern dupliqué dans les 3 routes de jeu :
 * - flèches (et ZQSD pour Sokomot) → `onDirection`
 * - Espace / Entrée → `onAction`
 * - Ctrl+Z / Cmd+Z → `onUndo`
 * - `r` → `onReset`
 *
 * Le listener est suspendu quand `enabled === false` (typiquement après la
 * victoire ou avant que le niveau ne soit chargé).
 */
export function useGameKeyboard({
  enabled,
  onDirection,
  onAction,
  onUndo,
  onReset,
  ignoreInputs = false,
}: Options): void {
  useEffect(() => {
    if (!enabled) return
    function handleKey(event: KeyboardEvent) {
      if (ignoreInputs) {
        const target = event.target
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          return
        }
      }

      const direction = KEY_TO_DIRECTION[event.key]
      if (direction && onDirection) {
        event.preventDefault()
        onDirection(direction)
        return
      }
      if (onUndo && event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        onUndo()
        return
      }
      if (onAction && ACTION_KEYS.has(event.key)) {
        event.preventDefault()
        onAction()
        return
      }
      if (onReset && event.key === 'r') {
        onReset()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [enabled, onDirection, onAction, onUndo, onReset, ignoreInputs])
}
