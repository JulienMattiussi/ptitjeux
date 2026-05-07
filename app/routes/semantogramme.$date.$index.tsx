import { useEffect, useReducer, useState } from 'react'
import { Link, useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { OutlineButton } from '~/components/OutlineButton'
import { PlaySidebar } from '~/components/PlaySidebar'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'
import { Board } from '~/games/semantogramme/Board'
import { getAllDates, getLevel } from '~/games/semantogramme/challenges'
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
import type { GameState } from '~/games/semantogramme/types'
import { dateLabel, todayString } from '~/lib/dates'
import { writeLevelProgress } from '~/lib/localStorage'
import { levelKey } from '~/lib/useLocalProgress'

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
  const { date, index } = useParams<{ date: string; index: string }>()
  const idx = Number(index)
  const level = date && idx ? getLevel(date, idx) : undefined

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
    if (level) prefetchDefinition(level.themeWord)
  }, [level])
  const beatPar = !!level && level.parMoves !== undefined && state.moves <= level.parMoves
  const victoryVariant: 'perfect' | 'solved' = beatPar ? 'perfect' : 'solved'

  const allDates = getAllDates()
  const isToday = date === todayString(allDates[allDates.length - 1])

  useEffect(() => {
    if (won && date && idx) {
      writeLevelProgress('semantogramme', levelKey(date, idx), {
        completed: true,
        bestMoves: state.moves,
      })
    }
  }, [won, date, idx, state.moves])

  if (!level || !date) {
    return (
      <GameLayout title="Niveau introuvable" backHref="/semantogramme">
        <p className="text-gray-600 dark:text-gray-300">
          Ce niveau n'existe pas.{' '}
          <Link to="/semantogramme" className="underline">
            Retour
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
      title={`Sémantogramme · ${isToday ? 'Défi du jour' : dateLabel(date)} · niveau ${idx}`}
      subtitle="Identifie les mots liés au thème caché."
      backHref="/semantogramme"
      backLabel="Niveaux"
    >
      <GameFrame
        size="lg"
        overlay={
          <VictoryOverlay
            show={won}
            variant={victoryVariant}
            title={beatPar ? 'Thème trouvé !' : 'Thème trouvé'}
            detail={
              <>
                <div>
                  Le mot caché était{' '}
                  <span className="font-bold">« {level.themeWord} »</span>, trouvé en{' '}
                  <span className="font-bold">
                    {state.moves} clic{state.moves > 1 ? 's' : ''}
                  </span>
                  .
                </div>
                {level.parMoves !== undefined && (
                  <div>
                    Objectif <span className="font-bold">{level.parMoves}</span>{' '}
                    {beatPar ? 'atteint' : 'dépassé'}.
                  </div>
                )}
                <WordDefinition word={level.themeWord} />
              </>
            }
            onReset={() => {
              dispatch({ type: 'reset' })
              setThemeError(false)
            }}
            backHref="/semantogramme"
          />
        }
      >
        <Board
          state={state}
          onCellClick={(x, y) => {
            if (won) return
            dispatch({ type: 'cycle', x, y })
            setThemeError(false)
          }}
        />
        <PlaySidebar>
          <HelpBox>
            Clique sur une case pour changer son état :
            <span className="mx-1 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-amber-950 dark:bg-amber-700/70 dark:text-amber-50">
              IN
            </span>
            (liée au thème) →
            <span className="mx-1 inline-block rounded bg-gray-200 px-1.5 py-0.5 line-through dark:bg-gray-700">
              OUT
            </span>
            (hors thème) → vide.
          </HelpBox>

          {fullyMarked && !gridSolved && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Toutes les cases sont marquées, mais le placement ne correspond pas. Vérifie les
              compteurs.
            </div>
          )}

          {gridSolved && !won && (
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
                autoFocus
                className="rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-emerald-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Ton mot-thème"
              />
              {themeError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Pas tout à fait. Réessaie.
                </p>
              )}
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Valider le thème
              </button>
            </form>
          )}

          <OutlineButton
            onClick={() => {
              dispatch({ type: 'reset' })
              setThemeError(false)
            }}
          >
            Recommencer
          </OutlineButton>
        </PlaySidebar>
      </GameFrame>
    </GameLayout>
  )
}
