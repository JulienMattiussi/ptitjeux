import { DiamondMark, DoorMark } from './BoardMarks'
import { WALL_CLASS } from './BoardCell'

const C = 20
const W = 5
const H = 3
const WALL = 3

type Cell = readonly [number, number]

// Salle de 5×3 : porte à l'ouest de la ligne du haut, couloir qui tourne dans
// le coin nord-est puis descend jusqu'au diamant.
const CORRIDOR: readonly Cell[] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [4, 1],
  [4, 2],
]
const DOOR: Cell = [0, 0]
const DIAMOND: Cell = [4, 2]
// Case restée dans l'ombre à côté du couloir : elle crée une impasse.
const BRANCH: Cell = [1, 1]

function Room({ dark, branch }: { dark: readonly Cell[]; branch?: Cell }) {
  const isDark = (x: number, y: number) => dark.some(([dx, dy]) => dx === x && dy === y)
  return (
    <svg
      viewBox={`${-WALL} ${-WALL} ${W * C + 2 * WALL} ${H * C + 2 * WALL}`}
      className="w-full rounded-md"
      aria-hidden="true"
    >
      <rect
        x={-WALL}
        y={-WALL}
        width={W * C + 2 * WALL}
        height={H * C + 2 * WALL}
        className={WALL_CLASS}
      />
      {Array.from({ length: H }, (_, y) =>
        Array.from({ length: W }, (_, x) => (
          <rect
            key={`${x},${y}`}
            x={x * C + 1}
            y={y * C + 1}
            width={C - 2}
            height={C - 2}
            rx={2}
            className={
              isDark(x, y)
                ? 'fill-slate-700 dark:fill-slate-900'
                : 'fill-amber-100 dark:fill-amber-700/60'
            }
          />
        )),
      )}
      {branch && (
        <rect
          x={branch[0] * C + 2.5}
          y={branch[1] * C + 2.5}
          width={C - 5}
          height={C - 5}
          rx={2}
          className="fill-none stroke-rose-500"
          strokeWidth="2"
        />
      )}
      <DoorMark cx={DOOR[0] * C + C / 2} cy={DOOR[1] * C + C / 2} size={C} wall={WALL} side="W" />
      <g transform={`translate(${DIAMOND[0] * C + C / 2} ${DIAMOND[1] * C + C / 2}) scale(0.6)`}>
        <DiamondMark cx={0} cy={0} />
      </g>
    </svg>
  )
}

/** Illustration de la règle du couloir unique : une case d'ombre en trop fait perdre. */
export function CorridorHelp() {
  return (
    <div className="mt-2">
      <div className="flex gap-3">
        <figure className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <Room dark={CORRIDOR} />
          <figcaption className="font-semibold text-emerald-700 dark:text-emerald-400">
            ✓ Couloir unique
          </figcaption>
        </figure>
        <figure className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <Room dark={[...CORRIDOR, BRANCH]} branch={BRANCH} />
          <figcaption className="font-semibold text-rose-600 dark:text-rose-400">
            ✗ Embranchement
          </figcaption>
        </figure>
      </div>
      <p className="mt-1">
        Toute case dans l'ombre compte : une seule case sombre en trop, même en impasse, et le casse
        échoue.
      </p>
    </div>
  )
}
