/**
 * Unicité du **couloir**, build-time uniquement.
 *
 * Un niveau est valide si un seul couloir peut être obtenu, même si plusieurs
 * poses de vigiles le produisent. La preuve se fait en deux temps :
 *
 * 1. on énumère les couloirs compatibles avec les indices : chemins induits de
 *    la porte au diamant, qui passent par chaque « 0 » et évitent chaque case
 *    d'indice positif. C'est rapide et élimine l'essentiel ;
 * 2. pour chaque couloir concurrent restant, le solveur cherche une pose des
 *    vigiles qui le produit, couloir imposé. S'il n'en existe aucune, le
 *    concurrent tombe sans indice supplémentaire.
 */
import { areCluesSatisfied, computeVision, isFloor, isPlaceable } from '~/games/anglemort/engine'
import type { Guard, Level, Pos } from '~/games/anglemort/types'
import { clueEntries, floorNeighbours } from './anglemort-grid'
import { solveAngleMort } from './anglemort-solver'

/** Un couloir : 1 sur ses cases (indice `y * width + x`), 0 ailleurs. */
type CorridorCells = Uint8Array

type CorridorList = {
  corridors: CorridorCells[]
  /** `false` si l'énumération s'est arrêtée au plafond `maxCorridors`. */
  complete: boolean
}

type RivalStatus = 'impossible' | 'possible' | 'unknown'

/** Verdict sur un concurrent ; s'il est réalisable, une pose qui le produit. */
export type RivalCheck =
  { status: 'impossible' } | { status: 'possible'; pose: Guard[] } | { status: 'unknown' }

export function corridorCells(level: Level, cells: Pos[]): CorridorCells {
  const out = new Uint8Array(level.width * level.height)
  for (const [x, y] of cells) out[y * level.width + x] = 1
  return out
}

export function corridorId(cells: CorridorCells): string {
  return cells.join('')
}

/**
 * Couloirs compatibles avec les indices du niveau. Un couloir est un chemin
 * **induit** (aucune case ne touche une autre case du chemin hors de ses deux
 * voisines), sinon les cases sombres formeraient un embranchement ou un bloc.
 */
export function compatibleCorridors(level: Level, maxCorridors: number): CorridorList {
  const w = level.width
  const nbs = floorNeighbours(level)
  const door = level.door[1] * w + level.door[0]
  const diamond = level.diamond[1] * w + level.diamond[0]
  const clues = clueEntries(level)
  const lit = new Set(clues.filter(([, v]) => v > 0).map(([i]) => i))
  const dark = clues.filter(([, v]) => v === 0).map(([i]) => i)
  const on = new Uint8Array(w * level.height)
  const corridors: CorridorCells[] = []
  let complete = true

  const extend = (i: number): void => {
    if (!complete) return
    if (i === diamond) {
      if (dark.every((d) => on[d] === 1)) {
        if (corridors.length === maxCorridors) complete = false
        else corridors.push(on.slice())
      }
      return
    }
    for (const n of nbs[i]) {
      if (on[n] || lit.has(n) || nbs[n].some((m) => on[m] && m !== i)) continue
      on[n] = 1
      extend(n)
      on[n] = 0
    }
  }

  on[door] = 1
  extend(door)
  return { corridors, complete }
}

/** Existe-t-il une pose du lot entier qui produit exactement ce couloir ? */
export function checkRival(level: Level, cells: CorridorCells, maxNodes: number): RivalCheck {
  const w = level.width
  const forcedPath: Pos[] = []
  const forbiddenPath: Pos[] = []
  for (let i = 0; i < cells.length; i++) {
    const x = i % w
    const y = Math.floor(i / w)
    if (!isFloor(level, x, y)) continue
    ;(cells[i] ? forcedPath : forbiddenPath).push([x, y])
  }
  const result = solveAngleMort(level, { limit: 1, maxNodes, forcedPath, forbiddenPath })
  if (result.solutions.length > 0) return { status: 'possible', pose: result.solutions[0] }
  return { status: result.complete ? 'impossible' : 'unknown' }
}

export function rivalStatus(level: Level, cells: CorridorCells, maxNodes: number): RivalStatus {
  return checkRival(level, cells, maxNodes).status
}

/**
 * Vrai si une pose trouvée plus tôt reste valable avec les indices actuels :
 * aucun vigile sur une case d'indice, et chaque indice compté juste. Les
 * indices ne changent pas l'éclairage, donc le couloir produit reste le même.
 */
export function poseFitsClues(level: Level, pose: Guard[]): boolean {
  return (
    pose.every((g) => isPlaceable(level, ...g.pos)) &&
    areCluesSatisfied(level, computeVision(level, pose))
  )
}

type UniquenessBudget = {
  maxCorridors: number
  /** Budget du solveur pour chaque couloir concurrent. */
  maxNodes: number
}

/**
 * Budget des preuves d'unicité des tests d'intégrité. Le solveur y dispose de
 * plus de nœuds qu'à la génération (`RIVAL_NODES`) : une variante tournée
 * d'une grille peut en demander plus que l'originale pour la même preuve.
 */
const PROOF_BUDGET: UniquenessBudget = { maxCorridors: 1_000_000, maxNodes: 2_000_000 }

/**
 * Preuve que `corridor` est le seul couloir possible : `true` seulement si
 * l'énumération est complète et que chaque concurrent est prouvé impossible.
 */
export function isCorridorUnique(
  level: Level,
  corridor: Pos[],
  budget: UniquenessBudget = PROOF_BUDGET,
): boolean {
  const { corridors, complete } = compatibleCorridors(level, budget.maxCorridors)
  if (!complete) return false
  const intended = corridorId(corridorCells(level, corridor))
  return corridors.every(
    (c) => corridorId(c) === intended || rivalStatus(level, c, budget.maxNodes) === 'impossible',
  )
}
