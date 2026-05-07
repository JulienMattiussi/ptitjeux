import type { GameState } from './types'

type Props = {
  state: GameState
  cellSize?: number
}

export function Board({ state, cellSize = 56 }: Props) {
  const { level, player, blocks } = state
  const isWall = (x: number, y: number) => level.walls.some(([wx, wy]) => wx === x && wy === y)
  const isIce = (x: number, y: number) => level.ice.some(([ix, iy]) => ix === x && iy === y)
  const targetIndex = (x: number, y: number) =>
    level.target.cells.findIndex(([tx, ty]) => tx === x && ty === y)
  const blockAt = (x: number, y: number) =>
    blocks.find((b) => b.pos[0] === x && b.pos[1] === y)
  const isPlayer = (x: number, y: number) => player[0] === x && player[1] === y

  const rows = Array.from({ length: level.height }, (_, y) => y)
  const cols = Array.from({ length: level.width }, (_, x) => x)

  return (
    <div
      className="relative inline-block rounded-lg bg-gray-200 p-2 dark:bg-gray-800"
      role="grid"
      aria-label={`Niveau ${level.name}`}
    >
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${level.width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${level.height}, ${cellSize}px)`,
        }}
      >
        {rows.flatMap((y) =>
          cols.map((x) => {
            const wall = isWall(x, y)
            const ice = isIce(x, y)
            const tIndex = targetIndex(x, y)
            const block = blockAt(x, y)
            const player = isPlayer(x, y)

            const baseClass = wall
              ? 'bg-gray-700 dark:bg-gray-950'
              : ice
                ? 'bg-sky-100 dark:bg-sky-900/40'
                : 'bg-white dark:bg-gray-900'

            return (
              <div
                key={`${x}-${y}`}
                className={`relative flex items-center justify-center text-2xl font-bold ${baseClass}`}
                role="gridcell"
              >
                {tIndex >= 0 && !block && (
                  <span className="absolute text-3xl text-gray-300 dark:text-gray-700">
                    {level.target.word[tIndex]}
                  </span>
                )}
                {block && (
                  <span className="z-10 flex h-[80%] w-[80%] items-center justify-center rounded-md bg-amber-300 text-gray-900 shadow-sm dark:bg-amber-400">
                    {block.letter}
                  </span>
                )}
                {player && (
                  <span className="absolute h-3 w-3 rounded-full bg-rose-500 shadow ring-2 ring-white dark:ring-gray-900" />
                )}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
