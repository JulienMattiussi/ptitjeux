/**
 * Source unique de vérité pour les styles et conventions par jeu :
 * couleurs d'accent, formules de taille de niveau, helpers spécifiques.
 *
 * Tout composant qui rend des éléments dépendant du jeu (cartes, tuiles,
 * accordéons, boards) doit consommer ces constantes plutôt que de
 * dupliquer les classes CSS.
 */

export type GameId = 'sokomot' | 'boucle' | 'semantogramme'

export const GAME_IDS: readonly GameId[] = ['sokomot', 'boucle', 'semantogramme'] as const

export type GameAccent = {
  /** Gradient pour la barre d'accent en haut des cartes (`bg-linear-to-r ${bar}`). */
  bar: string
  /** Bordure au survol des cartes (`hover:border-...`). */
  ring: string
  /** Couleur de texte d'accent. */
  text: string
  /** Couleur de bordure pour les pastilles de taille (`border-...`). */
  badgeBorder: string
}

export const GAME_ACCENT: Record<GameId, GameAccent> = {
  sokomot: {
    bar: 'from-sky-500 to-indigo-600',
    ring: 'hover:border-sky-400 dark:hover:border-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-500/70 dark:border-sky-400/60',
  },
  boucle: {
    bar: 'from-emerald-500 to-teal-600',
    ring: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-500/70 dark:border-emerald-400/60',
  },
  semantogramme: {
    bar: 'from-amber-500 to-orange-600',
    ring: 'hover:border-amber-400 dark:hover:border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-500/70 dark:border-amber-400/60',
  },
}

/** Calcule la taille de la grille pour un niveau donné dans un jeu donné. */
export const GAME_SIZE: Record<GameId, (index: number) => { width: number; height: number }> = {
  sokomot: (i) => ({ width: 6 + i, height: 5 + i }),
  boucle: (i) => ({ width: 3 + i, height: 3 + i }),
  semantogramme: (i) => ({ width: 3 + i, height: 3 + i }),
}

/**
 * Renvoie `true` si ce niveau utilise la mécanique de glace (Sokomot
 * uniquement, niveaux 2 et 4).
 */
export function isIceLevel(gameId: GameId, index: number): boolean {
  return gameId === 'sokomot' && (index === 2 || index === 4)
}
