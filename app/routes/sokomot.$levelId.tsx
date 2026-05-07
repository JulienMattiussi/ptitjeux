import { useEffect, useReducer } from 'react'
import { Link, useParams } from 'react-router'
import { GameLayout } from '~/components/GameLayout'
import { Board } from '~/games/sokomot/Board'
import { applyMove, isWon, loadLevel, reset, undo } from '~/games/sokomot/engine'
import { findLevel } from '~/games/sokomot/levels'
import type { Direction, GameState } from '~/games/sokomot/types'
import { writeLevelProgress } from '~/lib/localStorage'

type Action =
  | { type: 'move'; direction: Direction }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'load'; state: GameState }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'move':
      return applyMove(state, action.direction)
    case 'undo':
      return undo(state)
    case 'reset':
      return reset(state)
    case 'load':
      return action.state
  }
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

export default function SokomotPlay() {
  const { levelId } = useParams<{ levelId: string }>()
  const level = levelId ? findLevel(levelId) : undefined

  const [state, dispatch] = useReducer(
    reducer,
    level ?? null,
    (initialLevel) => (initialLevel ? loadLevel(initialLevel) : ({} as GameState)),
  )

  useEffect(() => {
    if (!level) return
    function handleKey(event: KeyboardEvent) {
      const direction = KEY_TO_DIRECTION[event.key]
      if (direction) {
        event.preventDefault()
        dispatch({ type: 'move', direction })
        return
      }
      if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        dispatch({ type: 'undo' })
        return
      }
      if (event.key === 'r') {
        dispatch({ type: 'reset' })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [level])

  const won = level ? isWon(state) : false

  useEffect(() => {
    if (won && level) {
      writeLevelProgress('sokomot', level.id, { completed: true, bestMoves: state.moves })
    }
  }, [won, level, state.moves])

  if (!level) {
    return (
      <GameLayout title="Niveau introuvable" backHref="/sokomot">
        <p className="text-gray-600 dark:text-gray-300">
          Ce niveau n'existe pas.{' '}
          <Link to="/sokomot" className="underline">
            Retour à la liste
          </Link>
          .
        </p>
      </GameLayout>
    )
  }

  return (
    <GameLayout
      title={`Sokomot · ${level.name}`}
      subtitle={`Mot à former : ${level.target.word}`}
      backHref="/sokomot"
      backLabel="← Niveaux"
    >
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <Board state={state} />
        <aside className="flex w-full max-w-xs flex-col gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">Coups</div>
            <div className="text-3xl font-bold">{state.moves}</div>
            {level.parMoves && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Objectif : {level.parMoves}
              </div>
            )}
          </div>

          {won && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <div className="font-semibold">Bravo !</div>
              <div className="text-sm">
                Niveau résolu en {state.moves} coup{state.moves > 1 ? 's' : ''}.
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'undo' })}
              className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              Annuler (Ctrl+Z)
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'reset' })}
              className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              Recommencer (R)
            </button>
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
            Déplace-toi avec les flèches ou ZQSD. Pousse les blocs sur les cases ombrées pour
            former le mot. Sur la glace, tout glisse jusqu'au prochain obstacle.
          </div>
        </aside>
      </div>
    </GameLayout>
  )
}
