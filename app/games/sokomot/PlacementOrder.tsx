import { useMemo } from 'react'
import { placementOrder } from './engine'
import type { Level } from './types'

/** Aide : les lettres du mot cible dans leur ordre de pose (« L > E > G »). */
export function PlacementOrder({ level }: { level: Level }) {
  const sequence = useMemo(() => {
    const ranks = placementOrder(level)
    return [...level.target.word]
      .map((letter, i) => ({ letter, rank: ranks[i] }))
      .sort((a, b) => a.rank - b.rank)
      .map((l) => l.letter)
      .join(' → ')
  }, [level])
  return <>{sequence}</>
}
