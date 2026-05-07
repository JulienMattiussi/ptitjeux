export type GameDescriptor = {
  id: string
  name: string
  tagline: string
  description: string
  href: string
  accentClass: string
}

export const games: GameDescriptor[] = [
  {
    id: 'sokomot',
    name: 'Sokomot',
    tagline: 'Pousse les lettres, forme le mot.',
    description:
      "Un Sokoban où chaque caisse porte une lettre. Aligne-les dans la zone cible pour épeler le mot du niveau. Certains niveaux ajoutent de la glace : tout glisse jusqu'au prochain obstacle.",
    href: '/sokomot',
    accentClass: 'from-sky-500 to-indigo-600',
  },
  {
    id: 'boucle',
    name: 'Boucle',
    tagline: 'Encercle le mot caché.',
    description:
      "Trace une seule boucle fermée sur une grille de lettres. Les indices numériques fonctionnent comme un Slitherlink. Les lettres encerclées forment le mot du jour.",
    href: '/boucle',
    accentClass: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'semantogramme',
    name: 'Sémantogramme',
    tagline: 'Découvre le thème par recoupement.',
    description:
      "Une grille de mots. Les chiffres en marge indiquent combien de mots de chaque ligne et colonne sont liés à un thème caché. Identifie-les tous, puis devine le thème.",
    href: '/semantogramme',
    accentClass: 'from-amber-500 to-orange-600',
  },
]

export function findGame(id: string): GameDescriptor | undefined {
  return games.find((g) => g.id === id)
}
