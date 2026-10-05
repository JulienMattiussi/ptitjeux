import { useState } from 'react'

/** L'aide se propose quand le joueur dépasse ce multiple de l'objectif. */
export const HINT_PAR_FACTOR = 2

export type Hint = {
  /** Le bouton d'aide est proposé. */
  available: boolean
  /** Le joueur a demandé l'aide. */
  revealed: boolean
  reveal: () => void
}

/**
 * Aide d'une partie, commune à tous les jeux. Une fois proposée, elle le reste
 * (annuler ou recommencer ne la retire pas), et une fois révélée elle reste
 * affichée jusqu'à la fin de la partie.
 */
export function useHint(moves: number, parMoves: number | undefined): Hint {
  const [offered, setOffered] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const overPar = parMoves !== undefined && moves > HINT_PAR_FACTOR * parMoves
  if (overPar && !offered) setOffered(true)
  return { available: offered || overPar, revealed, reveal: () => setRevealed(true) }
}
