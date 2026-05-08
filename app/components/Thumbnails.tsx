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
      {/* Joueur — crayon hexagonal pointant vers la droite (cohérent avec le Board) */}
      <g>
        {/* Gomme rose */}
        <rect
          x="9"
          y="36"
          width="3.6"
          height="8"
          rx="1"
          fill="oklch(80% 0.15 0)"
          stroke="oklch(55% 0.18 0)"
          strokeWidth="0.4"
        />
        {/* Virole métallique */}
        <rect
          x="12.6"
          y="36"
          width="1.4"
          height="8"
          fill="oklch(78% 0.01 250)"
          stroke="oklch(50% 0.02 250)"
          strokeWidth="0.3"
        />
        {/* Corps hexagonal (3 facettes : haut sombre, centre clair, bas sombre) */}
        <rect x="14" y="36" width="8" height="2" fill="oklch(76% 0.16 70)" />
        <rect x="14" y="38" width="8" height="4" fill="oklch(87% 0.19 82)" />
        <rect x="14" y="42" width="8" height="2" fill="oklch(70% 0.15 65)" />
        <rect
          x="14"
          y="36"
          width="8"
          height="8"
          fill="none"
          stroke="oklch(55% 0.18 60)"
          strokeWidth="0.4"
        />
        {/* Pointe taillée (3 facettes triangulaires) */}
        <polygon points="22,36 26,40 22,38" fill="oklch(86% 0.11 78)" />
        <polygon points="22,38 26,40 22,42" fill="oklch(94% 0.09 82)" />
        <polygon points="22,42 26,40 22,44" fill="oklch(80% 0.10 70)" />
        <polygon
          points="22,36 26,40 22,44"
          fill="none"
          stroke="oklch(55% 0.18 60)"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
        {/* Mine */}
        <polygon points="26,40 27.2,40 26,40.8 26,39.2" fill="oklch(18% 0.02 250)" />
      </g>
      {/* Flèche de poussée */}
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
  // Grille 4 colonnes × 3 lignes. Padding 10px sur chaque côté.
  // Cellules de 25 × 20. Bordures interieures à x=35,60,85 et y=30,50.
  const COLS = [22.5, 47.5, 72.5, 97.5]
  const ROWS = [20, 40, 60]
  const letters = [
    ['B', 'X', 'Y', 'Z'],
    ['O', 'Q', 'F', 'K'],
    ['N', 'W', 'J', 'V'],
  ]
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
      {/* Bordure extérieure de la grille + lignes intérieures */}
      <g stroke="oklch(70% 0.04 170)" strokeWidth="0.5" opacity="0.5" fill="none">
        <rect x="10" y="10" width="100" height="60" />
        <line x1="35" y1="10" x2="35" y2="70" />
        <line x1="60" y1="10" x2="60" y2="70" />
        <line x1="85" y1="10" x2="85" y2="70" />
        <line x1="10" y1="30" x2="110" y2="30" />
        <line x1="10" y1="50" x2="110" y2="50" />
      </g>
      {/* Lettres */}
      {ROWS.flatMap((y, ri) =>
        COLS.map((x, ci) => (
          <text
            key={`l-${ri}-${ci}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight="700"
            fill="oklch(40% 0.05 170)"
          >
            {letters[ri][ci]}
          </text>
        )),
      )}
      {/* Boucle encerclant la colonne 0 (B-O-N) → forme « BON » */}
      <path
        d="M 10 10 L 35 10 L 35 70 L 10 70 Z"
        fill="oklch(75% 0.13 170)"
        fillOpacity="0.22"
        stroke="oklch(50% 0.18 170)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Indices Slitherlink, alignés en haut-gauche des cases */}
      <text x="13" y="16" fontSize="6" fontWeight="700" fill="oklch(45% 0.18 145)">
        3
      </text>
      <text x="38" y="16" fontSize="6" fontWeight="700" fill="oklch(60% 0.04 170)">
        1
      </text>
      <text x="13" y="36" fontSize="6" fontWeight="700" fill="oklch(45% 0.18 145)">
        2
      </text>
      <text x="13" y="56" fontSize="6" fontWeight="700" fill="oklch(45% 0.18 145)">
        3
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
