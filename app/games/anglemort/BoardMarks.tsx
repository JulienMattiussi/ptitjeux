import type { MirrorHalf } from './engine'
import type { Dir, MirrorKind } from './types'
import { ANGLE } from './useHeading'

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
  side: Dir
}) {
  const half = size / 2
  const outside = -half - wall
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${ANGLE[side]})`} aria-hidden="true">
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
          ? 'fill-emerald-700 dark:fill-emerald-400'
          : 'fill-emerald-400'
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

/** Miroir dans une case de côté `size` dont le coin haut gauche est (`ox`, `oy`). */
export function MirrorMark({
  ox,
  oy,
  size,
  kind,
  lit = [],
}: {
  ox: number
  oy: number
  size: number
  kind: MirrorKind
  /** Moitiés touchées par un faisceau, teintées comme une case éclairée. */
  lit?: readonly MirrorHalf[]
}) {
  const a = size * 0.04
  const [l, t, r, b] = [ox + a, oy + a, ox + size - a, oy + size - a]
  const HALF: Record<MirrorHalf, string> = {
    NW: `${l},${t} ${r},${t} ${l},${b}`,
    NE: `${l},${t} ${r},${t} ${r},${b}`,
    SE: `${r},${t} ${r},${b} ${l},${b}`,
    SW: `${l},${t} ${l},${b} ${r},${b}`,
  }
  const inset = size * 0.15
  const [y1, y2] = kind === '/' ? [oy + size - inset, oy + inset] : [oy + inset, oy + size - inset]
  return (
    <>
      <rect
        x={ox + size * 0.04}
        y={oy + size * 0.04}
        width={size * 0.92}
        height={size * 0.92}
        rx={size * 0.12}
        className="fill-slate-200 dark:fill-slate-700"
      />
      {lit.map((half) => (
        <polygon
          key={half}
          points={HALF[half]}
          className="fill-amber-100 transition-colors duration-200 dark:fill-amber-700/60"
        />
      ))}
      <line
        x1={ox + inset}
        y1={y1}
        x2={ox + size - inset}
        y2={y2}
        className="stroke-sky-500"
        strokeWidth={size * 0.08}
        strokeLinecap="round"
      />
    </>
  )
}
