import { EdgeLine } from './EdgeLine'
import { clueStatus, findInsideCells, isValidLoop } from './engine'
import type { Edge, GameState } from './types'

type Props = {
  state: GameState
  onToggleEdge: (edge: Edge) => void
  /** Arête actuellement sélectionnée (clavier ou survol souris). */
  selected?: Edge
  /** Mise à jour de la sélection quand la souris passe sur une arête. */
  onHoverEdge?: (edge: Edge) => void
  cellSize?: number
}

const PADDING = 18

const CLUE_COLOR: Record<'ok' | 'over' | 'under', string> = {
  ok: 'fill-emerald-600 dark:fill-emerald-400',
  over: 'fill-rose-600 dark:fill-rose-400',
  under: 'fill-gray-500 dark:fill-gray-400',
}

function isEdgeActive(edges: Edge[], target: Edge): boolean {
  return edges.some(
    (e) => e.orientation === target.orientation && e.x === target.x && e.y === target.y,
  )
}

function isSameEdge(a: Edge | undefined, b: Edge): boolean {
  if (!a) return false
  return a.orientation === b.orientation && a.x === b.x && a.y === b.y
}

export function Board({ state, onToggleEdge, selected, onHoverEdge, cellSize = 64 }: Props) {
  const { level } = state
  const width = level.width * cellSize + 2 * PADDING
  const height = level.height * cellSize + 2 * PADDING
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
    <div className="rounded-2xl bg-linear-to-br from-emerald-50 to-teal-100 p-4 shadow-xl shadow-emerald-200/30 dark:from-emerald-950 dark:to-teal-950 dark:shadow-emerald-900/40">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="touch-none select-none"
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
                x={PADDING + cx * cellSize}
                y={PADDING + cy * cellSize}
                width={cellSize}
                height={cellSize}
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
              x={PADDING + (cx + 0.5) * cellSize}
              y={PADDING + (cy + 0.5) * cellSize}
              textAnchor="middle"
              dominantBaseline="central"
              className={`font-display font-bold transition-colors ${
                insideKeys.has(`${cx},${cy}`)
                  ? 'fill-emerald-800 dark:fill-emerald-100'
                  : 'fill-gray-700 dark:fill-gray-200'
              }`}
              style={{ fontSize: cellSize * 0.42 }}
            >
              {level.letters[cy][cx]}
            </text>
          )),
        )}

        {Object.entries(level.clues).map(([key, value]) => {
          const [cxStr, cyStr] = key.split(',')
          const cx = Number(cxStr)
          const cy = Number(cyStr)
          const status = clueStatus(state, cx, cy) ?? 'under'
          return (
            <g key={`clue-${key}`}>
              <circle
                cx={PADDING + cx * cellSize + 11}
                cy={PADDING + cy * cellSize + 11}
                r={9}
                className={
                  status === 'ok'
                    ? 'fill-emerald-100 dark:fill-emerald-900/50'
                    : status === 'over'
                      ? 'fill-rose-100 dark:fill-rose-900/40'
                      : 'fill-white/80 dark:fill-gray-800/80'
                }
              />
              <text
                x={PADDING + cx * cellSize + 11}
                y={PADDING + cy * cellSize + 11}
                textAnchor="middle"
                dominantBaseline="central"
                className={`font-bold ${CLUE_COLOR[status]}`}
                style={{ fontSize: cellSize * 0.22 }}
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
              cx={PADDING + i * cellSize}
              cy={PADDING + j * cellSize}
              r={2}
              className="fill-gray-400/80 dark:fill-gray-600/80"
            />
          )),
        )}

        {horizontalEdges.map((e) => (
          <EdgeLine
            key={`h-${e.x}-${e.y}`}
            edge={e}
            x1={PADDING + e.x * cellSize}
            y1={PADDING + e.y * cellSize}
            x2={PADDING + (e.x + 1) * cellSize}
            y2={PADDING + e.y * cellSize}
            active={isEdgeActive(state.edges, e)}
            isSelected={isSameEdge(selected, e)}
            onToggle={onToggleEdge}
            onHover={onHoverEdge}
          />
        ))}

        {verticalEdges.map((e) => (
          <EdgeLine
            key={`v-${e.x}-${e.y}`}
            edge={e}
            x1={PADDING + e.x * cellSize}
            y1={PADDING + e.y * cellSize}
            x2={PADDING + e.x * cellSize}
            y2={PADDING + (e.y + 1) * cellSize}
            active={isEdgeActive(state.edges, e)}
            isSelected={isSameEdge(selected, e)}
            onToggle={onToggleEdge}
            onHover={onHoverEdge}
          />
        ))}
      </svg>
    </div>
  )
}
