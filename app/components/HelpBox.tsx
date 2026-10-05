import type { ReactNode } from 'react'

/** Panneau d'aide contextuelle de la sidebar des pages de jeu. */
export function HelpBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      {children}
    </div>
  )
}
