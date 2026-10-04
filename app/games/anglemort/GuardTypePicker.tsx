import { GUARD_TYPES, remaining } from './engine'
import { GuardSprite } from './GuardSprite'
import type { GameState, GuardType } from './types'

const LABEL: Record<GuardType, string> = {
  simple: 'Simple',
  angle: 'En angle',
  oppose: 'Opposé',
}

/** Types de vigiles présents dans le lot, dans l'ordre du sélecteur (touches 1, 2, 3). */
export function pickableTypes(state: GameState): GuardType[] {
  return GUARD_TYPES.filter((t) => state.level.pool[t] > 0)
}

type Props = {
  state: GameState
  selected: GuardType
  onSelect: (type: GuardType) => void
}

/**
 * Sélecteur du type de vigile à poser, affiché sous la grille quand le lot
 * mélange plusieurs types. Chaque option ne montre que le vigile et ses
 * faisceaux, sur fond sombre, et son raccourci clavier ; le nom et le nombre
 * restant passent par le libellé accessible.
 */
export function GuardTypePicker({ state, selected, onSelect }: Props) {
  const types = pickableTypes(state)
  if (types.length < 2) return null
  return (
    <div role="radiogroup" aria-label="Type de vigile à poser" className="flex flex-wrap gap-2">
      {types.map((type, i) => {
        const left = remaining(state, type)
        const active = type === selected
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${LABEL[type]}, ${left} restant${left > 1 ? 's' : ''}, touche ${i + 1}`}
            disabled={left === 0}
            onClick={() => onSelect(type)}
            className={`relative rounded-xl bg-slate-800 p-1 ring-offset-2 transition duration-200 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-slate-900 dark:ring-offset-gray-950 ${
              active ? 'ring-2 ring-violet-500 dark:ring-violet-400' : 'hover:bg-slate-700'
            }`}
          >
            {/* Faisceaux visibles : c'est leur direction qui distingue les types. */}
            <svg viewBox="-36 -36 72 72" width="56" height="56" aria-hidden="true">
              <GuardSprite type={type} facing={type === 'oppose' ? 'E' : 'N'} />
            </svg>
            <kbd className="absolute right-1 bottom-1 rounded bg-slate-950/70 px-1 text-xs font-semibold text-slate-200">
              {i + 1}
            </kbd>
          </button>
        )
      })}
    </div>
  )
}
