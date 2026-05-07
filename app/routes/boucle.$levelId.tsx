import { useEffect, useReducer } from 'react'
import { Link, useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { Board } from '~/games/boucle/Board'
import {
  areCluesSatisfied,
  isValidLoop,
  isWon,
  loadLevel,
  reset,
  toggleEdge,
} from '~/games/boucle/engine'
import { findLevel } from '~/games/boucle/levels'
import type { Edge, GameState } from '~/games/boucle/types'
import { writeLevelProgress } from '~/lib/localStorage'

type Action = { type: 'toggle'; edge: Edge } | { type: 'reset' }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'toggle':
      return toggleEdge(state, action.edge)
    case 'reset':
      return reset(state)
  }
}

export default function BouclePlay() {
  const { levelId } = useParams<{ levelId: string }>()
  const level = levelId ? findLevel(levelId) : undefined

  const [state, dispatch] = useReducer(
    reducer,
    level ?? null,
    (initialLevel) => (initialLevel ? loadLevel(initialLevel) : ({} as GameState)),
  )

  const won = level ? isWon(state) : false
  const cluesOk = level ? areCluesSatisfied(state) : false
  const loopOk = level ? isValidLoop(state.edges) : false

  useEffect(() => {
    if (won && level) {
      writeLevelProgress('boucle', level.id, { completed: true })
    }
  }, [won, level])

  if (!level) {
    return (
      <GameLayout title="Niveau introuvable" backHref="/boucle">
        <p className="text-gray-600 dark:text-gray-300">
          Ce niveau n'existe pas.{' '}
          <Link to="/boucle" className="underline">
            Retour à la liste
          </Link>
          .
        </p>
      </GameLayout>
    )
  }

  return (
    <GameLayout
      title={`Boucle · ${level.name}`}
      subtitle={`${level.solutionWord.length} lettres à encercler.`}
      backHref="/boucle"
      backLabel="Niveaux"
    >
      <GameFrame
        size="lg"
        overlay={
          <VictoryOverlay
            show={won}
            title="Boucle complète !"
            detail={
              <>
                Mot encerclé :{' '}
                <span className="font-bold">{level.solutionWord}</span>.
              </>
            }
            onReset={() => dispatch({ type: 'reset' })}
            backHref="/boucle"
          />
        }
      >
        <Board
          state={state}
          onToggleEdge={(edge) => {
            if (!won) dispatch({ type: 'toggle', edge })
          }}
        />
        <aside className="flex w-full max-w-xs flex-col gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Indices</span>
              <span
                className={`font-semibold ${
                  cluesOk
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {cluesOk ? 'OK' : 'à vérifier'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Boucle</span>
              <span
                className={`font-semibold ${
                  loopOk
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {loopOk ? 'fermée' : 'ouverte'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dispatch({ type: 'reset' })}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Recommencer
          </button>

          <div className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Clique sur une arête entre deux cases pour l'ajouter à la boucle. Les indices
            t'aident comme dans Slitherlink : ils indiquent combien d'arêtes de la boucle
            entourent la case. La boucle doit être unique et fermée. Quand elle est valide,
            les lettres encerclées (lues dans l'ordre normal) doivent former le mot.
          </div>
        </aside>
      </GameFrame>
    </GameLayout>
  )
}
