import { useMemo, useReducer, useState } from 'react'
import { useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { LevelNotFound } from '~/components/LevelNotFound'
import { OutlineButton } from '~/components/OutlineButton'
import { PlaySidebar } from '~/components/PlaySidebar'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { Board } from '~/games/anglemort/Board'
import { getAllDates, getLevel } from '~/games/anglemort/challenges'
import {
  computeVision,
  corridorOrder,
  guardAt,
  isWon,
  loadLevel,
  reducer,
  unseenCells,
} from '~/games/anglemort/engine'
import { PoolTray } from '~/games/anglemort/PoolTray'
import type { Dir, GameState, Pos } from '~/games/anglemort/types'
import { useThiefWalk } from '~/games/anglemort/useThiefWalk'
import { moveCellCursor } from '~/lib/cursor'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useLatestRef } from '~/lib/useLatestRef'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { getVictoryState } from '~/lib/victoryState'

function stepDir([fx, fy]: Pos, [tx, ty]: Pos): Dir {
  if (tx > fx) return 'E'
  if (tx < fx) return 'W'
  return ty > fy ? 'S' : 'N'
}

// Wrapper qui force un remount complet quand l'URL change de niveau.
export default function AngleMortPlayRoute() {
  const { date = '', index = '' } = useParams<{ date: string; index: string }>()
  return <AngleMortPlay key={`${date}-${index}`} />
}

function AngleMortPlay() {
  const { date, index } = useParams<{ date: string; index: string }>()
  const idx = Number(index)
  const level = date && idx ? getLevel(date, idx) : undefined

  const [state, dispatch] = useReducer(reducer, level ?? null, (initialLevel) =>
    initialLevel ? loadLevel(initialLevel) : ({} as GameState),
  )
  const won = level ? isWon(state) : false
  // Le cambrioleur traverse le couloir avant l'annonce de la victoire.
  const corridor = useMemo(
    () =>
      won
        ? corridorOrder(
            unseenCells(state.level, state.guards, computeVision(state.level, state.guards)),
            state.level.door,
          )
        : [],
    [won, state.level, state.guards],
  )
  const walk = useThiefWalk(won, corridor.length)

  const [selected, setSelected] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const selectedRef = useLatestRef(selected)

  useGameKeyboard({
    enabled: !!level && !won,
    onDirection: (direction) => {
      if (!level) return
      setSelected((s) => moveCellCursor(s, direction, level.width, level.height))
    },
    onAction: () => dispatch({ type: 'toggle', ...selectedRef.current }),
    onSecondaryAction: () => dispatch({ type: 'rotate', ...selectedRef.current }),
  })

  const { beatPar, variant } = getVictoryState(level, state.moves)
  const allDates = getAllDates()
  const { dateChip, nextHref } = useLevelPlayLifecycle({
    gameId: 'anglemort',
    date: date ?? '',
    idx,
    lastAvailableDate: allDates[allDates.length - 1],
    won,
    moves: state.moves,
  })

  if (!level || !date) {
    return <LevelNotFound backHref="/anglemort" />
  }

  return (
    <GameLayout
      title={`Angle mort · ${dateChip} · niveau ${idx}`}
      subtitle="Chef de la sécurité corrompu : laisse le champ libre à ton complice."
      backHref={`/anglemort?from=${date}`}
      backLabel="Niveaux"
    >
      <GameFrame
        size="lg"
        overlay={
          <VictoryOverlay
            show={won && walk.done}
            variant={variant}
            title={beatPar ? 'Casse parfait !' : 'Le diamant a disparu'}
            detail={
              <>
                <div>
                  Ton complice a filé avec le diamant sans croiser un seul faisceau, et personne ne
                  soupçonne le chef de la sécurité. Vigiles placés en{' '}
                  <span className="font-bold">
                    {state.moves} pose{state.moves > 1 ? 's' : ''}
                  </span>
                  .
                </div>
                {level.parMoves !== undefined && (
                  <div>
                    Objectif <span className="font-bold">{level.parMoves}</span>{' '}
                    {beatPar ? 'atteint' : 'dépassé'}.
                  </div>
                )}
              </>
            }
            onReset={() => dispatch({ type: 'reset' })}
            backHref={`/anglemort?from=${date}`}
            nextHref={nextHref}
          />
        }
      >
        <Board
          state={state}
          thief={walk.step >= 0 ? corridor[walk.step] : undefined}
          thiefFacing={
            walk.step > 0 ? stepDir(corridor[walk.step - 1], corridor[walk.step]) : undefined
          }
          diamondTaken={walk.step >= 0 && walk.step === corridor.length - 1}
          selected={selected}
          onHoverCell={(x, y) => {
            if (!won) setSelected({ x, y })
          }}
          onCellClick={(x, y) => {
            if (won) return
            setSelected({ x, y })
            dispatch({ type: guardAt(state, x, y) ? 'rotate' : 'toggle', x, y })
          }}
          onCellRemove={(x, y) => {
            if (won) return
            dispatch({ type: 'toggle', x, y })
          }}
        />
        <PlaySidebar>
          <div className="rounded-xl border border-violet-200 bg-white/70 p-3 text-sm dark:border-violet-800 dark:bg-gray-900/60">
            <div className="mb-2 font-semibold text-violet-800 dark:text-violet-200">
              Vigiles à placer
            </div>
            <PoolTray state={state} />
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Poses : {state.moves}
              {level.parMoves !== undefined && ` / objectif ${level.parMoves}`}
            </div>
          </div>

          <HelpBox>
            Place tous les vigiles. Les cases sombres doivent former un seul couloir, sans
            embranchement, de la porte jusqu'au diamant. Un chiffre indique combien de vigiles
            éclairent sa case.
          </HelpBox>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Clic : poser ou pivoter · clic droit : retirer · clavier : flèches, Espace, Entrée
          </p>

          <OutlineButton onClick={() => dispatch({ type: 'reset' })}>Recommencer</OutlineButton>
        </PlaySidebar>
      </GameFrame>
    </GameLayout>
  )
}
