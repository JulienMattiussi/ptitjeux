import type { CSSProperties } from 'react'
import type { CellCursor } from '~/lib/cursor'
import { countInPerCol, countInPerRow } from './engine'
import type { CellStatus, GameState } from './types'

type Props = {
  state: GameState
  onCellClick: (x: number, y: number) => void
  /** Case actuellement sélectionnée (clavier ou survol souris). */
  selected?: CellCursor
  /** Mise à jour de la sélection quand la souris passe sur une case. */
  onHoverCell?: (x: number, y: number) => void
}

const STATUS_LABEL: Record<CellStatus, string> = {
  unmarked: 'non marquée',
  in: 'liée au thème',
  out: 'hors thème',
}

const CELL_CLASS: Record<CellStatus, string> = {
  in: 'bg-linear-to-br from-amber-200 to-amber-300 text-amber-950 ring-1 ring-amber-500/60 shadow-md shadow-amber-300/40 dark:from-amber-700 dark:to-amber-800 dark:text-amber-50 dark:ring-amber-400/50 dark:shadow-amber-900/40',
  out: 'bg-gray-200/80 text-gray-500 line-through dark:bg-gray-800/70 dark:text-gray-500',
  unmarked: 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

/** Couleur d'un compteur de marge : atteint, dépassé ou pas encore atteint. */
function clueClass(placed: number, target: number): string {
  if (placed === target)
    return 'bg-emerald-200/60 text-emerald-800 dark:bg-emerald-700/40 dark:text-emerald-200'
  if (placed > target) return 'bg-rose-200/60 text-rose-800 dark:bg-rose-700/40 dark:text-rose-200'
  return 'bg-white/60 text-amber-800 dark:bg-gray-800/60 dark:text-amber-300'
}

export function Board({ state, onCellClick, selected, onHoverCell }: Props) {
  const { level, status } = state

  return (
    <div className="max-w-full rounded-2xl bg-linear-to-br from-amber-50 to-orange-100 p-2 shadow-xl sm:p-4 shadow-amber-200/30 dark:from-amber-950/50 dark:to-orange-950/50 dark:shadow-orange-900/30">
      {/* Sur mobile, les colonnes se partagent la largeur disponible et les mots longs
          passent à la ligne : la grille s'allonge en hauteur au lieu de déborder. */}
      <div
        className="semanto-grid grid grid-cols-[auto_repeat(var(--cols),minmax(0,1fr))] gap-1 sm:grid-cols-[auto_repeat(var(--cols),minmax(96px,1fr))] sm:gap-1.5"
        style={{ '--cols': level.width, '--rows': level.height } as CSSProperties}
      >
        <div />
        {level.colClues.map((target, x) => {
          const placed = countInPerCol(state, x)
          return (
            <div
              key={`col-${x}`}
              className={`whitespace-nowrap rounded-md py-1 text-center text-xs font-bold tracking-tighter sm:text-sm sm:tracking-normal transition-colors ${clueClass(placed, target)}`}
            >
              {placed} / {target}
            </div>
          )
        })}
        {level.words.map((row, y) => {
          const target = level.rowClues[y]
          const placed = countInPerRow(state, y)
          return (
            <div key={`row-${y}`} className="contents">
              <div
                className={`flex items-center justify-end whitespace-nowrap rounded-md px-1.5 text-xs font-bold sm:px-3 sm:text-sm transition-colors ${clueClass(placed, target)}`}
              >
                {placed} / {target}
              </div>
              {row.map((word, x) => {
                const s = status[y][x]
                const isSelected = selected?.x === x && selected?.y === y
                return (
                  <button
                    type="button"
                    key={`${x}-${y}`}
                    onClick={() => onCellClick(x, y)}
                    onMouseEnter={() => onHoverCell?.(x, y)}
                    className={`flex min-h-12 min-w-0 items-center justify-center rounded-lg px-0.5 py-1 text-center text-xs leading-tight font-medium hyphens-auto [overflow-wrap:anywhere] sm:h-12 sm:px-0 sm:py-0 sm:text-sm transition-all duration-200 ${CELL_CLASS[s]} ${
                      isSelected
                        ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-transparent dark:ring-amber-400'
                        : ''
                    }`}
                    aria-label={`Case ${word}, ${STATUS_LABEL[s]}`}
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
