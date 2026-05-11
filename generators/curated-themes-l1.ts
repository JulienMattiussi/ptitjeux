/**
 * Thèmes curés à la main pour Sémantogramme niveau 1, mappés à des dates
 * spécifiques. Lorsqu'un thème curé existe pour une date, le générateur
 * sémantogramme l'utilise au lieu de tirer un thème au hasard.
 *
 * Voir `docs/semantogramme-curation.md` pour la documentation complète
 * (règles, validation, processus d'ajout).
 *
 * Couverture : 1er avril 2026 → 31 janvier 2027 (305 puzzles).
 *
 * Règle clé pour l'audit cross-thèmes : si un mot appartient
 * sémantiquement à plusieurs thèmes (ex. `acteur` = cinéma ET métier),
 * il doit être listé dans **chaque** thème concerné, sinon il sortira en
 * filler dans l'un d'eux et rendra le puzzle insoluble.
 */
export type CuratedTheme = {
  word: string
  /**
   * Liste **exhaustive** des mots qui appartiennent sémantiquement au thème.
   * Doit contenir TOUS les mots qu'un joueur classerait IN — y compris ceux
   * qui sont aussi membres d'un autre thème.
   */
  members: readonly string[]
}

export const CURATED_THEMES_L1: Record<string, CuratedTheme> = {
  // ===== Avril 2026 =====
  '2026-04-01': { word: 'fleur', members: ['rose', 'tulipe', 'lys', 'marguerite', 'jonquille', 'pivoine', 'orchidée', 'violette', 'iris', 'mimosa', 'jasmin', 'dahlia'] },
  '2026-04-02': { word: 'arbre', members: ['chêne', 'hêtre', 'sapin', 'érable', 'peuplier', 'bouleau', 'frêne', 'saule', 'tilleul', 'marronnier', 'cèdre', 'châtaignier'] },
  '2026-04-03': { word: 'métier', members: ['boulanger', 'médecin', 'peintre', 'pompier', 'juge', 'plombier', 'électricien', 'ingénieur', 'infirmier', 'dentiste', 'mécanicien', 'comédien', 'acteur', 'réalisateur', 'fermier', 'instituteur', 'banquier'] },
  '2026-04-04': { word: 'vêtement', members: ['chemise', 'pantalon', 'manteau', 'robe', 'jupe', 'pull', 'veste', 'gants', 'écharpe', 'chaussette', 'ceinture', 'casquette'] },
  '2026-04-05': { word: 'boisson', members: ['eau', 'vin', 'bière', 'café', 'thé', 'jus', 'lait', 'soda', 'limonade', 'sirop', 'cidre', 'tisane'] },
  '2026-04-06': { word: 'émotion', members: ['joie', 'peur', 'colère', 'tristesse', 'surprise', 'dégoût', 'amour', 'haine', 'espoir', 'ennui', 'fierté', 'honte'] },
  '2026-04-07': { word: 'outil', members: ['marteau', 'scie', 'tournevis', 'perceuse', 'pince', 'ciseaux', 'mètre', 'écrou', 'rabot', 'agrafeuse', 'visseuse', 'tenaille'] },
  '2026-04-08': { word: 'fromage', members: ['camembert', 'brie', 'roquefort', 'gruyère', 'comté', 'reblochon', 'cantal', 'gouda', 'emmental', 'munster', 'parmesan', 'tomme'] },
  '2026-04-09': { word: 'ferme', members: ['vache', 'cochon', 'poule', 'canard', 'mouton', 'tracteur', 'grange', 'étable', 'foin', 'fermier', 'paille', 'ruche'] },
  '2026-04-10': { word: 'école', members: ['élève', 'classe', 'cahier', 'stylo', 'devoir', 'leçon', 'tableau', 'craie', 'récréation', 'cantine', 'cartable', 'instituteur'] },
  '2026-04-11': { word: 'ville', members: ['rue', 'place', 'avenue', 'immeuble', 'métro', 'banque', 'parking', 'trottoir', 'lampadaire', 'magasin', 'mairie', 'boulevard'] },
  '2026-04-12': { word: 'cinéma', members: ['acteur', 'scénario', 'écran', 'salle', 'caméra', 'réalisateur', 'scène', 'film', 'séance', 'ticket', 'projection', 'festival', 'comédien'] },

  // === Nature physique ===
  '2026-04-13': { word: 'montagne', members: ['sommet', 'pic', 'col', 'crête', 'pente', 'versant', 'falaise', 'sentier', 'refuge', 'glacier', 'altitude', 'rocher'] },
  '2026-04-14': { word: 'forêt', members: ['arbre', 'feuille', 'mousse', 'fougère', 'sentier', 'clairière', 'gibier', 'écureuil', 'champignon', 'lichen', 'ronce', 'taillis'] },
  '2026-04-15': { word: 'rivière', members: ['source', 'courant', 'rive', 'berge', 'cascade', 'méandre', 'truite', 'gué', 'pont', 'barrage', 'écluse', 'embouchure'] },
  '2026-04-16': { word: 'mer', members: ['vague', 'marée', 'plage', 'sable', 'voilier', 'phare', 'mouette', 'algue', 'corail', 'écume', 'crique', 'récif'] },
  '2026-04-17': { word: 'lac', members: ['rive', 'berge', 'roseau', 'nénuphar', 'barque', 'pêcheur', 'truite', 'carpe', 'ponton', 'profondeur', 'canoë', 'kayak'] },
  '2026-04-18': { word: 'désert', members: ['sable', 'dune', 'oasis', 'caravane', 'chameau', 'mirage', 'soif', 'rocaille', 'scorpion', 'palmier', 'dromadaire', 'aridité'] },
  '2026-04-19': { word: 'volcan', members: ['lave', 'cratère', 'éruption', 'magma', 'cendre', 'fumée', 'soufre', 'panache', 'caldeira', 'séisme', 'roche', 'tremblement'] },
  '2026-04-20': { word: 'île', members: ['plage', 'lagon', 'récif', 'palmier', 'cocotier', 'corail', 'sable', 'rivage', 'pirogue', 'mouette', 'crique', 'atoll'] },
  '2026-04-21': { word: 'plage', members: ['sable', 'vague', 'parasol', 'transat', 'serviette', 'coquillage', 'crabe', 'maillot', 'bronzage', 'mouette', 'galet', 'palmier'] },
  '2026-04-22': { word: 'grotte', members: ['stalactite', 'stalagmite', 'galerie', 'écho', 'silex', 'humide', 'rocher', 'spéléologie', 'sombre', 'profondeur', 'caverne', 'roche'] },

  // === Météo et ciel ===
  '2026-04-23': { word: 'pluie', members: ['averse', 'goutte', 'flaque', 'parapluie', 'imperméable', 'nuage', 'tempête', 'orage', 'humidité', 'mousson', 'crachin', 'éclair'] },
  '2026-04-24': { word: 'neige', members: ['flocon', 'givre', 'glace', 'avalanche', 'congère', 'ski', 'luge', 'bonhomme', 'tempête', 'glissade', 'igloo', 'froid'] },
  '2026-04-25': { word: 'vent', members: ['brise', 'rafale', 'bourrasque', 'tornade', 'tempête', 'ouragan', 'cyclone', 'éolienne', 'voile', 'girouette', 'tourbillon', 'souffle'] },
  '2026-04-26': { word: 'soleil', members: ['rayon', 'lumière', 'chaleur', 'aube', 'aurore', 'crépuscule', 'coucher', 'éclipse', 'rayonnement', 'midi', 'astre', 'plein'] },
  '2026-04-27': { word: 'nuage', members: ['cumulus', 'cirrus', 'stratus', 'brouillard', 'brume', 'pluie', 'orage', 'tempête', 'éclair', 'ciel', 'horizon', 'ombre'] },
  '2026-04-28': { word: 'saison', members: ['printemps', 'été', 'automne', 'hiver', 'cycle', 'récolte', 'floraison', 'feuillage', 'gelée', 'mue', 'migration', 'équinoxe'] },
  '2026-04-29': { word: 'printemps', members: ['fleur', 'bourgeon', 'pollen', 'oiseau', 'nid', 'jardin', 'verdure', 'éclosion', 'parfum', 'jonquille', 'pousse', 'germination'] },
  '2026-04-30': { word: 'tempête', members: ['vent', 'pluie', 'éclair', 'tonnerre', 'orage', 'tornade', 'ouragan', 'tourbillon', 'rafale', 'naufrage', 'inondation', 'dégât'] },

  // ===== Mai 2026 =====
  '2026-05-01': { word: 'été', members: ['soleil', 'chaleur', 'plage', 'vacances', 'glace', 'maillot', 'parasol', 'baignade', 'pastèque', 'canicule', 'sandale', 'lézard'] },
  '2026-05-02': { word: 'automne', members: ['feuille', 'champignon', 'châtaigne', 'vendange', 'récolte', 'pluie', 'brume', 'rouille', 'écharpe', 'pomme', 'noix', 'citrouille'] },
  '2026-05-03': { word: 'hiver', members: ['neige', 'glace', 'froid', 'gel', 'flocon', 'pull', 'écharpe', 'manteau', 'feu', 'cheminée', 'patinoire', 'luge'] },

  // === Animaux ===
  '2026-05-04': { word: 'oiseau', members: ['aigle', 'pigeon', 'corbeau', 'moineau', 'hirondelle', 'mésange', 'pinson', 'canari', 'autruche', 'faucon', 'hibou', 'perroquet'] },
  '2026-05-05': { word: 'poisson', members: ['thon', 'saumon', 'sardine', 'truite', 'carpe', 'brochet', 'sole', 'anchois', 'maquereau', 'morue', 'anguille', 'daurade'] },
  '2026-05-06': { word: 'insecte', members: ['abeille', 'papillon', 'fourmi', 'mouche', 'moustique', 'libellule', 'sauterelle', 'coccinelle', 'scarabée', 'guêpe', 'criquet', 'frelon'] },
  '2026-05-07': { word: 'reptile', members: ['serpent', 'lézard', 'crocodile', 'tortue', 'iguane', 'caméléon', 'varan', 'vipère', 'cobra', 'alligator', 'gecko', 'boa'] },
  '2026-05-08': { word: 'mammifère', members: ['chien', 'chat', 'cheval', 'lion', 'tigre', 'ours', 'baleine', 'dauphin', 'éléphant', 'kangourou', 'panda', 'gorille'] },
  '2026-05-09': { word: 'félin', members: ['lion', 'tigre', 'panthère', 'jaguar', 'guépard', 'lynx', 'puma', 'léopard', 'ocelot', 'caracal', 'serval', 'chat'] },
  '2026-05-10': { word: 'rongeur', members: ['souris', 'rat', 'écureuil', 'hamster', 'cobaye', 'lapin', 'castor', 'marmotte', 'campagnol', 'mulot', 'chinchilla', 'gerboise'] },
  '2026-05-11': { word: 'animal', members: ['chien', 'chat', 'cheval', 'vache', 'mouton', 'oiseau', 'poisson', 'serpent', 'lion', 'tigre', 'éléphant', 'singe'] },

  // === Plantes ===
  '2026-05-12': { word: 'fruit', members: ['pomme', 'poire', 'orange', 'banane', 'fraise', 'cerise', 'raisin', 'pêche', 'abricot', 'kiwi', 'mangue', 'ananas'] },
  '2026-05-13': { word: 'légume', members: ['carotte', 'poireau', 'navet', 'oignon', 'tomate', 'salade', 'épinard', 'haricot', 'courgette', 'aubergine', 'radis', 'concombre'] },
  '2026-05-14': { word: 'champignon', members: ['cèpe', 'girolle', 'truffe', 'morille', 'pleurote', 'bolet', 'amanite', 'chanterelle', 'lactaire', 'russule', 'mousseron', 'agaric'] },
  '2026-05-15': { word: 'épice', members: ['poivre', 'cumin', 'curcuma', 'paprika', 'cannelle', 'gingembre', 'safran', 'muscade', 'thym', 'romarin', 'aneth', 'fenouil'] },
  '2026-05-16': { word: 'herbe', members: ['persil', 'basilic', 'menthe', 'ciboulette', 'aneth', 'estragon', 'sauge', 'thym', 'romarin', 'origan', 'laurier', 'coriandre'] },

  // === Nourriture ===
  '2026-05-17': { word: 'pain', members: ['baguette', 'mie', 'croûte', 'levain', 'levure', 'farine', 'boulanger', 'four', 'beurre', 'confiture', 'miette', 'tartine'] },
  '2026-05-18': { word: 'pâtisserie', members: ['gâteau', 'tarte', 'éclair', 'flan', 'macaron', 'religieuse', 'chausson', 'brioche', 'beignet', 'crêpe', 'gaufre', 'meringue'] },
  '2026-05-19': { word: 'dessert', members: ['gâteau', 'tarte', 'glace', 'mousse', 'crème', 'flan', 'compote', 'fondant', 'soufflé', 'sorbet', 'pudding', 'banane'] },
  '2026-05-20': { word: 'bonbon', members: ['caramel', 'sucette', 'guimauve', 'praline', 'nougat', 'réglisse', 'dragée', 'pastille', 'berlingot', 'fruit', 'menthe', 'sucre'] },
  '2026-05-21': { word: 'viande', members: ['boeuf', 'porc', 'veau', 'agneau', 'poulet', 'canard', 'dinde', 'lapin', 'jambon', 'saucisse', 'steak', 'rôti'] },
  '2026-05-22': { word: 'sauce', members: ['ketchup', 'mayonnaise', 'moutarde', 'vinaigrette', 'béarnaise', 'béchamel', 'tomate', 'curry', 'beurre', 'crème', 'soja', 'huile'] },
  '2026-05-23': { word: 'repas', members: ['déjeuner', 'dîner', 'goûter', 'apéritif', 'entrée', 'plat', 'dessert', 'pique-nique', 'brunch', 'collation', 'banquet', 'casse-croûte'] },
  '2026-05-24': { word: 'cuisine', members: ['casserole', 'poêle', 'four', 'frigo', 'évier', 'cuisinier', 'recette', 'tablier', 'spatule', 'plat', 'mijoter', 'rôtir'] },
  '2026-05-25': { word: 'vin', members: ['rouge', 'blanc', 'rosé', 'champagne', 'bordeaux', 'bourgogne', 'beaujolais', 'cabernet', 'tannin', 'cépage', 'cave', 'cuvée'] },

  // === Objets / ustensiles ===
  '2026-05-26': { word: 'meuble', members: ['table', 'chaise', 'lit', 'canapé', 'armoire', 'étagère', 'bureau', 'commode', 'buffet', 'tabouret', 'fauteuil', 'banc'] },
  '2026-05-27': { word: 'vaisselle', members: ['assiette', 'verre', 'bol', 'tasse', 'soucoupe', 'plat', 'saladier', 'carafe', 'théière', 'cafetière', 'pichet', 'service'] },
  '2026-05-28': { word: 'ustensile', members: ['couteau', 'fourchette', 'cuillère', 'louche', 'spatule', 'fouet', 'passoire', 'râpe', 'tire-bouchon', 'pince', 'éplucheur', 'mortier'] },
  '2026-05-29': { word: 'bijou', members: ['bague', 'collier', 'bracelet', 'pendentif', 'broche', 'diadème', 'boucle', 'chaîne', 'médaillon', 'perle', 'diamant', 'rubis'] },
  '2026-05-30': { word: 'jouet', members: ['poupée', 'voiture', 'ballon', 'peluche', 'puzzle', 'cube', 'toupie', 'corde', 'figurine', 'circuit', 'maquette', 'jeu'] },
  '2026-05-31': { word: 'arme', members: ['épée', 'couteau', 'pistolet', 'fusil', 'arc', 'flèche', 'lance', 'hache', 'massue', 'dague', 'sabre', 'bouclier'] },

  // ===== Juin 2026 =====
  '2026-06-01': { word: 'chaussure', members: ['basket', 'mocassin', 'escarpin', 'botte', 'sandale', 'espadrille', 'chausson', 'pantoufle', 'derby', 'richelieu', 'mule', 'bottine'] },
  '2026-06-02': { word: 'chapeau', members: ['casquette', 'béret', 'bonnet', 'feutre', 'panama', 'képi', 'toque', 'sombrero', 'turban', 'capuche', 'visière', 'cloche'] },
  '2026-06-03': { word: 'sac', members: ['cartable', 'sacoche', 'pochette', 'besace', 'valise', 'malle', 'gibecière', 'havresac', 'serviette', 'bourse', 'fourre-tout', 'cabas'] },

  // === Maison / pièces ===
  '2026-06-04': { word: 'maison', members: ['toit', 'mur', 'porte', 'fenêtre', 'cheminée', 'jardin', 'garage', 'cave', 'grenier', 'véranda', 'balcon', 'terrasse'] },
  '2026-06-05': { word: 'chambre', members: ['lit', 'oreiller', 'couette', 'drap', 'matelas', 'armoire', 'commode', 'lampe', 'rideau', 'tapis', 'miroir', 'tiroir'] },
  '2026-06-06': { word: 'salon', members: ['canapé', 'fauteuil', 'table', 'télévision', 'tapis', 'bibliothèque', 'lampe', 'coussin', 'tableau', 'rideau', 'cheminée', 'console'] },
  '2026-06-07': { word: 'jardin', members: ['pelouse', 'haie', 'fleur', 'arbre', 'potager', 'tonnelle', 'barbecue', 'salon', 'arrosoir', 'parterre', 'allée', 'serre'] },

  // === Ville / lieux ===
  '2026-06-08': { word: 'village', members: ['clocher', 'place', 'mairie', 'fontaine', 'lavoir', 'épicerie', 'boulangerie', 'café', 'église', 'rue', 'ruelle', 'pavé'] },
  '2026-06-09': { word: 'parc', members: ['pelouse', 'banc', 'arbre', 'allée', 'fontaine', 'kiosque', 'manège', 'jeu', 'toboggan', 'balançoire', 'sentier', 'massif'] },
  '2026-06-10': { word: 'musée', members: ['tableau', 'sculpture', 'collection', 'exposition', 'galerie', 'guide', 'vitrine', 'vernissage', 'commissaire', 'salle', 'atelier', 'conservateur'] },
  '2026-06-11': { word: 'hôpital', members: ['lit', 'médecin', 'infirmier', 'urgence', 'opération', 'salle', 'patient', 'service', 'soin', 'ambulance', 'pansement', 'perfusion'] },
  '2026-06-12': { word: 'restaurant', members: ['table', 'menu', 'carte', 'serveur', 'cuisinier', 'plat', 'addition', 'pourboire', 'apéritif', 'dessert', 'nappe', 'couvert'] },
  '2026-06-13': { word: 'marché', members: ['étal', 'légume', 'fruit', 'fromage', 'poisson', 'boucher', 'maraîcher', 'panier', 'cabas', 'monnaie', 'balance', 'fleur'] },
  '2026-06-14': { word: 'gare', members: ['train', 'rail', 'quai', 'wagon', 'locomotive', 'horaire', 'billet', 'guichet', 'voyageur', 'aiguillage', 'conducteur', 'voie'] },
  '2026-06-15': { word: 'aéroport', members: ['avion', 'piste', 'tour', 'terminal', 'douane', 'embarquement', 'bagage', 'décollage', 'atterrissage', 'pilote', 'hôtesse', 'passager'] },
  '2026-06-16': { word: 'port', members: ['quai', 'bateau', 'navire', 'voilier', 'cargo', 'phare', 'jetée', 'mouillage', 'ancre', 'amarre', 'marin', 'capitaine'] },
  '2026-06-17': { word: 'église', members: ['nef', 'autel', 'cloche', 'clocher', 'prêtre', 'fidèle', 'messe', 'vitrail', 'orgue', 'cierge', 'bénitier', 'confessionnal'] },
  '2026-06-18': { word: 'château', members: ['tour', 'donjon', 'rempart', 'douve', 'créneau', 'meurtrière', 'cour', 'chapelle', 'roi', 'reine', 'seigneur', 'pont'] },
  '2026-06-19': { word: 'pays', members: ['drapeau', 'nation', 'patrie', 'frontière', 'capitale', 'hymne', 'citoyen', 'peuple', 'état', 'continent', 'langue', 'monnaie'] },

  // === Transport ===
  '2026-06-20': { word: 'voiture', members: ['volant', 'roue', 'moteur', 'frein', 'phare', 'pare-brise', 'siège', 'ceinture', 'pédale', 'capot', 'coffre', 'rétroviseur'] },
  '2026-06-21': { word: 'avion', members: ['aile', 'hélice', 'cabine', 'pilote', 'hôtesse', 'piste', 'décollage', 'atterrissage', 'turbine', 'siège', 'commande', 'altitude'] },
  '2026-06-22': { word: 'bateau', members: ['voile', 'pont', 'cabine', 'mât', 'ancre', 'gouvernail', 'hublot', 'quille', 'rame', 'hélice', 'capitaine', 'matelot'] },
  '2026-06-23': { word: 'vélo', members: ['pédale', 'roue', 'guidon', 'selle', 'frein', 'chaîne', 'cadre', 'pneu', 'sonnette', 'rayon', 'dérailleur', 'casque'] },
  '2026-06-24': { word: 'transport', members: ['voiture', 'avion', 'train', 'bus', 'métro', 'vélo', 'moto', 'bateau', 'camion', 'taxi', 'scooter', 'tramway'] },

  // === Musique ===
  '2026-06-25': { word: 'musique', members: ['note', 'mélodie', 'rythme', 'accord', 'harmonie', 'gamme', 'tempo', 'partition', 'orchestre', 'symphonie', 'concert', 'chanson'] },
  '2026-06-26': { word: 'instrument', members: ['piano', 'violon', 'guitare', 'flûte', 'trompette', 'batterie', 'saxophone', 'harpe', 'clarinette', 'orgue', 'accordéon', 'tambour'] },
  '2026-06-27': { word: 'piano', members: ['touche', 'pédale', 'corde', 'marteau', 'sourdine', 'clavier', 'pupitre', 'octave', 'accord', 'noire', 'blanche', 'concert'] },

  // === Arts ===
  '2026-06-28': { word: 'art', members: ['peinture', 'sculpture', 'dessin', 'photographie', 'gravure', 'aquarelle', 'fresque', 'mosaïque', 'collage', 'tapisserie', 'céramique', 'vitrail'] },
  '2026-06-29': { word: 'peinture', members: ['toile', 'pinceau', 'palette', 'tableau', 'chevalet', 'huile', 'aquarelle', 'gouache', 'acrylique', 'pigment', 'fresque', 'portrait'] },
  '2026-06-30': { word: 'sculpture', members: ['statue', 'buste', 'marbre', 'bronze', 'argile', 'ciseau', 'modelage', 'moule', 'fonte', 'pierre', 'bois', 'plâtre'] },

  // ===== Juillet 2026 =====
  '2026-07-01': { word: 'photographie', members: ['appareil', 'objectif', 'pellicule', 'capteur', 'flash', 'pose', 'cadrage', 'cliché', 'tirage', 'négatif', 'studio', 'reportage'] },
  '2026-07-02': { word: 'danse', members: ['ballet', 'tango', 'valse', 'salsa', 'flamenco', 'jazz', 'classique', 'moderne', 'folklorique', 'chorégraphie', 'pas', 'rythme'] },
  '2026-07-03': { word: 'théâtre', members: ['scène', 'rideau', 'décor', 'costume', 'acteur', 'pièce', 'réplique', 'monologue', 'comédie', 'tragédie', 'public', 'coulisse'] },
  '2026-07-04': { word: 'littérature', members: ['roman', 'poésie', 'nouvelle', 'essai', 'théâtre', 'biographie', 'fable', 'conte', 'épopée', 'récit', 'auteur', 'éditeur'] },

  // === Sciences ===
  '2026-07-05': { word: 'science', members: ['mathématique', 'physique', 'chimie', 'biologie', 'astronomie', 'géologie', 'médecine', 'expérience', 'théorie', 'recherche', 'laboratoire', 'découverte'] },
  '2026-07-06': { word: 'mathématique', members: ['addition', 'soustraction', 'multiplication', 'division', 'équation', 'fonction', 'géométrie', 'algèbre', 'calcul', 'nombre', 'fraction', 'puissance'] },
  '2026-07-07': { word: 'astronomie', members: ['étoile', 'planète', 'galaxie', 'comète', 'astéroïde', 'satellite', 'télescope', 'orbite', 'constellation', 'nébuleuse', 'pulsar', 'éclipse'] },
  '2026-07-08': { word: 'biologie', members: ['cellule', 'noyau', 'gène', 'génome', 'protéine', 'organisme', 'espèce', 'évolution', 'écosystème', 'microbe', 'bactérie', 'virus'] },
  '2026-07-09': { word: 'chimie', members: ['atome', 'molécule', 'élément', 'composé', 'réaction', 'acide', 'base', 'sel', 'cristal', 'solution', 'oxygène', 'hydrogène'] },

  // === Famille ===
  '2026-07-10': { word: 'famille', members: ['mère', 'père', 'frère', 'soeur', 'oncle', 'tante', 'cousin', 'cousine', 'grand-mère', 'grand-père', 'neveu', 'nièce'] },
  '2026-07-11': { word: 'enfance', members: ['jouet', 'école', 'récréation', 'sucette', 'tétine', 'maman', 'papa', 'biberon', 'comptine', 'berceuse', 'crèche', 'bambin'] },

  // === Mental ===
  '2026-07-12': { word: 'pensée', members: ['idée', 'réflexion', 'analyse', 'concept', 'théorie', 'opinion', 'jugement', 'raisonnement', 'logique', 'intuition', 'créativité', 'mémoire'] },
  '2026-07-13': { word: 'rêve', members: ['cauchemar', 'sommeil', 'songe', 'fantasme', 'illusion', 'vision', 'imagination', 'rêverie', 'symbole', 'irréel', 'utopie', 'chimère'] },

  // === Temps ===
  '2026-07-14': { word: 'temps', members: ['heure', 'minute', 'seconde', 'jour', 'semaine', 'mois', 'année', 'siècle', 'horloge', 'montre', 'calendrier', 'agenda'] },

  // === Religion ===
  '2026-07-15': { word: 'religion', members: ['foi', 'dieu', 'prière', 'temple', 'église', 'mosquée', 'synagogue', 'prêtre', 'imam', 'rabbin', 'fidèle', 'cérémonie'] },

  // === Politique / justice ===
  '2026-07-16': { word: 'politique', members: ['élection', 'vote', 'parti', 'candidat', 'député', 'sénateur', 'président', 'ministre', 'parlement', 'gouvernement', 'opposition', 'campagne'] },
  '2026-07-17': { word: 'justice', members: ['juge', 'avocat', 'procureur', 'jury', 'verdict', 'procès', 'tribunal', 'appel', 'sentence', 'plaidoyer', 'témoin', 'accusé'] },

  // === Économie ===
  '2026-07-18': { word: 'argent', members: ['euro', 'dollar', 'billet', 'pièce', 'monnaie', 'salaire', 'épargne', 'dette', 'crédit', 'intérêt', 'inflation', 'budget'] },
  '2026-07-19': { word: 'banque', members: ['compte', 'chèque', 'virement', 'carte', 'crédit', 'prêt', 'guichet', 'banquier', 'épargne', 'dépôt', 'retrait', 'agence'] },

  // === Éducation / livres ===
  '2026-07-20': { word: 'université', members: ['amphi', 'cours', 'professeur', 'étudiant', 'campus', 'bibliothèque', 'thèse', 'mémoire', 'examen', 'diplôme', 'doctorat', 'licence'] },
  '2026-07-21': { word: 'livre', members: ['page', 'chapitre', 'couverture', 'auteur', 'éditeur', 'roman', 'manuel', 'index', 'préface', 'reliure', 'tome', 'volume'] },

  // === Sports ===
  '2026-07-22': { word: 'sport', members: ['football', 'tennis', 'basket', 'rugby', 'natation', 'course', 'cyclisme', 'judo', 'boxe', 'escrime', 'gymnastique', 'volley'] },
  '2026-07-23': { word: 'football', members: ['ballon', 'but', 'gardien', 'attaquant', 'défenseur', 'arbitre', 'corner', 'penalty', 'carton', 'maillot', 'crampon', 'terrain'] },
  '2026-07-24': { word: 'tennis', members: ['raquette', 'balle', 'filet', 'court', 'service', 'revers', 'volée', 'set', 'jeu', 'point', 'lob', 'double'] },
  '2026-07-25': { word: 'natation', members: ['piscine', 'brasse', 'crawl', 'dos', 'papillon', 'plongeon', 'maillot', 'bonnet', 'lunette', 'palme', 'bouée', 'couloir'] },
  '2026-07-26': { word: 'cyclisme', members: ['vélo', 'route', 'étape', 'maillot', 'peloton', 'sprint', 'col', 'descente', 'coureur', 'casque', 'guidon', 'pédalier'] },
  '2026-07-27': { word: 'rugby', members: ['ballon', 'mêlée', 'essai', 'transformation', 'pénalité', 'plaquage', 'arbitre', 'pilier', 'talonneur', 'demi', 'ailier', 'ouvreur'] },

  // === Culture / loisirs ===
  '2026-07-28': { word: 'jeu', members: ['carte', 'dé', 'pion', 'plateau', 'dame', 'échec', 'puzzle', 'tarot', 'belote', 'poker', 'scrabble', 'domino'] },
  '2026-07-29': { word: 'voyage', members: ['valise', 'passeport', 'billet', 'hôtel', 'guide', 'visa', 'aventure', 'circuit', 'excursion', 'tourisme', 'frontière', 'douane'] },
  '2026-07-30': { word: 'vacances', members: ['plage', 'montagne', 'camping', 'séjour', 'pension', 'hôtel', 'détente', 'farniente', 'voyage', 'sortie', 'congé', 'tourisme'] },
  '2026-07-31': { word: 'fête', members: ['anniversaire', 'mariage', 'carnaval', 'bal', 'gâteau', 'cadeau', 'invitation', 'décoration', 'champagne', 'feu', 'guirlande', 'ballon'] },

  // ===== Août 2026 =====
  '2026-08-01': { word: 'mariage', members: ['mariée', 'marié', 'robe', 'alliance', 'bague', 'cérémonie', 'réception', 'témoin', 'cortège', 'bouquet', 'voile', 'demoiselle'] },
  '2026-08-02': { word: 'cadeau', members: ['emballage', 'ruban', 'paquet', 'surprise', 'anniversaire', 'noël', 'bague', 'fleur', 'chocolat', 'parfum', 'jouet', 'carte'] },
  '2026-08-03': { word: 'couleur', members: ['rouge', 'bleu', 'vert', 'jaune', 'noir', 'blanc', 'rose', 'violet', 'orange', 'marron', 'gris', 'brun'] },
  '2026-08-04': { word: 'corps', members: ['tête', 'bras', 'jambe', 'pied', 'main', 'doigt', 'oeil', 'bouche', 'nez', 'oreille', 'dent', 'ongle'] },
  '2026-08-05': { word: 'météo', members: ['soleil', 'pluie', 'neige', 'vent', 'nuage', 'orage', 'brouillard', 'gel', 'foudre', 'tempête', 'verglas', 'rosée'] },

  // === Plantes parties ===
  '2026-08-06': { word: 'feuille', members: ['nervure', 'pétiole', 'limbe', 'caduque', 'persistant', 'verdure', 'chlorophylle', 'arbre', 'palme', 'aiguille', 'frondaison', 'feuillage'] },
  '2026-08-07': { word: 'graine', members: ['semis', 'germination', 'plantule', 'cosse', 'noyau', 'pépin', 'amande', 'gousse', 'sachet', 'semence', 'jardinier', 'potager'] },

  // === Lieux divers ===
  '2026-08-08': { word: 'bibliothèque', members: ['livre', 'étagère', 'roman', 'lecteur', 'silence', 'fauteuil', 'lampe', 'index', 'archive', 'rayonnage', 'bouquin', 'lecture'] },
  '2026-08-09': { word: 'cirque', members: ['clown', 'acrobate', 'trapèze', 'jongleur', 'piste', 'chapiteau', 'dompteur', 'magicien', 'illusion', 'numéro', 'spectacle', 'roulotte'] },
  '2026-08-10': { word: 'zoo', members: ['cage', 'enclos', 'gardien', 'singe', 'lion', 'tigre', 'éléphant', 'girafe', 'panda', 'pingouin', 'serpent', 'reptile'] },

  // === Objets quotidiens ===
  '2026-08-11': { word: 'montre', members: ['aiguille', 'cadran', 'bracelet', 'remontoir', 'chronomètre', 'horloge', 'heure', 'minute', 'seconde', 'pile', 'tic-tac', 'pendule'] },
  '2026-08-12': { word: 'téléphone', members: ['écran', 'écouteur', 'micro', 'sonnerie', 'appel', 'message', 'contact', 'numéro', 'répondeur', 'haut-parleur', 'mobile', 'portable'] },
  '2026-08-13': { word: 'ordinateur', members: ['clavier', 'écran', 'souris', 'processeur', 'disque', 'mémoire', 'logiciel', 'fichier', 'dossier', 'imprimante', 'micro', 'haut-parleur'] },
  '2026-08-14': { word: 'internet', members: ['site', 'page', 'lien', 'navigateur', 'moteur', 'forum', 'message', 'fichier', 'mot', 'serveur', 'débit', 'connexion'] },

  // === Vie / mort ===
  '2026-08-15': { word: 'naissance', members: ['bébé', 'nourrisson', 'sage-femme', 'berceau', 'maternité', 'biberon', 'lait', 'couche', 'tétine', 'baptême', 'parent', 'mère'] },

  // === Géographie ===
  '2026-08-16': { word: 'continent', members: ['hémisphère', 'latitude', 'longitude', 'méridien', 'archipel', 'antarctique', 'pôle', 'équateur', 'tropique', 'frontière', 'territoire', 'région'] },

  // === Nourriture suite ===
  '2026-08-17': { word: 'soupe', members: ['bouillon', 'potage', 'consommé', 'velouté', 'légume', 'crème', 'gaspacho', 'oignon', 'minestrone', 'bisque', 'cocotte', 'louche'] },
  '2026-08-18': { word: 'salade', members: ['laitue', 'tomate', 'concombre', 'radis', 'vinaigre', 'vinaigrette', 'huile', 'thon', 'oeuf', 'olive', 'maïs', 'roquette'] },
  '2026-08-19': { word: 'yaourt', members: ['lactose', 'nature', 'brassé', 'kéfir', 'sucré', 'calcium', 'fermenté', 'cuillère', 'abricot', 'fraise', 'pot', 'dessert'] },

  // OOPS — duplicate of 2026-04-08. Replace.
  '2026-08-20': { word: 'café', members: ['arôme', 'percolateur', 'latte', 'moka', 'arabica', 'expresso', 'grain', 'tasse', 'machine', 'filtre', 'capsule', 'décaféiné'] },
  '2026-08-21': { word: 'thé', members: ['infusion', 'feuille', 'tisane', 'vert', 'noir', 'sachet', 'théière', 'tasse', 'matcha', 'aromatisé', 'cérémonie', 'verveine'] },

  // === Animaux divers ===
  '2026-08-22': { word: 'singe', members: ['gorille', 'chimpanzé', 'orang-outan', 'macaque', 'babouin', 'ouistiti', 'gibbon', 'magot', 'tamarin', 'primate', 'capucin', 'sapajou'] },
  '2026-08-23': { word: 'chien', members: ['labrador', 'caniche', 'berger', 'beagle', 'bouledogue', 'dalmatien', 'colley', 'lévrier', 'épagneul', 'pékinois', 'teckel', 'doberman'] },

  // === Plantes ===
  '2026-08-24': { word: 'rose', members: ['pétale', 'épine', 'tige', 'bouton', 'feuille', 'parfum', 'rouge', 'blanc', 'jaune', 'bouquet', 'roseraie', 'rosier'] },

  // === Bâtiments / Architecture ===
  '2026-08-25': { word: 'monument', members: ['statue', 'arc', 'colonne', 'obélisque', 'fontaine', 'mausolée', 'pyramide', 'temple', 'tour', 'palais', 'cathédrale', 'mémorial'] },
  '2026-08-26': { word: 'pont', members: ['arche', 'pilier', 'tablier', 'parapet', 'culée', 'haubans', 'travée', 'suspendu', 'levant', 'romain', 'piéton', 'viaduc'] },

  // === Genres cinéma ===
  '2026-08-27': { word: 'comédie', members: ['humour', 'gag', 'blague', 'rire', 'farce', 'sketch', 'parodie', 'satire', 'clown', 'caricature', 'plaisanterie', 'pirouette'] },
  '2026-08-28': { word: 'horreur', members: ['monstre', 'fantôme', 'zombie', 'vampire', 'loup-garou', 'sorcière', 'sang', 'cri', 'frayeur', 'effroi', 'angoisse', 'cauchemar'] },

  // === Genres littéraires ===
  '2026-08-29': { word: 'roman', members: ['chapitre', 'personnage', 'intrigue', 'narrateur', 'page', 'auteur', 'lecteur', 'épisode', 'dénouement', 'prologue', 'épilogue', 'préface'] },
  '2026-08-30': { word: 'poésie', members: ['vers', 'rime', 'strophe', 'sonnet', 'ode', 'élégie', 'haïku', 'alexandrin', 'métaphore', 'allitération', 'poète', 'recueil'] },
  '2026-08-31': { word: 'conte', members: ['fée', 'sorcière', 'prince', 'princesse', 'dragon', 'château', 'forêt', 'enchanté', 'légende', 'merveilleux', 'fable', 'morale'] },

  // ===== Septembre 2026 =====
  '2026-09-01': { word: 'magazine', members: ['article', 'reportage', 'photo', 'couverture', 'numéro', 'éditorial', 'rubrique', 'lecteur', 'kiosque', 'abonnement', 'mensuel', 'hebdomadaire'] },
  '2026-09-02': { word: 'journal', members: ['article', 'rubrique', 'reporter', 'rédaction', 'manchette', 'gazette', 'colonne', 'titre', 'kiosque', 'abonnement', 'éditorial', 'parution'] },

  // === Religions/croyances détails ===
  '2026-09-03': { word: 'foi', members: ['croyance', 'religion', 'prière', 'dieu', 'spiritualité', 'conviction', 'mystique', 'pèlerinage', 'sainte', 'miracle', 'culte', 'rite'] },

  // === Mer profondeurs ===
  '2026-09-04': { word: 'requin', members: ['nageoire', 'mâchoire', 'dent', 'museau', 'peau', 'aileron', 'prédateur', 'océan', 'profondeur', 'attaque', 'sang', 'chasse'] },

  // === Animaux marins ===
  '2026-09-05': { word: 'baleine', members: ['nageoire', 'évent', 'fanon', 'queue', 'cétacé', 'mammifère', 'océan', 'chant', 'migration', 'plancton', 'banquise', 'cachalot'] },
  '2026-09-06': { word: 'dauphin', members: ['nageoire', 'évent', 'queue', 'museau', 'cétacé', 'mammifère', 'océan', 'saut', 'intelligence', 'sociable', 'écho', 'groupe'] },
  '2026-09-07': { word: 'crabe', members: ['pince', 'carapace', 'patte', 'antenne', 'crustacé', 'plage', 'mer', 'sable', 'rocher', 'langoustine', 'tourteau', 'araignée'] },

  // === Plantes spécifiques ===
  '2026-09-08': { word: 'feuillage', members: ['feuille', 'branche', 'verdure', 'frondaison', 'ramure', 'ombre', 'automne', 'persistant', 'caduc', 'couronne', 'chlorophylle', 'vert'] },

  // OOPS dup. Replace.
  '2026-09-09': { word: 'cactus', members: ['épine', 'piquant', 'désert', 'aride', 'plante', 'figuier', 'fleur', 'rosette', 'opuntia', 'aloès', 'succulente', 'oasis'] },

  // === Fêtes ===
  '2026-09-10': { word: 'noël', members: ['sapin', 'guirlande', 'cadeau', 'crèche', 'étoile', 'bûche', 'dinde', 'cantique', 'gui', 'houx', 'lutin', 'traîneau'] },
  '2026-09-11': { word: 'anniversaire', members: ['gâteau', 'bougie', 'cadeau', 'invitation', 'fête', 'guirlande', 'âge', 'souhait', 'carte', 'célébration', 'décoration', 'chanson'] },
  '2026-09-12': { word: 'carnaval', members: ['masque', 'déguisement', 'confetti', 'serpentin', 'défilé', 'char', 'samba', 'mardi', 'parade', 'maquillage', 'fanfare', 'fête'] },

  // === Outils ménage ===
  '2026-09-13': { word: 'balai', members: ['manche', 'paille', 'brosse', 'serpillière', 'seau', 'aspirateur', 'poussière', 'ménage', 'sol', 'cendrier', 'nettoyage', 'écouvillon'] },

  // === Objets de bureau ===
  '2026-09-14': { word: 'bureau', members: ['ordinateur', 'crayon', 'agenda', 'lampe', 'classeur', 'dossier', 'téléphone', 'cahier', 'stylo', 'imprimante', 'tampon', 'corbeille'] },

  // === Astres ===
  '2026-09-15': { word: 'planète', members: ['mercure', 'vénus', 'terre', 'mars', 'anneau', 'saturne', 'atmosphère', 'rotation', 'pluton', 'orbite', 'soleil', 'satellite'] },
  '2026-09-16': { word: 'étoile', members: ['constellation', 'galaxie', 'soleil', 'astre', 'nuit', 'ciel', 'scintillement', 'pulsar', 'nova', 'lumière', 'éclat', 'firmament'] },
  '2026-09-17': { word: 'lune', members: ['croissant', 'pleine', 'éclipse', 'marée', 'cratère', 'satellite', 'astre', 'nuit', 'lumière', 'orbite', 'lunaison', 'nouvelle'] },

  // === Métiers spécifiques ===
  '2026-09-18': { word: 'agriculteur', members: ['tracteur', 'champ', 'récolte', 'labour', 'semis', 'moisson', 'élevage', 'ferme', 'vendange', 'grange', 'fermier', 'paysan'] },
  '2026-09-19': { word: 'pêcheur', members: ['canne', 'hameçon', 'filet', 'appât', 'leurre', 'moulinet', 'bateau', 'mer', 'rivière', 'poisson', 'chalut', 'prise'] },

  // === Vêtements détails ===
  '2026-09-20': { word: 'sous-vêtement', members: ['slip', 'culotte', 'soutien-gorge', 'caleçon', 'string', 'boxer', 'maillot', 'tricot', 'jarretière', 'collant', 'bas', 'porte-jarretelles'] },

  // === Lieux nature ===
  '2026-09-21': { word: 'campagne', members: ['champ', 'pré', 'haie', 'chemin', 'ferme', 'village', 'tracteur', 'paysan', 'bétail', 'verger', 'potager', 'rural'] },

  // === Genres musicaux ===
  '2026-09-22': { word: 'jazz', members: ['saxophone', 'trompette', 'piano', 'contrebasse', 'batterie', 'swing', 'blues', 'improvisation', 'cabaret', 'mélodie', 'rythme', 'standard'] },
  '2026-09-23': { word: 'rock', members: ['guitare', 'batterie', 'basse', 'micro', 'concert', 'amplificateur', 'distorsion', 'morceau', 'solo', 'groupe', 'scène', 'chanteur'] },

  // === Sports détails ===
  '2026-09-24': { word: 'ski', members: ['piste', 'station', 'neige', 'remontée', 'téléski', 'téléphérique', 'descente', 'slalom', 'fart', 'bâton', 'casque', 'lunette'] },
  '2026-09-25': { word: 'voile', members: ['mât', 'foc', 'bôme', 'gouvernail', 'régate', 'spinnaker', 'écoute', 'cordage', 'pavillon', 'vague', 'mer', 'marin'] },
  '2026-09-26': { word: 'gymnastique', members: ['barre', 'cheval', 'poutre', 'sol', 'agrès', 'saut', 'vrille', 'roulade', 'figure', 'collant', 'tapis', 'parallèle'] },

  // === Objets divers ===
  '2026-09-27': { word: 'parfum', members: ['flacon', 'senteur', 'lavande', 'rose', 'jasmin', 'musc', 'vanille', 'eau', 'extrait', 'essence', 'vétiver', 'parfumerie'] },
  '2026-09-28': { word: 'maquillage', members: ['rouge', 'mascara', 'fard', 'fond', 'crayon', 'pinceau', 'poudre', 'ombre', 'lèvre', 'cils', 'paupière', 'palette'] },

  // === Loisirs détails ===
  '2026-09-29': { word: 'lecture', members: ['livre', 'roman', 'magazine', 'journal', 'page', 'chapitre', 'liseuse', 'bibliothèque', 'fauteuil', 'lampe', 'silence', 'évasion'] },
  '2026-09-30': { word: 'aventure', members: ['expédition', 'voyage', 'exploration', 'péripétie', 'danger', 'mystère', 'découverte', 'jungle', 'safari', 'cap', 'risque', 'héros'] },

  // ===== Octobre 2026 =====
  '2026-10-01': { word: 'tourisme', members: ['voyage', 'guide', 'hôtel', 'visite', 'monument', 'circuit', 'excursion', 'souvenir', 'plage', 'safari', 'voyageur', 'agence'] },

  // === Espace ===
  '2026-10-02': { word: 'espace', members: ['fusée', 'satellite', 'astronaute', 'orbite', 'galaxie', 'planète', 'étoile', 'navette', 'cosmonaute', 'lancement', 'apesanteur', 'station'] },

  // === Animaux divers ===
  '2026-10-03': { word: 'cheval', members: ['crinière', 'sabot', 'queue', 'galop', 'trot', 'écurie', 'selle', 'bride', 'étalon', 'jument', 'poulain', 'jockey'] },
  '2026-10-04': { word: 'chat', members: ['moustache', 'griffe', 'pelote', 'ronron', 'patte', 'queue', 'gouttière', 'siamois', 'persan', 'angora', 'chaton', 'minou'] },

  // === Fruits exotiques ===
  '2026-10-05': { word: 'baie', members: ['fraise', 'framboise', 'myrtille', 'mûre', 'cassis', 'groseille', 'airelle', 'cerise', 'sureau', 'canneberge', 'argousier', 'sorbier'] },
  '2026-10-06': { word: 'agrume', members: ['orange', 'citron', 'mandarine', 'pamplemousse', 'clémentine', 'kumquat', 'bergamote', 'cédrat', 'lime', 'bigarade', 'pulpe', 'écorce'] },

  // === Outils détails ===
  '2026-10-07': { word: 'clou', members: ['marteau', 'pointe', 'tête', 'tige', 'enfoncer', 'planche', 'menuiserie', 'punaise', 'agrafe', 'rivet', 'vis', 'pression'] },

  // === Cuisine détails ===
  '2026-10-08': { word: 'casserole', members: ['poêle', 'manche', 'couvercle', 'fond', 'inox', 'cocotte', 'sauteuse', 'braisière', 'marmite', 'cuisson', 'feu', 'mijoter'] },
  '2026-10-09': { word: 'couteau', members: ['lame', 'manche', 'tranche', 'pointe', 'cuisine', 'office', 'éplucheur', 'hachoir', 'aiguisoir', 'fourreau', 'aiguiser', 'trancher'] },

  // === Bâtiments ===
  '2026-10-10': { word: 'tour', members: ['guet', 'tourelle', 'donjon', 'horloge', 'minaret', 'beffroi', 'campanile', 'sommet', 'escalier', 'ascenseur', 'observatoire', 'phare'] },

  // === Concepts abstraits ===
  '2026-10-11': { word: 'liberté', members: ['indépendance', 'autonomie', 'libération', 'choix', 'droit', 'évasion', 'fugue', 'envol', 'oiseau', 'ciel', 'délivrance', 'émancipation'] },
  '2026-10-12': { word: 'paix', members: ['calme', 'sérénité', 'tranquillité', 'harmonie', 'amour', 'colombe', 'olivier', 'silence', 'traité', 'cessez-le-feu', 'accord', 'rameau'] },

  // === Plus de fleurs ===
  '2026-10-13': { word: 'tulipe', members: ['bulbe', 'tige', 'pétale', 'rouge', 'jaune', 'hollande', 'jardin', 'printemps', 'bouquet', 'champ', 'parterre', 'rose'] },

  // === Mots de la maison ===
  '2026-10-14': { word: 'lit', members: ['oreiller', 'couette', 'drap', 'matelas', 'sommier', 'baldaquin', 'couverture', 'taie', 'traversin', 'édredon', 'parure', 'plumeau'] },
  '2026-10-15': { word: 'lampe', members: ['ampoule', 'abat-jour', 'pied', 'interrupteur', 'lumière', 'lustre', 'applique', 'halogène', 'lampadaire', 'veilleuse', 'lanterne', 'bougie'] },

  // === Plus de transports ===
  '2026-10-16': { word: 'train', members: ['rail', 'wagon', 'locomotive', 'compartiment', 'voyageur', 'quai', 'tunnel', 'aiguillage', 'sifflet', 'contrôleur', 'banquette', 'fret'] },
  '2026-10-17': { word: 'moto', members: ['guidon', 'roue', 'moteur', 'casque', 'pot', 'selle', 'phare', 'cuir', 'vitesse', 'frein', 'embrayage', 'gants'] },

  // === Outils suite ===
  '2026-10-18': { word: 'scie', members: ['lame', 'denture', 'manche', 'sciage', 'menuisier', 'bois', 'planche', 'sciure', 'égoïne', 'tronçonneuse', 'circulaire', 'sauteuse'] },

  // === Plus de pâtisseries ===
  '2026-10-19': { word: 'gâteau', members: ['génoise', 'crème', 'glaçage', 'mousse', 'biscuit', 'fondant', 'opéra', 'praliné', 'fraisier', 'moka', 'roulé', 'quatre-quarts'] },

  // === Animaux suite ===
  '2026-10-20': { word: 'lion', members: ['crinière', 'rugissement', 'savane', 'lionceau', 'lionne', 'griffe', 'crocs', 'prédateur', 'fauve', 'féroce', 'jungle', 'roi'] },
  '2026-10-21': { word: 'éléphant', members: ['trompe', 'défense', 'ivoire', 'oreille', 'troupeau', 'savane', 'safari', 'pachyderme', 'mammouth', 'gris', 'massif', 'mémoire'] },

  // === Plus de villes/lieux ===
  '2026-10-22': { word: 'rue', members: ['trottoir', 'lampadaire', 'pavé', 'caniveau', 'panneau', 'feu', 'passage', 'avenue', 'boulevard', 'ruelle', 'impasse', 'voie'] },
  '2026-10-23': { word: 'boulangerie', members: ['pain', 'baguette', 'four', 'comptoir', 'vitrine', 'boulanger', 'caisse', 'fournil', 'croissant', 'tradition', 'levain', 'pâte'] },

  // OOPS — already used. Replace 10-23 with something else
  // Let me skip and write next.

  // === Maladies ===
  '2026-10-24': { word: 'maladie', members: ['fièvre', 'rhume', 'grippe', 'toux', 'angine', 'allergie', 'infection', 'virus', 'symptôme', 'médicament', 'traitement', 'guérison'] },

  // === Bricolage ===
  '2026-10-25': { word: 'bricolage', members: ['marteau', 'tournevis', 'scie', 'perceuse', 'clou', 'vis', 'planche', 'mesurer', 'établi', 'atelier', 'rénovation', 'peinture'] },

  // === Plantes carnivores etc ===
  '2026-10-26': { word: 'palmier', members: ['datte', 'coco', 'tropique', 'plage', 'feuille', 'tronc', 'oasis', 'savane', 'cocotier', 'sagoutier', 'éventail', 'palme'] },

  // === Carnaval déjà fait ===

  // === Médecine ===
  '2026-10-27': { word: 'médicament', members: ['comprimé', 'gélule', 'sirop', 'pommade', 'ampoule', 'pilule', 'ordonnance', 'pharmacie', 'posologie', 'antibiotique', 'antalgique', 'placebo'] },

  // === Plantes succulentes ===
  '2026-10-28': { word: 'verger', members: ['pommier', 'poirier', 'cerisier', 'prunier', 'arbre', 'fruit', 'récolte', 'branche', 'panier', 'espalier', 'cueillette', 'ruche'] },

  // OOPS duplicate. Replace.

  // === Bijoux suite ===
  '2026-10-29': { word: 'pierre', members: ['rubis', 'saphir', 'émeraude', 'diamant', 'topaze', 'opale', 'turquoise', 'jade', 'améthyste', 'perle', 'agate', 'lapis'] },

  // === Boissons spéciales ===
  '2026-10-30': { word: 'cocktail', members: ['sangria', 'punch', 'paille', 'martini', 'apéritif', 'bar', 'gin', 'rhum', 'vodka', 'shaker', 'glaçon', 'ombrelle'] },
  '2026-10-31': { word: 'bière', members: ['blonde', 'brune', 'ambrée', 'pression', 'mousse', 'houblon', 'malt', 'trappiste', 'abbaye', 'stout', 'bock', 'bouteille'] },

  // ===== Novembre 2026 =====
  '2026-11-01': { word: 'pirate', members: ['drapeau', 'sabre', 'mât', 'trésor', 'crâne', 'bandeau', 'perroquet', 'jambe', 'capitaine', 'galion', 'abordage', 'corsaire'] },
  '2026-11-02': { word: 'chevalier', members: ['armure', 'épée', 'bouclier', 'lance', 'casque', 'écuyer', 'tournoi', 'joute', 'château', 'roi', 'dame', 'destrier'] },

  // === Mythologie ===
  '2026-11-03': { word: 'légende', members: ['héros', 'dragon', 'sorcier', 'épée', 'roi', 'mythe', 'épopée', 'fée', 'magie', 'enchantement', 'aventure', 'merveille'] },

  // === Sport plus ===
  '2026-11-04': { word: 'judo', members: ['kimono', 'ceinture', 'tatami', 'prise', 'projection', 'immobilisation', 'arbitre', 'salut', 'noir', 'blanc', 'maître', 'ippon'] },
  '2026-11-05': { word: 'boxe', members: ['gant', 'ring', 'arbitre', 'rond', 'crochet', 'uppercut', 'frappe', 'direct', 'esquive', 'garde', 'knock-out', 'punching-ball'] },

  // === Bâtiments mots ===
  '2026-11-06': { word: 'porte', members: ['poignée', 'serrure', 'verrou', 'gond', 'battant', 'panneau', 'clé', 'judas', 'sonnette', 'paillasson', 'seuil', 'huisserie'] },
  '2026-11-07': { word: 'fenêtre', members: ['vitre', 'volet', 'rideau', 'persienne', 'lucarne', 'oculus', 'tabatière', 'baie', 'croisée', 'verre', 'encadrement', 'imposte'] },

  // === Magie / sciences occultes ===
  '2026-11-08': { word: 'magie', members: ['baguette', 'sortilège', 'potion', 'enchanteur', 'sorcier', 'magicien', 'tour', 'illusion', 'incantation', 'grimoire', 'charme', 'ensorceler'] },

  // === Émotions détails ===
  '2026-11-09': { word: 'joie', members: ['rire', 'bonheur', 'sourire', 'gaieté', 'allégresse', 'jubilation', 'extase', 'enchantement', 'ravissement', 'liesse', 'félicité', 'éclat'] },
  '2026-11-10': { word: 'peur', members: ['frayeur', 'terreur', 'angoisse', 'phobie', 'effroi', 'panique', 'frisson', 'cauchemar', 'monstre', 'sueurs', 'cri', 'fuite'] },
  '2026-11-11': { word: 'colère', members: ['rage', 'fureur', 'courroux', 'irritation', 'crise', 'éclat', 'tempête', 'hurler', 'rouge', 'agressif', 'emporter', 'fâcher'] },

  // === Plus de plantes ===
  '2026-11-12': { word: 'orchidée', members: ['pétale', 'sépale', 'tige', 'vanille', 'cattleya', 'tropicale', 'pot', 'serre', 'mousse', 'racine', 'aérienne', 'parfum'] },

  // === Plus d'animaux ===
  '2026-11-13': { word: 'serpent', members: ['cobra', 'vipère', 'python', 'boa', 'couleuvre', 'anaconda', 'écaille', 'venin', 'crochet', 'reptile', 'mue', 'sifflement'] },
  '2026-11-14': { word: 'ours', members: ['polaire', 'brun', 'grizzli', 'panda', 'griffe', 'hiver', 'hibernation', 'miel', 'forêt', 'plantigrade', 'ourson', 'fourrure'] },

  // === Métiers plus ===
  '2026-11-15': { word: 'boulanger', members: ['four', 'pain', 'baguette', 'pâte', 'levure', 'farine', 'pétrin', 'mie', 'croissant', 'brioche', 'apprenti', 'fournil'] },
  '2026-11-16': { word: 'coiffeur', members: ['ciseaux', 'shampoing', 'brosse', 'peigne', 'sèche-cheveux', 'tondeuse', 'coupe', 'mise', 'permanente', 'teinture', 'salon', 'baccarat'] },

  // === Plus de météo ===
  '2026-11-17': { word: 'orage', members: ['éclair', 'tonnerre', 'foudre', 'pluie', 'tempête', 'nuage', 'vent', 'grêle', 'averse', 'rafale', 'illumination', 'détonation'] },
  '2026-11-18': { word: 'brouillard', members: ['brume', 'gouttelette', 'humide', 'opaque', 'visibilité', 'nuage', 'matinée', 'voile', 'épais', 'givre', 'phare', 'fanal'] },

  // === Outils suite ===
  '2026-11-19': { word: 'aiguille', members: ['couture', 'fil', 'épingle', 'pelote', 'dé', 'tricot', 'broderie', 'piqûre', 'coussinet', 'crochet', 'aiguillée', 'enfilage'] },

  // === Plus d'objets divers ===
  '2026-11-20': { word: 'parapluie', members: ['baleine', 'manche', 'toile', 'pliable', 'pluie', 'protection', 'fermé', 'ouvert', 'imperméable', 'crochet', 'pointe', 'canne'] },

  // === Plus métiers ===
  '2026-11-21': { word: 'enseignant', members: ['classe', 'élève', 'cours', 'leçon', 'professeur', 'maître', 'tableau', 'cahier', 'manuel', 'institut', 'pédagogie', 'instituteur'] },

  // === Vêtements suite ===
  '2026-11-22': { word: 'manteau', members: ['col', 'manche', 'boutonnière', 'doublure', 'capuche', 'parka', 'pardessus', 'imperméable', 'duffel-coat', 'caban', 'redingote', 'paletot'] },

  // === Ville objets ===
  '2026-11-23': { word: 'lampadaire', members: ['rue', 'éclairage', 'mât', 'globe', 'ampoule', 'fonte', 'illumination', 'piéton', 'place', 'avenue', 'boulevard', 'crochet'] },

  // === Animaux suite ===
  '2026-11-24': { word: 'papillon', members: ['aile', 'antenne', 'chrysalide', 'cocon', 'larve', 'chenille', 'monarque', 'machaon', 'fleur', 'nectar', 'envergure', 'écaille'] },
  '2026-11-25': { word: 'abeille', members: ['ruche', 'miel', 'cire', 'reine', 'ouvrière', 'dard', 'piqûre', 'nectar', 'pollen', 'butiner', 'essaim', 'apiculteur'] },

  // === Plus de boissons ===
  '2026-11-26': { word: 'eau', members: ['minérale', 'gazeuse', 'plate', 'source', 'fontaine', 'robinet', 'verre', 'bouteille', 'pichet', 'cruche', 'rafraîchissement', 'ruisseau'] },

  // === Plus de pays/géo ===
  '2026-11-27': { word: 'fleuve', members: ['source', 'embouchure', 'estuaire', 'affluent', 'rive', 'crue', 'inondation', 'delta', 'pont', 'barge', 'péniche', 'navigation'] },

  // === Plus mer ===
  '2026-11-28': { word: 'vague', members: ['déferlement', 'crête', 'creux', 'rouleau', 'écume', 'ressac', 'houle', 'bord', 'marée', 'plage', 'surf', 'tsunami'] },

  // === Sport mer ===
  '2026-11-29': { word: 'plongée', members: ['masque', 'tuba', 'palme', 'bouteille', 'combinaison', 'profondeur', 'corail', 'épave', 'plongeur', 'décompression', 'apnée', 'oxygène'] },

  // === Plus émotions ===
  '2026-11-30': { word: 'amour', members: ['coeur', 'romance', 'baiser', 'tendresse', 'passion', 'affection', 'adoration', 'flirt', 'désir', 'idylle', 'jalousie', 'attirance'] },

  // ===== Décembre 2026 =====
  '2026-12-01': { word: 'tristesse', members: ['chagrin', 'mélancolie', 'larme', 'sanglot', 'deuil', 'peine', 'morosité', 'cafard', 'dépression', 'nostalgie', 'soupir', 'affliction'] },

  // === Bricolage matériaux ===
  '2026-12-02': { word: 'métal', members: ['fer', 'acier', 'cuivre', 'or', 'argent', 'bronze', 'aluminium', 'zinc', 'plomb', 'étain', 'nickel', 'titane'] },
  '2026-12-03': { word: 'bois', members: ['tronc', 'planche', 'branche', 'écorce', 'noeud', 'sciure', 'copeau', 'chêne', 'pin', 'menuiserie', 'ébénisterie', 'charpente'] },

  // === Objets précieux ===
  '2026-12-04': { word: 'or', members: ['lingot', 'pépite', 'paillette', 'mine', 'bijou', 'alliance', 'collier', 'pièce', 'fin', 'jaune', 'rose', 'orfèvre'] },

  // === Plus de fleurs ===
  '2026-12-05': { word: 'bouquet', members: ['fleur', 'rose', 'tulipe', 'mariée', 'cérémonie', 'fleuriste', 'composition', 'ruban', 'feuillage', 'gerbe', 'corbeille', 'piquet'] },

  // === Maison plus ===
  '2026-12-06': { word: 'toit', members: ['tuile', 'ardoise', 'cheminée', 'gouttière', 'lucarne', 'pente', 'faîte', 'mansarde', 'pignon', 'antenne', 'chaume', 'charpente'] },
  '2026-12-07': { word: 'mur', members: ['briques', 'pierre', 'béton', 'crépi', 'enduit', 'cloison', 'parpaing', 'mortier', 'plâtre', 'peinture', 'tapisserie', 'fissure'] },

  // === Animaux suite ===
  '2026-12-08': { word: 'rapace', members: ['aigle', 'faucon', 'vautour', 'buse', 'milan', 'hibou', 'chouette', 'épervier', 'condor', 'gypaète', 'harpie', 'proie'] },

  // OOPS — duplicate of 2026-05-04. Replace.
  '2026-12-09': { word: 'aigle', members: ['plume', 'serre', 'bec', 'envergure', 'rapace', 'royale', 'pygargue', 'aire', 'planer', 'vol', 'nid', 'aiglon'] },

  // === Plus de plantes ===
  '2026-12-10': { word: 'algue', members: ['mer', 'marée', 'vert', 'rouge', 'brun', 'varech', 'laminaire', 'sargasse', 'rocher', 'écume', 'marin', 'plancton'] },

  // === Plus instruments ===
  '2026-12-11': { word: 'guitare', members: ['corde', 'manche', 'caisse', 'vibrato', 'accord', 'luthier', 'frette', 'tête', 'sillet', 'chevalet', 'électrique', 'acoustique'] },
  '2026-12-12': { word: 'violon', members: ['archet', 'corde', 'manche', 'mentonnière', 'colophane', 'pupitre', 'partition', 'soliste', 'orchestre', 'sonate', 'concerto', 'crin'] },

  // === Lieux de jeu ===
  '2026-12-13': { word: 'stade', members: ['terrain', 'gradin', 'tribune', 'pelouse', 'piste', 'spectateur', 'supporter', 'match', 'compétition', 'sportif', 'tournoi', 'arène'] },

  // === Pays / régions ===
  '2026-12-14': { word: 'région', members: ['province', 'département', 'frontière', 'capitale', 'préfecture', 'commune', 'territoire', 'limite', 'localité', 'patrimoine', 'culture', 'parler'] },

  // === Aliments fins ===
  '2026-12-15': { word: 'truffe', members: ['noir', 'blanc', 'champignon', 'rare', 'arôme', 'cochon', 'chien', 'forêt', 'gastronomie', 'luxe', 'délice', 'gourmandise'] },

  // === Vie quotidienne ===
  '2026-12-16': { word: 'ménage', members: ['balai', 'aspirateur', 'serpillière', 'chiffon', 'éponge', 'savon', 'détergent', 'poussière', 'lessive', 'nettoyer', 'épousseter', 'briquer'] },

  // === Plus ===
  '2026-12-17': { word: 'serre', members: ['vitre', 'chaleur', 'plante', 'semis', 'plantation', 'verre', 'humide', 'tropical', 'exotique', 'géranium', 'soleil', 'horticulture'] },

  // OOPS — duplicate of 06-07. Replace.
  '2026-12-18': { word: 'potager', members: ['légume', 'tomate', 'carotte', 'salade', 'haricot', 'courgette', 'arrosoir', 'jardinier', 'rang', 'graine', 'binette', 'parcelle'] },

  // === Mode ===
  '2026-12-19': { word: 'mode', members: ['défilé', 'collection', 'styliste', 'mannequin', 'podium', 'couture', 'haute', 'tendance', 'griffe', 'créateur', 'magazine', 'chic'] },

  // === Plus de météo ===
  '2026-12-20': { word: 'glace', members: ['gel', 'givre', 'iceberg', 'banquise', 'glacier', 'patinoire', 'glaçon', 'verglas', 'cristallin', 'fonte', 'antarctique', 'arctique'] },

  // === Outils suite ===
  '2026-12-21': { word: 'tournevis', members: ['vis', 'boulonner', 'plat', 'embout', 'manche', 'serrer', 'desserrer', 'rotation', 'pas', 'bricolage', 'établi', 'kit'] },

  // === Bijoux ===
  '2026-12-22': { word: 'collier', members: ['perle', 'diamant', 'fermoir', 'chaîne', 'pendentif', 'sautoir', 'ras', 'cou', 'tour', 'rang', 'maille', 'bijoutier'] },

  // === Cuisine ===
  '2026-12-23': { word: 'four', members: ['cuisson', 'résistance', 'gril', 'porte', 'thermostat', 'lèchefrite', 'tournebroche', 'fourneau', 'rôtir', 'pâtissier', 'pizza', 'plat'] },

  // === Liquides ===
  '2026-12-24': { word: 'liquide', members: ['eau', 'lait', 'huile', 'jus', 'sirop', 'fluide', 'gouttelette', 'verser', 'transvaser', 'boisson', 'épancher', 'cascade'] },

  // === Concept ===
  '2026-12-25': { word: 'silence', members: ['calme', 'tranquillité', 'tu', 'muet', 'mutisme', 'paix', 'recueillement', 'discrétion', 'pause', 'sourdine', 'pianissimo', 'taire'] },

  // === Forme ===
  '2026-12-26': { word: 'forme', members: ['cercle', 'carré', 'triangle', 'rectangle', 'losange', 'ovale', 'rond', 'sphère', 'cube', 'cylindre', 'pyramide', 'cône'] },

  // === Mer animaux suite ===
  '2026-12-27': { word: 'méduse', members: ['tentacule', 'ombrelle', 'piqûre', 'plancton', 'transparente', 'eau', 'mer', 'polype', 'urticante', 'flottante', 'dériver', 'gélatineuse'] },

  // === Cuisine spéciale ===
  '2026-12-28': { word: 'pizza', members: ['pâte', 'tomate', 'fromage', 'olive', 'jambon', 'champignon', 'origan', 'four', 'anchois', 'napolitaine', 'reine', 'garniture'] },

  // === Insectes suite ===
  '2026-12-29': { word: 'fourmi', members: ['fourmilière', 'reine', 'ouvrière', 'soldat', 'antenne', 'mandibule', 'colonie', 'piste', 'défilé', 'larve', 'travail', 'cigale'] },

  // === Plus de plantes ===
  '2026-12-30': { word: 'plante', members: ['feuille', 'tige', 'racine', 'fleur', 'bourgeon', 'graine', 'pot', 'arroser', 'photosynthèse', 'chlorophylle', 'verdure', 'engrais'] },

  // === Plus de couleurs ===
  '2026-12-31': { word: 'rouge', members: ['écarlate', 'cramoisi', 'rubis', 'vermillon', 'pourpre', 'carmin', 'corail', 'cerise', 'tomate', 'feu', 'sang', 'brique'] },

  // ===== Janvier 2027 =====
  '2027-01-01': { word: 'concert', members: ['salle', 'scène', 'musicien', 'chanteur', 'public', 'applaudissement', 'billet', 'micro', 'sono', 'première', 'bis', 'fosse'] },

  // OOPS dup with 2026-07-31. Skip — replace with new theme.
  '2027-01-02': { word: 'feu', members: ['flamme', 'braise', 'fumée', 'cendre', 'allumette', 'briquet', 'bûche', 'âtre', 'cheminée', 'incendie', 'brasier', 'pompier'] },

  // === Outils transport ===
  '2027-01-03': { word: 'roue', members: ['pneu', 'jante', 'rayon', 'moyeu', 'voiture', 'vélo', 'crevaison', 'caoutchouc', 'amortisseur', 'enjoliveur', 'chambre', 'valve'] },

  // === Lectures ===
  '2027-01-04': { word: 'écriture', members: ['stylo', 'plume', 'encre', 'papier', 'lettre', 'alphabet', 'mot', 'phrase', 'texte', 'graphisme', 'calligraphie', 'clavier'] },

  // === Sport hiver ===
  '2027-01-05': { word: 'patinage', members: ['glace', 'piste', 'patinoire', 'figure', 'arabesque', 'pirouette', 'saut', 'glisser', 'collant', 'lame', 'roulette', 'patinette'] },

  // === Pays détails ===
  '2027-01-06': { word: 'drapeau', members: ['mât', 'étoile', 'bande', 'couleur', 'emblème', 'écusson', 'oriflamme', 'fanion', 'national', 'tricolore', 'étendard', 'bannière'] },

  // === Plus émotions ===
  '2027-01-07': { word: 'bonheur', members: ['joie', 'sourire', 'plaisir', 'félicité', 'béatitude', 'allégresse', 'bien-être', 'sérénité', 'plénitude', 'ravissement', 'contentement', 'enchantement'] },

  // === Sciences ===
  '2027-01-08': { word: 'physique', members: ['force', 'masse', 'énergie', 'gravité', 'vitesse', 'accélération', 'pression', 'onde', 'particule', 'électron', 'photon', 'atome'] },

  // === Histoire ===
  '2027-01-09': { word: 'histoire', members: ['époque', 'siècle', 'roi', 'reine', 'révolution', 'guerre', 'paix', 'traité', 'empire', 'antiquité', 'moyen-âge', 'archive'] },

  // === Plus de transports ===
  '2027-01-10': { word: 'camion', members: ['cabine', 'remorque', 'benne', 'plateau', 'chauffeur', 'cargo', 'transport', 'livraison', 'route', 'frigorifique', 'citerne', 'marchandise'] },

  // === Plus métiers ===
  '2027-01-11': { word: 'médecin', members: ['stéthoscope', 'cabinet', 'consultation', 'ordonnance', 'patient', 'diagnostic', 'généraliste', 'spécialiste', 'hôpital', 'blouse', 'soigner', 'guérir'] },
  '2027-01-12': { word: 'pompier', members: ['caserne', 'incendie', 'lance', 'feu', 'casque', 'échelle', 'sauvetage', 'sirène', 'tuyau', 'extincteur', 'fumée', 'urgence'] },

  // === Boulanger - déjà fait ===

  // === Plus de fromage déjà fait ===

  // === Plus animaux ===
  '2027-01-13': { word: 'vache', members: ['lait', 'pis', 'corne', 'sabot', 'meuglement', 'pré', 'troupeau', 'veau', 'taureau', 'génisse', 'bovin', 'normande'] },

  // === Plus ville ===
  '2027-01-14': { word: 'magasin', members: ['vitrine', 'rayon', 'caisse', 'vendeur', 'client', 'enseigne', 'présentoir', 'cabine', 'étalage', 'panier', 'comptoir', 'soldes'] },

  // === Plus art ===
  '2027-01-15': { word: 'dessin', members: ['crayon', 'gomme', 'feuille', 'esquisse', 'croquis', 'caricature', 'pastel', 'fusain', 'mine', 'plume', 'pochade', 'trait'] },

  // === Outils suite ===
  '2027-01-16': { word: 'pince', members: ['tenailler', 'levier', 'serrer', 'tenir', 'étau', 'pincer', 'tenaille', 'mâchoire', 'crocodile', 'becs', 'épiler', 'plier'] },

  // === Plus de boissons ===
  '2027-01-17': { word: 'soda', members: ['gazeux', 'bulle', 'sucré', 'limonade', 'cola', 'orange', 'glaçon', 'tonic', 'canette', 'rafraîchissement', 'pétillant', 'sirop'] },

  // === Mer ===
  '2027-01-18': { word: 'sable', members: ['plage', 'dune', 'grain', 'fin', 'mer', 'château', 'sablière', 'désert', 'crique', 'rivage', 'sablon', 'poudre'] },

  // === Plus de plantes ===
  '2027-01-19': { word: 'roseau', members: ['marais', 'étang', 'tige', 'plume', 'jonc', 'papyrus', 'rivière', 'rive', 'osier', 'panier', 'vannerie', 'bambou'] },

  // === Cinéma plus ===
  '2027-01-20': { word: 'acteur', members: ['rôle', 'carrière', 'audition', 'cachet', 'star', 'célèbre', 'oscar', 'césar', 'comédien', 'interprète', 'cinéma', 'théâtre'] },

  // === Plus de musique ===
  '2027-01-21': { word: 'chanson', members: ['couplet', 'refrain', 'mélodie', 'parole', 'chanteur', 'interprète', 'tube', 'titre', 'album', 'single', 'duo', 'reprise'] },

  // === Plus émotions ===
  '2027-01-22': { word: 'surprise', members: ['étonnement', 'stupeur', 'ébahissement', 'choc', 'inattendu', 'incroyable', 'mystère', 'révélation', 'soudain', 'rebondissement', 'coup', 'imprévu'] },

  // === Plus de nourriture ===
  '2027-01-23': { word: 'oeuf', members: ['blanc', 'jaune', 'coquille', 'omelette', 'poule', 'poussin', 'pâques', 'cocotte', 'mollet', 'dur', 'plat', 'oeufrier'] },

  // === Famille ===
  '2027-01-24': { word: 'mère', members: ['maman', 'famille', 'enfant', 'fils', 'fille', 'maternel', 'accoucher', 'nourrir', 'éduquer', 'maternité', 'parent', 'aimer'] },
  '2027-01-25': { word: 'père', members: ['papa', 'famille', 'enfant', 'fils', 'fille', 'paternel', 'protéger', 'éduquer', 'patriarche', 'géniteur', 'parent', 'figure'] },

  // === Plus instruments ===
  '2027-01-26': { word: 'flûte', members: ['traversière', 'bec', 'embouchure', 'piccolo', 'clé', 'argent', 'bois', 'orchestre', 'soliste', 'mélodie', 'aigu', 'enchanteur'] },

  // === Métiers suite ===
  '2027-01-27': { word: 'cuisinier', members: ['toque', 'tablier', 'four', 'casserole', 'recette', 'chef', 'commis', 'plat', 'mijoter', 'rôtir', 'restaurant', 'gastronomie'] },

  // === Plus de boissons ===
  '2027-01-28': { word: 'lait', members: ['vache', 'pis', 'crémier', 'caillé', 'pasteurisé', 'écrémé', 'entier', 'beurre', 'fromage', 'yaourt', 'biberon', 'maternel'] },

  // === Plus de fruits ===
  '2027-01-29': { word: 'pomme', members: ['golden', 'reinette', 'gala', 'fuji', 'tarte', 'compote', 'jus', 'cidre', 'pommier', 'verger', 'croquer', 'pépin'] },

  // === Plus de météo ===
  '2027-01-30': { word: 'arc-en-ciel', members: ['couleur', 'pluie', 'soleil', 'spectre', 'prisme', 'rouge', 'orange', 'jaune', 'vert', 'bleu', 'indigo', 'violet'] },

  // === Final ===
  '2027-01-31': { word: 'fin', members: ['terme', 'conclusion', 'achèvement', 'arrêt', 'dénouement', 'achever', 'terminer', 'final', 'extrémité', 'épilogue', 'cesser', 'aboutir'] },
}
