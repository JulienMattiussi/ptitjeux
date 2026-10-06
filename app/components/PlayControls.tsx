import { OutlineButton } from './OutlineButton'
import { KeyboardOnly } from './InputHint'

type Props = {
  onUndo: () => void
  onReset: () => void
  /** Rien à annuler, ou partie terminée. */
  undoDisabled?: boolean
}

/**
 * Boutons communs à toutes les pages de jeu, avec leurs raccourcis clavier
 * (gérés par `useGameKeyboard` via `onUndo` / `onReset`). Côte à côte quand
 * la place le permet, l'un sous l'autre sinon : le libellé ne se coupe jamais.
 */
export function PlayControls({ onUndo, onReset, undoDisabled = false }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <OutlineButton
        onClick={onUndo}
        disabled={undoDisabled}
        className="flex-1 basis-36 whitespace-nowrap"
      >
        Annuler<KeyboardOnly> (Ctrl+Z)</KeyboardOnly>
      </OutlineButton>
      <OutlineButton onClick={onReset} className="flex-1 basis-36 whitespace-nowrap">
        Recommencer<KeyboardOnly> (R)</KeyboardOnly>
      </OutlineButton>
    </div>
  )
}
