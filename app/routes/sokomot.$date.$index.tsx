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
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'

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

// Wrapper qui force un remount complet (et donc un état frais) chaque fois
// que l'URL change vers un autre niveau. Sans cela, le `useReducer` à
// l'intérieur garde l'état du niveau précédent.
export default function SokomotPlayRoute() {
  const { date = '', index = '' } = useParams<{ date: string; index: string }>()
  return <SokomotPlay key={`${date}-${index}`} />
}

function SokomotPlay() {
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

  useGameKeyboard({
    enabled: !!level && !won,
    onDirection: (direction) => dispatch({ type: 'move', direction }),
    onUndo: () => dispatch({ type: 'undo' }),
    onReset: () => dispatch({ type: 'reset' }),
  })

  const allDates = getAllDates()
  const { dateChip, nextHref } = useLevelPlayLifecycle({
    gameId: 'sokomot',
    date: date ?? '',
    idx,
    lastAvailableDate: allDates[allDates.length - 1],
    won,
    moves: state.moves,
  })

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

  return (
    <GameLayout
      title={`Sokomot · ${dateChip} · niveau ${idx}`}
      subtitle={`Mot à former : ${level.target.word}`}
      backHref={`/sokomot?from=${date}`}
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
            backHref={`/sokomot?from=${date}`}
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
