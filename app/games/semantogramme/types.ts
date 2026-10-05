export type CellStatus = 'unmarked' | 'in' | 'out'

export type Level = {
  id: string
  name: string
  width: number
  height: number
  /** Mots affichés dans la grille, indexés `[y][x]`. */
  words: string[][]
  /** Pour chaque ligne, nombre de cases liées au thème. */
  rowClues: number[]
  /** Pour chaque colonne, nombre de cases liées au thème. */
  colClues: number[]
  /** Mot-thème caché. */
  themeWord: string
  /**
   * Révélés par l'aide : domaines de sens du thème (curation `domains.json`) qui
   * ne le trahissent pas, à défaut sa catégorie (`helpDomains`).
   */
  domains: string[]
  /** Solution : pour chaque case, true si liée au thème. */
  solution: boolean[][]
  /** Nombre maximum de cycles de cases pour que la résolution soit « parfaite ». */
  parMoves: number
}

export type GameState = {
  level: Level
  /** Statut courant de chaque case, indexé `[y][x]`. */
  status: CellStatus[][]
  /** Tentative de mot-thème saisie par le joueur. */
  themeGuess: string
  /** Nombre total de cycles de cases effectués (= clics sur la grille). */
  moves: number
}
