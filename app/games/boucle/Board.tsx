import type { GameState } from './types'

type Props = {
  state: GameState
}

export function Board({ state }: Props) {
  const { level } = state
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div
        className="grid gap-px bg-gray-200 dark:bg-gray-800"
        style={{ gridTemplateColumns: `repeat(${level.width}, 56px)` }}
      >
        {level.letters.flatMap((row, y) =>
          row.map((letter, x) => {
            const clue = level.clues[`${x},${y}`]
            return (
              <div
                key={`${x}-${y}`}
                className="relative flex h-14 items-center justify-center bg-white text-xl font-semibold dark:bg-gray-900"
              >
                <span className="text-gray-700 dark:text-gray-200">{letter}</span>
                {typeof clue === 'number' && (
                  <span className="absolute right-1 top-0 text-xs text-rose-500">{clue}</span>
                )}
              </div>
            )
          }),
        )}
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Tracé de la boucle à venir : moteur en cours d'implémentation.
      </p>
    </div>
  )
}
