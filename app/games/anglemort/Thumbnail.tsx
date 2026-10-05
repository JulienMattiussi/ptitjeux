import { DiamondMark, DoorMark } from './BoardMarks'
import { GuardSprite } from './GuardSprite'
import { ThiefSprite } from './ThiefSprite'

type Props = { className?: string }

/** Aperçu d'Angle mort : vigiles, couloir sombre et diamant. */
export function Thumbnail({ className = '' }: Props) {
  const cell = 52
  const margin = 40
  const wall = 10
  const lit = new Set(['0,0', '1,0', '2,0', '3,0', '1,2', '2,2', '3,2', '4,2'])
  const corridor = new Set(['1,1', '2,1'])
  return (
    <svg viewBox="0 0 120 80" className={className} role="img" aria-label="Aperçu d'Angle mort">
      <rect x="0" y="0" width="120" height="80" className="fill-violet-100" />
      <g transform="translate(2 0) scale(0.339)">
        <rect
          x={margin - wall}
          y={margin - wall}
          width={5 * cell + wall * 2}
          height={3 * cell + wall * 2}
          rx={6}
          className="fill-slate-300"
        />
        <rect x={margin} y={margin} width={5 * cell} height={3 * cell} className="fill-slate-800" />
        {[0, 1, 2].flatMap((y) =>
          [0, 1, 2, 3, 4].map((x) => {
            const k = `${x},${y}`
            const ox = margin + x * cell
            const oy = margin + y * cell
            const fill = lit.has(k) ? 'fill-amber-100' : 'fill-slate-700'
            return (
              <g key={k}>
                {k === '4,1' ? (
                  <rect x={ox} y={oy} width={cell} height={cell} className="fill-slate-300" />
                ) : (
                  <rect
                    x={ox + 1.5}
                    y={oy + 1.5}
                    width={cell - 3}
                    height={cell - 3}
                    rx={4}
                    className={fill}
                  />
                )}
                {corridor.has(k) && (
                  <rect
                    x={ox + 6}
                    y={oy + 6}
                    width={cell - 12}
                    height={cell - 12}
                    rx={4}
                    className="fill-none stroke-violet-400/70"
                    strokeDasharray="4 3"
                  />
                )}
              </g>
            )
          }),
        )}
        <DoorMark
          cx={margin + cell / 2}
          cy={margin + cell * 1.5}
          size={cell}
          wall={wall}
          side="W"
        />
        <g transform={`translate(${margin - wall - 16} ${margin + cell * 1.5}) scale(1.1)`}>
          <ThiefSprite facing="E" />
        </g>
        <DiamondMark cx={margin + cell * 3.5} cy={margin + cell * 1.5} />
        <g transform={`translate(${margin + cell * 4.5} ${margin + cell / 2})`}>
          <GuardSprite type="simple" facing="W" />
        </g>
        <g transform={`translate(${margin + cell / 2} ${margin + cell * 2.5})`}>
          <GuardSprite type="simple" facing="E" />
        </g>
      </g>
    </svg>
  )
}
