import { useMemo, useReducer, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { LevelNotFound } from '~/components/LevelNotFound'
import { MovesCard } from '~/components/MovesCard'
import { PlayControls } from '~/components/PlayControls'
import { PlaySidebar } from '~/components/PlaySidebar'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { Board } from '~/games/anglemort/Board'
import { getAllDates, getLevel } from '~/games/anglemort/challenges'
import {
  computeVision,
  corridorOrder,
  expectedCorridor,
  guardAt,
  isWon,
  loadLevel,
  reducer,
  remaining,
  unseenCells,
} from '~/games/anglemort/engine'
import { GuardTypePicker, pickableTypes } from '~/games/anglemort/GuardTypePicker'
import { PoolTray } from '~/games/anglemort/PoolTray'
import type { Dir, GameState, GuardType, Pos } from '~/games/anglemort/types'
import { useThiefWalk } from '~/games/anglemort/useThiefWalk'
import { moveCellCursor } from '~/lib/cursor'
import { undoable, withUndo } from '~/lib/undoable'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useLatestRef } from '~/lib/useLatestRef'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { getVictoryState } from '~/lib/victoryState'

const undoableReducer = withUndo(reducer, (action) => action.type !== 'reset')

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
  // Mise au point : `?couloir` dans l'adresse teinte le couloir attendu.
  const [searchParams] = useSearchParams()
  const showCorridor = searchParams.has('couloir')
  const navigate = useNavigate()
  const idx = Number(index)
  const level = date && idx ? getLevel(date, idx) : undefined

  const [history, dispatch] = useReducer(undoableReducer, level ?? null, (initialLevel) =>
    undoable(initialLevel ? loadLevel(initialLevel) : ({} as GameState)),
  )
  const state = history.present
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

  // Type de vigile à poser (sélecteur sous la grille). Quand le type choisi est
  // épuisé, on bascule sur le premier type encore disponible.
  const types = level ? pickableTypes(state) : []
  const [chosenType, setChosenType] = useState<GuardType>(types[0] ?? 'simple')
  const guardType =
    !level || remaining(state, chosenType) > 0
      ? chosenType
      : (types.find((t) => remaining(state, t) > 0) ?? chosenType)
  const guardTypeRef = useLatestRef(guardType)

  useGameKeyboard({
    onBack: () => navigate(`/anglemort?from=${date}`),
    enabled: !!level && !won,
    onDirection: (direction) => {
      if (!level) return
      setSelected((s) => moveCellCursor(s, direction, level.width, level.height))
    },
    onAction: () =>
      dispatch({ type: 'toggle', ...selectedRef.current, guardType: guardTypeRef.current }),
    onSecondaryAction: () => dispatch({ type: 'rotate', ...selectedRef.current }),
    onUndo: () => dispatch({ type: 'undo' }),
    onReset: () => dispatch({ type: 'reset' }),
    onDigit: (digit) => {
      const type = types[digit - 1]
      if (type && remaining(state, type) > 0) setChosenType(type)
    },
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
        <div className="flex flex-col items-center gap-3">
          <Board
            state={state}
            expected={showCorridor && level ? expectedCorridor(level) : undefined}
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
              dispatch(
                guardAt(state, x, y)
                  ? { type: 'rotate', x, y }
                  : { type: 'toggle', x, y, guardType },
              )
            }}
            onCellRemove={(x, y) => {
              if (won) return
              dispatch({ type: 'toggle', x, y })
            }}
          />
          <GuardTypePicker state={state} selected={guardType} onSelect={setChosenType} />
        </div>
        <PlaySidebar>
          <MovesCard label="Poses" moves={state.moves} parMoves={level.parMoves}>
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">Vigiles à placer</div>
            <PoolTray state={state} />
          </MovesCard>

          <PlayControls
            onUndo={() => dispatch({ type: 'undo' })}
            onReset={() => dispatch({ type: 'reset' })}
            undoDisabled={won || history.past.length === 0}
          />

          <HelpBox>
            Place tous les vigiles. Les cases sombres doivent former un seul couloir, sans
            embranchement, de la porte jusqu'au diamant. Un chiffre indique combien de vigiles
            éclairent sa case.
          </HelpBox>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Clic : poser ou pivoter · clic droit : retirer · clavier : flèches, Espace, Entrée
            {types.length > 1 && ' · 1, 2, 3 : type de vigile'}
          </p>
        </PlaySidebar>
      </GameFrame>
    </GameLayout>
  )
}
