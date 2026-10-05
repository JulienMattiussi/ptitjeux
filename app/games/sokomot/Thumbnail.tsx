import { PencilSprite } from './PencilSprite'

/** Aperçu de Sokomot : pousser une lettre vers la zone cible. */
export function ThumbnailArt() {
  return (
    <>
      <defs>
        <linearGradient id="sokomot-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(95% 0.04 240)" />
          <stop offset="100%" stopColor="oklch(88% 0.08 240)" />
        </linearGradient>
        <linearGradient id="sokomot-block" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(86% 0.16 80)" />
          <stop offset="100%" stopColor="oklch(72% 0.18 70)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="80" fill="url(#sokomot-bg)" />
      <g stroke="oklch(70% 0.04 240)" strokeWidth="0.5" opacity="0.4">
        <line x1="30" y1="10" x2="30" y2="70" />
        <line x1="60" y1="10" x2="60" y2="70" />
        <line x1="90" y1="10" x2="90" y2="70" />
        <line x1="10" y1="30" x2="110" y2="30" />
        <line x1="10" y1="50" x2="110" y2="50" />
      </g>
      <rect x="60" y="30" width="50" height="20" fill="oklch(70% 0.1 240)" opacity="0.18" rx="2" />
      <rect
        x="60"
        y="30"
        width="50"
        height="20"
        fill="none"
        stroke="oklch(50% 0.15 240)"
        strokeWidth="0.8"
        strokeDasharray="2 2"
        rx="2"
      />
      <rect x="63" y="33" width="14" height="14" rx="2" fill="url(#sokomot-block)" />
      <text
        x="70"
        y="45"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="oklch(25% 0.06 70)"
      >
        A
      </text>
      <rect x="33" y="33" width="14" height="14" rx="2" fill="url(#sokomot-block)" />
      <text
        x="40"
        y="45"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="oklch(25% 0.06 70)"
      >
        B
      </text>
      <g transform="translate(9 31)" aria-hidden="true">
        <PencilSprite direction="right" size={18} />
      </g>
      <path
        d="M 49 40 L 56 40 M 53 37 L 56 40 L 53 43"
        stroke="oklch(50% 0.15 240)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  )
}
