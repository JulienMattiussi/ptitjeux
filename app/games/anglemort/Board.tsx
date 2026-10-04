import { useMemo } from 'react'
import { ClueMark, DiamondMark, DoorMark, doorSide, MirrorMark, SIDE_VECTOR } from './BoardMarks'
import { beamOutlines, computeVision, isPlaceable, key, unseenCells } from './engine'
import { GuardSprite } from './GuardSprite'
import { ThiefSprite } from './ThiefSprite'
import type { Dir, GameState, Pos } from './types'

type Props = {
  state: GameState
  /** Clic gauche : pose un vigile, ou fait pivoter celui en place. */
  onCellClick: (x: number, y: number) => void
  /** Clic droit : retire le vigile. */
  onCellRemove: (x: number, y: number) => void
  selected?: { x: number; y: number }
  onHoverCell?: (x: number, y: number) => void
  /** Mise au point (`?couloir`) : couloir attendu, teinté sur le plateau. */
  expected?: Pos[]
  /** Position du cambrioleur pendant sa traversée de victoire. */
  thief?: Pos
  /** Direction de son dernier pas (par défaut : face à la porte). */
  thiefFacing?: Dir
  /** Le cambrioleur a atteint le diamant : il n'est plus dessiné sur sa case. */
  diamondTaken?: boolean
}

const CELL = 52
/** Marge autour de la grille, où le cambrioleur attend devant l'entrée. */
const MARGIN = 64
/** Épaisseur du mur d'enceinte. */
const WALL = 10
/** Même teinte pour l'enceinte et les piliers : tout ce qui est mur. */
const WALL_CLASS = 'fill-slate-300 dark:fill-slate-500'

/** Direction qui entre dans la salle depuis chaque côté. */
const INWARD: Record<Dir, Dir> = { N: 'S', S: 'N', W: 'E', E: 'W' }

const DIR_LABEL: Record<Dir, string> = { N: 'le nord', E: "l'est", S: 'le sud', W: "l'ouest" }

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
      const [ox, oy] = origin(x, y)
      const cx = ox + CELL / 2
      const cy = oy + CELL / 2
      const handlers = {
        onMouseEnter: () => onHoverCell?.(x, y),
        onClick: () => onCellClick(x, y),
        onContextMenu: (e: React.MouseEvent) => {
          e.preventDefault()
          onCellRemove(x, y)
        },
      }

      if (pillars.has(k)) {
        cells.push(
          <g key={k} role="img" aria-label="Pilier" onMouseEnter={handlers.onMouseEnter}>
            <rect x={ox} y={oy} width={CELL} height={CELL} className={WALL_CLASS} />
          </g>,
        )
        continue
      }

      const mirror = mirrors.get(k)
      if (mirror) {
        cells.push(
          <g
            key={k}
            role="img"
            aria-label={`Miroir ${mirror}`}
            onMouseEnter={handlers.onMouseEnter}
          >
            <MirrorMark ox={ox} oy={oy} size={CELL} kind={mirror} lit={vision.litMirrors[k]} />
          </g>,
        )
        continue
      }

      const seen = vision.seen[y][x]
      const clue = level.clues[k]
      const guard = guardByCell.get(k)
      const isDoor = level.door[0] === x && level.door[1] === y
      const isDiamond = level.diamond[0] === x && level.diamond[1] === y
      const label = guard
        ? `Vigile tourné vers ${DIR_LABEL[guard.facing]}`
        : isDoor
          ? "Case d'entrée"
          : isDiamond
            ? 'Diamant'
            : clue !== undefined
              ? `Indice : ${clue} vigile${clue > 1 ? 's' : ''} doivent éclairer cette case, ${seen} actuellement`
              : seen > 0
                ? `Case éclairée par ${seen} vigile${seen > 1 ? 's' : ''}`
                : 'Case dans l’ombre'

      cells.push(
        <g key={k} role="button" aria-label={label} className="cursor-pointer" {...handlers}>
          <rect
            x={ox + 1.5}
            y={oy + 1.5}
            width={CELL - 3}
            height={CELL - 3}
            rx={4}
            className={`transition-colors duration-200 ${
              guard
                ? 'fill-amber-50 dark:fill-amber-800/60'
                : seen > 0
                  ? 'fill-amber-100 dark:fill-amber-700/60'
                  : 'fill-slate-700 dark:fill-slate-900'
            }`}
          />
          {expectedSet.has(k) && (
            <rect
              x={ox + 1.5}
              y={oy + 1.5}
              width={CELL - 3}
              height={CELL - 3}
              rx={4}
              className="fill-fuchsia-500/35"
            />
          )}
          {unseen.has(k) && !isDoor && !isDiamond && (
            <rect
              x={ox + 6}
              y={oy + 6}
              width={CELL - 12}
              height={CELL - 12}
              rx={4}
              className="fill-none stroke-violet-400/70 dark:stroke-violet-600/70"
              strokeDasharray="4 3"
            />
          )}
          {isDiamond && !diamondTaken && <DiamondMark cx={cx} cy={cy} />}
          {clue !== undefined && <ClueMark cx={cx} cy={cy} clue={clue} seen={seen} />}
        </g>,
      )
    }
  }

  const [dx, dy] = origin(...level.door)
  const side = doorSide(level)
  // Avant la victoire, le cambrioleur attend dehors, face à la porte.
  const wait = CELL / 2 + WALL + 22
  const [thiefX, thiefY] = thief
    ? [origin(...thief)[0] + CELL / 2, origin(...thief)[1] + CELL / 2]
    : [dx + CELL / 2 + SIDE_VECTOR[side][0] * wait, dy + CELL / 2 + SIDE_VECTOR[side][1] * wait]

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
            transition: 'transform 140ms linear',
          }}
          pointerEvents="none"
        >
          <g transform="scale(1.35)">
            <ThiefSprite facing={thiefFacing ?? INWARD[side]} />
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
