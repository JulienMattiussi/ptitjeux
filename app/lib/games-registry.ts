import { GAME_ACCENT, type GameId } from './game-styles'

export type GameDescriptor = {
  id: GameId
  name: string
  tagline: string
  description: string
  /** Règles détaillées, affichées sur la page du jeu (texte indexé par les moteurs). */
  howToPlay: string
  /** Type de casse-tête, pour l'« À propos » de l'accueil et les données structurées. */
  genre: string
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
      'Trace une seule boucle fermée sur une grille de lettres. Les lettres encerclées forment le mot caché.',
    howToPlay:
      "Boucle est un casse-tête de type Slitherlink, avec un mot caché en prime. Trace une seule boucle fermée en reliant les arêtes de la grille, sans croisement ni embranchement. Le chiffre d'une case indique combien de ses côtés appartiennent à la boucle. Une fois la boucle complète, les lettres qu'elle encercle forment le mot caché.",
    genre: 'un Slitherlink à mot caché',
    href: '/boucle',
    accentClass: GAME_ACCENT.boucle.bar,
  },
  {
    id: 'anglemort',
    name: 'Angle mort',
    tagline: 'Laisse le champ libre au cambrioleur.',
    description:
      "Tu es le chef de la sécurité, et tu es corrompu. Place tes vigiles pour que tout semble surveillé, en laissant à ton complice un unique couloir jusqu'au diamant.",
    howToPlay:
      "Tu es le chef de la sécurité d'un musée, et tu es corrompu. Place tous tes vigiles : le musée doit sembler entièrement surveillé, tout en laissant à ton complice un seul couloir dans l'ombre, de la porte jusqu'au diamant. Un chiffre indique combien de vigiles doivent éclairer sa case.",
    genre: 'un puzzle de surveillance',
    href: '/anglemort',
    accentClass: GAME_ACCENT.anglemort.bar,
  },
  {
    id: 'semantogramme',
    name: 'Sémantogramme',
    tagline: 'Découvre le thème par recoupement.',
    description:
      'Une grille de mots. Les chiffres en marge indiquent combien de mots sont liés au thème caché. Identifie-les tous, puis devine le thème.',
    howToPlay:
      'Sémantogramme est un jeu de mots et de déduction. Chaque case de la grille contient un mot, et les chiffres en marge indiquent combien de mots de la ligne ou de la colonne sont liés à un thème caché. Recoupe les indices pour marquer les mots liés au thème, puis devine le thème.',
    genre: "un jeu de déduction autour d'un thème caché",
    href: '/semantogramme',
    accentClass: GAME_ACCENT.semantogramme.bar,
  },
  {
    id: 'sokomot',
    name: 'Sokomot',
    tagline: 'Pousse les lettres, forme le mot.',
    description:
      'Un Sokoban où chaque caisse porte une lettre. Aligne-les dans la zone cible pour épeler le mot caché.',
    howToPlay:
      "Sokomot est un Sokoban de lettres. Déplace-toi dans l'entrepôt et pousse les caisses, chacune marquée d'une lettre, jusqu'aux cases cibles en pointillés pour épeler le mot caché. Attention : une caisse poussée dans un coin n'en ressort plus.",
    genre: 'un Sokoban de lettres',
    href: '/sokomot',
    accentClass: GAME_ACCENT.sokomot.bar,
  },
]

/** Rappel commun aux pages de jeu, sous les règles. */
export const DAILY_PITCH =
  'Un nouveau défi chaque jour à minuit : 4 niveaux de taille croissante. Gratuit, sans compte et sans publicité.'

export function findGame(id: GameId): GameDescriptor {
  const game = games.find((g) => g.id === id)
  if (!game) throw new Error(`Jeu absent du catalogue : ${id}`)
  return game
}
