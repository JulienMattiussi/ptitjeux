# Plan projet — ptitjeux

Plateforme web de mini-jeux logico-spatiaux, full front-end.

> **Document de référence opérationnelle :** [AGENTS.md](../AGENTS.md). Ce
> fichier complète AGENTS.md avec le « pourquoi » architectural (choix de
> stack, scope v1, jalons restants).

---

## 1. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| Framework | **React Router 7** (Framework Mode) | Évolution officielle de Remix v2 (fusion 2025) ; SSR + nested routes ; types générés ; ergonomie front |
| Langage | **TypeScript** strict | Sécurité de typage critique pour les moteurs de jeu |
| Style | **Tailwind CSS v4** | Itération rapide ; suffisant pour des UI puzzle |
| Tests | **Vitest** + **Testing Library** | Rapide, intégration native Vite |
| Lint/Format | **ESLint** (flat config, `typescript-eslint`) + **Prettier** | Setup standard |
| Build | **Vite 8** + `@react-router/dev` | Bundling et dev server |

**Pas de back-end** dans la v1. Les niveaux sont des fichiers JSON commités,
chargés par chaque `<jeu>/challenges/index.ts` via `import.meta.glob` (statique,
embarqué au build). Pas de comptes, pas de scores serveur. La progression
locale est stockée en `localStorage`.

---

## 2. Structure de répertoire

```
ptitjeux/
├── docs/
│   ├── existing-games.md
│   ├── new-games.md
│   ├── project-plan.md
│   └── semantogramme-curation.md
├── app/
│   ├── root.tsx                       # Layout HTML, lang="fr"
│   ├── routes.ts                      # Config des routes
│   ├── app.css                        # Tailwind + variables globales
│   ├── routes/
│   │   ├── home.tsx                   # /
│   │   ├── <jeu>.tsx                  # /<jeu> — sélecteur de niveau
│   │   └── <jeu>.$date.$index.tsx     # /<jeu>/:date/:index — partie
│   ├── games/
│   │   ├── index.ts                   # `getLevelParMoves` agrégé
│   │   └── <jeu>/
│   │       ├── engine.ts              # Logique pure
│   │       ├── types.ts
│   │       ├── Board.tsx              # Rendu de la grille
│   │       └── challenges/
│   │           ├── index.ts           # buildChallengeIndex
│   │           └── <YYYY-MM>/         # JSON des niveaux
│   ├── components/                    # Composants partagés
│   └── lib/                           # Utilitaires, hooks
├── generators/                        # Build-time, jamais bundlé
├── scripts/
│   └── generate-levels.ts             # CLI de génération
├── public/
├── tests/
│   ├── setup.ts
│   ├── unit/                          # Logique pure
│   └── component/                     # Rendu RTL
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

---

## 3. Routing

| Route | Composant | Rôle |
|---|---|---|
| `/` | `routes/home.tsx` | Home, liste des jeux disponibles avec vignettes |
| `/sokomot` | `routes/sokomot.tsx` | Sélecteur de niveau Sokomot |
| `/sokomot/:date/:index` | `routes/sokomot.$date.$index.tsx` | Joue un niveau (date + index 1..4) |
| `/boucle` | `routes/boucle.tsx` | Sélecteur Boucle |
| `/boucle/:date/:index` | `routes/boucle.$date.$index.tsx` | Joue un niveau Boucle |
| `/semantogramme` | `routes/semantogramme.tsx` | Sélecteur Sémantogramme |
| `/semantogramme/:date/:index` | `routes/semantogramme.$date.$index.tsx` | Joue un niveau Sémantogramme |

Chargement du niveau : les fichiers JSON sont indexés à la compilation par
`import.meta.glob` et accessibles via `getLevel(date, index)` côté client.
Pas de `loader` côté serveur — le rendu reste statique.

Le pattern wrapper-pour-remount (`key={\`${date}-${index}\`}`) est obligatoire
dans chaque page `<jeu>.$date.$index.tsx` pour forcer un état frais quand on
passe au niveau suivant via l'URL (cf. AGENTS.md §« Pattern critique »).

---

## 4. Architecture commune des moteurs de jeu

Chaque jeu suit le même pattern, séparation stricte **moteur / rendu** :

### 4.1 Moteur (logique pure, testable sans DOM)

```ts
// app/games/<jeu>/engine.ts

export type Level = { /* JSON parsé */ }
export type GameState = { /* état courant */ }
export type Move = { /* action joueur */ }

export function loadLevel(level: Level): GameState
export function applyMove(state: GameState, move: Move): GameState
export function isWon(state: GameState): boolean
```

Contraintes :
- 100 % testable en Vitest sans rendu (aucun import React dans `engine.ts`).
- Transitions **immutables** (retournent un nouveau `GameState`).
- L'historique des coups est dans `state.history` quand l'undo est supporté
  (Sokomot uniquement à ce jour).
