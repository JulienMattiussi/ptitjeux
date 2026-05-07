import { isWon } from './engine'
import type { GameState } from './types'

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
      className="inline-block rounded-2xl bg-linear-to-br from-slate-200 to-slate-300 p-3 shadow-xl shadow-slate-400/20 dark:from-slate-800 dark:to-slate-900 dark:shadow-black/30"
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

        {/* Couche animée : joueur */}
        <div
          className="pointer-events-none absolute transition-transform duration-200 ease-out"
          style={{
            width: cellSize,
            height: cellSize,
            transform: `translate(${player[0] * cellSize}px, ${player[1] * cellSize}px)`,
          }}
        >
          <svg
            viewBox="0 0 32 32"
            className="absolute inset-0 m-auto drop-shadow-md"
            style={{
              width: cellSize * 0.65,
              height: cellSize * 0.65,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            role="img"
            aria-label="Joueur"
          >
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="oklch(70% 0.21 18)"
              stroke="white"
              strokeWidth="1.5"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="oklch(45% 0.18 18)"
              strokeWidth="0.6"
            />
            <ellipse cx="11.5" cy="13" rx="1.6" ry="2" fill="white" />
            <ellipse cx="20.5" cy="13" rx="1.6" ry="2" fill="white" />
            <circle cx="11.5" cy="13.5" r="1" fill="oklch(20% 0.1 280)" />
            <circle cx="20.5" cy="13.5" r="1" fill="oklch(20% 0.1 280)" />
            <path
              d="M 11 19 Q 16 22.5 21 19"
              stroke="white"
              strokeWidth="1.7"
              strokeLinecap="round"
              fill="none"
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
