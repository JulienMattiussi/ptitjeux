/** Chemins des fichiers de niveaux, relatifs au dossier `challenges/` d'un jeu. */
import { monthKey } from '../app/lib/dates.js'
import type { LevelIndex } from '../app/games/types.js'

export function levelFile(date: string, index: LevelIndex): string {
  return `${monthKey(date)}/${date}-${index}.json`
}

/**
 * Fichiers que `--clean` supprime : chaque niveau du filtre, sauf ceux que
 * `keep` protège (grilles de base fixées d'Angle mort, relues par le
 * générateur lui-même).
 */
export function filesToClean(
  dates: readonly string[],
  levels: readonly LevelIndex[],
  keep: (date: string, index: LevelIndex) => boolean = () => false,
): string[] {
  return dates.flatMap((date) =>
    levels.filter((index) => !keep(date, index)).map((index) => levelFile(date, index)),
  )
}
