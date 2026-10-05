type Props = { className?: string }

/** Aperçu de Boucle : une boucle encercle un mot. */
export function Thumbnail({ className = '' }: Props) {
  // Grille 4 colonnes × 3 lignes. Padding 10px sur chaque côté.
  // Cellules de 25 × 20. Bordures intérieures à x=35,60,85 et y=30,50.
  const COLS = [22.5, 47.5, 72.5, 97.5]
  const ROWS = [20, 40, 60]
  const letters = [
    ['B', 'X', 'Y', 'Z'],
    ['O', 'Q', 'F', 'K'],
    ['N', 'W', 'J', 'V'],
  ]
  return (
    <svg viewBox="0 0 120 80" className={className} role="img" aria-label="Aperçu de Boucle">
      <defs>
        <linearGradient id="boucle-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(95% 0.04 170)" />
          <stop offset="100%" stopColor="oklch(88% 0.07 170)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="80" fill="url(#boucle-bg)" />
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
