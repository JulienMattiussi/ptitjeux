import type { Direction } from '~/lib/cursor'

export type { Direction }

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
  parMoves: number
  /** Suite de coups qui résout le niveau. Lue par les tests d'intégrité et par l'aide. */
  solution: Direction[]
  /** Forme canonique du mot cible (avec accents) pour la recherche Wiktionnaire. */
  canonicalWord: string
}

export type GameState = {
  level: Level
  player: Coord
  blocks: Block[]
  moves: number
  /** Direction du dernier coup joué, qui oriente le crayon. */
  lastDirection: Direction
}
