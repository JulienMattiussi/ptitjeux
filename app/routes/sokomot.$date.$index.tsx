import { useEffect, useReducer, useState } from 'react'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { HintButton } from '~/components/HintButton'
import { LevelNotFound } from '~/components/LevelNotFound'
import { MovesCard } from '~/components/MovesCard'
import { ParObjective } from '~/components/ParObjective'
import { PlayControls } from '~/components/PlayControls'
import { PlaySidebar } from '~/components/PlaySidebar'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'
import { Board } from '~/games/sokomot/Board'
import * as challenges from '~/games/sokomot/challenges'
import { isWon, loadLevel, reducer } from '~/games/sokomot/engine'
import { PlacementOrder } from '~/games/sokomot/PlacementOrder'
import type { Level } from '~/games/sokomot/types'
import { plural } from '~/lib/text'
import { undoable, withUndo } from '~/lib/undoable'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useHint } from '~/lib/useHint'
import { loadLevelRoute, type LevelParams, type PlayProps } from '~/lib/levelRoute'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { gamePlayMeta } from '~/lib/seo'
import type { Route } from './+types/sokomot.$date.$index'

export function meta({ params, loaderData }: Route.MetaArgs) {
  return gamePlayMeta('sokomot', params.date, params.index, !!loaderData?.level)
}

export function loader({ params }: { params: LevelParams }) {
  return loadLevelRoute(params, challenges)
}

const undoableReducer = withUndo(reducer, (action) => action.type === 'move')

/** Laisse le dernier bloc finir de glisser (`duration-200`) avant d'annoncer la victoire. */
const VICTORY_DELAY_MS = 280

function useDelayedVictory(won: boolean): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!won) return
    const handle = setTimeout(() => setReady(true), VICTORY_DELAY_MS)
    return () => {
      clearTimeout(handle)
      setReady(false)
    }
  }, [won])
  return won && ready
}

// Le `key` remonte une partie neuve à chaque changement de niveau : sans lui,
// le `useReducer` garderait l'état du niveau précédent.
export default function SokomotPlayRoute({ loaderData }: Route.ComponentProps) {
  const { date, idx, level, lastDate } = loaderData
  if (!level) return <LevelNotFound backHref="/sokomot" />
  return (
    <SokomotPlay key={`${date}-${idx}`} level={level} date={date} idx={idx} lastDate={lastDate} />
  )
}

function SokomotPlay({ level, date, idx, lastDate }: PlayProps<Level>) {
  const [history, dispatch] = useReducer(undoableReducer, level, (l) => undoable(loadLevel(l)))
  const state = history.present
  const won = isWon(state)
  const showVictory = useDelayedVictory(won)
  const hint = useHint(state.moves, level.parMoves)
  const { title, backHref, goBack, nextHref, variant } = useLevelPlayLifecycle({
    gameId: 'sokomot',
    date,
    idx,
    lastDate,
    won,
    moves: state.moves,
    parMoves: level.parMoves,
  })

  useEffect(() => {
    prefetchDefinition(level.canonicalWord)
  }, [level])

  useGameKeyboard({
    onBack: goBack,
    enabled: !won,
    onDirection: (direction) => dispatch({ type: 'move', direction }),
    onUndo: () => dispatch({ type: 'undo' }),
    onReset: () => dispatch({ type: 'reset' }),
  })

  return (
    <GameLayout
      title={title}
      subtitle={`Mot à former : ${level.target.word}.`}
      backHref={backHref}
      backLabel="Niveaux"
    >
      <GameFrame
        overlay={
          <VictoryOverlay
            show={showVictory}
            variant={variant}
            title={variant === 'perfect' ? 'Niveau parfait !' : 'Niveau résolu'}
            detail={
              <>
                <div>
                  Mot formé en <span className="font-bold">{plural(state.moves, 'coup')}</span>.
                </div>
                <ParObjective parMoves={level.parMoves} variant={variant} />
                <WordDefinition word={level.canonicalWord} />
              </>
            }
            onReset={() => dispatch({ type: 'reset' })}
            backHref={backHref}
            nextHref={nextHref}
          />
        }
      >
        <Board
          state={state}
          onMove={won ? undefined : (direction) => dispatch({ type: 'move', direction })}
        />
        <PlaySidebar>
          <MovesCard
            moves={state.moves}
            parMoves={level.parMoves}
            hint={
              <HintButton hint={hint} label="Ordre de pose">
                <PlacementOrder level={level} />
              </HintButton>
            }
          />

          <PlayControls
            onUndo={() => dispatch({ type: 'undo' })}
            onReset={() => dispatch({ type: 'reset' })}
            undoDisabled={won || history.past.length === 0}
          />

          <HelpBox>
            Déplace-toi avec les flèches ou ZQSD, ou au doigt : glisse sur le plateau, ou touche une
            case à côté du crayon. Pousse les lettres sur les cases en pointillés pour former le
            mot.
          </HelpBox>
        </PlaySidebar>
      </GameFrame>
    </GameLayout>
  )
}
