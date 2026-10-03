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

> Les niveaux livrés sont indexés `YYYY-MM-DD-N` avec `N ∈ {1, 2, 3, 4}`
> (4 niveaux par jour, tailles croissantes). Le champ `id` reprend ce
> format. La structure JSON ci-dessous correspond exactement aux fichiers
> dans `app/games/sokomot/challenges/<YYYY-MM>/`.

```json
{
  "id": "2026-05-07-1",
  "name": "Niveau 1 · 7×6",
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
  "id": "2026-05-07-1",
  "name": "Niveau 1 · 4×4",
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
  "id": "2026-05-07-3",
  "name": "Niveau 3 · 6×6",
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

## 4. Angle mort : Vigies × ligne unique

**Pitch** : placer et orienter des vigiles pour surveiller toute la pièce, sauf l'unique couloir par lequel le cambrioleur ira de la porte jusqu'au diamant. Premier jeu **sans mot** : placement pur. Inspiration : Queens, Akari, Loopy River.

### Éléments de la grille
- **Case libre** : sol, peut recevoir un vigile.
- **Pilier** (fixe) : bloque la vue et le passage.
- **Entrée** : case libre sur le **bord** de la grille, point d'arrivée du cambrioleur. Dessinée par une porte sur le pourtour et une flèche venue de l'extérieur. Position différente à chaque niveau.
- **Diamant 💎** : case libre **n'importe où** dans la pièce, fin du chemin. Position différente à chaque niveau.
- **Indice chiffré** : case libre qui affiche le nombre de vigiles qui la voient.
- **Miroir ╱ ╲** (niveau 4, fixe) : dévie la vue de 90°, bloque le passage.

Porte, diamant, indices et miroirs n'acceptent pas de vigile.

### Vigiles
Trois types, chacun orientable :

| Type | Champs de vision | Orientations |
|---|---|---|
| Simple | 1 direction | 4 (↑ → ↓ ←) |
| Angle | 2 directions à 90° | 4 (┗ ┏ ┓ ┛) |
| Opposé | 2 directions à 180° | 2 (━ ┃) |

Un vigile éclaire en ligne droite avec sa ou ses lampes torches, jusqu'à un pilier ou au bord de la grille. La lumière passe au-dessus des autres vigiles. Un miroir prolonge le faisceau en le déviant.

Le **lot est donné** par le niveau (ex. « 3 simples + 1 angle ») et doit être entièrement placé.

### Conditions de victoire
1. Tout le lot est placé.
2. Chaque indice chiffré est vu par exactement le nombre de vigiles indiqué.
3. Les cases libres **non surveillées** (hors vigiles) forment **un seul chemin sans embranchement** de 🚪 à 💎 : la porte et le diamant ont exactement 1 voisin non surveillé, toutes les autres cases du chemin exactement 2, et l'ensemble est connexe.

### Progression sur la journée
Tailles alignées sur Sokomot (`GAME_SIZE`), en surface jouable : le bord de la grille arrête la vue, pas besoin de bordure de murs.

| Niv. | Taille | Vigiles | Nouveauté |
|---|---|---|---|
| 1 | 7×6 | simples | règles de base, chemin compris |
| 2 | 8×7 | simples | grille plus grande, plus de piliers |
| 3 | 9×8 | simples + doubles (angle, opposé) | vigiles à 2 champs |
| 4 | 10×9 | simples + doubles | 1 ou 2 miroirs |

### Chemin du cambrioleur
- Longueur **variable** d'un niveau à l'autre, mais au minimum `largeur + hauteur` cases (13 en 7×6, 19 en 10×9), et au plus ~40 % des cases libres.
- Au moins **3 virages**, pour qu'un chemin long mais presque droit ne se devine pas d'un coup d'œil.

### Contrôles
| Touche | Action |
|---|---|
| Flèches / ZQSD / WASD | Déplacer le curseur |
| **Espace** | Poser le prochain vigile du lot, ou retirer celui sous le curseur |
| **Entrée** | Faire pivoter le vigile sous le curseur |

Nécessite de distinguer Espace et Entrée dans `useGameKeyboard` (aujourd'hui confondus en « action principale »). Le chemin non surveillé est mis en évidence en direct, pour que le joueur voie le couloir se dessiner.

### Statut `perfect`
`moves` = nombre de **poses** (les rotations ne comptent pas). `parMoves` = taille du lot. Parfait = aucun vigile retiré ni déplacé, donc résolu sans tâtonner.

### Génération (offline, build-time)
1. Placer des piliers aléatoires (et les miroirs au niveau 4).
2. Tirer la porte sur le bord, puis un chemin auto-évitant de longueur et de nombre de virages conformes, qui se termine sur le diamant.
3. Placer des vigiles (types selon le niveau) qui couvrent toutes les cases hors chemin sans éclairer le chemin, puis retirer les vigiles superflus.
4. Déduire le lot, puis ajouter des indices chiffrés jusqu'à ce que le solveur trouve une **solution unique**.

### Format de niveau
```json
{
  "id": "2026-10-03-3",
  "name": "Niveau 3 · 9×8",
  "width": 9,
  "height": 8,
  "pillars": [[2, 1], [5, 3]],
  "mirrors": [],
  "door": [0, 4],
  "diamond": [6, 2],
  "clues": { "3,5": 2, "7,1": 0 },
  "pool": { "simple": 3, "angle": 1, "oppose": 1 },
  "parMoves": 5,
  "solution": [
    { "pos": [1, 1], "type": "simple", "facing": "E" },
    { "pos": [4, 6], "type": "angle", "facing": "N" }
  ]
}
```

`facing` est la direction principale : un vigile `angle` regarde `facing` et sa rotation horaire (N → nord + est), un vigile `oppose` regarde `facing` et son opposé. Les miroirs s'écrivent `{ "pos": [x, y], "kind": "/" }` ou `"\\"`. `solution` n'est lu que par le test d'intégrité.

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

### Cascade : pose de dominos × réaction en chaîne (sans mots)
Placer un lot imposé de pièces (domino droit, domino d'angle à 90°, séparateur en fin de semaine) dans les cases vides, pour qu'une seule poussée depuis ✋ fasse tomber tous les dominos et toutes les cibles 🎯 en une chaîne continue. La « ligne unique » est la trajectoire de la chute. Inspiration : DominoFit, Loopy River, Zip.
