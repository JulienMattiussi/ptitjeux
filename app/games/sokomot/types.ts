export type Coord = [number, number]

export type Block = {
  id: string
  letter: string
  pos: Coord
}

export type Level = {
  id: string
  name: string
  width: number
  height: number
  player: Coord
  walls: Coord[]
  ice: Coord[]
  blocks: Block[]
  target: {
    word: string
    cells: Coord[]
  }
  parMoves?: number
  /** Suite de coups qui résout le niveau. Lue uniquement par les tests d'intégrité. */
  solution?: Direction[]
  /** Forme canonique du mot cible (avec accents) pour la recherche Wiktionnaire. */
  canonicalWord?: string
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export type GameState = {
  level: Level
  player: Coord
  blocks: Block[]
  moves: number
  history: GameSnapshot[]
}

export type GameSnapshot = {
  player: Coord
  blocks: Block[]
}
