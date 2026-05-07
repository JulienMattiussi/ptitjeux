import type { Level } from '../types'

const modules = import.meta.glob<Level>('./*/*.json', {
  eager: true,
  import: 'default',
})

const FILE_PATTERN = /(\d{4}-\d{2}-\d{2})-(\d)\.json$/

const challengesByDate = new Map<string, Level[]>()
for (const [filePath, level] of Object.entries(modules)) {
  const match = filePath.match(FILE_PATTERN)
  if (!match) continue
  const date = match[1]
  const index = Number(match[2])
  const arr = challengesByDate.get(date) ?? []
  arr[index - 1] = level
  challengesByDate.set(date, arr)
}

export function getChallenge(date: string): Level[] | undefined {
  return challengesByDate.get(date)
}

export function getLevel(date: string, index: number): Level | undefined {
  return challengesByDate.get(date)?.[index - 1]
}

export function getAllDates(): string[] {
  return Array.from(challengesByDate.keys()).sort()
}
