import { useEffect, useReducer, useState } from 'react'
import { useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { LevelNotFound } from '~/components/LevelNotFound'
import { OutlineButton } from '~/components/OutlineButton'
import { PlaySidebar } from '~/components/PlaySidebar'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'
import { Board } from '~/games/semantogramme/Board'
import { getAllDates, getLevel } from '~/games/semantogramme/challenges'
import {
  isFullyMarked,
  isGridSolved,
  isThemeGuessCorrect,
  isWon,
  loadLevel,
  reducer,
} from '~/games/semantogramme/engine'
import type { GameState } from '~/games/semantogramme/types'
import { moveCellCursor } from '~/lib/cursor'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useLatestRef } from '~/lib/useLatestRef'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { getVictoryState } from '~/lib/victoryState'

// Wrapper qui force un remount complet quand l'URL change de niveau.
export default function SemantogrammePlayRoute() {
  const { date = '', index = '' } = useParams<{ date: string; index: string }>()
  return <SemantogrammePlay key={`${date}-${index}`} />
}

function SemantogrammePlay() {
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

  // Sélection au clavier sur la grille : flèches déplacent, Espace cycle.
  const [selected, setSelected] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const selectedRef = useLatestRef(selected)

  useGameKeyboard({
    enabled: !!level && !won && !gridSolved,
    ignoreInputs: true,
    onDirection: (direction) => {
      if (!level) return
      setSelected((s) => moveCellCursor(s, direction, level.width, level.height))
    },
    onAction: () => {
      dispatch({
        type: 'cycle',
        x: selectedRef.current.x,
        y: selectedRef.current.y,
      })
      setThemeError(false)
    },
  })

  useEffect(() => {
    if (level) prefetchDefinition(level.themeWord)
  }, [level])
  const { beatPar, variant } = getVictoryState(level, state.moves)

  const allDates = getAllDates()
  const { dateChip, nextHref } = useLevelPlayLifecycle({
    gameId: 'semantogramme',
    date: date ?? '',
    idx,
    lastAvailableDate: allDates[allDates.length - 1],
    won,
    moves: state.moves,
  })

  if (!level || !date) {
    return <LevelNotFound backHref="/semantogramme" />
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
      title={`Sémantogramme · ${dateChip} · niveau ${idx}`}
      subtitle="Identifie les mots liés au thème caché."
      backHref={`/semantogramme?from=${date}`}
      backLabel="Niveaux"
    >
      <GameFrame
        size="lg"
        overlay={
          <VictoryOverlay
            show={won}
            variant={variant}
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
            backHref={`/semantogramme?from=${date}`}
            nextHref={nextHref}
          />
        }
      >
        <Board
          state={state}
          selected={selected}
          onHoverCell={(x, y) => {
            if (!won && !gridSolved) setSelected({ x, y })
          }}
          onCellClick={(x, y) => {
            if (won) return
            setSelected({ x, y })
            dispatch({ type: 'cycle', x, y })
            setThemeError(false)
          }}
        />
        <PlaySidebar>
          <HelpBox>
            Clique (ou flèches + Espace) pour changer l'état d'une case :
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
