# Concepts de jeux nouveaux

Idées originales — soit totalement neuves, soit hybridations intelligentes de mécaniques existantes.
Le projet vise une **forte dimension logique/spatiale**, avec une touche lexicale optionnelle.

---

## 1. Sokomot — Sokoban × Wordle

**Pitch** : pousser des blocs-lettres pour former le mot du jour dans la zone cible.

### Mécanique
- Grille avec un personnage, des blocs-lettres, des murs, et une zone cible (cases marquées).
- Règles Sokoban classiques :
  - On pousse, on ne tire pas.
  - Un bloc poussé contre un autre bloc ou un mur ne bouge pas.
  - Un seul bloc à la fois.
- **Objectif** : aligner les lettres dans la zone cible pour former le mot demandé, dans l'ordre.

### Variante "mode glace"
- Sur les cases glacées : un bloc poussé glisse jusqu'à heurter un obstacle.
- Permet des résolutions plus longues et des trajectoires non triviales.
- Le sol non-glacé fonctionne en Sokoban classique.

### Difficulté
- **Logique** : planification de la séquence de poussées.
- **Spatial** : ordonner les lettres sans bloquer les autres.
- **Lexical** : le mot guide mais peut être deviné en cours de jeu.

### Score
- Nombre de coups (objectif minimal).
- Niveau quotidien partagé.

### Format de niveau
```json
{
  "id": "sokomot-2026-05-07",
  "width": 8,
  "height": 6,
  "player": [1, 1],
  "walls": [[0,0], [0,1], ...],
  "ice": [[3,2], [3,3], [3,4]],
  "blocks": [
    { "letter": "M", "pos": [2, 3] },
    { "letter": "A", "pos": [4, 1] },
    { "letter": "I", "pos": [5, 4] },
    { "letter": "S", "pos": [6, 2] }
  ],
  "target": {
    "word": "MAIS",
    "cells": [[1,5], [2,5], [3,5], [4,5]]
  },
  "parMoves": 18
}
```

---

## 2. Boucle — Slitherlink × mot caché

**Pitch** : tracer une boucle fermée sur une grille de lettres ; les lettres encerclées forment le mot du jour.

### Mécanique
- Grille de lettres avec des indices numériques sur certaines cases (comme Slitherlink).
- Le joueur trace **une seule boucle fermée** sur les arêtes entre cases.
- Indices = nombre d'arêtes de la case qui appartiennent à la boucle (0, 1, 2 ou 3).
- **Contrainte lexicale** : les lettres à l'intérieur de la boucle, lues dans l'ordre normal (haut→bas, gauche→droite), forment un mot valide.

### Difficulté
- **Logique pure** pour le tracé (Slitherlink est NP-complet en général, mais les puzzles humains sont conçus solubles par déduction).
- **Lexical** : la contrainte du mot agit comme un indice supplémentaire.

### Génération
- Choisir un mot.
- Placer les lettres du mot sur des cases connexes formant un polygone simple.
- Remplir le reste de la grille avec d'autres lettres aléatoires.
- Calculer les indices Slitherlink correspondants.
- Vérifier l'unicité de la solution.

### Format de niveau
```json
{
  "id": "boucle-2026-05-07",
  "width": 7,
  "height": 7,
  "letters": [
    ["A", "B", "M", "I", "S", "T", "E"],
    ...
  ],
  "clues": {
    "1,2": 3,
    "3,4": 2,
    "5,1": 0
  },
  "solutionWord": "MAISON"
}
```

---

## 3. Sémantogramme — Nonogram × Semantle

**Pitch** : peindre les cases d'une grille de mots pour révéler ceux liés à un thème caché, en s'aidant d'indices numériques façon Nonogram.

### Mécanique
- Grille N×N où **chaque case contient un mot**.
- Sur chaque ligne et chaque colonne, un **chiffre en marge** indique combien de mots de cette ligne/colonne sont "dans le thème" (sémantiquement proches du mot-thème caché).
- Le joueur peint chaque case en **IN** (lié au thème) ou **OUT** (hors thème).
- **Objectif** : identifier toutes les cases IN. Une fois la grille résolue, le joueur peut deviner le mot-thème.

