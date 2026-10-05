# Generators

Données et code utilisés **à la génération** des défis (build-time uniquement).
Aucun fichier de ce dossier n'est embarqué dans le bundle de l'application
runtime — l'app ne consomme que les JSON déjà générés dans
`app/games/<jeu>/challenges/`.

## Fichiers

| Fichier | Rôle |
|---|---|
| [words-fr-raw.json](words-fr-raw.json) | Dictionnaire français complet (336 524 entrées, ~4.5 MB). Source : npm `an-array-of-french-words` (MIT). |
| [wordlists.ts](wordlists.ts) | Filtre le dico par longueur, en majuscules ASCII. `freshWords` donne aux générateurs Sokomot et Boucle les mots d'une longueur, hors mots déjà publiés. |
| [random.ts](random.ts) | Générateur pseudo-aléatoire à graine (`Rng`) : même graine, même niveau. |
| [calendar.ts](calendar.ts) | Période couverte par les niveaux publiés (du 2026-09-01 au 2027-09-30), chemin du fichier de chaque niveau. |
| [sokomot.ts](sokomot.ts) | Générateur Sokomot : une méthode de construction par niveau, puis `parMoves` réglé par les solveurs. |
| [sokomot-grid.ts](sokomot-grid.ts) | Briques communes Sokomot : directions, murs, cibles, obstacles, marche du joueur. |
| [sokomot-freeform.ts](sokomot-freeform.ts) | Niveaux 1 et 2 : blocs à une ou deux cases de leur cible, glace au niveau 2. |
| [sokomot-pullchain.ts](sokomot-pullchain.ts) | Niveau 3 : Sokoban classique généré à rebours, par tirages. |
| [sokomot-fullice.ts](sokomot-fullice.ts) | Niveau 4 : intérieur entièrement gelé, généré à rebours. |
| [sokomot-optimal-solver.ts](sokomot-optimal-solver.ts) | Solveur optimal (A* sur les coups du joueur). |
| [sokomot-pushstate-solver.ts](sokomot-pushstate-solver.ts) | Solveur par poussées, recours sans garantie d'optimum quand le solveur optimal dépasse son budget. |
| [sokomot-search.ts](sokomot-search.ts) | Clé d'état, tas binaire et heuristique partagés par les recherches Sokomot. |
| [boucle.ts](boucle.ts) | Générateur Boucle : le mot suit une marche aléatoire à droite ou en bas ; la boucle attendue est le périmètre de ses cases. |
| [semantogramme.ts](semantogramme.ts) | Générateur Sémantogramme : planifie toute l'année depuis la curation (voir [docs/semantogramme-curation.md](../docs/semantogramme-curation.md)). |
| [semantogramme-curation/](semantogramme-curation/) | Curation Sémantogramme : calendrier des 1580 thèmes, mots de chaque thème, domaines de sens, décisions manuelles. |
| [semantogramme-curation.ts](semantogramme-curation.ts) | Règles automatiques de la curation (source unique, testée sur tout le corpus). |
| [semantogramme-rules.ts](semantogramme-rules.ts) | Normalisation des mots et heuristique « même famille ». |
| [anglemort.ts](anglemort.ts) | Générateur Angle mort : paramètres par niveau, enchaînement des étapes. |
| [anglemort-stats.ts](anglemort-stats.ts) | Statistiques et événements de génération, pour mesurer le générateur. |
| [anglemort-schedule.ts](anglemort-schedule.ts) | Calendrier : grille de base et symétrie de chaque date (cycle figé de 395 jours, 50 bases), grilles de base fixées. |
| [anglemort-construct.ts](anglemort-construct.ts) | Construction d'une grille : couloir, vigiles, piliers, diamant, miroirs. |
| [anglemort-clues.ts](anglemort-clues.ts) | Indices posés d'office, puis ajoutés jusqu'à l'unicité du couloir. |
| [anglemort-corridors.ts](anglemort-corridors.ts) | Unicité du couloir : couloirs compatibles avec les indices, concurrents soumis au solveur, preuve des tests d'intégrité. |
| [anglemort-solver.ts](anglemort-solver.ts) | Solveur : poses du lot entier qui respectent les indices et laissent un seul chemin dans l'ombre. |
| [anglemort-bounds.ts](anglemort-bounds.ts) | Contexte du solveur : candidats, nœuds de recherche, bornes d'éclairage. |
| [anglemort-propagate.ts](anglemort-propagate.ts) | Propagation du solveur : règles de déduction jusqu'au point fixe. |
| [anglemort-symmetry.ts](anglemort-symmetry.ts) | Les 8 symétries d'une grille (rotations et miroir). |
| [anglemort-grid.ts](anglemort-grid.ts) | Indices et voisinage des cases, en indices de case. |

## Usage

**Les niveaux publiés sont figés** : ne régénérer que sur décision explicite,
puis lancer `make verify-levels`.

```bash
# Régénère les niveaux dans app/games/<jeu>/challenges/<mois>/<date>-<index>.json
make generate-levels ARGS="--start 2026-10-01 --end 2026-10-31 --game boucle"
make generate-levels ARGS="--start 2026-10-01 --end 2026-10-07 --game sokomot --level 3"
```

Sans `--game`, tous les jeux sont traités sauf Sémantogramme. `--clean`
supprime d'abord les fichiers du filtre, sauf ceux de Sémantogramme et les
grilles de base fixées d'Angle mort, que le générateur relit.

> **Sémantogramme** : ne jamais régénérer. Les grilles publiées sont relues et
> jouées ; un mot se corrige localement, dans la curation et dans le JSON du
> niveau (voir « Corriger un mot » dans
> [docs/semantogramme-curation.md](../docs/semantogramme-curation.md)). Le
> script ne le traite que sur `--game semantogramme` explicite.

## Mise à jour du dictionnaire

```bash
curl -sSL -o generators/words-fr-raw.json https://unpkg.com/an-array-of-french-words/index.json
```

Changer le dictionnaire change les mots tirés : les niveaux Sokomot et Boucle
déjà publiés ne se régénèrent pas, seuls les nouveaux niveaux en profitent.

## Filtrage appliqué par `wordlists.ts`

Le brut contient toutes les formes (conjugaisons, pluriels, mots avec
apostrophes/traits d'union…). On ne garde que :

- les mots dont la version sans accents est purement `[A-Z]+` ;
- les longueurs 3 à 7 ;
- déduplication après normalisation.

Chaque entrée conserve deux formes : `display` (ASCII pour la grille) et
`canonical` (avec accents pour la requête Wiktionnaire).

## Licence

Le dico provient du paquet npm `an-array-of-french-words` (licence MIT,
copyright Titus Wormer). Voir <https://github.com/words/an-array-of-french-words>.
