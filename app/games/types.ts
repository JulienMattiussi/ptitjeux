/**
 * Un défi quotidien commun à tous les jeux. Contient toujours 4 niveaux,
 * de tailles croissantes (niveau 1 = plus petit, niveau 4 = plus grand).
 */
export type Challenge<L> = {
  date: string // YYYY-MM-DD
  levels: [L, L, L, L]
}

/** Index 1..4 d'un niveau dans un défi. */
export type LevelIndex = 1 | 2 | 3 | 4

export const LEVEL_INDICES: readonly LevelIndex[] = [1, 2, 3, 4] as const
