import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Largeur maximale de la carte. Par défaut `max-w-3xl` (~768 px). */
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
}

/**
 * Carte centrée pour héberger le plateau d'un jeu et ses contrôles.
 * Toutes les pages de jeu (play) doivent envelopper leur contenu dedans.
 */
export function GameFrame({ children, size = 'md' }: Props) {
  return (
    <div
      className={`mx-auto w-full ${SIZE_CLASS[size]} rounded-3xl border border-gray-200/80 bg-white/80 p-5 shadow-xl shadow-gray-300/30 backdrop-blur sm:p-8 dark:border-gray-800/80 dark:bg-gray-900/70 dark:shadow-black/30`}
    >
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        {children}
      </div>
    </div>
  )
}
