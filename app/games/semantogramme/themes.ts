/**
 * Thèmes pour Sémantogramme : chaque thème a une liste de mots du thème,
 * et un pool de mots « hors thème » est partagé.
 *
 * Pour la v1, les thèmes sont curés à la main. Une étape future pourrait
 * passer à des embeddings sémantiques pour une variété infinie.
 */
export type Theme = {
  id: string
  word: string // mot-thème caché que le joueur doit deviner
  members: readonly string[] // mots liés au thème (peuvent apparaître plusieurs fois dans une grille)
}

export const THEMES: readonly Theme[] = [
  {
    id: 'mer',
    word: 'mer',
    members: [
      'thon', 'saumon', 'dauphin', 'requin', 'vague', 'marin', 'plage',
      'voile', 'phare', 'sable', 'bateau', 'sardine', 'baleine', 'méduse',
      'crabe', 'écaille', 'rivage', 'corail', 'poisson', 'écume',
    ],
  },
  {
    id: 'fruit',
    word: 'fruit',
    members: [
      'pomme', 'fraise', 'cerise', 'kiwi', 'orange', 'banane', 'raisin',
      'prune', 'poire', 'abricot', 'mangue', 'pêche', 'melon', 'citron',
      'ananas', 'mûre', 'figue', 'cassis', 'pastèque', 'framboise',
    ],
  },
  {
    id: 'couleur',
    word: 'couleur',
    members: [
      'rouge', 'bleu', 'vert', 'jaune', 'blanc', 'noir', 'rose', 'violet',
      'gris', 'orange', 'brun', 'beige', 'doré', 'mauve', 'ocre', 'indigo',
      'turquoise', 'argenté',
    ],
  },
  {
    id: 'animal',
    word: 'animal',
    members: [
      'chat', 'chien', 'lion', 'tigre', 'ours', 'loup', 'cheval', 'vache',
      'mouton', 'lapin', 'souris', 'écureuil', 'panda', 'koala', 'zèbre',
      'girafe', 'renard', 'lynx', 'castor', 'belette',
    ],
  },
  {
    id: 'musique',
    word: 'musique',
    members: [
      'piano', 'violon', 'guitare', 'flûte', 'batterie', 'chant', 'mélodie',
      'rythme', 'note', 'accord', 'gamme', 'harpe', 'trompette', 'orgue',
      'tambour', 'symphonie', 'choeur', 'concerto', 'opéra', 'jazz',
    ],
  },
  {
    id: 'transport',
    word: 'transport',
    members: [
      'voiture', 'avion', 'train', 'vélo', 'bus', 'métro', 'bateau', 'moto',
      'taxi', 'camion', 'scooter', 'tramway', 'ferry', 'fusée', 'navette',
      'autobus', 'caravane', 'remorque',
    ],
  },
  {
    id: 'corps',
    word: 'corps',
    members: [
      'tête', 'main', 'pied', 'jambe', 'bras', 'doigt', 'oeil', 'bouche',
      'oreille', 'nez', 'coeur', 'dos', 'dent', 'langue', 'ongle', 'peau',
      'joue', 'lèvre', 'épaule', 'genou',
    ],
  },
  {
    id: 'meteo',
    word: 'météo',
    members: [
      'pluie', 'soleil', 'neige', 'vent', 'nuage', 'orage', 'brouillard',
      'glace', 'foudre', 'tempête', 'rosée', 'verglas', 'éclair', 'tonnerre',
      'gel', 'arc-en-ciel',
    ],
  },
  {
    id: 'cuisine',
    word: 'cuisine',
    members: [
      'casserole', 'poêle', 'assiette', 'verre', 'fourchette', 'cuillère',
      'couteau', 'plat', 'four', 'frigo', 'évier', 'tablier', 'spatule',
      'recette', 'épice', 'farine',
    ],
  },
  {
    id: 'sport',
    word: 'sport',
    members: [
      'tennis', 'football', 'basket', 'rugby', 'natation', 'course', 'judo',
      'voile', 'ski', 'golf', 'boxe', 'danse', 'volley', 'gym', 'escalade',
      'cyclisme', 'marathon',
    ],
  },
]

/**
 * Mots « hors thème » génériques. On essaie d'éviter les mots qui appartiennent
 * à un thème de la liste ci-dessus.
 */
export const FILLER_WORDS: readonly string[] = [
  'table', 'chaise', 'livre', 'carnet', 'crayon', 'lampe', 'écran', 'porte',
  'mur', 'sol', 'plafond', 'miroir', 'étagère', 'horloge', 'agenda', 'tasse',
  'plateau', 'marteau', 'tournevis', 'pelle', 'balai', 'brosse', 'peigne',
  'ciseaux', 'règle', 'gomme', 'pince', 'serrure', 'clé', 'vis', 'bureau',
  'rideau', 'tapis', 'coussin', 'panier', 'tabouret', 'panneau', 'cadre',
  'enveloppe', 'timbre', 'maison', 'jardin', 'chemin', 'mémoire', 'prison',
  'étoile', 'savon', 'parfum', 'banquier', 'voisin', 'devoir', 'prière',
  'silence', 'rumeur', 'manuel', 'pierre', 'caillou', 'ombre', 'lueur',
  'racine', 'fusée', 'globe', 'tunnel', 'pétale',
]
