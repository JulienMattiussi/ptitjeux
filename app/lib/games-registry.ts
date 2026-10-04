import { GAME_ACCENT, type GameId } from './game-styles'

export type GameDescriptor = {
  id: GameId
  name: string
  tagline: string
  description: string
  href: string
  /** Classes Tailwind du gradient d'accent (ex. `from-sky-500 to-indigo-600`). */
  accentClass: string
}

export const games: GameDescriptor[] = [
  {
    id: 'boucle',
    name: 'Boucle',
    tagline: 'Encercle le mot caché.',
    description:
      'Trace une seule boucle fermée sur une grille de lettres. Les lettres encerclées forment le mot du jour.',
    href: '/boucle',
    accentClass: GAME_ACCENT.boucle.bar,
  },
  {
    id: 'anglemort',
    name: 'Angle mort',
    tagline: 'Laisse le champ libre au cambrioleur.',
    description:
      "Tu es le chef de la sécurité, et tu es corrompu. Place tes vigiles pour que tout semble surveillé, en laissant à ton complice un unique couloir jusqu'au diamant.",
    href: '/anglemort',
    accentClass: GAME_ACCENT.anglemort.bar,
  },
  {
    id: 'sokomot',
    name: 'Sokomot',
    tagline: 'Pousse les lettres, forme le mot.',
    description:
      'Un Sokoban où chaque caisse porte une lettre. Aligne-les dans la zone cible pour épeler le mot du niveau.',
    href: '/sokomot',
    accentClass: GAME_ACCENT.sokomot.bar,
  },
  {
    id: 'semantogramme',
    name: 'Sémantogramme',
    tagline: 'Découvre le thème par recoupement.',
    description:
      'Une grille de mots. Les chiffres en marge indiquent combien de mots sont liés au thème caché. Identifie-les tous, puis devine le thème.',
    href: '/semantogramme',
    accentClass: GAME_ACCENT.semantogramme.bar,
  },
]

export function findGame(id: string): GameDescriptor | undefined {
  return games.find((g) => g.id === id)
}
