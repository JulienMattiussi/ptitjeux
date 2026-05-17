import type { Direction } from './types'

const PENCIL_ROTATION: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: -90,
}

type Props = {
  direction: Direction
  size: number
}

export function PencilSprite({ direction, size }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="drop-shadow-lg transition-transform duration-150 ease-out"
      style={{ transform: `rotate(${PENCIL_ROTATION[direction]}deg)` }}
      role="img"
      aria-label={`Crayon orienté ${direction}`}
    >
      <rect
        x="2"
        y="22"
        width="20"
        height="56"
        rx="6"
        fill="oklch(80% 0.15 0)"
        stroke="oklch(55% 0.18 0)"
        strokeWidth="1.2"
      />
      <rect
        x="22"
        y="22"
        width="8"
        height="56"
        fill="oklch(78% 0.01 250)"
        stroke="oklch(50% 0.02 250)"
        strokeWidth="1"
      />
      <line x1="24.5" y1="22" x2="24.5" y2="78" stroke="oklch(50% 0.02 250)" strokeWidth="0.8" />
      <line x1="27.5" y1="22" x2="27.5" y2="78" stroke="oklch(50% 0.02 250)" strokeWidth="0.8" />
      <rect x="30" y="22" width="46" height="14" fill="oklch(76% 0.16 70)" />
      <rect x="30" y="36" width="46" height="28" fill="oklch(87% 0.19 82)" />
      <rect x="30" y="64" width="46" height="14" fill="oklch(70% 0.15 65)" />
      <rect x="32" y="40" width="42" height="3" fill="white" opacity="0.55" />
      <line
        x1="30"
        y1="36"
        x2="76"
        y2="36"
        stroke="oklch(55% 0.16 60)"
        strokeWidth="0.7"
        opacity="0.6"
      />
      <line
        x1="30"
        y1="64"
        x2="76"
        y2="64"
        stroke="oklch(55% 0.16 60)"
        strokeWidth="0.7"
        opacity="0.6"
      />
      <rect
        x="30"
        y="22"
        width="46"
        height="56"
        fill="none"
        stroke="oklch(55% 0.18 60)"
        strokeWidth="1.2"
      />
      <polygon points="76,22 96,50 76,36" fill="oklch(86% 0.11 78)" />
      <polygon points="76,36 96,50 76,64" fill="oklch(94% 0.09 82)" />
      <polygon points="76,64 96,50 76,78" fill="oklch(80% 0.10 70)" />
      <line
        x1="76"
        y1="36"
        x2="96"
        y2="50"
        stroke="oklch(55% 0.16 60)"
        strokeWidth="0.6"
        opacity="0.55"
      />
      <line
        x1="76"
        y1="64"
        x2="96"
        y2="50"
        stroke="oklch(55% 0.16 60)"
        strokeWidth="0.6"
        opacity="0.55"
      />
      <polygon
        points="76,22 96,50 76,78"
        fill="none"
        stroke="oklch(55% 0.18 60)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon points="96,50 100,50 96,55 96,45" fill="oklch(18% 0.02 250)" />
    </svg>
  )
}
