import { GUARD_TYPES, remaining } from './engine'
import { GuardSprite } from './GuardSprite'
import type { GameState, GuardType } from './types'

const TYPE_LABEL: Record<GuardType, string> = {
  simple: 'une lampe',
  angle: 'deux lampes en angle',
  oppose: 'deux lampes dos à dos',
}

/**
 * Réserve des vigiles encore à poser : chacun est dessiné, groupés par type.
 * Un vigile posé disparaît de la réserve, il n'y a donc rien à compter.
 */
export function PoolTray({ state }: { state: GameState }) {
  const left = GUARD_TYPES.flatMap((type) =>
    Array.from({ length: remaining(state, type) }, (_, i) => ({ type, i })),
  )
  const label = GUARD_TYPES.filter((t) => remaining(state, t) > 0)
    .map((t) => `${remaining(state, t)} à ${TYPE_LABEL[t]}`)
    .join(', ')

  if (left.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Tous les vigiles sont placés.</p>
  }

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`Vigiles à placer : ${label}`}>
      {left.map(({ type, i }) => (
        <li key={`${type}-${i}`} title={`Vigile à ${TYPE_LABEL[type]}`}>
          <svg viewBox="-20 -20 40 40" width="36" height="36" aria-hidden="true">
            <GuardSprite type={type} facing={type === 'oppose' ? 'E' : 'N'} beams={false} />
          </svg>
        </li>
      ))}
    </ul>
  )
}
