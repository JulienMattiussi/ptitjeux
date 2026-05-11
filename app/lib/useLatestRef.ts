import { useEffect, useRef, type RefObject } from 'react'

/**
 * Renvoie une `ref` toujours synchronisée avec la dernière valeur de `value`.
 * Utile pour qu'un listener clavier (re-créé une seule fois) puisse lire la
 * sélection courante sans devoir s'abonner à toutes ses mises à jour.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}
