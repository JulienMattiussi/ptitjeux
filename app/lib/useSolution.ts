import { useState } from 'react'
import { useSearchParams } from 'react-router'

export type Solution = {
  /** Jour passé : le bouton « Voir la solution » est proposé. */
  available: boolean
  /** Le plateau affiche la solution à la place de la partie. */
  shown: boolean
  toggle: () => void
}

/**
 * Affichage de la solution d'un jour passé, commun à tous les jeux. La partie
 * en cours reste intacte derrière, et voir la solution n'a aucun effet sur la
 * progression. `?solution` dans l'URL (lien des archives) l'ouvre d'emblée.
 */
export function useSolution(revealed: boolean): Solution {
  const [searchParams] = useSearchParams()
  const [shown, setShown] = useState(() => searchParams.has('solution'))
  return { available: revealed, shown: revealed && shown, toggle: () => setShown((s) => !s) }
}
