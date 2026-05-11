# Generators

Données et code utilisés **à la génération** des défis (build-time uniquement).
Aucun fichier de ce dossier n'est embarqué dans le bundle de l'application
runtime — l'app ne consomme que les JSON déjà générés dans
`app/games/<jeu>/challenges/`.

## Fichiers

| Fichier | Rôle |
|---|---|
| [words-fr-raw.json](words-fr-raw.json) | Dictionnaire français complet (336 524 entrées, ~4.5 MB). Source : npm `an-array-of-french-words` (MIT). |
| [wordlists.ts](wordlists.ts) | Filtre + groupe le dico par longueur, en majuscules ASCII. Exporte `WORDS_BY_LENGTH` consommé par les générateurs Sokomot et Boucle. |
| [themes.ts](themes.ts) | Pool générique de thèmes Sémantogramme + pool de mots filler. Utilisé uniquement pour la branche aléatoire (dates sans thème curé). |
| [curated-themes-l1.ts](curated-themes-l1.ts) | Thèmes curés niveau 1 (grilles 4×4). **Figés** — voir AGENTS.md. |
| [curated-themes-l2.ts](curated-themes-l2.ts) | Thèmes curés niveau 2 (grilles 5×5). |
| [curated-themes-l3.ts](curated-themes-l3.ts) | Thèmes curés niveau 3 (grilles 6×6). |
| [curated-themes-l4.ts](curated-themes-l4.ts) | Thèmes curés niveau 4 (grilles 7×7). |
| [sokomot.ts](sokomot.ts) | Générateur Sokomot (template push-up + glace). |
| [boucle.ts](boucle.ts) | Générateur Boucle (rectangle entourant une colonne). |
| [semantogramme.ts](semantogramme.ts) | Générateur Sémantogramme : utilise un thème curé si disponible pour la date, sinon retombe sur la branche aléatoire `themes.ts`. |

## Usage

```bash
# Régénère les niveaux dans app/games/<jeu>/challenges/<mois>/<date>-<index>.json
make generate-levels

# Avec des bornes de date / un sous-ensemble :
make generate-levels ARGS="--start 2026-06-01 --end 2026-06-30"
make generate-levels ARGS="--start 2026-05-01 --end 2026-05-07 --game sokomot --level 3"
```

> **Attention — Sémantogramme L1 figés.** Les 306 niveaux curés L1 ne doivent
> plus être régénérés une fois publiés. Voir AGENTS.md et la note dans la
> mémoire projet.

## Mise à jour du dictionnaire

```bash
curl -sSL -o generators/words-fr-raw.json https://unpkg.com/an-array-of-french-words/index.json
make generate-levels
```

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
