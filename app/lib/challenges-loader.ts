/**
 * Construit l'API d'accès aux niveaux d'un jeu à partir des modules JSON
 * chargés par `import.meta.glob`. Les fichiers sont attendus avec le motif
 * `<date>-<index>.json` (ex. `2026-04-01-1.json`), peu importe la profondeur
 * du dossier (typiquement organisés en sous-dossiers mensuels).
 *
 * `import.meta.glob` ne peut pas être appelé hors du module appelant — chaque
 * `<jeu>/challenges/index.ts` reste mince et fait l'appel ; ce module ne fait
 * que parser les chemins et exposer les accesseurs partagés.
 */
const FILE_PATTERN = /(\d{4}-\d{2}-\d{2})-(\d)\.json$/

export type ChallengeIndex<TLevel> = {
  getChallenge(date: string): TLevel[] | undefined
  getLevel(date: string, index: number): TLevel | undefined
  getAllDates(): string[]
}

export function buildChallengeIndex<TLevel>(
  modules: Record<string, TLevel>,
): ChallengeIndex<TLevel> {
  const byDate = new Map<string, TLevel[]>()
  for (const [filePath, level] of Object.entries(modules)) {
    const match = filePath.match(FILE_PATTERN)
    if (!match) continue
    const date = match[1]
    const index = Number(match[2])
    const arr = byDate.get(date) ?? []
    arr[index - 1] = level
    byDate.set(date, arr)
  }

  return {
    getChallenge(date) {
      return byDate.get(date)
    },
    getLevel(date, index) {
      return byDate.get(date)?.[index - 1]
    },
    getAllDates() {
      return Array.from(byDate.keys()).sort()
    },
  }
}
