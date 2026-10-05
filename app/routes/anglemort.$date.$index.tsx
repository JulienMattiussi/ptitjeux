import { useMemo, useReducer, useState } from 'react'
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
import { Board } from '~/games/anglemort/Board'
import { getLevel } from '~/games/anglemort/challenges'
import {
  computeVision,
  corridorOrder,
  expectedCorridor,
  guardAt,
  isWon,
  loadLevel,
  pickableTypes,
  reducer,
  remaining,
  stepDir,
  unseenCells,
} from '~/games/anglemort/engine'
import { GuardTypePicker } from '~/games/anglemort/GuardTypePicker'
import { MirrorHelp } from '~/games/anglemort/MirrorHelp'
import { PoolTray } from '~/games/anglemort/PoolTray'
import type { GuardType, Level } from '~/games/anglemort/types'
import { useThiefWalk } from '~/games/anglemort/useThiefWalk'
import { moveCellCursor, type CellCursor } from '~/lib/cursor'
import { plural } from '~/lib/text'
import { undoable, withUndo } from '~/lib/undoable'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useHint } from '~/lib/useHint'
import { useLatestRef } from '~/lib/useLatestRef'
import { useLevelParams, useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { gamePlayMeta } from '~/lib/seo'
import type { Route } from './+types/anglemort.$date.$index'

export function meta({ params }: Route.MetaArgs) {
  return gamePlayMeta('anglemort', params.date, params.index)
}

const undoableReducer = withUndo(reducer, (action) => action.type !== 'reset')

// Le `key` remonte une partie neuve à chaque changement de niveau.
export default function AngleMortPlayRoute() {
  const { date, idx, level } = useLevelParams(getLevel)
  if (!level) return <LevelNotFound backHref="/anglemort" />
  return <AngleMortPlay key={`${date}-${idx}`} level={level} date={date} idx={idx} />
}

function AngleMortPlay({ level, date, idx }: { level: Level; date: string; idx: number }) {
  const [history, dispatch] = useReducer(undoableReducer, level, (l) => undoable(loadLevel(l)))
  const state = history.present
  const won = isWon(state)
  const hint = useHint(state.moves, level.parMoves)
  const { title, backHref, goBack, nextHref, variant } = useLevelPlayLifecycle({
    gameId: 'anglemort',
    date,
    idx,
    won,
    moves: state.moves,
    parMoves: level.parMoves,
  })

  // Le cambrioleur traverse le couloir avant l'annonce de la victoire.
  const corridor = useMemo(
    () =>
      won
        ? corridorOrder(
            unseenCells(level, state.guards, computeVision(level, state.guards)),
            level.door,
          )
        : [],
    [won, level, state.guards],
  )
  const walk = useThiefWalk(won, corridor.length)

  const [selected, setSelected] = useState<CellCursor>({ x: 0, y: 0 })
  const selectedRef = useLatestRef(selected)

  // Type de vigile à poser (sélecteur sous la grille). Quand le type choisi est
  // épuisé, on bascule sur le premier type encore disponible.
  const types = pickableTypes(state)
  const [chosenType, setChosenType] = useState<GuardType>(types[0] ?? 'simple')
  const guardType =
    remaining(state, chosenType) > 0
      ? chosenType
      : (types.find((t) => remaining(state, t) > 0) ?? chosenType)
  const guardTypeRef = useLatestRef(guardType)

  useGameKeyboard({
    onBack: goBack,
    enabled: !won,
    onDirection: (direction) =>
      setSelected((s) => moveCellCursor(s, direction, level.width, level.height)),
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

  return (
    <GameLayout
      title={title}
      subtitle="Chef de la sécurité corrompu : laisse le champ libre à ton complice."
      backHref={backHref}
      backLabel="Niveaux"
    >
      <GameFrame
        overlay={
          <VictoryOverlay
            show={won && walk.done}
            variant={variant}
            title={variant === 'perfect' ? 'Casse parfait !' : 'Le diamant a disparu'}
            detail={
              <>
                <div>
                  Ton complice a filé avec le diamant sans croiser un seul faisceau, et personne ne
                  soupçonne le chef de la sécurité. Vigiles placés en{' '}
                  <span className="font-bold">{plural(state.moves, 'pose')}</span>.
                </div>
                <ParObjective parMoves={level.parMoves} variant={variant} />
              </>
            }
            onReset={() => dispatch({ type: 'reset' })}
            backHref={backHref}
            nextHref={nextHref}
          />
        }
      >
        <div className="flex flex-col items-center gap-3">
          <Board
            state={state}
            expected={hint.revealed ? expectedCorridor(level) : undefined}
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
              if (!won) dispatch({ type: 'toggle', x, y })
            }}
          />
          <GuardTypePicker state={state} selected={guardType} onSelect={setChosenType} />
        </div>
        <PlaySidebar>
          <MovesCard
            label="Poses"
            moves={state.moves}
            parMoves={level.parMoves}
            hint={<HintButton hint={hint} label="Le couloir est teinté en rose sur la grille." />}
          >
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
            {level.mirrors.length > 0 && <MirrorHelp />}
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
