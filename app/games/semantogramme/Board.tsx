import { countInPerCol, countInPerRow } from './engine'
import type { GameState } from './types'

type Props = {
  state: GameState
  onCellClick: (x: number, y: number) => void
  /** Case actuellement sélectionnée (clavier ou survol souris). */
  selected?: { x: number; y: number }
  /** Mise à jour de la sélection quand la souris passe sur une case. */
  onHoverCell?: (x: number, y: number) => void
}

export function Board({ state, onCellClick, selected, onHoverCell }: Props) {
  const { level, status } = state

  return (
    <div className="rounded-2xl bg-linear-to-br from-amber-50 to-orange-100 p-4 shadow-xl shadow-amber-200/30 dark:from-amber-950/50 dark:to-orange-950/50 dark:shadow-orange-900/30">
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `auto repeat(${level.width}, minmax(96px, 1fr))`,
        }}
      >
        <div />
        {level.colClues.map((target, x) => {
          const placed = countInPerCol(state, x)
          const ok = placed === target
          const over = placed > target
          return (
            <div
              key={`col-${x}`}
              className={`rounded-md py-1 text-center text-sm font-bold transition-colors ${
                ok
                  ? 'bg-emerald-200/60 text-emerald-800 dark:bg-emerald-700/40 dark:text-emerald-200'
                  : over
                    ? 'bg-rose-200/60 text-rose-800 dark:bg-rose-700/40 dark:text-rose-200'
                    : 'bg-white/60 text-amber-800 dark:bg-gray-800/60 dark:text-amber-300'
              }`}
            >
              {placed} / {target}
            </div>
          )
        })}
        {level.words.map((row, y) => {
          const target = level.rowClues[y]
          const placed = countInPerRow(state, y)
          const ok = placed === target
          const over = placed > target
          return (
            <div key={`row-${y}`} className="contents">
              <div
                className={`flex items-center justify-end rounded-md px-3 text-sm font-bold transition-colors ${
                  ok
                    ? 'bg-emerald-200/60 text-emerald-800 dark:bg-emerald-700/40 dark:text-emerald-200'
                    : over
                      ? 'bg-rose-200/60 text-rose-800 dark:bg-rose-700/40 dark:text-rose-200'
                      : 'bg-white/60 text-amber-800 dark:bg-gray-800/60 dark:text-amber-300'
                }`}
              >
                {placed} / {target}
              </div>
              {row.map((word, x) => {
                const s = status[y][x]
                const isSelected = selected?.x === x && selected?.y === y
                const cellClass =
                  s === 'in'
                    ? 'bg-linear-to-br from-amber-200 to-amber-300 text-amber-950 ring-1 ring-amber-500/60 shadow-md shadow-amber-300/40 dark:from-amber-700 dark:to-amber-800 dark:text-amber-50 dark:ring-amber-400/50 dark:shadow-amber-900/40'
                    : s === 'out'
                      ? 'bg-gray-200/80 text-gray-500 line-through dark:bg-gray-800/70 dark:text-gray-500'
                      : 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                return (
                  <button
                    type="button"
                    key={`${x}-${y}`}
                    onClick={() => onCellClick(x, y)}
                    onMouseEnter={() => onHoverCell?.(x, y)}
                    className={`flex h-12 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${cellClass} ${
                      isSelected
                        ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-transparent dark:ring-amber-400'
                        : ''
                    }`}
                    aria-label={`Case ${word}, statut ${s}`}
                    aria-pressed={s === 'in'}
                  >
                    {word}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
