# Generators

Données et code utilisés **à la génération** des défis (build-time uniquement).
Aucun fichier de ce dossier n'est embarqué dans le bundle de l'application
runtime — l'app ne consomme que les JSON déjà générés dans
`app/games/<jeu>/challenges/`.

> Le dossier s'appelle `generators/` (et non `builder/`) pour éviter toute
> confusion avec le build JS de Vite.

## Fichiers

| Fichier | Rôle |
|---|---|
| [words-fr-raw.json](words-fr-raw.json) | Dictionnaire français complet (336 524 entrées, ~4.5 MB). Source : npm `an-array-of-french-words` (MIT). |
| [wordlists.ts](wordlists.ts) | Filtre + groupe le dico par longueur, en majuscules ASCII. Exporte `WORDS_BY_LENGTH` consommé par les générateurs Sokomot et Boucle. |
| [themes.ts](themes.ts) | Thèmes Sémantogramme (mer, fruit, couleur…) + pool de mots filler hors-thème. |
| [sokomot.ts](sokomot.ts) | Générateur Sokomot (template push-up + glace). |
| [boucle.ts](boucle.ts) | Générateur Boucle (rectangle entourant une colonne). |
| [semantogramme.ts](semantogramme.ts) | Générateur Sémantogramme (mix thème/filler ~50 %). |

## Usage

```bash
# Régénère les niveaux dans app/games/<jeu>/challenges/<mois>/<date>-<index>.json
npm run generate:levels

# Avec un range custom :
npx tsx scripts/generate-levels.ts 2026-06-01 2026-06-30
```

## Mise à jour du dictionnaire

```bash
curl -sSL -o generators/words-fr-raw.json https://unpkg.com/an-array-of-french-words/index.json
npm run generate:levels
```

## Filtrage appliqué par `wordlists.ts`

Le brut contient toutes les formes (conjugaisons, pluriels, mots avec
apostrophes/traits d'union…). On ne garde que :

- les mots dont la version sans accents est purement `[A-Z]+` ;
- les longueurs 3 à 7 ;
- déduplication après normalisation.

## Licence

Le dico provient du paquet npm `an-array-of-french-words` (licence MIT,
copyright Titus Wormer). Voir <https://github.com/words/an-array-of-french-words>.
