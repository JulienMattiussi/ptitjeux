import { isWon } from './engine'
import type { Direction, GameState } from './types'

const PENCIL_ROTATION: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: -90,
}

type Props = {
  state: GameState
  cellSize?: number
}

const ICE_PATTERN =
  'repeating-linear-gradient(45deg, oklch(96% 0.03 230) 0 6px, oklch(89% 0.06 230) 6px 8px)'
const ICE_PATTERN_DARK =
  'repeating-linear-gradient(45deg, oklch(35% 0.07 230) 0 6px, oklch(28% 0.05 230) 6px 8px)'

const WALL_PATTERN =
  'linear-gradient(135deg, oklch(40% 0.02 260), oklch(30% 0.02 260))'

export function Board({ state, cellSize = 60 }: Props) {
  const { level, player, blocks } = state
  const won = isWon(state)
  const isIceLevel = level.ice.length > 0

  const isWall = (x: number, y: number) =>
    level.walls.some(([wx, wy]) => wx === x && wy === y)
  const isIce = (x: number, y: number) => level.ice.some(([ix, iy]) => ix === x && iy === y)
  const targetIndex = (x: number, y: number) =>
    level.target.cells.findIndex(([tx, ty]) => tx === x && ty === y)
  const blockAt = (x: number, y: number) =>
    blocks.find((b) => b.pos[0] === x && b.pos[1] === y)

  const rows = Array.from({ length: level.height }, (_, y) => y)
  const cols = Array.from({ length: level.width }, (_, x) => x)

  const blockSize = cellSize - 8

  return (
    <div
      className={`inline-block rounded-2xl p-3 shadow-xl ${
        isIceLevel
          ? 'bg-linear-to-br from-sky-100 to-cyan-200 shadow-sky-300/30 dark:from-sky-950 dark:to-cyan-950 dark:shadow-sky-900/40'
          : 'bg-linear-to-br from-slate-200 to-slate-300 shadow-slate-400/20 dark:from-slate-800 dark:to-slate-900 dark:shadow-black/30'
      }`}
      role="application"
      aria-label={`Plateau ${level.name}`}
    >
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          width: level.width * cellSize,
          height: level.height * cellSize,
        }}
      >
        {/* Couche statique : cases */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${level.width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${level.height}, ${cellSize}px)`,
          }}
          role="grid"
        >
          {rows.flatMap((y) =>
            cols.map((x) => {
              const wall = isWall(x, y)
              const ice = isIce(x, y)
              const tIndex = targetIndex(x, y)
              const block = blockAt(x, y)

              return (
                <div
                  key={`${x}-${y}`}
                  className="relative flex items-center justify-center"
                  role="gridcell"
                  style={{
                    background: wall
                      ? WALL_PATTERN
                      : ice
                        ? `var(--ice-bg, ${ICE_PATTERN})`
                        : 'oklch(99% 0.005 240)',
                  }}
                >
                  {wall && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 ring-1 ring-inset ring-black/30"
                    />
                  )}
                  {tIndex >= 0 && !block && (
                    <span
                      className="flex h-[78%] w-[78%] items-center justify-center rounded-md border-2 border-dashed border-amber-400/70 text-2xl font-bold text-amber-500/40 dark:border-amber-500/60 dark:text-amber-400/30"
                      style={{ fontSize: cellSize * 0.5 }}
                      aria-hidden="true"
                    >
                      {level.target.word[tIndex]}
                    </span>
                  )}
                </div>
              )
            }),
          )}
        </div>

        {/* Style switcher pour le motif glace en mode sombre */}
        <style>{`
          @media (prefers-color-scheme: dark) {
            [role="application"] [role="gridcell"] {
              --ice-bg: ${ICE_PATTERN_DARK};
            }
          }
        `}</style>

        {/* Couche animée : blocs */}
        {blocks.map((b) => {
          const onTarget =
            level.target.cells.findIndex(([tx, ty]) => tx === b.pos[0] && ty === b.pos[1]) >= 0
          const onTargetCorrect =
            won ||
            (onTarget &&
              level.target.word[
                level.target.cells.findIndex(
                  ([tx, ty]) => tx === b.pos[0] && ty === b.pos[1],
                )
              ]?.toUpperCase() === b.letter.toUpperCase())
          return (
            <div
              key={b.id}
              className={`pointer-events-none absolute flex items-center justify-center font-extrabold transition-transform duration-200 ease-out ${
                won ? 'animate-pop' : ''
              }`}
              style={{
                top: 0,
                left: 0,
                width: blockSize,
                height: blockSize,
                fontSize: cellSize * 0.5,
                transform: `translate(${b.pos[0] * cellSize + 4}px, ${b.pos[1] * cellSize + 4}px)`,
                background: onTargetCorrect
                  ? 'linear-gradient(180deg, oklch(85% 0.16 145), oklch(68% 0.17 145))'
                  : 'linear-gradient(180deg, oklch(88% 0.13 80), oklch(73% 0.16 70))',
                borderRadius: 10,
                boxShadow: onTargetCorrect
                  ? '0 2px 0 oklch(50% 0.16 145), 0 6px 16px oklch(40% 0.1 145 / 0.35)'
                  : '0 2px 0 oklch(55% 0.15 65), 0 6px 16px oklch(40% 0.1 60 / 0.3)',
                color: onTargetCorrect ? 'oklch(20% 0.06 145)' : 'oklch(25% 0.06 60)',
              }}
            >
              {b.letter}
            </div>
          )
        })}

        {/* Couche animée : joueur (z-10 pour passer au-dessus des blocs) */}
        <div
          className="pointer-events-none absolute z-10 flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            top: 0,
            left: 0,
            width: cellSize,
            height: cellSize,
            transform: `translate(${player[0] * cellSize}px, ${player[1] * cellSize}px)`,
          }}
        >
          <svg
            viewBox="0 0 100 100"
            width={cellSize * 0.95}
            height={cellSize * 0.95}
            className="drop-shadow-lg transition-transform duration-150 ease-out"
            style={{ transform: `rotate(${PENCIL_ROTATION[state.lastDirection]}deg)` }}
            role="img"
            aria-label={`Crayon orienté ${state.lastDirection}`}
          >
            {/* Gomme rose */}
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
            {/* Virole métallique */}
            <rect
              x="22"
              y="22"
              width="8"
              height="56"
              fill="oklch(78% 0.01 250)"
              stroke="oklch(50% 0.02 250)"
              strokeWidth="1"
            />
            <line
              x1="24.5"
              y1="22"
              x2="24.5"
              y2="78"
              stroke="oklch(50% 0.02 250)"
              strokeWidth="0.8"
            />
            <line
              x1="27.5"
              y1="22"
              x2="27.5"
              y2="78"
              stroke="oklch(50% 0.02 250)"
              strokeWidth="0.8"
            />
            {/* Corps hexagonal : 3 facettes horizontales pour suggérer le profil 6 pans */}
            {/* Facette supérieure (oblique, plus sombre) */}
            <rect x="30" y="22" width="46" height="14" fill="oklch(76% 0.16 70)" />
            {/* Facette centrale (face avant, plus claire) */}
            <rect x="30" y="36" width="46" height="28" fill="oklch(87% 0.19 82)" />
            {/* Facette inférieure (oblique, encore plus sombre) */}
            <rect x="30" y="64" width="46" height="14" fill="oklch(70% 0.15 65)" />
            {/* Reflet sur la facette centrale */}
            <rect x="32" y="40" width="42" height="3" fill="white" opacity="0.55" />
            {/* Lignes d'arête entre facettes */}
            <line x1="30" y1="36" x2="76" y2="36" stroke="oklch(55% 0.16 60)" strokeWidth="0.7" opacity="0.6" />
            <line x1="30" y1="64" x2="76" y2="64" stroke="oklch(55% 0.16 60)" strokeWidth="0.7" opacity="0.6" />
            {/* Contour du corps */}
            <rect
              x="30"
              y="22"
              width="46"
              height="56"
              fill="none"
              stroke="oklch(55% 0.18 60)"
              strokeWidth="1.2"
            />
            {/* Pointe taillée : 3 facettes triangulaires reflétant le hex */}
            <polygon points="76,22 96,50 76,36" fill="oklch(86% 0.11 78)" />
            <polygon points="76,36 96,50 76,64" fill="oklch(94% 0.09 82)" />
            <polygon points="76,64 96,50 76,78" fill="oklch(80% 0.10 70)" />
            {/* Lignes d'arête de la pointe */}
            <line x1="76" y1="36" x2="96" y2="50" stroke="oklch(55% 0.16 60)" strokeWidth="0.6" opacity="0.55" />
            <line x1="76" y1="64" x2="96" y2="50" stroke="oklch(55% 0.16 60)" strokeWidth="0.6" opacity="0.55" />
            {/* Contour de la pointe */}
            <polygon
              points="76,22 96,50 76,78"
              fill="none"
              stroke="oklch(55% 0.18 60)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Pointe graphite */}
            <polygon
              points="96,50 100,50 96,55 96,45"
              fill="oklch(18% 0.02 250)"
            />
          </svg>
        </div>

        {/* Overlay victoire */}
        {won && (
          <div
            className="pointer-events-none absolute inset-0 animate-fade-in-up"
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-xl ring-4 ring-emerald-400/60 ring-offset-2 ring-offset-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}
