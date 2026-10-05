import { useEffect, useState } from 'react'

export type ThiefWalk = {
  /** Index de la case du couloir où se trouve le cambrioleur, -1 s'il n'est pas entré. */
  step: number
  /** Vrai une fois le diamant atteint (et la courte pause qui suit écoulée). */
  done: boolean
}

const IDLE: ThiefWalk = { step: -1, done: false }

/** Durée d'un pas du cambrioleur, partagée avec la transition CSS de son sprite. */
export const THIEF_STEP_MS = 140

/**
 * Fait avancer le cambrioleur d'une case toutes les `stepMs` millisecondes dès
 * que `active` passe à vrai. Un pas supplémentaire après la dernière case sert
 * de pause avant d'annoncer la fin, pour laisser voir le diamant ramassé.
 */
export function useThiefWalk(active: boolean, length: number, stepMs = THIEF_STEP_MS): ThiefWalk {
  const [walk, setWalk] = useState<ThiefWalk>(IDLE)

  useEffect(() => {
    if (!active || length === 0) return
    let step = -1
    const id = setInterval(() => {
      step++
      if (step < length) {
        setWalk({ step, done: false })
      } else {
        clearInterval(id)
        setWalk({ step: length - 1, done: true })
      }
    }, stepMs)
    return () => {
      clearInterval(id)
      setWalk(IDLE)
    }
  }, [active, length, stepMs])

  return active ? walk : IDLE
}
