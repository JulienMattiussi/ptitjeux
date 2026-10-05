# Plan projet — ptitjeux

Plateforme web de mini-jeux logico-spatiaux, sans back-end métier (ni base, ni compte).

> **Document de référence opérationnelle :** [AGENTS.md](../AGENTS.md) (stack,
> arborescence, conventions, sources uniques, tests, commandes). Ce fichier
> garde le « pourquoi » des choix d'architecture et le modèle de chaque moteur.

---

## 1. Choix de stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **React Router 7** (Framework Mode) | Évolution officielle de Remix v2 (fusion 2025) ; SSR, types générés, routes déclaratives |
| Langage | **TypeScript** strict | Les moteurs de jeu manipulent des grilles et des coordonnées : le typage évite les inversions silencieuses |
| Style | **Tailwind CSS v4** | Itération rapide, suffisant pour des interfaces de puzzle |
| Tests | **Vitest** + **Testing Library** | Rapide, intégration native à Vite |
| Code mort | **knip** | Repère fichiers, exports et dépendances inutilisés (`make knip`, inclus dans `make check`) |

**Pas de back-end métier** dans la v1 (ni base, ni compte). Les niveaux sont
des fichiers JSON commités, indexés par chaque `<jeu>/challenges/index.ts`
(`import.meta.glob`, chargement à la demande). Les `loader` des routes, côté
serveur, n'envoient au navigateur que les bornes du calendrier (listes) ou le niveau joué
(partie) : embarquer tous les niveaux dans chaque page pesait 4 Mo. La
progression locale est stockée en `localStorage`.

---

## 2. Routing

| Route | Rôle |
|---|---|
| `/` | Accueil : les quatre jeux avec leur miniature |
| `/<jeu>` | Liste des niveaux : défi du jour, puis archives par mois (`ChallengeListPage`) |
| `/<jeu>/:date/:index` | Partie : un niveau (date + index 1..4) |

Jeux : `sokomot`, `boucle`, `semantogramme`, `anglemort`.

Chaque page de partie charge son niveau dans un `loader` côté serveur
(`loadLevelRoute`), puis un wrapper affiche `LevelNotFound` si le niveau
manque, et sinon remonte la partie sur un `key` propre au niveau (cf.
AGENTS.md §« Pattern critique »).

---

## 3. Modèle commun des moteurs

Séparation stricte **moteur / rendu** :

- `engine.ts` est pur : `loadLevel`, transitions propres au jeu, `reducer`,
  `isWon`. Aucun import React, aucun effet (ni console, ni localStorage, ni
  fetch), transitions immutables.
- L'annulation n'est pas dans les moteurs : chaque page enveloppe le `reducer`
  avec `withUndo` (`app/lib/undoable.ts`), qui garde la pile des états
  précédents. Le moteur reste simple et l'annulation se comporte pareil dans
  tous les jeux.
- La page orchestre : `useReducer`, clavier (`useGameKeyboard`), cycle de vie
  (`useLevelPlayLifecycle` : titre, retour, niveau suivant, variante de
  victoire, statut enregistré), aide (`useHint`), modale de victoire.

---

## 4. Spécifications par jeu

Règles et génération détaillées : [new-games.md](new-games.md).

### 4.1 Sokomot (Sokoban × Wordle)

- État : position du joueur, des blocs, coups joués, direction du dernier coup
  (qui oriente le crayon).
- Coup : une direction. Un bloc poussé bouge si la case derrière est libre ;
  sur la glace, joueur et blocs glissent jusqu'à un obstacle.
- Victoire : les blocs posés dans `target.cells` épèlent `target.word`.

### 4.2 Boucle (Slitherlink × mot caché)

- État : arêtes tracées par le joueur.
- Coup : basculer une arête.
- Victoire : une boucle fermée unique (chaque sommet de degré 2, sous-graphe
  connexe), qui respecte les indices, et dont les lettres intérieures
  (remplissage depuis un anneau extérieur virtuel) forment `solutionWord`.

### 4.3 Sémantogramme (Nonogram × Semantle)

- État : statut de chaque case (`unmarked` / `in` / `out`) et proposition de
  thème (comparée sans accents ni casse).
- Coup : faire tourner le statut d'une case.
- Victoire : les cases `in` correspondent exactement à `solution`, et le thème
  proposé est le bon.
- Toute la donnée sémantique vient d'une curation écrite à la main
  ([semantogramme-curation.md](semantogramme-curation.md)), aucun calcul
  sémantique à l'exécution.

### 4.4 Angle mort (placement pur)

- État : vigiles posés (type, position, orientation).
- Coup : poser un vigile du lot, le faire pivoter ou le retirer ; seules les
  poses comptent.
- Victoire : tout le lot est posé, les indices sont respectés, et les cases
  laissées dans l'ombre forment un couloir unique de la porte au diamant.

---

## 5. Persistance locale

`localStorage`, clé `ptitjeux.progress` :

```ts
type Progress = {
  [gameId: string]: {
    [levelId: string]: { status: 'solved' | 'perfect'; lastPlayedAt: string }
  }
}
```

Un niveau n'est enregistré qu'une fois réussi, avec son statut figé à la
victoire (`recordWin` garde `perfect` s'il est déjà acquis) : les listes
colorent leurs coches sans avoir besoin des niveaux. Lecture et écriture sont
SSR-safe (`app/lib/localStorage.ts`), et `useLocalProgress` hydrate après le
montage puis suit les autres onglets.

---

## 6. Hors scope v1

- Comptes utilisateurs / authentification
- Niveaux quotidiens partagés (nécessite back-end)
- Classements
- Génération procédurale à l'exécution
- Solveur automatique côté UI
- Internationalisation (français uniquement)
- Mode multijoueur
