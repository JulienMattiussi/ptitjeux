import type { ReactNode } from 'react'

/*
 * Aides qui dépendent de l'appareil, choisies par le pointeur principal plutôt
 * que par la largeur d'écran : une fenêtre étroite sur ordinateur garde ses
 * raccourcis, un téléphone n'affiche que les gestes au doigt.
 */

/** Raccourcis clavier et gestes à la souris : masqués sur écran tactile. */
export function KeyboardOnly({ children }: { children: ReactNode }) {
  return <span className="pointer-coarse:hidden">{children}</span>
}

/** Gestes au doigt : affichés seulement sur écran tactile. */
export function TouchOnly({ children }: { children: ReactNode }) {
  return <span className="hidden pointer-coarse:inline">{children}</span>
}
