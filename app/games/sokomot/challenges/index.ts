import { buildChallengeIndex } from '~/lib/challenges-loader'
import type { Level } from '../types'

// Un fichier par niveau, organisés en sous-dossiers mensuels
// (ex. `./2026-04/2026-04-01-1.json`).
const modules = import.meta.glob<Level>('./*/*.json', {
  eager: true,
  import: 'default',
})

export const { getChallenge, getLevel, getAllDates } = buildChallengeIndex(modules)
