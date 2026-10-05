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
import { StatusRow } from '~/components/StatusRow'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'
import { Board } from '~/games/boucle/Board'
import * as challenges from '~/games/boucle/challenges'
import {
  areCluesSatisfied,
  countClues,
  countSatisfiedClues,
  isValidLoop,
  isWon,
  loadLevel,
  moveEdgeSelection,
  reducer,
} from '~/games/boucle/engine'
import type { Edge, Level } from '~/games/boucle/types'
import { plural } from '~/lib/text'
import { undoable, withUndo } from '~/lib/undoable'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useHint } from '~/lib/useHint'
import { useLatestRef } from '~/lib/useLatestRef'
import { loadLevelRoute, type LevelParams, type PlayProps } from '~/lib/levelRoute'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { gamePlayMeta } from '~/lib/seo'
import type { Route } from './+types/boucle.$date.$index'

export function meta({ params }: Route.MetaArgs) {
  return gamePlayMeta('boucle', params.date, params.index)
}

export function loader({ params }: { params: LevelParams }) {
  return loadLevelRoute(params, challenges)
}

const undoableReducer = withUndo(reducer, (action) => action.type === 'toggle')

// Le `key` remonte une partie neuve à chaque changement de niveau.
export default function BouclePlayRoute({ loaderData }: Route.ComponentProps) {
  const { date, idx, level, lastDate } = loaderData
  if (!level) return <LevelNotFound backHref="/boucle" />
  return (
    <BouclePlay key={`${date}-${idx}`} level={level} date={date} idx={idx} lastDate={lastDate} />
  )
}

function BouclePlay({ level, date, idx, lastDate }: PlayProps<Level>) {
  const [history, dispatch] = useReducer(undoableReducer, level, (l) => undoable(loadLevel(l)))
  const state = history.present
  const won = isWon(state)
  const loopOk = isValidLoop(state.edges)
  const hint = useHint(state.moves, level.parMoves)
  const { title, backHref, goBack, nextHref, variant } = useLevelPlayLifecycle({
    gameId: 'boucle',
    date,
    idx,
    lastDate,
    won,
    moves: state.moves,
    parMoves: level.parMoves,
  })

  const [selected, setSelected] = useState<Edge>({ x: 0, y: 0, orientation: 'horizontal' })
  const selectedRef = useLatestRef(selected)

  useGameKeyboard({
    onBack: goBack,
    enabled: !won,
    onDirection: (direction) =>
      setSelected((prev) => moveEdgeSelection(prev, direction, level.width, level.height)),
    onAction: () => dispatch({ type: 'toggle', edge: selectedRef.current }),
    onUndo: () => dispatch({ type: 'undo' }),
    onReset: () => dispatch({ type: 'reset' }),
  })

  useEffect(() => {
    prefetchDefinition(level.canonicalWord)
  }, [level])

  return (
    <GameLayout
      title={title}
      subtitle={`${level.solutionWord.length} lettres à encercler.`}
      backHref={backHref}
      backLabel="Niveaux"
    >
      <GameFrame
        overlay={
          <VictoryOverlay
            show={won}
            variant={variant}
            title={variant === 'perfect' ? 'Boucle parfaite !' : 'Boucle complète'}
            detail={
              <>
                <div>
                  Mot encerclé : <span className="font-bold">{level.solutionWord}</span> en{' '}
                  <span className="font-bold">{plural(state.moves, 'coup')}</span>.
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
          selected={selected}
          onHoverEdge={(edge) => {
            if (!won) setSelected(edge)
          }}
          onToggleEdge={(edge) => {
            if (won) return
            setSelected(edge)
            dispatch({ type: 'toggle', edge })
          }}
        />
        <PlaySidebar>
          <MovesCard
            moves={state.moves}
            parMoves={level.parMoves}
            hint={
              <HintButton hint={hint} label="Mot à encercler">
                {level.solutionWord}
              </HintButton>
            }
          >
            <div className="flex flex-col gap-1 text-sm">
              <StatusRow
                label="Indices ok"
                value={`${countSatisfiedClues(state)} / ${countClues(state)}`}
                ok={areCluesSatisfied(state)}
              />
              <StatusRow label="Boucle" value={loopOk ? 'fermée' : 'ouverte'} ok={loopOk} />
            </div>
          </MovesCard>

          <PlayControls
            onUndo={() => dispatch({ type: 'undo' })}
            onReset={() => dispatch({ type: 'reset' })}
            undoDisabled={won || history.past.length === 0}
          />

          <HelpBox>
            Clique sur une arête entre deux cases pour l'ajouter à la boucle, ou navigue avec les
            flèches et appuie sur Espace pour la basculer. Les indices te disent combien d'arêtes de
            la boucle entourent chaque case. Quand la boucle est valide, les lettres encerclées
            doivent former le mot.
          </HelpBox>
        </PlaySidebar>
      </GameFrame>
    </GameLayout>
  )
}
