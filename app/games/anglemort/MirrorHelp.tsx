import { MirrorMark } from './BoardMarks'
import { GuardSprite } from './GuardSprite'

const C = 28

// Salle de 3×2 : vigile en bas à gauche tourné vers la droite, miroir « / » en
// bas à droite. Le faisceau éclaire la case du milieu, puis repart vers le haut.
const LIT: readonly (readonly [number, number])[] = [
  [1, 1],
  [2, 0],
]

/** Illustration du miroir pour l'aide des niveaux qui en ont. */
export function MirrorHelp() {
  return (
    <div className="mt-2 flex items-center gap-3">
      <svg
        viewBox={`0 0 ${3 * C} ${2 * C}`}
        className="w-20 shrink-0 rounded-md"
        role="img"
        aria-label="Un faisceau dévié à angle droit par un miroir"
      >
        <rect width={3 * C} height={2 * C} className="fill-slate-700 dark:fill-slate-900" />
        {LIT.map(([x, y]) => (
          <rect
            key={`${x},${y}`}
            x={x * C + 1}
            y={y * C + 1}
            width={C - 2}
            height={C - 2}
            className="fill-amber-100 dark:fill-amber-700/60"
          />
        ))}
        <polyline
          points={`${C * 0.9},${C * 1.5} ${C * 2.5},${C * 1.5} ${C * 2.5},${C * 0.1}`}
          className="fill-none stroke-yellow-300"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
        <MirrorMark ox={2 * C} oy={C} size={C} kind="/" lit={['NW']} />
        <g transform={`translate(${C / 2} ${C * 1.5}) scale(0.72)`}>
          <GuardSprite type="simple" facing="E" />
        </g>
      </svg>
      <p>
        Un <span className="font-semibold">miroir</span> renvoie le faisceau à angle droit. Ni
        vigile ni couloir ne peut passer sur sa case.
      </p>
    </div>
  )
}
