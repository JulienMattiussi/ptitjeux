import type { ReactNode } from 'react'

type Props = {
  moves: number
  parMoves: number
  /** Libellé du compteur (« Coups » par défaut). */
  label?: string
  /** Aide du jeu (`HintButton`), à droite du compteur. */
  hint?: ReactNode
  /** Informations propres au jeu, affichées sous le compteur. */
  children?: ReactNode
}

/** Carte de la sidebar de jeu : compteur de coups, objectif, aide, puis extras du jeu. */
export function MovesCard({ moves, parMoves, label = 'Coups', hint, children }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
          <div className="text-3xl font-bold">{moves}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Objectif : {parMoves}</div>
        </div>
        {hint}
      </div>
      {children && (
        <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">{children}</div>
      )}
    </div>
  )
}
