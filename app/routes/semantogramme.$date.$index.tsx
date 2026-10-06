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
import { Board } from '~/games/semantogramme/Board'
import * as challenges from '~/games/semantogramme/challenges'
import {
  isFullyMarked,
  isGridSolved,
  isThemeGuessCorrect,
  isWon,
  loadLevel,
  reducer,
  type Action,
} from '~/games/semantogramme/engine'
import { ThemeGuessForm } from '~/games/semantogramme/ThemeGuessForm'
import type { Level } from '~/games/semantogramme/types'
import { moveCellCursor, type CellCursor } from '~/lib/cursor'
import { plural } from '~/lib/text'
import { undoable, withUndo, type UndoAction } from '~/lib/undoable'
import { useGameKeyboard } from '~/lib/useGameKeyboard'
import { useHint } from '~/lib/useHint'
import { useLatestRef } from '~/lib/useLatestRef'
import { loadLevelRoute, type LevelParams, type PlayProps } from '~/lib/levelRoute'
import { useLevelPlayLifecycle } from '~/lib/useLevelPlayLifecycle'
import { gamePlayMeta } from '~/lib/seo'
import type { Route } from './+types/semantogramme.$date.$index'

export function meta({ params, loaderData }: Route.MetaArgs) {
  return gamePlayMeta('semantogramme', params.date, params.index, !!loaderData?.level)
}

export function loader({ params }: { params: LevelParams }) {
  return loadLevelRoute(params, challenges)
}

// La saisie du thème n'est pas un coup : seuls les changements de case s'annulent.
const undoableReducer = withUndo(reducer, (action) => action.type === 'cycle')

// Le `key` remonte une partie neuve à chaque changement de niveau : sans lui,
// le `useReducer` garderait l'état du niveau précédent.
export default function SemantogrammePlayRoute({ loaderData }: Route.ComponentProps) {
  const { date, idx, level, lastDate } = loaderData
  if (!level) return <LevelNotFound backHref="/semantogramme" />
  return (
    <SemantogrammePlay
      key={`${date}-${idx}`}
      level={level}
      date={date}
      idx={idx}
      lastDate={lastDate}
    />
  )
}

function SemantogrammePlay({ level, date, idx, lastDate }: PlayProps<Level>) {
  const [history, dispatch] = useReducer(undoableReducer, level, (l) => undoable(loadLevel(l)))
  const state = history.present
  const won = isWon(state)
  const gridSolved = isGridSolved(state)
  const hint = useHint(state.moves, level.parMoves)
  const { title, backHref, goBack, nextHref, variant } = useLevelPlayLifecycle({
    gameId: 'semantogramme',
    date,
    idx,
    lastDate,
    won,
    moves: state.moves,
    parMoves: level.parMoves,
  })

  // Toute action efface le message « Pas tout à fait » de la proposition précédente.
  const [themeError, setThemeError] = useState(false)
  function play(action: Action | UndoAction) {
    dispatch(action)
    setThemeError(false)
  }

  const [selected, setSelected] = useState<CellCursor>({ x: 0, y: 0 })
  const selectedRef = useLatestRef(selected)

  useGameKeyboard({
    onBack: goBack,
    enabled: !won,
    // Le champ du thème garde ses touches (R, Espace, flèches) pour la saisie.
    ignoreInputs: true,
    onDirection: (direction) =>
      setSelected((s) => moveCellCursor(s, direction, level.width, level.height)),
    onAction: () => play({ type: 'cycle', ...selectedRef.current }),
    onUndo: () => play({ type: 'undo' }),
    onReset: () => play({ type: 'reset' }),
  })

  useEffect(() => {
    prefetchDefinition(level.themeWord)
  }, [level])

  return (
    <div className="force-landscape">
      <GameLayout
        title={title}
        subtitle="Identifie les mots liés au thème caché."
        backHref={backHref}
        backLabel="Niveaux"
      >
        <GameFrame
          overlay={
            <VictoryOverlay
              show={won}
              variant={variant}
              title={variant === 'perfect' ? 'Sans faute !' : 'Thème trouvé'}
              detail={
                <>
                  <div>
                    Le thème était <span className="font-bold">« {level.themeWord} »</span>, trouvé
                    en <span className="font-bold">{plural(state.moves, 'coup')}</span>.
                  </div>
                  <ParObjective parMoves={level.parMoves} variant={variant} />
                  <WordDefinition word={level.themeWord} />
                </>
              }
              onReset={() => play({ type: 'reset' })}
              backHref={backHref}
              nextHref={nextHref}
            />
          }
        >
          <Board
            state={state}
            selected={selected}
            onHoverCell={(x, y) => {
              if (!won) setSelected({ x, y })
            }}
            onCellClick={(x, y) => {
              if (won) return
              setSelected({ x, y })
              play({ type: 'cycle', x, y })
            }}
          />
          <PlaySidebar>
            <MovesCard
              moves={state.moves}
              parMoves={level.parMoves}
              hint={
                <HintButton hint={hint} label={level.domains.length > 1 ? 'Domaines' : 'Domaine'}>
                  {level.domains.join(', ')}
                </HintButton>
              }
            />

            <PlayControls
              onUndo={() => play({ type: 'undo' })}
              onReset={() => play({ type: 'reset' })}
              undoDisabled={won || history.past.length === 0}
            />

            <HelpBox>
              Clique (ou flèches + Espace ou Entrée) pour changer l'état d'une case :
              <span className="mx-1 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-amber-950 dark:bg-amber-700/70 dark:text-amber-50">
                Liée au thème
              </span>
              →
              <span className="mx-1 inline-block rounded bg-gray-200 px-1.5 py-0.5 line-through dark:bg-gray-700">
                Hors thème
              </span>
              → non marquée.
            </HelpBox>

            {isFullyMarked(state) && !gridSolved && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                Toutes les cases sont marquées, mais le placement ne correspond pas. Vérifie les
                compteurs.
              </div>
            )}

            {gridSolved && !won && (
              <ThemeGuessForm
                value={state.themeGuess}
                onChange={(value) => play({ type: 'guess', value })}
                onSubmit={() => setThemeError(!isThemeGuessCorrect(state))}
                error={themeError}
              />
            )}
          </PlaySidebar>
        </GameFrame>
      </GameLayout>
    </div>
  )
}
