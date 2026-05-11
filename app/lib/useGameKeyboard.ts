import { useEffect } from 'react'

export type GameKeyDirection = 'up' | 'down' | 'left' | 'right'

const KEY_TO_DIRECTION: Record<string, GameKeyDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  // QWERTY : WASD
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  // AZERTY : ZQSD (mêmes touches physiques, caractères produits différents)
  z: 'up',
  q: 'left',
}

// `event.code` cible la position physique de la touche, indépendamment de la
// disposition : permet de couvrir QWERTZ et autres dispositions sans surcharger
// `KEY_TO_DIRECTION`.
const CODE_TO_DIRECTION: Record<string, GameKeyDirection> = {
  KeyW: 'up',
  KeyA: 'left',
  KeyS: 'down',
  KeyD: 'right',
}

const ACTION_KEYS = new Set([' ', 'Enter'])

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

      // Ctrl/Cmd+Z avant le mapping directionnel : sur AZERTY, `z` est
      // aliasé sur « up », il ne faut pas le consommer comme déplacement
      // quand le joueur essaie de faire undo.
      if (onUndo && event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        onUndo()
        return
      }
      const direction = KEY_TO_DIRECTION[event.key] ?? CODE_TO_DIRECTION[event.code]
      if (direction && onDirection) {
        event.preventDefault()
        onDirection(direction)
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
