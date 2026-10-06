import { EdgeLine } from './EdgeLine'
import {
  clueCell,
  clueStatus,
  findInsideCells,
  isValidLoop,
  sameEdge,
  type ClueStatus,
} from './engine'
import type { Edge, GameState } from './types'

type Props = {
  state: GameState
  onToggleEdge: (edge: Edge) => void
  /** Arête actuellement sélectionnée (clavier ou survol souris). */
  selected?: Edge
  /** Mise à jour de la sélection quand la souris passe sur une arête. */
  onHoverEdge?: (edge: Edge) => void
}

const CELL_SIZE = 64
const PADDING = 18

const CLUE_COLOR: Record<ClueStatus, string> = {
  ok: 'fill-emerald-600 dark:fill-emerald-400',
  over: 'fill-rose-600 dark:fill-rose-400',
  under: 'fill-gray-500 dark:fill-gray-400',
}

const CLUE_BACKGROUND: Record<ClueStatus, string> = {
  ok: 'fill-emerald-100 dark:fill-emerald-900/50',
  over: 'fill-rose-100 dark:fill-rose-900/40',
  under: 'fill-white/80 dark:fill-gray-800/80',
}

export function Board({ state, onToggleEdge, selected, onHoverEdge }: Props) {
  const { level } = state
  const width = level.width * CELL_SIZE + 2 * PADDING
  const height = level.height * CELL_SIZE + 2 * PADDING
  const loopValid = isValidLoop(state.edges)
  const inside = loopValid ? findInsideCells(state.edges, level.width, level.height) : []
  const insideKeys = new Set(inside.map(([x, y]) => `${x},${y}`))

  const horizontalEdges: Edge[] = []
  for (let y = 0; y <= level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      horizontalEdges.push({ x, y, orientation: 'horizontal' })
    }
  }
  const verticalEdges: Edge[] = []
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x <= level.width; x++) {
      verticalEdges.push({ x, y, orientation: 'vertical' })
    }
  }

  return (
    <div className="rounded-2xl bg-linear-to-br from-emerald-50 to-teal-100 p-2 shadow-xl shadow-emerald-200/30 sm:p-4 dark:from-emerald-950 dark:to-teal-950 dark:shadow-emerald-900/40">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width }}
        className="h-auto max-w-full touch-none select-none"
        role="application"
        aria-label={`Plateau ${level.name}`}
      >
        <defs>
          <filter id="boucle-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Array.from({ length: level.height }, (_, cy) =>
          Array.from({ length: level.width }, (_, cx) => {
            if (!insideKeys.has(`${cx},${cy}`)) return null
            return (
              <rect
                key={`inside-${cx}-${cy}`}
                x={PADDING + cx * CELL_SIZE}
                y={PADDING + cy * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                className="fill-emerald-200/60 dark:fill-emerald-700/30"
                style={{ transition: 'opacity 0.3s ease-out' }}
              />
            )
          }),
        )}

        {Array.from({ length: level.height }, (_, cy) =>
          Array.from({ length: level.width }, (_, cx) => (
            <text
              key={`letter-${cx}-${cy}`}
              x={PADDING + (cx + 0.5) * CELL_SIZE}
              y={PADDING + (cy + 0.5) * CELL_SIZE}
              textAnchor="middle"
              dominantBaseline="central"
              className={`font-display font-bold transition-colors ${
                insideKeys.has(`${cx},${cy}`)
                  ? 'fill-emerald-800 dark:fill-emerald-100'
                  : 'fill-gray-700 dark:fill-gray-200'
              }`}
              style={{ fontSize: CELL_SIZE * 0.42 }}
            >
              {level.letters[cy][cx]}
            </text>
          )),
        )}

        {Object.entries(level.clues).map(([key, value]) => {
          const [cx, cy] = clueCell(key)
          const status = clueStatus(state, cx, cy) ?? 'under'
          return (
            <g key={`clue-${key}`}>
              <circle
                cx={PADDING + cx * CELL_SIZE + 11}
                cy={PADDING + cy * CELL_SIZE + 11}
                r={9}
                className={CLUE_BACKGROUND[status]}
              />
              <text
                x={PADDING + cx * CELL_SIZE + 11}
                y={PADDING + cy * CELL_SIZE + 11}
                textAnchor="middle"
                dominantBaseline="central"
                className={`font-bold ${CLUE_COLOR[status]}`}
                style={{ fontSize: CELL_SIZE * 0.22 }}
              >
                {value}
              </text>
            </g>
          )
        })}

        {Array.from({ length: level.height + 1 }, (_, j) =>
          Array.from({ length: level.width + 1 }, (_, i) => (
            <circle
              key={`vertex-${i}-${j}`}
              cx={PADDING + i * CELL_SIZE}
              cy={PADDING + j * CELL_SIZE}
              r={2}
              className="fill-gray-400/80 dark:fill-gray-600/80"
            />
          )),
        )}

        {horizontalEdges.map((e) => (
          <EdgeLine
            key={`h-${e.x}-${e.y}`}
            edge={e}
            x1={PADDING + e.x * CELL_SIZE}
            y1={PADDING + e.y * CELL_SIZE}
            x2={PADDING + (e.x + 1) * CELL_SIZE}
            y2={PADDING + e.y * CELL_SIZE}
            active={state.edges.some((a) => sameEdge(a, e))}
            isSelected={!!selected && sameEdge(selected, e)}
            onToggle={onToggleEdge}
            onHover={onHoverEdge}
          />
        ))}

        {verticalEdges.map((e) => (
          <EdgeLine
            key={`v-${e.x}-${e.y}`}
            edge={e}
            x1={PADDING + e.x * CELL_SIZE}
            y1={PADDING + e.y * CELL_SIZE}
            x2={PADDING + e.x * CELL_SIZE}
            y2={PADDING + (e.y + 1) * CELL_SIZE}
            active={state.edges.some((a) => sameEdge(a, e))}
            isSelected={!!selected && sameEdge(selected, e)}
            onToggle={onToggleEdge}
            onHover={onHoverEdge}
          />
        ))}
      </svg>
    </div>
  )
}
