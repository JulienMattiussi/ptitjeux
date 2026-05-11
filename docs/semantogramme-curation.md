# Sémantogramme — création des niveaux 1 (curés)

Ce document décrit le processus de création des niveaux 1 du sémantogramme,
qui sont **curés à la main** (un thème par jour, du début avril 2026 à fin
janvier 2027). Les niveaux 2-4 restent générés automatiquement à partir d'un
pool de 10 thèmes hardcodés.

## Pourquoi du contenu curé

Pour un niveau de découverte, on veut :

- des thèmes **immédiatement reconnaissables** par tout francophone ;
- une vingtaine de mots membres clairement associés au thème (sans
  ambiguïté) ;
- une grille **toujours résoluble** par sémantique pure : si un mot est
  posé en case « IN », tous les joueurs s'accorderont à dire qu'il est
  bien dans le thème.

Une génération automatique produirait des thèmes parfois flous (« choses
rondes ») ou des cooccurrences ambiguës (« voile » qui peut être à la fois
sport, mer et vêtement). On préfère donc lister à la main.

## Anatomie d'un niveau curé

Un niveau 1 fait **4 × 4 = 16 cases**. Il contient :

- `N` cases **IN** = mots du thème, avec `N` tiré aléatoirement entre **7
  et 10** par la graine date+index. Au-delà de 10, la grille devient trop
  saturée (≥ 11/16 cases « IN ») et le puzzle perd son intérêt.
- `16 − N` cases **OUT** = mots qui n'appartiennent **pas** au thème
  courant.
- Les indices `rowClues` et `colClues` sont calculés depuis la matrice
  solution (placement des IN).

Tous les mots placés dans une grille sont **distincts** — pas de
répétition, ni pour les membres ni pour les fillers.

## Règles de curation

### Pour le thème (`word`)

- Doit être un **nom commun** (pas de nom propre, pas de marque, pas
  d'adjectif).
- Doit être **courant** : si le mot demande un dictionnaire pour être
  identifié, il est rejeté.
- Doit être **distinct** de tous les autres thèmes de la collection (on
  vise ~305 thèmes différents).
- Doit exister tel quel dans `generators/words-fr-raw.json` (vérifié à la
  génération).

### Pour les membres

- **Au moins 10** membres distincts par thème (le N tiré peut atteindre
  10).
- La liste doit être **exhaustive** : elle doit contenir TOUS les mots
  qu'un joueur classerait IN pour ce thème — y compris ceux qui sont
  aussi membres d'un autre thème (ex. `acteur` est membre du thème
  `cinéma` ET de `métier`). Si on oublie un mot, il sortira en filler et
  rendra le puzzle insoluble.
- Chaque membre est **fortement associé** au thème : si un joueur lit le
  mot et connaît le thème, il marque la case IN sans hésiter.
- Chaque membre existe tel quel dans `words-fr-raw.json`.
- Au-delà de 10, on peut en lister 12-17 pour diversifier les puzzles
  d'un même thème (mais chaque thème n'est utilisé qu'une seule fois sur
  la collection, donc l'enjeu est surtout de couvrir les ambiguïtés
  cross-thèmes).

### Pour les fillers

**Pas de pool générique.** Les fillers d'un puzzle viennent du **pool des
membres de tous les autres thèmes curés**. Un mot de la liste « fleur »
peut donc servir de filler dans une grille « métier » : par construction,
il n'est pas un métier.

Conséquence importante : si un mot appartient sémantiquement à
**plusieurs** thèmes (ex. « voile » dans `mer` ET `transport`), il faut
l'inscrire dans les `members` de **tous** les thèmes concernés. Sinon il
sortira en filler dans l'un alors que le joueur le marquerait IN.

Décision **au cas par cas** par le curateur :
- `acteur` est membre de `cinéma` et de `métier` → liste dans les deux.
- `instituteur` est membre de `école` et de `métier` → liste dans les
  deux.
- `chêne` est membre de `arbre` uniquement → liste dans `arbre` seulement.
- `pétale` n'est pas listé comme membre de `fleur` (c'est une PARTIE de
  fleur, pas une fleur) → reste un filler valide pour fleur.

La règle de validation : un joueur connaissant le thème courant
classerait-il ce mot IN ? Si oui → membre. Si non → filler valide.

## Processus pas-à-pas (pour ajouter de nouveaux thèmes)

1. **Choisir un thème** : un nom commun courant, distinct des thèmes déjà
   curés (voir `generators/curated-themes.ts`).
2. **Lister 12 membres candidats** (on garde 12 pour avoir de la marge
   au-dessus du min 10 ; ça permet la diversité entre puzzles si jamais
   un même thème est réutilisé).
3. **Valider chaque mot** dans le dictionnaire :
   ```bash
   node -e 'const d=require("./generators/words-fr-raw.json");for(const w of ["fleur","rose","tulipe"])console.log(w,d.includes(w))'
   ```
   Si un mot manque, en choisir un proche qui existe (ex. `mozzarella`
   absent → remplacer par `parmesan` ou `tomme`).
4. **Vérifier la cohérence sémantique** : chaque membre doit être dans le
   thème ET pas dans un thème déjà curé d'une manière qui rendrait la
   grille ambiguë.
5. **Ajouter l'entrée** dans `generators/curated-themes.ts` :
   ```ts
   '2026-04-13': {
     word: 'légume',
     members: ['carotte', 'navet', 'poireau', /* ... */],
   },
   ```
6. **Régénérer les niveaux** :
   ```bash
   make generate-levels
   ```
7. **Vérifier dans le navigateur** : ouvrir le niveau du jour
   correspondant et confirmer qu'il fonctionne.

## Validation automatique

Le générateur jette une exception en cas d'invariant cassé :

- Thème avec moins de 10 membres → `Theme X a moins de 10 membres curés`.
- Pool cross-thèmes trop petit après exclusion → `Pool de fillers trop
  petit pour le thème X`. Ce cas n'arrive que si le total cumulé des
  membres des autres thèmes est insuffisant pour couvrir 6 à 9 fillers
  distincts — c'est-à-dire jamais en pratique à partir de ~5 thèmes
  curés.

Si l'exception est levée pendant `make generate-levels`, la génération
s'arrête et il faut corriger la curation.

## Format final (JSON)

Chaque niveau est sérialisé en JSON dans
`app/games/semantogramme/challenges/<YYYY-MM>/<YYYY-MM-DD>-1.json` avec la
structure habituelle (`words`, `rowClues`, `colClues`, `themeWord`,
`solution`, `parMoves`).

Le `parMoves` est égal **exactement** à `N` (le nombre de cases IN).
Aucune marge n'est accordée : il faut faire pile le bon nombre de clics
pour décrocher la coche verte (« perfect »). Tout clic perdu ou superflu
fait basculer en `solved` (jaune).

## Maintenance

- **Pour modifier un thème** déjà publié : éditer `curated-themes.ts`,
  régénérer. Attention aux joueurs qui auraient déjà la progression
  sauvegardée — leur `bestMoves` deviendrait potentiellement comparé à un
  `parMoves` différent.
- **Pour rajouter un thème** sur une date qui était auto-générée :
  ajouter l'entrée et régénérer. Le générateur préfère systématiquement
  le thème curé.
- **Pour retirer une date du curé** (revenir à l'aléatoire) : supprimer
  l'entrée du record.
