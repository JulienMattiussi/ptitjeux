import { ANGLE, useHeading } from './rotation'
import type { Dir } from './types'

/**
 * Cambrioleur vu de dessus, sur le même gabarit que le vigile : vêtements
 * orange, gants noirs, cheveux à la place de la casquette et masque noir
 * devant les yeux. Dessiné vers le haut puis pivoté selon `facing`.
 */
export function ThiefSprite({ facing = 'N' }: { facing?: Dir }) {
  const angle = useHeading(ANGLE[facing])
  return (
    <g
      style={{ transform: `rotate(${angle}deg)`, transition: 'transform 140ms linear' }}
      aria-hidden="true"
    >
      <rect x="-13" y="-4" width="26" height="12" rx="4" className="fill-orange-500" />
      <circle cx="-10" cy="-3" r="2.6" className="fill-slate-950" />
      <circle cx="10" cy="-3" r="2.6" className="fill-slate-950" />
      <circle cx="0" cy="1" r="7" className="fill-amber-900" />
      <path
        d="M -5.5 3 Q -3 -2 0 4 Q 3 -2 5.5 3 M -4 6 Q 0 1 4 6"
        className="fill-none stroke-amber-700"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M -6.6 -2.5 Q 0 -8.2 6.6 -2.5 L 6 -0.6 Q 0 -5.8 -6 -0.6 Z"
        className="fill-slate-950"
      />
      <circle cx="-2.6" cy="-3.5" r="0.9" className="fill-amber-100" />
      <circle cx="2.6" cy="-3.5" r="0.9" className="fill-amber-100" />
    </g>
  )
}
