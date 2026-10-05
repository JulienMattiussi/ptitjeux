import { gameChallenges } from '~/lib/challenges-loader'
import type { Level } from '../types'

// Un fichier par niveau, en sous-dossiers mensuels (`./2026-09/2026-09-01-1.json`),
// chacun chargé seulement quand on le joue.
export const { getAllDates, fetchLevel } = gameChallenges(
  import.meta.glob<Level>('./*/*.json', { import: 'default' }),
)
