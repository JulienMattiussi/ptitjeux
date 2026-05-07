# Secretgame — Agent File

## Description du projet

Plateforme web de mini-jeux logico-spatiaux, **full front-end**, sans backend.
Les niveaux sont des fichiers JSON statiques chargés par les routes du framework.
La progression locale est stockée dans `localStorage`.

Trois jeux dans la v1 :

1. **Sokomot** — Sokoban × Wordle. Pousser des blocs-lettres pour former un mot dans la zone cible. Variante "mode glace".
2. **Boucle** — Slitherlink × mot caché. Tracer une boucle fermée sur une grille de lettres ; les lettres encerclées forment le mot du jour.
3. **Sémantogramme** — Nonogram × Semantle. Identifier les mots liés à un thème caché dans une grille, à l'aide de chiffres en marge façon Nonogram.

Voir [docs/new-games.md](docs/new-games.md) pour les spécifications détaillées et [docs/project-plan.md](docs/project-plan.md) pour le plan global.

## Règle impérative — langue

Tout le contenu visible dans l'interface (textes, labels, messages, titres) est **en français**.
Les commits, identifiants techniques, noms de variables et commentaires de code restent en anglais.

## Règle impérative — chaque niveau doit être vérifié

**Tout niveau livré (Sokomot, Boucle, Sémantogramme) doit avoir un test d'intégrité dans `tests/unit/<jeu>.levels.test.ts` qui prouve sa résolubilité.**

- **Sokomot** : encoder une séquence de coups (`Direction[]`) qui résout le niveau. Le test rejoue les coups et vérifie `isWon()`. Le test vérifie aussi que `moves.length ≤ parMoves`.
- **Boucle** : encoder la boucle attendue (typiquement via un helper `rectangleEdges` ou la liste explicite des arêtes), la jouer, vérifier `isValidLoop`, `areCluesSatisfied`, `getInsideWord` et `isWon`.
- **Sémantogramme** : vérifier que `rowClues` et `colClues` correspondent au comptage de la matrice `solution`, puis appliquer la solution et le `themeWord` et vérifier `isWon`.

**Ajouter un niveau sans son entrée dans le fichier de tests d'intégrité fait échouer le test concerné** (par construction : la map `SOLUTIONS` ou `LEVEL_IDS` doit être mise à jour). C'est intentionnel et bloquant.

Cette règle empêche de livrer un puzzle qu'on n'a pas su résoudre soi-même, et empêche les régressions dans le moteur (un changement de logique fait immédiatement tomber les tests d'intégrité des niveaux).

## Stack technique

| Outil | Usage |
|---|---|
| React Router 7 (Framework Mode) | Anciennement Remix ; SSR + nested routes |
| React 19 + TypeScript strict | UI |
| Vite 8 | Build / dev server |
| Tailwind CSS v4 | Styles via `@tailwindcss/vite` |
| Vitest + Testing Library | Tests unitaires et composants |
| Prettier | Formatage |
| ESLint flat config (typescript-eslint) | Linting |

> Note : React Router 7 est l'évolution officielle de Remix v2 (fusion en 2025). On utilise le mode "Framework" qui fournit `loader`, routing par fichier, types générés.

## Architecture

```
app/
├── root.tsx                   # Layout HTML, lang="fr"
├── routes.ts                  # Configuration des routes
├── app.css                    # Tailwind + variables globales
├── routes/
│   ├── home.tsx               # /  — liste des jeux
│   ├── sokomot.tsx            # /sokomot — sélecteur de niveau
│   ├── sokomot.$levelId.tsx   # /sokomot/:levelId — partie
│   ├── boucle.tsx
│   ├── boucle.$levelId.tsx
│   ├── semantogramme.tsx
│   └── semantogramme.$levelId.tsx
├── games/
│   ├── sokomot/
│   │   ├── engine.ts          # Logique pure, zéro React
│   │   ├── types.ts
│   │   ├── Board.tsx          # Rendu de la grille
│   │   └── levels/            # JSON des niveaux
│   ├── boucle/
│   └── semantogramme/
├── components/
│   ├── GameCard.tsx           # Vignette home
│   └── GameLayout.tsx         # En-tête + zone de jeu + footer
└── lib/
    ├── games-registry.ts      # Catalogue des jeux disponibles
    └── localStorage.ts        # Wrapper SSR-safe pour la progression

tests/
├── setup.ts                   # Configuration jsdom + jest-dom matchers
├── unit/                      # Vitest — moteurs de jeu (logique pure)
└── component/                 # Vitest + Testing Library — composants
```

## Architecture commune des moteurs de jeu

Séparation stricte **moteur / rendu** :

```ts
// app/games/<jeu>/engine.ts — logique pure, testable sans DOM

export type Level = { /* JSON parsé */ }
export type GameState = { /* état courant */ }
export type Move = { /* action joueur */ }

export function loadLevel(level: Level): GameState
export function applyMove(state: GameState, move: Move): GameState
export function isWon(state: GameState): boolean
export function canMove(state: GameState, move: Move): boolean
```

Avantages :
- 100 % testable en Vitest sans rendu.
- Réutilisable (replay, solveur, génération).
- Le composant React n'est qu'une projection visuelle de l'état.

## Conventions

### Nommage
- Composants React : `PascalCase.tsx`
- Modules de logique : `camelCase.ts`
- Tests : à côté du fichier OU sous `tests/` selon la portée (préférer `tests/` pour la logique pure des moteurs).

### Tests obligatoires
- Tout moteur de jeu (`app/games/*/engine.ts`) a une suite Vitest qui couvre :
  - Chargement de niveau.
  - Transitions de mouvement valides + invalides.
  - Détection de victoire.
  - Cas particuliers spécifiques au jeu (glace pour Sokomot, indices Slitherlink ambigus pour Boucle…).

### Format des niveaux
Chaque jeu définit son `Level` typé dans `app/games/<jeu>/types.ts`.
Les niveaux sont des fichiers JSON statiques dans `app/games/<jeu>/levels/`.
Aucun calcul coûteux à l'exécution — tout est précalculé offline (notamment les embeddings sémantiques pour Sémantogramme).

## Commandes

| Commande | Action |
|---|---|
| `make install` | Installer les dépendances |
| `make start` | Démarrer le serveur de développement |
| `make build` | Compiler pour la production |
| `make test` | Lancer les tests Vitest |
| `make typecheck` | Vérifier les types TypeScript |
| `make fix` | Formater + linter |
| `make check` | Toutes les vérifications (build + lint + typecheck + test) |

## Hors scope v1

- Comptes utilisateurs / authentification
- Niveaux quotidiens partagés (nécessite back-end)
- Classements
- Génération procédurale de niveaux à l'exécution
- Solveur automatique
- Internationalisation (français uniquement)
- Mode multijoueur
