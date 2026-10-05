import { plural } from '~/lib/text'
import { useLongPress } from '~/lib/useLongPress'
import { ClueMark, DiamondMark, MirrorMark } from './BoardMarks'
import type { MirrorHalf } from './engine'
import type { Dir, Guard, MirrorKind } from './types'

export const CELL = 52
/** Même teinte pour l'enceinte et les piliers : tout ce qui est mur. */
export const WALL_CLASS = 'fill-slate-300 dark:fill-slate-500'

const DIR_LABEL: Record<Dir, string> = { N: 'le nord', E: "l'est", S: 'le sud', W: "l'ouest" }

/** Ce qu'une case contient, du point de vue du rendu. */
export type CellContent =
  | { kind: 'pillar' }
  | { kind: 'mirror'; mirror: MirrorKind; lit: readonly MirrorHalf[] | undefined }
  | {
      kind: 'floor'
      seen: number
      clue: number | undefined
      guard: Guard | undefined
      isDoor: boolean
      isDiamond: boolean
      diamondTaken: boolean
      unseen: boolean
      expected: boolean
    }

type Props = {
  ox: number
  oy: number
  content: CellContent
  onHover: () => void
  onClick: () => void
  onRemove: () => void
}

function floorLabel(c: Extract<CellContent, { kind: 'floor' }>): string {
  if (c.guard) return `Vigile tourné vers ${DIR_LABEL[c.guard.facing]}`
  if (c.isDoor) return "Porte d'entrée"
  if (c.isDiamond) return 'Diamant'
  if (c.clue !== undefined) {
    const must = c.clue > 1 ? 'doivent' : 'doit'
    return `Indice : ${plural(c.clue, 'vigile')} ${must} éclairer cette case, ${c.seen} actuellement`
  }
  if (c.seen > 0) return `Case éclairée par ${plural(c.seen, 'vigile')}`
  return 'Case dans l’ombre'
}

/** Une case du plateau : pilier, miroir, ou dalle de sol avec ses marques. */
export function BoardCell({ ox, oy, content, onHover, onClick, onRemove }: Props) {
  // Au doigt, l'appui long remplace le clic droit (retirer le vigile).
  const longPress = useLongPress(onRemove)

  if (content.kind === 'pillar') {
    return (
      <g role="img" aria-label="Pilier" onMouseEnter={onHover}>
        <rect x={ox} y={oy} width={CELL} height={CELL} className={WALL_CLASS} />
      </g>
    )
  }
  if (content.kind === 'mirror') {
    return (
      <g role="img" aria-label={`Miroir ${content.mirror}`} onMouseEnter={onHover}>
        <MirrorMark ox={ox} oy={oy} size={CELL} kind={content.mirror} lit={content.lit} />
      </g>
    )
  }

  const { seen, clue, guard, isDoor, isDiamond } = content
  const cx = ox + CELL / 2
  const cy = oy + CELL / 2
  return (
    <g
      role="button"
      aria-label={floorLabel(content)}
      className="cursor-pointer"
      onMouseEnter={onHover}
      {...longPress.handlers}
      onClick={() => {
        if (!longPress.consume()) onClick()
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (!longPress.consume()) onRemove()
      }}
    >
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
      {content.expected && (
        <rect
          x={ox + 1.5}
          y={oy + 1.5}
          width={CELL - 3}
          height={CELL - 3}
          rx={4}
          className="fill-fuchsia-500/35"
        />
      )}
      {content.unseen && !isDoor && !isDiamond && (
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
      {isDiamond && !content.diamondTaken && <DiamondMark cx={cx} cy={cy} />}
      {clue !== undefined && <ClueMark cx={cx} cy={cy} clue={clue} seen={seen} />}
    </g>
  )
}
