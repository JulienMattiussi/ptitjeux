/** Coordonnées `[x, y]`, origine en haut à gauche. */
export type Pos = [number, number]

export type Dir = 'N' | 'E' | 'S' | 'W'

/**
 * - `simple` : 1 champ de vision, dans la direction `facing`.
 * - `angle` : 2 champs à 90°, `facing` puis sa rotation horaire (N → N+E).
 * - `oppose` : 2 champs à 180°, `facing` et son opposé.
 */
export type GuardType = 'simple' | 'angle' | 'oppose'

export type Guard = {
  pos: Pos
  type: GuardType
  facing: Dir
}

/**
 * Sens du tracé dans la case. Un regard qui va vers l'est repart vers le nord
 * sur `/`, vers le sud sur `\`.
 */
export type MirrorKind = '/' | '\\'

export type Mirror = {
  pos: Pos
  kind: MirrorKind
}

export type Pool = Record<GuardType, number>

export type Level = {
  id: string
  name: string
  width: number
  height: number
  /** Bloquent la vue et le passage. */
  pillars: Pos[]
  /** Dévient la vue de 90°, bloquent le passage. */
  mirrors: Mirror[]
  /** Case libre sur le bord : début du chemin du cambrioleur. */
  door: Pos
  /** Case libre : fin du chemin du cambrioleur. */
  diamond: Pos
  /** `"x,y"` → nombre exact de vigiles qui voient la case. */
  clues: Record<string, number>
  /** Lot de vigiles à placer entièrement. */
  pool: Pool
  /** Taille du lot : une pose par vigile, sans retrait. */
  parMoves?: number
  /** Lu uniquement par le test d'intégrité. */
  solution: Guard[]
}

export type GameState = {
  level: Level
  guards: Guard[]
  /** Nombre de poses de vigiles (les rotations et retraits ne comptent pas). */
  moves: number
}
