import type { Edge } from './types'

type Props = {
  edge: Edge
  x1: number
  y1: number
  x2: number
  y2: number
  active: boolean
  isSelected: boolean
  onToggle: (edge: Edge) => void
  onHover?: (edge: Edge) => void
}

/**
 * Une arête de la grille Boucle : couche de glow (si active), sélection
 * clavier (si sélectionnée), trait visible et zone cliquable transparente.
 *
 * Horizontale et verticale ont la même structure, seules les coordonnées
 * changent. Le composant ne s'occupe pas de la géométrie — il reçoit
 * `x1/y1/x2/y2` déjà calculés.
 */
export function EdgeLine({ edge, x1, y1, x2, y2, active, isSelected, onToggle, onHover }: Props) {
  return (
    <g>
      {active && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          strokeWidth={9}
          className="stroke-sky-400/40 dark:stroke-sky-300/30"
          strokeLinecap="round"
          filter="url(#boucle-glow)"
        />
      )}
      {isSelected && (
        <>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={8}
            className="stroke-amber-400/40 dark:stroke-amber-300/40"
            strokeLinecap="round"
          />
          <circle cx={x1} cy={y1} r={3.5} className="fill-amber-500 dark:fill-amber-400" />
          <circle cx={x2} cy={y2} r={3.5} className="fill-amber-500 dark:fill-amber-400" />
        </>
      )}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={active ? 4.5 : 1}
        className={
          active
            ? 'stroke-sky-600 dark:stroke-sky-300'
            : 'stroke-gray-300/60 dark:stroke-gray-700/60'
        }
        style={{ transition: 'stroke-width 0.15s ease-out' }}
        strokeLinecap="round"
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={20}
        stroke="transparent"
        onClick={() => onToggle(edge)}
        onMouseEnter={() => onHover?.(edge)}
        className="cursor-pointer"
      />
    </g>
  )
}
