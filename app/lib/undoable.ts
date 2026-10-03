/**
 * Ajoute l'annulation à n'importe quel reducer de jeu, sans toucher au
 * moteur : on garde la pile des états précédents. Même comportement que
 * l'annulation de Sokomot (historique dans le moteur) : annuler restaure
 * l'état d'avant, compteur de coups compris, et `reset` vide l'historique.
 */
export type Undoable<S> = { present: S; past: S[] }

export type UndoAction = { type: 'undo' }

export function undoable<S>(present: S): Undoable<S> {
  return { present, past: [] }
}

/**
 * `tracked` dit quelles actions sont annulables (ex. la saisie d'un mot n'en
 * est pas une). Une action sans effet n'empile rien.
 */
export function withUndo<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  tracked: (action: A) => boolean,
) {
  return (u: Undoable<S>, action: A | UndoAction): Undoable<S> => {
    if (action.type === 'undo') {
      if (u.past.length === 0) return u
      return { present: u.past[u.past.length - 1], past: u.past.slice(0, -1) }
    }
    const gameAction = action as A
    const next = reducer(u.present, gameAction)
    if (gameAction.type === 'reset') return undoable(next)
    if (next === u.present) return u
    if (!tracked(gameAction)) return { ...u, present: next }
    return { present: next, past: [...u.past, u.present] }
  }
}
