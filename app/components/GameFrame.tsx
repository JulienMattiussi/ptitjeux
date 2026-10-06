import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /**
   * Slot pour un overlay (par ex. `VictoryOverlay`) qui se superpose au
   * contenu et bloque les interactions. Positionné absolument grâce à
   * `relative` sur le wrapper.
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
    <div className="relative mx-auto w-full max-w-5xl rounded-3xl border border-transparent p-3 shadow-xl shadow-gray-300/30 sm:p-8 dark:shadow-black/30">
      <div
        className="absolute -inset-px rounded-3xl border border-gray-200/80 bg-white/80 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        {children}
      </div>
      {overlay}
    </div>
  )
}
