import { GUARD_TYPES, remaining, restFacing } from './engine'
import { GuardSprite } from './GuardSprite'
import type { GameState, GuardType } from './types'

const TYPE_LABEL: Record<GuardType, string> = {
  simple: 'une lampe',
  angle: 'deux lampes en angle',
  oppose: 'deux lampes dos à dos',
}

/**
 * Réserve des vigiles encore à poser : chacun est dessiné, une ligne par type.
 * Un vigile posé disparaît de la réserve, il n'y a donc rien à compter.
 */
export function PoolTray({ state }: { state: GameState }) {
  const types = GUARD_TYPES.filter((t) => remaining(state, t) > 0)

  if (types.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Tous les vigiles sont placés.</p>
  }

  return (
    <div className="flex flex-col gap-1.5">
      {types.map((type) => (
        <ul
          key={type}
          className="flex flex-wrap gap-1.5"
          aria-label={`Vigiles à placer : ${remaining(state, type)} à ${TYPE_LABEL[type]}`}
        >
          {Array.from({ length: remaining(state, type) }, (_, i) => (
            <li key={i} title={`Vigile à ${TYPE_LABEL[type]}`}>
              <svg viewBox="-20 -20 40 40" width="36" height="36" aria-hidden="true">
                <GuardSprite type={type} facing={restFacing(type)} beams={false} />
              </svg>
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
}
