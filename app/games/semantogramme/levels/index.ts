import level001 from './001-intro.json'
import type { Level } from '../types'

export const levels: Level[] = [level001 as unknown as Level]

export function findLevel(id: string): Level | undefined {
  return levels.find((l) => l.id === id)
}
