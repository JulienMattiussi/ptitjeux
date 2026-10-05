import { blockAt, isCellFilled, isIce, isWall, isWon, targetIndexAt } from './engine'
import { PencilSprite } from './PencilSprite'
import type { GameState } from './types'

type Props = {
  state: GameState
}

const CELL_SIZE = 60

const ICE_PATTERN =
  'repeating-linear-gradient(45deg, oklch(96% 0.03 230) 0 6px, oklch(89% 0.06 230) 6px 8px)'
const ICE_PATTERN_DARK =
  'repeating-linear-gradient(45deg, oklch(35% 0.07 230) 0 6px, oklch(28% 0.05 230) 6px 8px)'

const WALL_PATTERN = 'linear-gradient(135deg, oklch(40% 0.02 260), oklch(30% 0.02 260))'

export function Board({ state }: Props) {
  const { level, player, blocks } = state
  const won = isWon(state)
  const isIceLevel = level.ice.length > 0

  const rows = Array.from({ length: level.height }, (_, y) => y)
  const cols = Array.from({ length: level.width }, (_, x) => x)

  const blockSize = CELL_SIZE - 8

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
          width: level.width * CELL_SIZE,
          height: level.height * CELL_SIZE,
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${level.width}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${level.height}, ${CELL_SIZE}px)`,
          }}
          role="grid"
        >
          {rows.flatMap((y) =>
            cols.map((x) => {
              const wall = isWall(level, [x, y])
              const ice = isIce(level, [x, y])
              const tIndex = targetIndexAt(level, [x, y])
              const block = blockAt(blocks, [x, y])

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
                      style={{ fontSize: CELL_SIZE * 0.5 }}
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

        <style>{`
          @media (prefers-color-scheme: dark) {
            [role="application"] [role="gridcell"] {
              --ice-bg: ${ICE_PATTERN_DARK};
            }
          }
        `}</style>

        {blocks.map((b) => {
          const targetIdx = targetIndexAt(level, b.pos)
          const onTargetCorrect = won || (targetIdx >= 0 && isCellFilled(state, targetIdx))
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
                fontSize: CELL_SIZE * 0.5,
                transform: `translate(${b.pos[0] * CELL_SIZE + 4}px, ${b.pos[1] * CELL_SIZE + 4}px)`,
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

        <div
          className="pointer-events-none absolute z-10 flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            top: 0,
            left: 0,
            width: CELL_SIZE,
            height: CELL_SIZE,
            transform: `translate(${player[0] * CELL_SIZE}px, ${player[1] * CELL_SIZE}px)`,
          }}
        >
          <PencilSprite direction={state.lastDirection} size={CELL_SIZE * 0.95} />
        </div>

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