- Pas d'effets : pas de console.log, pas de localStorage, pas de fetch.

### 4.2 Rendu (composants React)

Le composant page orchestre :
- Lecture du niveau via `getLevel(date, index)`.
- État local via `useReducer` qui appelle `applyMove`.
- Clavier via `useGameKeyboard` (hook partagé).
- Cycle de vie via `useLevelPlayLifecycle` (étiquette du jour, niveau suivant,
  écriture progression à la victoire).
- Détection de victoire et `<VictoryOverlay>` avec variante `perfect`/`solved`.

---

## 5. Spécifications par jeu

### 5.1 Sokomot — Sokoban × Wordle

**Format de niveau** : cf. [new-games.md](new-games.md) §1.

**Moteur** :
- État : position joueur, position des blocs, nombre de coups, historique.
- Move : direction (`up`/`down`/`left`/`right`).
- Logique de poussée : un bloc poussé bouge si la case derrière est libre.
- Logique de glace : sur les cases glacées, joueur et blocs glissent jusqu'à
  un obstacle.
- Victoire : les blocs alignés dans `target.cells` épèlent `target.word`.

**UI** : grille CSS Grid, motif de glace par CSS pattern, blocs avec lettre,
crayon-personnage orienté selon la dernière direction. Flèches + ZQSD/WASD +
undo (Ctrl+Z) + reset (R).

### 5.2 Boucle — Slitherlink × mot caché

**Format de niveau** : cf. [new-games.md](new-games.md) §2.

**Moteur** :
- État : ensemble d'arêtes activées par le joueur.
- Move : toggle d'une arête.
- Validation : la sélection forme une boucle fermée unique (chaque sommet a
  un degré 2 et le sous-graphe est connexe), respecte les indices, et les
  lettres internes (flood-fill depuis un anneau extérieur virtuel) forment
  `solutionWord`.

**UI** : grille SVG avec arêtes survolables et toggle au clic ; navigation
clavier via `moveEdgeSelection` (pivot horizontal↔vertical).

### 5.3 Sémantogramme — Nonogram × Semantle

**Format de niveau** : cf. [new-games.md](new-games.md) §3.

**Moteur** :
- État : pour chaque case, statut `unmarked` / `in` / `out`. Devinette du
  thème via un champ texte (normalisé NFD pour ignorer les accents).
- Move : cycler le statut d'une case.
- Victoire : les cases `in` correspondent exactement à `solution`, ET le
  mot-thème saisi est correct.

**UI** : grille avec mots, indices Nonogram en marges, champ de saisie du
thème quand la grille est résolue. Navigation clavier via `moveCellCursor`.

Toute la donnée sémantique est précalculée offline (cf. AGENTS.md §Format),
pas de calcul d'embeddings à l'exécution.

---

## 6. Home page

Liste les jeux disponibles avec :
- Nom du jeu + courte description.
- Vignette SVG résumant la mécanique.
- Lien vers le sélecteur de niveau du jeu.

**Source de données** : `app/lib/games-registry.ts`, fichier statique avec
nom, tagline, description, href et classe d'accent.

---

## 7. Persistance locale

Pas de back-end. `localStorage` stocke (clé `ptitjeux.progress`) :

```ts
type Progress = {
  [gameId: string]: {
    [levelId: string]: {
      completed: boolean
      bestMoves?: number
      lastPlayedAt: string
    }
  }
}
```

Wrappers centralisés dans `app/lib/localStorage.ts` (lecture/écriture
SSR-safe : pas d'accès `window` en SSR) et `app/lib/useLocalProgress.ts`
(hook qui hydrate après mount et écoute l'event `storage` cross-onglets).

---

## 8. Tests

Couverture attendue (cf. AGENTS.md §Tests) :
- **Moteurs** ≥ 90 % statements et branches.
- **`app/lib/`** ≥ 90 % statements (hooks testés via `renderHook`).
- **Composants critiques** : `ChallengeListPage`, `ArchiveAccordion`,
  `LevelTile`, `VictoryOverlay`, `WordDefinition` — tests RTL.
- **Routes de jeu** : smoke tests (rendu + URL invalide).
- **Générateurs** : un test par jeu, branche curée et branche aléatoire.
- **Tests d'intégrité de niveaux** : rejoue la solution stockée dans chaque
  JSON. Bloquant par construction (la map `SOLUTIONS` / `LEVEL_IDS` doit
  être mise à jour à chaque ajout de niveau).

---

## 9. Hors scope v1

- Comptes utilisateurs / authentification
- Niveaux quotidiens partagés (nécessite back-end)
- Classements
- Génération procédurale à l'exécution
- Solveur automatique côté UI
- Internationalisation (français uniquement)
- Mode multijoueur
