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
- Sur les cases glacées, joueur et blocs glissent jusqu'à heurter un obstacle (ou jusqu'à la première case sans glace).
- Permet des résolutions plus longues et des trajectoires non triviales.
- Le sol non-glacé fonctionne en Sokoban classique.

### Difficulté
- **Logique** : planification de la séquence de poussées.
- **Spatial** : ordonner les lettres sans bloquer les autres.
- **Lexical** : le mot guide mais peut être deviné en cours de jeu.

### Score
- Nombre de coups, comparé à l'objectif `parMoves` (le minimum trouvé par le solveur).

### Format de niveau

> Les niveaux livrés sont indexés `YYYY-MM-DD-N` avec `N ∈ {1, 2, 3, 4}`
> (4 niveaux par jour, tailles croissantes). Le champ `id` reprend ce
> format. La structure JSON ci-dessous correspond exactement aux fichiers
> dans `app/games/sokomot/challenges/<YYYY-MM>/`.

```json
{
  "id": "2026-10-01-1",
  "name": "Niveau 1 · 7×6",
  "width": 7,
  "height": 6,
  "player": [5, 1],
  "walls": [[0, 0], [0, 5], [1, 0], ...],
  "ice": [],
  "blocks": [
    { "id": "b1", "letter": "F", "pos": [4, 1] },
    { "id": "b2", "letter": "I", "pos": [3, 2] },
    { "id": "b3", "letter": "N", "pos": [5, 3] }
  ],
  "target": { "word": "FIN", "cells": [[3, 1], [4, 2], [5, 2]] },
  "parMoves": 11,
  "solution": ["left", "down", "down", ...],
  "canonicalWord": "fin"
}
```

`solution` n'est lu que par le test d'intégrité et par l'aide (ordre de pose des lettres) ; `canonicalWord` garde les accents pour le Wiktionnaire.

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
- Placer les lettres du mot sur un chemin aléatoire de cases voisines (vers la droite ou vers le bas), qui forme l'intérieur de la boucle.
- Remplir le reste de la grille avec d'autres lettres aléatoires.
- Calculer les indices Slitherlink correspondants.
- L'unicité du tracé n'est pas vérifiée : le mot à encercler sert d'indice supplémentaire.

