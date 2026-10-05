import { applyMove, loadLevel } from '~/games/sokomot/engine'
import type { GameState, Level } from '~/games/sokomot/types'

/** Rejoue la solution enregistrée du niveau. */
export function replaySolution(level: Level): GameState {
  return level.solution.reduce(applyMove, loadLevel(level))
}
