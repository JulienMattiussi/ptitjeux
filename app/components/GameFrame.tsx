import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /**
   * Slot pour un overlay (par ex. `VictoryOverlay`) qui se superpose au
   * contenu et bloque les interactions. Il partage la cellule de grille du
   * contenu (marge négative = padding du cadre, pour le couvrir aussi) : le
   * cadre prend la hauteur du plus grand des deux, et une modale plus haute
   * qu'un petit plateau agrandit le cadre au lieu de défiler dedans.
   */
  overlay?: ReactNode
}

/**
 * Carte centrée pour héberger le plateau d'un jeu et ses contrôles.
 * Toutes les pages de jeu (play) doivent envelopper leur contenu dedans.
 *
 * Le fond flouté est un calque à part, et non le cadre lui-même : un ancêtre
 * flouté deviendrait la référence des éléments fixes, et la modale de victoire
 * ne pourrait plus se caler sur l'écran du téléphone.
 */
export function GameFrame({ children, overlay }: Props) {
  return (
    <div className="relative mx-auto grid w-full max-w-5xl rounded-3xl border border-transparent p-3 shadow-xl shadow-gray-300/30 sm:p-8 dark:shadow-black/30">
      <div
        className="absolute -inset-px rounded-3xl border border-gray-200/80 bg-white/80 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70"
        aria-hidden="true"
      />
      <div className="relative col-start-1 row-start-1 flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        {children}
      </div>
      <div className="col-start-1 row-start-1 grid sm:-m-8">{overlay}</div>
    </div>
  )
}
