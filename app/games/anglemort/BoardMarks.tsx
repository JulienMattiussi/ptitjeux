import type { Level, Pos } from './types'

type Side = 'N' | 'S' | 'W' | 'E'

/** Côté extérieur de la case d'entrée (la porte est toujours sur le bord). */
export const SIDE_VECTOR: Record<Side, Pos> = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }

export function doorSide(level: Level): Side {
  const [x, y] = level.door
  if (x === 0) return 'W'
  if (x === level.width - 1) return 'E'
  if (y === 0) return 'N'
  return 'S'
}

const SIDE_ROTATION: Record<Side, number> = { N: 0, E: 90, S: 180, W: 270 }

/**
 * Porte dans l'épaisseur du mur, sur le pourtour de la case d'entrée.
 * Dessinée côté nord puis pivotée autour du centre de la case.
 */
export function DoorMark({
  cx,
  cy,
  size,
  wall,
  side,
}: {
  cx: number
  cy: number
  size: number
  /** Épaisseur du mur : la porte occupe l'ouverture dans le mur. */
  wall: number
  side: Side
}) {
  const half = size / 2
  const outside = -half - wall
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${SIDE_ROTATION[side]})`} aria-hidden="true">
      <rect
        x={-half + 4}
        y={outside}
        width={size - 8}
        height={wall}
        rx={1.5}
        className="fill-amber-700 dark:fill-amber-500"
      />
      <circle cx={half - 10} cy={-half - wall / 2} r={1.6} className="fill-amber-200" />
    </g>
  )
}

export function DiamondMark({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`} aria-hidden="true">
      <path
        d="M -11 -4 L -6 -11 L 6 -11 L 11 -4 L 0 12 Z"
        className="fill-cyan-300 stroke-cyan-600"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M -11 -4 L 11 -4 M -6 -11 L -2 -4 L 0 12 M 6 -11 L 2 -4 L 0 12"
        className="fill-none stroke-cyan-600/70"
        strokeWidth="1"
      />
    </g>
  )
}

/**
 * Indice : nombre de vigiles qui doivent éclairer la case dans la solution.
 * Les pastilles se remplissent avec l'éclairage courant, et tout passe au
 * rouge si la case est trop éclairée.
 */
export function ClueMark({
  cx,
  cy,
  clue,
  seen,
}: {
  cx: number
  cy: number
  clue: number
  seen: number
}) {
  const state = seen > clue ? 'over' : seen === clue ? 'ok' : 'todo'
  // Case sombre tant qu'elle n'est pas éclairée : texte clair, et inversement.
  const lit = seen > 0
  const text =
    state === 'over'
      ? lit
        ? 'fill-rose-600 dark:fill-rose-300'
        : 'fill-rose-300'
      : state === 'ok'
        ? lit
          ? 'fill-emerald-700 dark:fill-emerald-200'
          : 'fill-emerald-300'
        : lit
          ? 'fill-gray-800 dark:fill-gray-100'
          : 'fill-gray-100'
  return (
    <g aria-hidden="true">
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="20" fontWeight="700" className={text}>
        {clue}
      </text>
      {Array.from({ length: clue }, (_, i) => (
        <circle
          key={i}
          cx={cx + (i - (clue - 1) / 2) * 9}
          cy={cy + 14}
          r={3}
          className={
            state === 'over'
              ? 'fill-rose-500'
              : i < seen
                ? 'fill-amber-500'
                : 'fill-none stroke-gray-400 dark:stroke-gray-500'
          }
          strokeWidth="1.2"
        />
      ))}
    </g>
  )
}
