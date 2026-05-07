import { useEffect, useReducer, useState } from 'react'
import { Link, useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { Board } from '~/games/semantogramme/Board'
import {
  cycleCellStatus,
  isFullyMarked,
  isGridSolved,
  isThemeGuessCorrect,
  isWon,
  loadLevel,
  reset,
  setThemeGuess,
} from '~/games/semantogramme/engine'
import { findLevel } from '~/games/semantogramme/levels'
import type { GameState } from '~/games/semantogramme/types'
import { writeLevelProgress } from '~/lib/localStorage'

type Action =
  | { type: 'cycle'; x: number; y: number }
  | { type: 'reset' }
  | { type: 'guess'; value: string }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'cycle':
      return cycleCellStatus(state, action.x, action.y)
    case 'reset':
      return reset(state)
    case 'guess':
      return setThemeGuess(state, action.value)
  }
}

export default function SemantogrammePlay() {
  const { levelId } = useParams<{ levelId: string }>()
  const level = levelId ? findLevel(levelId) : undefined

  const [state, dispatch] = useReducer(
    reducer,
    level ?? null,
    (initialLevel) => (initialLevel ? loadLevel(initialLevel) : ({} as GameState)),
  )

  const [themeError, setThemeError] = useState(false)

  const fullyMarked = level ? isFullyMarked(state) : false
  const gridSolved = level ? isGridSolved(state) : false
  const won = level ? isWon(state) : false

  useEffect(() => {
    if (won && level) {
      writeLevelProgress('semantogramme', level.id, { completed: true })
    }
  }, [won, level])

  if (!level) {
    return (
      <GameLayout title="Niveau introuvable" backHref="/semantogramme">
        <p className="text-gray-600 dark:text-gray-300">
          Ce niveau n'existe pas.{' '}
          <Link to="/semantogramme" className="underline">
            Retour à la liste
          </Link>
          .
        </p>
      </GameLayout>
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isThemeGuessCorrect(state)) {
      setThemeError(false)
    } else {
      setThemeError(true)
    }
  }

  return (
    <GameLayout
      title={`Sémantogramme · ${level.name}`}
      subtitle="Identifie les mots liés au thème caché."
      backHref="/semantogramme"
      backLabel="← Niveaux"
    >
      <GameFrame size="lg">
        <Board
          state={state}
          onCellClick={(x, y) => {
            dispatch({ type: 'cycle', x, y })
            setThemeError(false)
          }}
        />
        <aside className="flex w-full max-w-xs flex-col gap-3">
          <div className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Clique sur une case pour changer son état :
            <span className="mx-1 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-amber-950 dark:bg-amber-700/70 dark:text-amber-50">
              IN
            </span>
            (liée au thème) →
            <span className="mx-1 inline-block rounded bg-gray-200 px-1.5 py-0.5 line-through dark:bg-gray-700">
              OUT
            </span>
            (hors thème) → vide. Les compteurs en marge montrent ton avancée.
          </div>

          {fullyMarked && !gridSolved && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Toutes les cases sont marquées, mais le placement ne correspond pas. Vérifie les
              compteurs.
            </div>
          )}

          {gridSolved && (
            <form
              onSubmit={handleSubmit}
              className="animate-pop flex flex-col gap-2 rounded-xl border border-emerald-300 bg-linear-to-br from-emerald-50 to-teal-50 p-3 shadow-md shadow-emerald-200/50 dark:border-emerald-700 dark:from-emerald-950 dark:to-teal-950 dark:shadow-emerald-900/30"
            >
              <label
                htmlFor="theme-guess"
                className="text-sm font-medium text-emerald-900 dark:text-emerald-200"
              >
                Grille résolue. Quel est le thème ?
              </label>
              <input
                id="theme-guess"
                type="text"
                value={state.themeGuess}
                onChange={(e) => {
                  dispatch({ type: 'guess', value: e.target.value })
                  setThemeError(false)
                }}
                disabled={won}
                autoFocus
                className="rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-emerald-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Ton mot-thème"
              />
              {themeError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Pas tout à fait. Réessaie.
                </p>
              )}
              {won ? (
                <p className="flex items-center gap-2 font-display text-base font-bold text-emerald-800 dark:text-emerald-200">
                  <span aria-hidden="true">✨</span>
                  Bravo ! Le thème était « {level.themeWord} ».
                </p>
              ) : (
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  Valider le thème
                </button>
              )}
            </form>
          )}

          <button
            type="button"
            onClick={() => dispatch({ type: 'reset' })}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Recommencer
          </button>
        </aside>
      </GameFrame>
    </GameLayout>
  )
}
