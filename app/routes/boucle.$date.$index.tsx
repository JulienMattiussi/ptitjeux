import { useEffect, useReducer, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { GameFrame } from '~/components/GameFrame'
import { GameLayout } from '~/components/GameLayout'
import { HelpBox } from '~/components/HelpBox'
import { OutlineButton } from '~/components/OutlineButton'
import { PlaySidebar } from '~/components/PlaySidebar'
import { VictoryOverlay } from '~/components/VictoryOverlay'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'
import { Board } from '~/games/boucle/Board'
import { getAllDates, getLevel } from '~/games/boucle/challenges'
import {
  areCluesSatisfied,
  countEdgesAroundCell,
  isValidLoop,
  isWon,
  loadLevel,
  moveEdgeSelection,
  reset,
  toggleEdge,
} from '~/games/boucle/engine'
import type { Edge, GameState } from '~/games/boucle/types'
import { dateLabel, todayString } from '~/lib/dates'
import { writeLevelProgress } from '~/lib/localStorage'
import { levelKey } from '~/lib/useLocalProgress'

type Action = { type: 'toggle'; edge: Edge } | { type: 'reset' }

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`font-semibold ${
          ok
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-amber-600 dark:text-amber-400'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'toggle':
      return toggleEdge(state, action.edge)
    case 'reset':
      return reset(state)
  }
}

// Wrapper qui force un remount complet quand l'URL change de niveau.
export default function BouclePlayRoute() {
  const { date = '', index = '' } = useParams<{ date: string; index: string }>()
  return <BouclePlay key={`${date}-${index}`} />
}

function BouclePlay() {
  const { date, index } = useParams<{ date: string; index: string }>()
  const idx = Number(index)
  const level = date && idx ? getLevel(date, idx) : undefined

  const [state, dispatch] = useReducer(
    reducer,
    level ?? null,
    (initialLevel) => (initialLevel ? loadLevel(initialLevel) : ({} as GameState)),
  )

  const won = level ? isWon(state) : false
  const cluesOk = level ? areCluesSatisfied(state) : false
  const clueEntries = level ? Object.entries(level.clues) : []
  const totalClues = clueEntries.length
  const okClues = level
    ? clueEntries.reduce((acc, [key, target]) => {
        const [cxStr, cyStr] = key.split(',')
        return countEdgesAroundCell(state, Number(cxStr), Number(cyStr)) === target
          ? acc + 1
          : acc
      }, 0)
    : 0

  // Sélection au clavier : flèches déplacent l'arête, Espace toggle.
  const [selected, setSelected] = useState<Edge>({ x: 0, y: 0, orientation: 'horizontal' })
  const selectedRef = useRef(selected)
  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    if (!level || won) return
    function handleKey(event: KeyboardEvent) {
      const w = level!.width
      const h = level!.height
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          setSelected((prev) => moveEdgeSelection(prev, 'up', w, h))
          return
        case 'ArrowDown':
          event.preventDefault()
          setSelected((prev) => moveEdgeSelection(prev, 'down', w, h))
          return
        case 'ArrowLeft':
          event.preventDefault()
          setSelected((prev) => moveEdgeSelection(prev, 'left', w, h))
          return
        case 'ArrowRight':
          event.preventDefault()
          setSelected((prev) => moveEdgeSelection(prev, 'right', w, h))
          return
        case ' ':
        case 'Spacebar':
        case 'Enter':
          event.preventDefault()
          dispatch({ type: 'toggle', edge: selectedRef.current })
          return
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [level, won])

  useEffect(() => {
    if (level) prefetchDefinition(level.canonicalWord ?? level.solutionWord)
  }, [level])

  const loopOk = level ? isValidLoop(state.edges) : false
  const beatPar = !!level && level.parMoves !== undefined && state.moves <= level.parMoves
  const victoryVariant: 'perfect' | 'solved' = beatPar ? 'perfect' : 'solved'
  const nextHref = idx < 4 ? `/boucle/${date}/${idx + 1}` : undefined

  const allDates = getAllDates()
  const isToday = date === todayString(allDates[allDates.length - 1])

  useEffect(() => {
    if (won && date && idx) {
      writeLevelProgress('boucle', levelKey(date, idx), {
        completed: true,
        bestMoves: state.moves,
      })
    }
  }, [won, date, idx, state.moves])

  if (!level || !date) {
    return (
      <GameLayout title="Niveau introuvable" backHref="/boucle">
        <p className="text-gray-600 dark:text-gray-300">
          Ce niveau n'existe pas.{' '}
          <Link to="/boucle" className="underline">
            Retour
          </Link>
          .
        </p>
      </GameLayout>
    )
  }

  return (
    <GameLayout
      title={`Boucle · ${isToday ? 'Défi du jour' : dateLabel(date)} · niveau ${idx}`}
      subtitle={`${level.solutionWord.length} lettres à encercler.`}
      backHref="/boucle"
      backLabel="Niveaux"
    >
      <GameFrame
        size="lg"
        overlay={
          <VictoryOverlay
            show={won}
            variant={victoryVariant}
            title={beatPar ? 'Boucle parfaite !' : 'Boucle complète'}
            detail={
              <>
                <div>
                  Mot encerclé : <span className="font-bold">{level.solutionWord}</span>{' '}
                  en{' '}
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
            backHref="/boucle"
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
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
            <StatusRow
              label="Indices ok"
              value={`${okClues} / ${totalClues}`}
              ok={cluesOk}
            />
            <div className="mt-1">
              <StatusRow label="Boucle" value={loopOk ? 'fermée' : 'ouverte'} ok={loopOk} />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Coups</span>
              <span className="font-semibold">
                {state.moves}
                {level.parMoves !== undefined && (
                  <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                    / {level.parMoves}
                  </span>
                )}
              </span>
            </div>
          </div>

          <OutlineButton onClick={() => dispatch({ type: 'reset' })}>
            Recommencer
          </OutlineButton>

          <HelpBox>
            Clique sur une arête entre deux cases pour l'ajouter à la boucle, ou navigue avec
            les flèches et appuie sur Espace pour la basculer. Les indices te disent combien
            d'arêtes de la boucle entourent chaque case. Quand la boucle est valide, les
            lettres encerclées doivent former le mot.
          </HelpBox>
        </PlaySidebar>
      </GameFrame>
    </GameLayout>
  )
}
