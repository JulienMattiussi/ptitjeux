import { useEffect, useReducer, useState } from 'react'
import { Link, useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { OutlineButton } from '~/components/OutlineButton'
import { PlaySidebar } from '~/components/PlaySidebar'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'
import { Board } from '~/games/sokomot/Board'
import { getAllDates, getLevel } from '~/games/sokomot/challenges'
import { applyMove, isWon, loadLevel, reset, undo } from '~/games/sokomot/engine'
import type { Direction, GameState } from '~/games/sokomot/types'
import { dateLabel, todayString } from '~/lib/dates'
import { writeLevelProgress } from '~/lib/localStorage'
import { levelKey } from '~/lib/useLocalProgress'

type Action =
  | { type: 'move'; direction: Direction }
  | { type: 'undo' }
  | { type: 'reset' }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'move':
      return applyMove(state, action.direction)
    case 'undo':
      return undo(state)
    case 'reset':
      return reset(state)
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
  const { date, index } = useParams<{ date: string; index: string }>()
  const idx = Number(index)
  const level = date && idx ? getLevel(date, idx) : undefined

  const [state, dispatch] = useReducer(
    reducer,
    level ?? null,
    (initialLevel) => (initialLevel ? loadLevel(initialLevel) : ({} as GameState)),
  )

  const won = level ? isWon(state) : false

  useEffect(() => {
    if (level) prefetchDefinition(level.canonicalWord ?? level.target.word)
  }, [level])

  // L'overlay attend la fin du slide CSS (200 ms duration-200 sur les blocs)
  // pour ne pas s'afficher pendant qu'un bloc glisse encore vers sa cible.
  const [showVictory, setShowVictory] = useState(false)
  useEffect(() => {
    if (!won) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowVictory(false)
      return
    }
    const handle = setTimeout(() => setShowVictory(true), 280)
    return () => clearTimeout(handle)
  }, [won])

  useEffect(() => {
    if (!level || won) return
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
  }, [level, won])

  useEffect(() => {
    if (won && date && idx) {
      writeLevelProgress('sokomot', levelKey(date, idx), {
        completed: true,
        bestMoves: state.moves,
      })
    }
  }, [won, date, idx, state.moves])

  if (!level || !date) {
    return (
      <GameLayout title="Niveau introuvable" backHref="/sokomot">
        <p className="text-gray-600 dark:text-gray-300">
          Ce niveau n'existe pas.{' '}
          <Link to="/sokomot" className="underline">
            Retour
          </Link>
          .
        </p>
      </GameLayout>
    )
  }

  const beatPar = level.parMoves !== undefined && state.moves <= level.parMoves
  const victoryVariant: 'perfect' | 'solved' = beatPar ? 'perfect' : 'solved'
  const nextHref = idx < 4 ? `/sokomot/${date}/${idx + 1}` : undefined

  const allDates = getAllDates()
  const isToday = date === todayString(allDates[allDates.length - 1])
  const dateChip = isToday ? 'Défi du jour' : dateLabel(date)

  return (
    <GameLayout
      title={`Sokomot · ${dateChip} · niveau ${idx}`}
      subtitle={`Mot à former : ${level.target.word}`}
      backHref="/sokomot"
      backLabel="Niveaux"
    >
      <GameFrame
        size="lg"
        overlay={
          <VictoryOverlay
            show={showVictory}
            variant={victoryVariant}
            title={beatPar ? 'Niveau parfait !' : 'Niveau résolu'}
            detail={
              <>
                <div>
                  Mot formé en{' '}
                  <span className="font-bold">
                    {state.moves} coup{state.moves > 1 ? 's' : ''}
                  </span>
                  .
                </div>
                {level.parMoves !== undefined && (
                  <div>
                    Objectif <span className="font-bold">{level.parMoves}</span>{' '}
                    {beatPar ? 'atteint' : 'dépassé'}.
                  </div>
                )}
                <WordDefinition word={level.canonicalWord ?? level.target.word} />
              </>
            }
            onReset={() => dispatch({ type: 'reset' })}
            backHref="/sokomot"
            nextHref={nextHref}
          />
        }
      >
        <Board state={state} />
        <PlaySidebar>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">Coups</div>
            <div className="text-3xl font-bold">{state.moves}</div>
            {level.parMoves && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Objectif : {level.parMoves}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <OutlineButton
              onClick={() => dispatch({ type: 'undo' })}
              disabled={won}
              className="flex-1"
            >
              Annuler (Ctrl+Z)
            </OutlineButton>
            <OutlineButton
              onClick={() => dispatch({ type: 'reset' })}
              className="flex-1"
            >
              Recommencer (R)
            </OutlineButton>
          </div>

          <HelpBox>
            Déplace-toi avec les flèches ou ZQSD. Pousse les blocs sur les cases ombrées pour
            former le mot.
          </HelpBox>
        </PlaySidebar>
      </GameFrame>
    </GameLayout>
  )
}
