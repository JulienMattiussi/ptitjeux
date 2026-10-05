type Props = { className?: string }

/** Aperçu de Sémantogramme : grille de mots et compteurs de marge. */
export function Thumbnail({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 120 80" className={className} role="img" aria-label="Aperçu de Sémantogramme">
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
      <rect x="0" y="0" width="120" height="80" fill="url(#sem-bg)" />
      {/* Compteurs de marge */}
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
      {/* Cases */}
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

/**
 * Mini-plateau Angle mort 5×3 dessiné avec les vraies pièces du jeu : deux
 * vigiles éclairent les rangées du haut et du bas, le couloir du milieu reste
 * dans l'ombre de la porte jusqu'au diamant.
 */
