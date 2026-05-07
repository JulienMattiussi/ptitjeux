/**
 * Mini-illustrations SVG qui résument la mécanique de chaque jeu.
 * Utilisées dans les cartes de la home page.
 */

type Props = { className?: string }

export function SokomotThumbnail({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      role="img"
      aria-label="Aperçu de Sokomot"
    >
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
      <rect x="0" y="0" width="120" height="80" rx="10" fill="url(#sokomot-bg)" />
      {/* Grid lines */}
      <g stroke="oklch(70% 0.04 240)" strokeWidth="0.5" opacity="0.4">
        <line x1="30" y1="10" x2="30" y2="70" />
        <line x1="60" y1="10" x2="60" y2="70" />
        <line x1="90" y1="10" x2="90" y2="70" />
        <line x1="10" y1="30" x2="110" y2="30" />
        <line x1="10" y1="50" x2="110" y2="50" />
      </g>
      {/* Target zone */}
      <rect
        x="60"
        y="30"
        width="50"
        height="20"
        fill="oklch(70% 0.1 240)"
        opacity="0.18"
        rx="2"
      />
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
      {/* Block in target */}
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
      {/* Movable block */}
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
      {/* Player */}
      <circle cx="20" cy="40" r="4.5" fill="oklch(60% 0.22 20)" />
      <circle cx="18.5" cy="38.5" r="0.8" fill="white" />
      <circle cx="21.5" cy="38.5" r="0.8" fill="white" />
      {/* Arrow */}
      <path
        d="M 49 40 L 56 40 M 53 37 L 56 40 L 53 43"
        stroke="oklch(50% 0.15 240)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function BoucleThumbnail({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      role="img"
      aria-label="Aperçu de Boucle"
    >
      <defs>
        <linearGradient id="boucle-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(95% 0.04 170)" />
          <stop offset="100%" stopColor="oklch(88% 0.07 170)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="80" rx="10" fill="url(#boucle-bg)" />
      {/* Grid */}
      <g stroke="oklch(70% 0.04 170)" strokeWidth="0.5" opacity="0.4">
        <line x1="30" y1="10" x2="30" y2="70" />
        <line x1="60" y1="10" x2="60" y2="70" />
        <line x1="90" y1="10" x2="90" y2="70" />
        <line x1="10" y1="30" x2="110" y2="30" />
        <line x1="10" y1="50" x2="110" y2="50" />
      </g>
      {/* Letters */}
      {[
        ['B', 20, 24],
        ['L', 50, 24],
        ['Z', 80, 24],
        ['M', 105, 24],
        ['O', 20, 44],
        ['N', 50, 44],
        ['Y', 80, 44],
        ['T', 105, 44],
        ['E', 20, 64],
        ['Q', 50, 64],
        ['U', 80, 64],
        ['F', 105, 64],
      ].map(([l, x, y]) => (
        <text
          key={`${l}-${x}-${y}`}
          x={x as number}
          y={y as number}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fontWeight="600"
          fill="oklch(40% 0.05 170)"
        >
          {l}
        </text>
      ))}
      {/* Loop around B and O (cells (0,0) and (0,1)) */}
      <path
        d="M 12 12 L 36 12 L 36 52 L 12 52 Z"
        fill="oklch(75% 0.13 170)"
        fillOpacity="0.18"
        stroke="oklch(55% 0.16 170)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Clue numbers */}
      <text x="14" y="14.5" fontSize="6" fontWeight="700" fill="oklch(45% 0.16 170)">
        3
      </text>
      <text x="44" y="14.5" fontSize="6" fontWeight="700" fill="oklch(45% 0.16 0)">
        1
      </text>
      <text x="14" y="34.5" fontSize="6" fontWeight="700" fill="oklch(45% 0.16 170)">
        2
      </text>
    </svg>
  )
}

export function SemantogrammeThumbnail({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      role="img"
      aria-label="Aperçu de Sémantogramme"
    >
      <defs>
        <linearGradient id="sem-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(95% 0.04 60)" />
          <stop offset="100%" stopColor="oklch(88% 0.09 60)" />
        </linearGradient>
        <linearGradient id="sem-in" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(88% 0.14 60)" />
          <stop offset="100%" stopColor="oklch(78% 0.16 55)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="80" rx="10" fill="url(#sem-bg)" />
      {/* Margin numbers */}
      <text x="11" y="22" fontSize="7" fontWeight="700" fill="oklch(50% 0.18 60)">
        2
      </text>
      <text x="11" y="42" fontSize="7" fontWeight="700" fill="oklch(50% 0.18 60)">
        3
      </text>
      <text x="11" y="62" fontSize="7" fontWeight="700" fill="oklch(50% 0.18 60)">
        1
      </text>
      <text x="32" y="14" fontSize="7" fontWeight="700" fill="oklch(50% 0.18 60)">
        2
      </text>
      <text x="62" y="14" fontSize="7" fontWeight="700" fill="oklch(50% 0.18 60)">
        2
      </text>
      <text x="92" y="14" fontSize="7" fontWeight="700" fill="oklch(50% 0.18 60)">
        2
      </text>
      {/* Cells */}
      {[
        [22, 16, true, 'thon'],
        [50, 16, false, 'banc'],
        [80, 16, true, 'pomme'],
        [22, 36, true, 'mer'],
        [50, 36, true, 'sel'],
        [80, 36, true, 'pin'],
        [22, 56, false, 'écran'],
        [50, 56, true, 'figue'],
        [80, 56, false, 'clé'],
      ].map(([x, y, isIn, label]) => (
        <g key={`${x}-${y}`}>
          <rect
            x={x as number}
            y={y as number}
            width="28"
            height="14"
            rx="2.5"
            fill={isIn ? 'url(#sem-in)' : 'oklch(85% 0.02 60)'}
            stroke={isIn ? 'oklch(60% 0.18 55)' : 'oklch(75% 0.04 60)'}
            strokeWidth="0.6"
          />
          <text
            x={(x as number) + 14}
            y={(y as number) + 9.5}
            textAnchor="middle"
            fontSize="6"
            fontWeight="600"
            fill={isIn ? 'oklch(28% 0.1 60)' : 'oklch(55% 0.04 60)'}
            style={isIn ? undefined : { textDecoration: 'line-through' }}
          >
            {label as string}
          </text>
        </g>
      ))}
    </svg>
  )
}

export const THUMBNAILS: Record<string, (props: Props) => React.JSX.Element> = {
  sokomot: SokomotThumbnail,
  boucle: BoucleThumbnail,
  semantogramme: SemantogrammeThumbnail,
}
