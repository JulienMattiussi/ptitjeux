import type { SolvedStatus } from '~/lib/completion'

/** Ligne « Objectif N atteint / dépassé » du détail de victoire. */
export function ParObjective({ parMoves, variant }: { parMoves: number; variant: SolvedStatus }) {
  return (
    <div>
      Objectif <span className="font-bold">{parMoves}</span>{' '}
      {variant === 'perfect' ? 'atteint' : 'dépassé'}.
    </div>
  )
}
