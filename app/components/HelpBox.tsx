import type { ReactNode } from 'react'

/**
 * Panneau d'aide contextuelle utilisé dans la sidebar des pages de jeu.
 * Style discret, parfait pour quelques lignes d'instructions.
 */
export function HelpBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      {children}
    </div>
  )
}
