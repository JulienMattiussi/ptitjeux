import { useEffect, useState } from 'react'
import type { GameId } from './game-styles'
import { readGameProgress, STORAGE_KEY, type GameProgress } from './localStorage'

/**
 * Hook SSR-safe qui lit la progression locale d'un jeu et se met à jour
 * lorsque la valeur change dans `localStorage` (y compris via d'autres onglets).
 */
export function useLocalProgress(gameId: GameId): GameProgress {
  const [progress, setProgress] = useState<GameProgress>({})

  useEffect(() => {
    // Sans risque à l'hydratation : état vide au rendu serveur et au premier
    // rendu, lecture après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(readGameProgress(gameId))
    function handler(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setProgress(readGameProgress(gameId))
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [gameId])

  return progress
}
