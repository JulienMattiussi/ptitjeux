import { buildChallengeIndex } from '~/lib/challenges-loader'
import type { Level } from '../types'

const modules = import.meta.glob<Level>('./*/*.json', {
  eager: true,
  import: 'default',
})

export const { getLevel, getAllDates } = buildChallengeIndex(modules)