### Format de niveau
```json
{
  "id": "2026-10-01-1",
  "name": "Niveau 1 · 4×4",
  "width": 4,
  "height": 4,
  "letters": [
    ["E", "R", "R", "Z"],
    ["S", "Q", "E", "G"],
    ...
  ],
  "clues": { "0,0": 3, "1,0": 2, "2,1": 3, ... },
  "solutionWord": "ERRE",
  "solutionInsideCells": [[0, 0], [1, 0], [2, 0], [2, 1]],
  "parMoves": 14,
  "canonicalWord": "erre"
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
- Les thèmes et leurs mots sont **curés à la main** (`generators/semantogramme-curation/`) : un thème par jour et par niveau, 10 / 15 / 18 / 19 mots selon le niveau.
- Le générateur tire une partie des mots du thème, puis complète avec des mots d'autres thèmes, sans lien avec le thème courant (domaines de sens distincts) et jamais répétés à moins de 3 jours.
- Détails, règles et commandes : [semantogramme-curation.md](semantogramme-curation.md).

> Le runtime ne fait **pas** de calcul sémantique : tout est précalculé en JSON statique.

### Format de niveau
```json
{
  "id": "2026-10-01-1",
  "name": "Niveau 1 · 4×4",
  "width": 4,
  "height": 4,
  "words": [
    ["Marseille", "modique", "bulle", "baignoire"],
    ["Dove", "gisant", "Jamaïque", "douche"],
    ...
  ],
  "rowClues": [3, 2, 2, 3],
  "colClues": [3, 2, 2, 3],
  "themeWord": "savon",
  "domains": ["maison"],
  "solution": [
    [true, false, true, true],
    [true, false, false, true],
    ...
  ],
  "parMoves": 10
}
```

`domains` est révélé par l'aide ; `solution` sert au jeu (grille résolue) et au test d'intégrité.

### Variantes futures
- **Mode "thème donné"** : le thème est affiché, on joue le Nonogram pur.
- **Mode "double thème"** : ligne et colonne ont des thèmes différents (deux mots à deviner).

---

## 4. Angle mort : Vigies × ligne unique

**Pitch** : tu es le chef de la sécurité, et tu es corrompu. Ce soir, ton complice vient voler le diamant. Place et oriente tes vigiles pour que la salle ait l'air surveillée, tout en lui laissant un unique couloir dans l'ombre, de l'entrée jusqu'au diamant. Premier jeu **sans mot** : placement pur. Inspiration : Queens, Akari, Loopy River, Inkwell Games.

### Éléments de la grille
- **Case libre** : sol, peut recevoir un vigile.
- **Pilier** (fixe) : bloque la lumière et le passage. Même teinte que le mur d'enceinte.
- **Entrée** : case libre sur le **bord** de la grille. La porte est dessinée dans l'épaisseur du mur, le cambrioleur attend devant, à l'extérieur. Position différente à chaque niveau.
- **Diamant 💎** : case libre dans la salle, fin du couloir. Position différente à chaque niveau. À partir du niveau 3, il est toujours **contre le mur ou un pilier**.
- **Indice chiffré** : nombre de vigiles qui éclairent la case dans la solution.
- **Miroir ╱ ╲** (niveau 4, fixe) : dévie le faisceau de 90°, bloque le passage.

Entrée, diamant, indices et miroirs n'acceptent pas de vigile.

### Vigiles
Trois types, chacun orientable :

| Type | Lampes | Orientations | Dessin |
|---|---|---|---|
| Simple | 1, devant | 4 (↑ → ↓ ←) | lampe dans la main droite |
| Angle | 2, à 90° | 4 | devant + sur le côté droit |
| Opposé | 2, à 180° | 2 | une lampe dans chaque main, bras écartés |

- Une lampe éclaire en ligne droite jusqu'au mur, à un pilier ou à **un autre vigile**, qui arrête le faisceau et fait de l'ombre derrière lui. Un miroir prolonge le faisceau en le déviant.
- Deux vigiles peuvent se voir.
- Une lampe ne peut pas être **braquée directement contre le mur ou un pilier** : la pose et la rotation sautent ces orientations. Une case cernée (mur et piliers sur tous ses côtés) ne peut donc pas recevoir de vigile.
- Le **lot est donné** par le niveau et doit être entièrement placé. La réserve dessine chaque vigile restant.

### Conditions de victoire
1. Tout le lot est placé.
2. Chaque indice chiffré est éclairé par exactement le nombre de vigiles indiqué.
3. Les cases libres **non éclairées** (hors vigiles) forment **un seul couloir sans embranchement** de l'entrée au diamant : l'entrée et le diamant ont exactement 1 voisin dans l'ombre, les autres cases du couloir exactement 2, et l'ensemble est connexe.

À la victoire, le cambrioleur entre, suit le couloir case par case en se tournant dans son sens de marche, ramasse le diamant, puis le panneau de victoire s'affiche (« Casse parfait ! » ou « Le diamant a disparu »).

### Rendu
- Cases dans l'ombre **sombres**, cases éclairées claires et chaudes : le cambrioleur se cache dans le noir.
- Vigile vu de dessus : casquette à 6 pans avec visière courte, épaules bleues, mains, lampes et faisceaux. Le personnage pivote par le plus court chemin.
- Cambrioleur sur le même gabarit : vêtements orange, gants noirs, cheveux, masque noir sur les yeux.
- Curseur clair (violet pâle, gris sur les cases interdites aux vigiles).

### Progression sur la journée
Tailles alignées sur Sokomot (`GAME_SIZE`), en surface jouable.

| Niv. | Taille | Vigiles | Nouveauté |
|---|---|---|---|
| 1 | 7×6 | simples | règles de base, couloir compris |
| 2 | 8×7 | simples | grille plus grande, plus de piliers |
| 3 | 9×8 | simples + 2 à 3 doubles (angle, opposé) | vigiles à 2 lampes, choisis au sélecteur ; au moins 4 piliers ; diamant contre un mur ; un indice d'office hors du couloir |
| 4 | 10×9 | simples + 1 à 4 doubles | 1 ou 2 miroirs, chacun indispensable |

### Couloir du cambrioleur
- Longueur **variable**, au minimum `largeur + hauteur` cases (13 en 7×6, 19 en 10×9), au plus ~40 % des cases libres.
- Au moins **3 virages**, pour qu'un couloir long mais presque droit ne se devine pas d'un coup d'œil.

### Contrôles
| Entrée | Action |
|---|---|
| Clic | Poser un vigile, ou faire pivoter celui en place |
| Clic droit | Retirer le vigile |
| Flèches / ZQSD / WASD | Déplacer le curseur |
| **Espace** | Poser un vigile du type sélectionné, ou retirer celui sous le curseur |
| **Entrée** | Faire pivoter le vigile, parmi les orientations autorisées de son type |
| **1**, **2**, **3** | Choisir le type de vigile à poser (sélecteur sous la grille, affiché dès que le lot mélange plusieurs types) |
| **Ctrl+Z** / **R** | Annuler / recommencer |

### Statut `perfect`
`moves` = nombre de **poses** (les rotations ne comptent pas). `parMoves` = taille du lot. Parfait = aucun vigile retiré ni déplacé, donc résolu sans tâtonner.

### Unicité du couloir
Ce qui est garanti, c'est qu'**un seul couloir** est possible, pas une seule pose : plusieurs placements des vigiles peuvent produire ce même couloir, tous gagnants. La preuve se fait en deux temps (`generators/anglemort-corridors.ts`) :
1. énumérer les couloirs compatibles avec les indices : chemins induits de la porte au diamant, qui passent par chaque « 0 » et évitent chaque case d'indice positif ;
2. pour chaque couloir concurrent, demander au solveur, couloir imposé, s'il existe une pose du lot qui le produit. Il doit n'en exister aucune.

### Génération (offline, build-time)
1. Placer des piliers aléatoires.
2. Tirer l'entrée sur le bord, puis un couloir auto-évitant **induit** (aucune case ne touche le couloir hors de ses voisines) de longueur et de nombre de virages conformes ; il se termine sur le diamant.
3. Couvrir de façon gloutonne les cases hors couloir avec des vigiles qui n'éclairent pas le couloir, puis retirer les vigiles superflus.
4. Au niveau 4, remplacer 1 ou 2 vigiles par un miroir : un vigile qui reçoit déjà un faisceau par le côté peut devenir un miroir qui renvoie ce faisceau là où il éclairait. On ne garde que des miroirs indispensables (remplacé par un pilier, le couloir change).
5. Déduire le lot, poser les indices d'office, puis ajouter à chaque tour l'indice qui élimine le plus de couloirs concurrents : un « 0 » sur le couloir élimine ceux qui l'évitent, un chiffre positif ceux qui traversent sa case. Quand il reste peu de concurrents, le solveur écarte ceux qu'aucune pose ne produit (ils ne coûtent aucun indice). On s'arrête à l'**unicité du couloir**. Au niveau 4, le solveur n'est jamais appelé (trop lent avec les miroirs) : on ajoute des indices jusqu'à ce qu'un seul couloir reste possible par la forme.

Le solveur (`generators/anglemort-solver.ts`) gère le blocage par des bornes « éclairé à coup sûr » / « peut-être éclairé », propage les contraintes du couloir (degrés, connexité de l'entrée au diamant), des indices et de la couverture, et branche sur les vigiles capables d'éclairer la case la plus contrainte.

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
