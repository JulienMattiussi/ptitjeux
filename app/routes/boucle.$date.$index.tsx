import { useEffect, useReducer, useState } from 'react'
import { useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { LevelNotFound } from '~/components/LevelNotFound'
import { MovesCard } from '~/components/MovesCard'
import { PlayControls } from '~/components/PlayControls'
import { PlaySidebar } from '~/components/PlaySidebar'
import { StatusRow } from '~/components/StatusRow'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'
import { Board } from '~/games/boucle/Board'
import { getAllDates, getLevel } from '~/games/boucle/challenges'
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
import type { Edge, GameState } from '~/games/boucle/types'
import { undoable, withUndo } from '~/lib/undoable'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useLatestRef } from '~/lib/useLatestRef'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { getVictoryState } from '~/lib/victoryState'

const undoableReducer = withUndo(reducer, (action) => action.type === 'toggle')

// Wrapper qui force un remount complet quand l'URL change de niveau.
export default function BouclePlayRoute() {
  const { date = '', index = '' } = useParams<{ date: string; index: string }>()
  return <BouclePlay key={`${date}-${index}`} />
}

function BouclePlay() {
  const { date, index } = useParams<{ date: string; index: string }>()
  const idx = Number(index)
  const level = date && idx ? getLevel(date, idx) : undefined

  const [history, dispatch] = useReducer(undoableReducer, level ?? null, (initialLevel) =>
    undoable(initialLevel ? loadLevel(initialLevel) : ({} as GameState)),
  )
  const state = history.present

  const won = level ? isWon(state) : false
  const cluesOk = level ? areCluesSatisfied(state) : false
  const totalClues = level ? countClues(state) : 0
  const okClues = level ? countSatisfiedClues(state) : 0

  // Sélection au clavier : flèches déplacent l'arête, Espace toggle.
  const [selected, setSelected] = useState<Edge>({ x: 0, y: 0, orientation: 'horizontal' })
  const selectedRef = useLatestRef(selected)

  useGameKeyboard({
    enabled: !!level && !won,
    onDirection: (direction) => {
      if (!level) return
      setSelected((prev) => moveEdgeSelection(prev, direction, level.width, level.height))
    },
    onAction: () => dispatch({ type: 'toggle', edge: selectedRef.current }),
    onUndo: () => dispatch({ type: 'undo' }),
    onReset: () => dispatch({ type: 'reset' }),
  })

  useEffect(() => {
    if (level) prefetchDefinition(level.canonicalWord ?? level.solutionWord)
  }, [level])

  const loopOk = level ? isValidLoop(state.edges) : false
  const { beatPar, variant } = getVictoryState(level, state.moves)

  const allDates = getAllDates()
  const { dateChip, nextHref } = useLevelPlayLifecycle({
    gameId: 'boucle',
    date: date ?? '',
    idx,
    lastAvailableDate: allDates[allDates.length - 1],
    won,
    moves: state.moves,
  })

  if (!level || !date) {
    return <LevelNotFound backHref="/boucle" />
  }

  return (
    <GameLayout
      title={`Boucle · ${dateChip} · niveau ${idx}`}
      subtitle={`${level.solutionWord.length} lettres à encercler.`}
      backHref={`/boucle?from=${date}`}
      backLabel="Niveaux"
    >
      <GameFrame
        size="lg"
        overlay={
          <VictoryOverlay
            show={won}
            variant={variant}
            title={beatPar ? 'Boucle parfaite !' : 'Boucle complète'}
            detail={
              <>
                <div>
                  Mot encerclé : <span className="font-bold">{level.solutionWord}</span> en{' '}
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
                <WordDefinition word={level.canonicalWord ?? level.solutionWord} />
              </>
            }
            onReset={() => dispatch({ type: 'reset' })}
            backHref={`/boucle?from=${date}`}
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
            if (!won) {
              setSelected(edge)
              dispatch({ type: 'toggle', edge })
            }
          }}
        />
        <PlaySidebar>
          <MovesCard moves={state.moves} parMoves={level.parMoves}>
            <div className="flex flex-col gap-1 text-sm">
              <StatusRow label="Indices ok" value={`${okClues} / ${totalClues}`} ok={cluesOk} />
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
