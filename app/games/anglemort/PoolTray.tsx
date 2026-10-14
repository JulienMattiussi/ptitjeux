import type { ReactNode } from 'react'
import { GUARD_TYPES, pickableTypes, remaining, restFacing } from './engine'
import { GuardSprite } from './GuardSprite'
import { GUARD_LABEL } from './guardLabels'
import type { GameState, GuardType } from './types'

/** Fond clair, comme les dalles éclairées : la casquette sombre reste lisible en mode sombre. */
const CHIP = 'rounded-lg bg-slate-100 dark:bg-slate-400'

type Props = {
  state: GameState
  /** Cliquer un vigile de la réserve choisit son type, comme le sélecteur sous la grille. */
  onSelect?: (type: GuardType) => void
}

/**
 * Réserve des vigiles encore à poser. Sur ordinateur, chacun est dessiné, une
 * ligne par type : un vigile posé disparaît, il n'y a rien à compter. Sur
 * mobile, où la liste prendrait plusieurs rangées, un vigile par type et son
 * nombre restant.
 */
export function PoolTray({ state, onSelect }: Props) {
  // Comme le sélecteur : choisir n'a de sens que si le lot mélange plusieurs types.
  const select = pickableTypes(state).length > 1 ? onSelect : undefined
  return (
    <>
      <div className="sm:hidden">
        <PoolCounts state={state} onSelect={select} />
      </div>
      <div className="max-sm:hidden">
        <PoolList state={state} onSelect={select} />
      </div>
    </>
  )
}

/** Un vigile par type du lot, avec son nombre restant ; grisé quand il n'en reste plus. */
function PoolCounts({ state, onSelect }: Props) {
  return (
    <ul className="flex flex-wrap gap-3">
      {pickableTypes(state).map((type) => {
        const left = remaining(state, type)
        return (
          <li
            key={type}
            aria-label={`Vigiles à placer, type ${GUARD_LABEL[type].toLowerCase()} : ${left}`}
            className={`transition-opacity duration-200 ${left === 0 ? 'opacity-35 grayscale' : ''}`}
          >
            <Pick
              type={type}
              onSelect={left > 0 ? onSelect : undefined}
              className="flex items-center gap-1.5"
            >
              <svg
                viewBox="-20 -20 40 40"
                width="36"
                height="36"
                className={CHIP}
                aria-hidden="true"
              >
                <GuardSprite type={type} facing={restFacing(type)} beams={false} />
              </svg>
              <span className="text-sm font-semibold tabular-nums">× {left}</span>
            </Pick>
          </li>
        )
      })}
    </ul>
  )
}

function PoolList({ state, onSelect }: Props) {
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
            <li key={i} className={CHIP}>
              <Pick
                type={type}
                onSelect={onSelect}
                title={`Vigile ${GUARD_LABEL[type].toLowerCase()}`}
              >
                <svg viewBox="-20 -20 40 40" width="36" height="36" aria-hidden="true">
                  <GuardSprite type={type} facing={restFacing(type)} beams={false} />
                </svg>
              </Pick>
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
}

type PickProps = {
  type: GuardType
  onSelect?: (type: GuardType) => void
  title?: string
  className?: string
  children: ReactNode
}

/** Bouton qui choisit le type quand la sélection est possible, simple bloc sinon. */
function Pick({ type, onSelect, title, className = '', children }: PickProps) {
  if (!onSelect) {
    return (
      <div title={title} className={className}>
        {children}
      </div>
    )
  }
  return (
    <button
      type="button"
      aria-label={`Choisir le vigile ${GUARD_LABEL[type].toLowerCase()}`}
      title={title}
      onClick={() => onSelect(type)}
      className={`block cursor-pointer rounded-lg ${className}`}
    >
      {children}
    </button>
  )
}
