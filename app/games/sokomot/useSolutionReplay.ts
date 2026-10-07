import { useEffect, useMemo, useState } from 'react'
import { applyMove, loadLevel } from './engine'
import type { GameState, Level } from './types'

/** Un peu plus que le glissé d'un bloc (`duration-200`), pour suivre chaque coup. */
const STEP_MS = 350

export type SolutionReplay = {
  /** Plateau après `step` coups de la solution. */
  state: GameState
  step: number
  total: number
  playing: boolean
  togglePlay: () => void
  previous: () => void
  next: () => void
  restart: () => void
}

/**
 * Solution d'un jour passé rejouée coup par coup : afficher seulement la grille
 * finale ne dit pas comment déplacer le crayon. Démarre dès que `active` passe
 * à vrai.
 */
export function useSolutionReplay(level: Level, active: boolean): SolutionReplay {
  const states = useMemo(() => {
    const out = [loadLevel(level)]
    for (const direction of level.solution) out.push(applyMove(out[out.length - 1], direction))
    return out
  }, [level])
  const total = level.solution.length
  const [step, setStep] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  // La lecture s'arrête d'elle-même au dernier coup.
  const playing = autoplay && step < total
  // Chaque ouverture de la solution la rejoue depuis le début.
  const [wasActive, setWasActive] = useState(active)
  if (active !== wasActive) {
    setWasActive(active)
    if (active) {
      setStep(0)
      setAutoplay(true)
    }
  }

  useEffect(() => {
    if (!active || !playing) return
    const handle = setTimeout(() => setStep((s) => s + 1), STEP_MS)
    return () => clearTimeout(handle)
  }, [active, playing, step])

  return {
    state: states[step],
    step,
    total,
    playing,
    togglePlay: () => {
      if (!playing && step >= total) setStep(0)
      setAutoplay(!playing)
    },
    previous: () => {
      setAutoplay(false)
      setStep((s) => Math.max(0, s - 1))
    },
    next: () => {
      setAutoplay(false)
      setStep((s) => Math.min(total, s + 1))
    },
    restart: () => {
      setStep(0)
      setAutoplay(true)
    },
  }
}
