import { ANGLE, useHeading } from './rotation'
import type { Dir, GuardType } from './types'

type TorchSpec = { angle: number; x: number }

/**
 * Lampes torches par type, relativement au corps : devant dans la main droite
 * (`x: 8`), ou tendues sur le côté (`x: 0` puis pivotées de ±90°).
 */
const TORCHES: Record<GuardType, TorchSpec[]> = {
  simple: [{ angle: 0, x: 8 }],
  angle: [
    { angle: 0, x: 8 },
    { angle: 90, x: 0 },
  ],
  oppose: [
    { angle: 90, x: 0 },
    { angle: -90, x: 0 },
  ],
}

/**
 * Le vigile à lampes opposées tient une lampe dans chaque main : son corps est
 * tourné d'un quart de tour par rapport à `facing` pour que ses bras pointent
 * dans les deux directions éclairées.
 */
const BODY_OFFSET: Record<GuardType, number> = { simple: 0, angle: 0, oppose: -90 }

type Props = {
  type: GuardType
  facing: Dir
  /** Faisceaux dessinés devant les lampes (désactivé dans la réserve). */
  beams?: boolean
  muted?: boolean
}

function Torch({ beam, x }: { beam: boolean; x: number }) {
  return (
    <g>
      {beam && (
        <polygon
          points={`${x},-15 ${x - 8},-27 ${x + 8},-27`}
          className="fill-yellow-200/80 dark:fill-yellow-300/50"
        />
      )}
      <rect x={x - 2} y="-15" width="4" height="9" rx="1" className="fill-slate-600" />
      <rect x={x - 2.5} y="-16" width="5" height="2.5" rx="1" className="fill-yellow-300" />
    </g>
  )
}

/** Coutures de la calotte, en étoile depuis le bouton central. */
const SEAMS = [30, 90, 150, 210, 270, 330].map((deg) => {
  const rad = (deg * Math.PI) / 180
  return [Math.cos(rad) * 7.5, 1.5 + Math.sin(rad) * 7.5]
})

/** Casquette vue de dessus : visière arrondie devant, calotte à 6 pans. */
function Cap() {
  return (
    <g>
      <path
        d="M -6.5 -3 C -7 -8.5 -3.5 -11 0 -11 C 3.5 -11 7 -8.5 6.5 -3 Z"
        className="fill-slate-800 dark:fill-slate-900"
      />
      <circle cx="0" cy="1.5" r="7.5" className="fill-slate-700 dark:fill-slate-800" />
      {SEAMS.map(([x, y]) => (
        <line
          key={`${x},${y}`}
          x1="0"
          y1="1.5"
          x2={x}
          y2={y}
          className="stroke-slate-900/70"
          strokeWidth="0.6"
        />
      ))}
      <circle cx="0" cy="1.5" r="1.3" className="fill-slate-900" />
    </g>
  )
}

/**
 * Vigile vu de dessus, dessiné autour de (0, 0) et orienté vers le haut puis
 * pivoté selon `facing`. Chaque lampe torche matérialise un champ de vision.
 */
export function GuardSprite({ type, facing, beams = true, muted = false }: Props) {
  const angle = useHeading(ANGLE[facing] + BODY_OFFSET[type])
  return (
    <g
      style={{
        transform: `rotate(${angle}deg)`,
        transition: 'transform 200ms',
      }}
      opacity={muted ? 0.35 : 1}
    >
      {TORCHES[type].map((t) => (
        <g key={t.angle} transform={`rotate(${t.angle})`}>
          <Torch beam={beams} x={t.x} />
        </g>
      ))}
      <rect
        x="-13"
        y="-4"
        width="26"
        height="12"
        rx="4"
        className="fill-indigo-500 dark:fill-indigo-400"
      />
      <circle cx="-10" cy="-3" r="2.6" className="fill-amber-200" />
      <circle cx="10" cy="-3" r="2.6" className="fill-amber-200" />
      <Cap />
    </g>
  )
}
