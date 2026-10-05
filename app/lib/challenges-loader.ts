/**
 * Indexe par date et par niveau des modules chargés par `import.meta.glob`,
 * à partir de leur chemin `<date>-<index>.json` (ex. `./2026-04/2026-04-01-1.json`).
 *
 * `import.meta.glob` ne peut pas être appelé hors du module appelant : chaque
 * `<jeu>/challenges/index.ts` fait l'appel, ce module ne fait que parser les
 * chemins et exposer les accesseurs partagés.
 */
const FILE_PATTERN = /(\d{4}-\d{2}-\d{2})-(\d)\.json$/

export type ChallengeIndex<T> = {
  getLevel(date: string, index: number): T | undefined
  getAllDates(): string[]
}

export function buildChallengeIndex<T>(modules: Record<string, T>): ChallengeIndex<T> {
  const byDate = new Map<string, T[]>()
  for (const [filePath, level] of Object.entries(modules)) {
    const match = filePath.match(FILE_PATTERN)
    if (!match) continue
    const arr = byDate.get(match[1]) ?? []
    arr[Number(match[2]) - 1] = level
    byDate.set(match[1], arr)
  }
  const dates = Array.from(byDate.keys()).sort()
  return {
    getLevel: (date, index) => byDate.get(date)?.[index - 1],
    getAllDates: () => dates,
  }
}

/** Accès aux niveaux d'un jeu tel que le site l'utilise. */
export type GameChallenges<L> = {
  getAllDates(): string[]
  /** Charge un seul niveau, à la demande. */
  fetchLevel(date: string, index: number): Promise<L | undefined>
}

/**
 * Les niveaux ne sont jamais embarqués d'avance : la liste des dates se lit
 * dans les chemins des fichiers, et une partie charge son seul niveau.
 */
export function gameChallenges<L>(levels: Record<string, () => Promise<L>>): GameChallenges<L> {
  const loaders = buildChallengeIndex(levels)
  return {
    getAllDates: loaders.getAllDates,
    fetchLevel: async (date, index) => loaders.getLevel(date, index)?.(),
  }
}
