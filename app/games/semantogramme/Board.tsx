import type { GameState } from './types'

type Props = {
  state: GameState
}

export function Board({ state }: Props) {
  const { level, status } = state
  return (
    <div className="inline-block rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `auto repeat(${level.width}, minmax(80px, 1fr))`,
        }}
      >
        <div />
        {level.colClues.map((c, x) => (
          <div
            key={`col-${x}`}
            className="px-2 text-center text-sm font-semibold text-amber-700 dark:text-amber-400"
          >
            {c}
          </div>
        ))}
        {level.words.map((row, y) => (
          <div key={`row-${y}`} className="contents">
            <div className="flex items-center justify-end pr-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              {level.rowClues[y]}
            </div>
            {row.map((word, x) => {
              const s = status[y][x]
              const cellClass =
                s === 'in'
                  ? 'bg-amber-200 dark:bg-amber-700'
                  : s === 'out'
                    ? 'bg-gray-200 text-gray-500 line-through dark:bg-gray-800 dark:text-gray-500'
                    : 'bg-white dark:bg-gray-900'
              return (
                <div
                  key={`${x}-${y}`}
                  className={`flex h-12 items-center justify-center rounded-sm text-sm ${cellClass}`}
                >
                  {word}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Interactions à venir : moteur d'interaction en cours d'implémentation.
      </p>
    </div>
  )
}
