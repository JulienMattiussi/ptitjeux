import type { ReactNode } from 'react'

/**
 * Sidebar verticale d'une page de jeu : à droite du plateau (lg+) ou en
 * dessous (sm/mobile). Largeur maximale fixée pour rester lisible à côté
 * du plateau.
 */
export function PlaySidebar({ children }: { children: ReactNode }) {
  return <aside className="flex w-full max-w-xs flex-col gap-3">{children}</aside>
}