### Exemple

Thème caché : **POISSON**

```
                3   4   2   5   4   3
              ┌───┬───┬───┬───┬───┬───┐
        4     │thon│cri-│sau-│re- │ca- │ave-│
              │   │vette│mon │quin│las │nir │
              ├───┼───┼───┼───┼───┼───┤
        2     │vent│table│ban-│dau-│por- │mer│
              │   │   │que │phin│ tail│   │
              ├───┼───┼───┼───┼───┼───┤
        ...
```

Le chiffre `4` à gauche de la ligne 1 dit : 4 des 6 mots de cette ligne sont liés à POISSON. Le `3` au-dessus de la colonne 1 dit : 3 des 6 mots de cette colonne le sont.

### Difficulté
- **Logique pure** (Nonogram) quand les contraintes forcent un cas (ligne `6/6` → tout IN, ligne `0/6` → tout OUT).
- **Sémantique** quand on reconnaît qu'un mot est clairement lié ou non au thème.
- **Synergie** : un mot ambigu peut être tranché par contrainte croisée ligne/colonne, ou inversement, une intuition sémantique débloque une zone bloquée logiquement.

### Génération (offline, build-time)
- Choisir un mot-thème.
- Calculer les embeddings (OpenAI, multilingual sentence-transformers, ou fasttext) pour un dictionnaire.
- Sélectionner N×N mots avec un mix de mots proches et lointains du thème.
- Définir un seuil de similarité = "IN" ou "OUT".
- Calculer les chiffres ligne/colonne.
- Vérifier l'unicité de la solution Nonogram (avec solveur).

> Le runtime ne fait **pas** de calcul sémantique : tout est précalculé en JSON statique.

### Format de niveau
```json
{
  "id": "semantogramme-2026-05-07",
  "width": 6,
  "height": 6,
  "words": [
    ["thon", "crevette", "saumon", "requin", "calas", "avenir"],
    ["vent", "table", "banque", "dauphin", "portail", "mer"],
    ["sardine", "anchois", "carrelet", "vague", "filet", "écaille"],
    ["livre", "pieuvre", "morue", "hameçon", "plage", "voile"],
    ["thon", "table", "rouget", "lieu", "ourson", "sole"],
    ["bar", "merlu", "barque", "marin", "phare", "perche"]
  ],
  "rowClues": [4, 2, 5, 3, 5, 6],
  "colClues": [4, 4, 5, 3, 3, 6],
  "themeWord": "poisson",
  "solution": [
    [true, true, true, true, false, false],
    [false, false, false, true, false, true],
    ...
  ]
}
```

### Variantes futures
- **Mode "thème caché"** : le joueur ne connaît pas le thème, il doit le deviner à la fin.
- **Mode "thème donné"** : le thème est affiché, on joue le Nonogram pur.
- **Mode "double thème"** : ligne et colonne ont des thèmes différents (deux mots à deviner).

---

## Idées en réserve (non priorisées)

### Galaxies Lexicales — Spiral Galaxies × mots
Partitionner une grille en régions à symétrie rotationnelle 180° autour de centres `●` imposés. Chaque région, lue en ordre normal, forme un mot. Synergie forte entre déduction géométrique et lexicale.

### Reine Lettrée — Queens × Scrabble
Placer une lettre par ligne / colonne / région colorée. Les lettres de chaque région forment un mot.

### Convergence — Wordle × Wordle
Deux mots cibles cachés sémantiquement liés. Chaque essai donne le feedback pour les deux. 8 essais.

### Écho — propriétés vs lettres
Pas de feedback sur les lettres : feedback sur les propriétés du mot (longueur, syllabes, registre, fréquence).

### Pliage — origami logique
Plier une grille pour superposer des motifs. Pure logique combinatoire, sans mots.

### Inertie — Sokoban × glace pure
Glissade systématique. Tous les blocs glissent jusqu'à un obstacle. Niveaux de planification longue.
