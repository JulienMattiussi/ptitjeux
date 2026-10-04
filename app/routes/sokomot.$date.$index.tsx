import { useEffect, useReducer, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { LevelNotFound } from '~/components/LevelNotFound'
import { MovesCard } from '~/components/MovesCard'
import { PlayControls } from '~/components/PlayControls'
import { PlaySidebar } from '~/components/PlaySidebar'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'
import { Board } from '~/games/sokomot/Board'
import { getAllDates, getLevel } from '~/games/sokomot/challenges'
import { isWon, loadLevel, reducer } from '~/games/sokomot/engine'
import type { GameState } from '~/games/sokomot/types'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { getVictoryState } from '~/lib/victoryState'
import { gamePlayMeta } from '~/lib/seo'
import type { Route } from './+types/sokomot.$date.$index'

export function meta({ params }: Route.MetaArgs) {
  return gamePlayMeta('sokomot', params.date, params.index)
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
  const navigate = useNavigate()
  const idx = Number(index)
  const level = date && idx ? getLevel(date, idx) : undefined

  const [state, dispatch] = useReducer(reducer, level ?? null, (initialLevel) =>
    initialLevel ? loadLevel(initialLevel) : ({} as GameState),
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
    onBack: () => navigate(`/sokomot?from=${date}`),
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
    return <LevelNotFound backHref="/sokomot" />
  }

  const { beatPar, variant } = getVictoryState(level, state.moves)

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
            variant={variant}
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
          <MovesCard moves={state.moves} parMoves={level.parMoves} />

          <PlayControls
            onUndo={() => dispatch({ type: 'undo' })}
            onReset={() => dispatch({ type: 'reset' })}
            undoDisabled={won || state.history.length === 0}
          />

          <HelpBox>
            Déplace-toi avec les flèches ou ZQSD. Pousse les blocs sur les cases ombrées pour former
            le mot.
          </HelpBox>
        </PlaySidebar>
      </GameFrame>
    </GameLayout>
  )
}
