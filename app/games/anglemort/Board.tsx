import { useMemo } from 'react'
import type { CellCursor } from '~/lib/cursor'
import { BoardCell, CELL, WALL_CLASS, type CellContent } from './BoardCell'
import { DoorMark } from './BoardMarks'
import {
  beamOutlines,
  computeVision,
  DELTA,
  doorSide,
  isPlaceable,
  key,
  OPPOSITE,
  samePos,
  unseenCells,
} from './engine'
import { GuardSprite } from './GuardSprite'
import { ThiefSprite } from './ThiefSprite'
import type { Dir, GameState, Pos } from './types'
import { THIEF_STEP_MS } from './useThiefWalk'

type Props = {
  state: GameState
  /** Clic gauche : pose un vigile, ou fait pivoter celui en place. */
  onCellClick: (x: number, y: number) => void
  /** Clic droit : retire le vigile. */
  onCellRemove: (x: number, y: number) => void
  selected?: CellCursor
  onHoverCell?: (x: number, y: number) => void
  /** Aide : couloir attendu, teinté sur le plateau. */
  expected?: Pos[]
  /** Position du cambrioleur pendant sa traversée de victoire. */
  thief?: Pos
  /** Direction de son dernier pas (par défaut : face à la porte). */
  thiefFacing?: Dir
  /** Le cambrioleur a atteint le diamant : il n'est plus dessiné sur sa case. */
  diamondTaken?: boolean
}

/** Marge autour de la grille, où le cambrioleur attend devant l'entrée. */
const MARGIN = 64
/** Épaisseur du mur d'enceinte. */
const WALL = 10

export function Board({
  state,
  onCellClick,
  onCellRemove,
  selected,
  onHoverCell,
  thief,
  thiefFacing,
  diamondTaken = false,
  expected = [],
}: Props) {
  const expectedSet = new Set(expected.map(([x, y]) => key(x, y)))
  const { level, guards } = state
  const vision = useMemo(() => computeVision(level, guards), [level, guards])
  const unseen = useMemo(
    () => new Set(unseenCells(level, guards, vision).map(([x, y]) => key(x, y))),
    [level, guards, vision],
  )
  const pillars = new Set(level.pillars.map(([x, y]) => key(x, y)))
  const mirrors = new Map(level.mirrors.map((m) => [key(...m.pos), m.kind]))
  const guardByCell = new Map(guards.map((g) => [key(...g.pos), g]))
  // Vigile sous le curseur (souris ou clavier) : ses faisceaux sont tracés en entier.
  const hovered = selected ? guardByCell.get(key(selected.x, selected.y)) : undefined
  const width = level.width * CELL + MARGIN * 2
  const height = level.height * CELL + MARGIN * 2
  const origin = (x: number, y: number) => [MARGIN + x * CELL, MARGIN + y * CELL] as const

  const cells = []
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const k = key(x, y)
      const mirror = mirrors.get(k)
      const content: CellContent = pillars.has(k)
        ? { kind: 'pillar' }
        : mirror
          ? { kind: 'mirror', mirror, lit: vision.litMirrors[k] }
          : {
              kind: 'floor',
              seen: vision.seen[y][x],
              clue: level.clues[k],
              guard: guardByCell.get(k),
              isDoor: samePos(level.door, x, y),
              isDiamond: samePos(level.diamond, x, y),
              diamondTaken,
              unseen: unseen.has(k),
              expected: expectedSet.has(k),
            }
      const [ox, oy] = origin(x, y)
      cells.push(
        <BoardCell
          key={k}
          ox={ox}
          oy={oy}
          content={content}
          onHover={() => onHoverCell?.(x, y)}
          onClick={() => onCellClick(x, y)}
          onRemove={() => onCellRemove(x, y)}
        />,
      )
    }
  }

  const [dx, dy] = origin(...level.door)
  const side = doorSide(level)
  // Avant la victoire, le cambrioleur attend dehors, face à la porte.
  const wait = CELL / 2 + WALL + 22
  const [thiefX, thiefY] = thief
    ? [origin(...thief)[0] + CELL / 2, origin(...thief)[1] + CELL / 2]
    : [dx + CELL / 2 + DELTA[side][0] * wait, dy + CELL / 2 + DELTA[side][1] * wait]

  return (
    <div className="rounded-2xl bg-linear-to-br from-violet-50 to-fuchsia-100 p-2 shadow-xl shadow-violet-200/30 dark:from-violet-950/50 dark:to-fuchsia-950/50 dark:shadow-fuchsia-900/30">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width }}
        className="h-auto max-w-full select-none"
      >
        <rect
          x={MARGIN - WALL}
          y={MARGIN - WALL}
          width={level.width * CELL + WALL * 2}
          height={level.height * CELL + WALL * 2}
          rx={6}
          className={WALL_CLASS}
        />
        {/* Sol sous les dalles : les joints restent sombres, sans quadrillage clair. */}
        <rect
          x={MARGIN}
          y={MARGIN}
          width={level.width * CELL}
          height={level.height * CELL}
          className="fill-slate-800 dark:fill-slate-950"
        />
        {cells}
        <DoorMark cx={dx + CELL / 2} cy={dy + CELL / 2} size={CELL} wall={WALL} side={side} />
        {hovered &&
          !thief &&
          beamOutlines(level, guards, hovered).map((line, i) => (
            <polyline
              key={i}
              points={line
                .map(([x, y]) => `${MARGIN + (x + 0.5) * CELL},${MARGIN + (y + 0.5) * CELL}`)
                .join(' ')}
              className="fill-none stroke-yellow-300"
              strokeWidth="3"
              strokeDasharray="6 4"
              strokeLinecap="round"
              pointerEvents="none"
            />
          ))}
        {guards.map((g) => {
          const [gx, gy] = origin(...g.pos)
          return (
            <g
              key={key(...g.pos)}
              transform={`translate(${gx + CELL / 2} ${gy + CELL / 2}) scale(1.35)`}
              pointerEvents="none"
            >
              <GuardSprite type={g.type} facing={g.facing} />
            </g>
          )
        })}
        <g
          style={{
            transform: `translate(${thiefX}px, ${thiefY}px)`,
            transition: `transform ${THIEF_STEP_MS}ms linear`,
          }}
          pointerEvents="none"
        >
          <g transform="scale(1.35)">
            <ThiefSprite facing={thiefFacing ?? OPPOSITE[side]} />
          </g>
        </g>
        {selected && !thief && (
          <rect
            x={origin(selected.x, selected.y)[0] + 1}
            y={origin(selected.x, selected.y)[1] + 1}
            width={CELL - 2}
            height={CELL - 2}
            rx={7}
            pointerEvents="none"
            className={`fill-none ${
              isPlaceable(level, selected.x, selected.y)
                ? 'stroke-violet-200 dark:stroke-violet-300'
                : 'stroke-gray-200/60 dark:stroke-gray-400/60'
            }`}
            strokeWidth="3"
          />
        )}
      </svg>
    </div>
  )
}
