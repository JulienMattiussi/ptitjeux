import { GUARD_TYPES, pickableTypes, remaining, restFacing } from './engine'
import { GuardSprite } from './GuardSprite'
import { GUARD_LABEL } from './guardLabels'
import type { GameState } from './types'

/** Fond clair, comme les dalles éclairées : la casquette sombre reste lisible en mode sombre. */
const CHIP = 'rounded-lg bg-slate-100 dark:bg-slate-400'

/**
 * Réserve des vigiles encore à poser. Sur ordinateur, chacun est dessiné, une
 * ligne par type : un vigile posé disparaît, il n'y a rien à compter. Sur
 * mobile, où la liste prendrait plusieurs rangées, un vigile par type et son
 * nombre restant.
 */
export function PoolTray({ state }: { state: GameState }) {
  return (
    <>
      <div className="sm:hidden">
        <PoolCounts state={state} />
      </div>
      <div className="max-sm:hidden">
        <PoolList state={state} />
      </div>
    </>
  )
}

/** Un vigile par type du lot, avec son nombre restant ; grisé quand il n'en reste plus. */
function PoolCounts({ state }: { state: GameState }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {pickableTypes(state).map((type) => {
        const left = remaining(state, type)
        return (
          <li
            key={type}
            aria-label={`Vigiles à placer, type ${GUARD_LABEL[type].toLowerCase()} : ${left}`}
            className={`flex items-center gap-1.5 transition-opacity duration-200 ${left === 0 ? 'opacity-35 grayscale' : ''}`}
          >
            <svg viewBox="-20 -20 40 40" width="36" height="36" className={CHIP} aria-hidden="true">
              <GuardSprite type={type} facing={restFacing(type)} beams={false} />
            </svg>
            <span className="text-sm font-semibold tabular-nums">× {left}</span>
          </li>
        )
      })}
    </ul>
  )
}

function PoolList({ state }: { state: GameState }) {
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
          aria-label={`Vigiles à placer, type ${GUARD_LABEL[type].toLowerCase()} : ${remaining(state, type)}`}
        >
          {Array.from({ length: remaining(state, type) }, (_, i) => (
            <li key={i} title={`Vigile ${GUARD_LABEL[type].toLowerCase()}`} className={CHIP}>
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
