/**
 * Mots français en majuscules ASCII, regroupés par longueur. Utilisés par les
 * générateurs Sokomot et Boucle pour produire des défis quotidiens variés.
 *
 * Les mots sont en majuscules sans accents pour s'afficher proprement comme
 * lettres uniformes sur une grille (« ETE » au lieu de « ÉTÉ », etc.).
 */
export const WORDS_BY_LENGTH: Record<number, readonly string[]> = {
  3: [
    'AGE', 'AMI', 'ART', 'BAS', 'BON', 'BUT', 'CAR', 'CRI', 'DOS', 'EAU',
    'EST', 'ETE', 'FEE', 'FIN', 'FOI', 'FOU', 'GAZ', 'ICI', 'ILE', 'JET',
    'JEU', 'JUS', 'LAC', 'LIT', 'LOI', 'LUI', 'MAI', 'MER', 'MOI', 'MOT',
    'MUR', 'NEZ', 'NID', 'NON', 'OUI', 'PAS', 'PEU', 'PIE', 'PIN', 'POT',
    'PUR', 'RAT', 'ROI', 'RUE', 'SAC', 'SEC', 'SEL', 'SOL', 'SUD', 'TON',
    'VER', 'VIE', 'VIN', 'VOL', 'VUE', 'ZUT',
  ],
  4: [
    'AILE', 'AMIS', 'ANGE', 'ARBRE', 'AVIS', 'BLEU', 'BOIS', 'BRAS', 'CHAT',
    'CIEL', 'CLIN', 'COEUR', 'DAME', 'DENT', 'DIRE', 'DOIS', 'EAUX', 'ECHO',
    'ETOI', 'EXIL', 'FAIM', 'FILS', 'FOIN', 'GANT', 'GENS', 'IDEE', 'IMAGE',
    'JEAN', 'JEUX', 'JOUE', 'LAIT', 'LIVRE', 'LUNE', 'MAIS', 'MAIN', 'MARE',
    'MERE', 'MIDI', 'MORT', 'MOTS', 'NORD', 'NUIT', 'OEIL', 'OURS', 'PAIN',
    'PAIX', 'PARC', 'PAUL', 'PEAU', 'PERE', 'PIED', 'PLAT', 'PLIS', 'PORT',
    'POSE', 'ROIS', 'ROSE', 'ROUE', 'SACS', 'SAGE', 'SOIR', 'SOLS', 'TOIT',
    'VENT', 'VERS', 'VIES', 'VITE',
  ].filter((w) => w.length === 4),
  5: [
    'AIDER', 'AIMER', 'ALOUE', 'AMOUR', 'ANNEE', 'ARBRE', 'ARMES', 'AUTRE',
    'AVEUX', 'AVOIR', 'BANCS', 'BLANC', 'BOITE', 'BORDS', 'BOUCH', 'CARRE',
    'CHIEN', 'CIEUX', 'CLOUS', 'CONTE', 'CORPS', 'COURS', 'CRIER', 'DESIR',
    'DOUTE', 'ECRAN', 'ENVIE', 'ETOIL', 'FAUTE', 'FERME', 'FETER', 'FILER',
    'FILET', 'FROID', 'FRUIT', 'GAUCH', 'IDEAL', 'JAUNE', 'LAITS', 'LIBRE',
    'LIVRE', 'LUNDI', 'MARDI', 'NUAGE', 'OURSE', 'PARIS', 'PERLE', 'PIANO',
    'PLAGE', 'PLUME', 'POMME', 'PORTE', 'POULE', 'RAIDE', 'ROUGE', 'RUBAN',
    'SABRE', 'SCENE', 'SOLEI', 'SUITE', 'TABLE', 'TIGRE', 'TIRER', 'TONUS',
    'TROUS', 'VENIR', 'VITRE', 'VOILE', 'ZEBRE',
  ].filter((w) => w.length === 5),
  6: [
    'ACTION', 'AIMANT', 'ARGENT', 'AVENIR', 'BANANE', 'BATEAU', 'BUREAU',
    'CADEAU', 'CARTON', 'CHEVAL', 'CHIENS', 'CIMENT', 'COURIR', 'CROUTE',
    'DESERT', 'EFFORT', 'ELEVES', 'ENFANT', 'ETOILE', 'EVENT', 'FACTEUR',
    'FENETR', 'FORCES', 'FUMEES', 'GIRAFE', 'GROUPE', 'GUITAR', 'HISTOIR',
    'IMAGES', 'JARDIN', 'LAMPES', 'LECTUR', 'LIBRES', 'MAISON', 'MAITRE',
    'MELODI', 'MIROIR', 'MIXTUR', 'MORALE', 'MUSIQU', 'NUAGES', 'OCEANS',
    'ORANGE', 'PALAIS', 'PAYSAN', 'PENSER', 'PERSON', 'PIETON', 'PLANTE',
    'POULAI', 'PRENOM', 'RIDEAU', 'ROUGES', 'SOLEIL', 'TANGOS', 'TIROIR',
    'TROISI', 'VENDRE', 'VOISIN', 'VOTANT',
  ].filter((w) => w.length === 6),
  7: [
    'ABOUTIR', 'ANCIENS', 'ARGENTS', 'AUTOMNE', 'BAIGNER', 'BARQUES',
    'BLANCHE', 'BONHEUR', 'BUREAUX', 'CARNETS', 'CHAMPER', 'CHANTER',
    'CHARITE', 'CHATEAU', 'COIFFER', 'COURAGE', 'CRAYONS', 'CULTURE',
    'DESSINS', 'ECOLIER', 'ETOILES', 'ETUDIER', 'FACTEUR', 'FENETRE',
    'FOLIOLE', 'GERMAIN', 'HISTOIRE', 'JARDINS', 'LANTERN', 'LIBERTE',
    'LIGNAGE', 'LIVRETS', 'LUMIERE', 'MAJORTE', 'MARCHES', 'MELANGE',
    'MIRACLE', 'NUAGEUX', 'OBSCURI', 'OFFRANT', 'OUBLIER', 'PARDONS',
    'PARFUMS', 'PARTAGE', 'PEINTRE', 'PIQUANT', 'PLAQUES', 'PRENOMS',
    'PROFITE', 'RACINES', 'RECEVRE', 'SECOUER', 'SOMMEIL', 'SOULIER',
    'TABLEAU', 'TARTINE', 'VENDEUR', 'VIEILLE', 'VOLAILE',
  ].filter((w) => w.length === 7),
}
