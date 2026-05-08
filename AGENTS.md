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

## Règles impératives

### Langue

- Tout le contenu **visible dans l'interface** (textes, labels, messages, titres, erreurs) est **en français**.
- Les commits, identifiants techniques, noms de variables, types, et **commentaires de code** sont en **anglais ou en français** mais cohérents au sein d'un fichier — la base est globalement en français côté commentaires métier.

### Chaque niveau doit être vérifié par un test d'intégrité

**Tout niveau livré (Sokomot, Boucle, Sémantogramme) doit avoir un test d'intégrité dans `tests/unit/<jeu>.levels.test.ts` qui prouve sa résolubilité.**

- **Sokomot** : encoder une séquence de coups (`Direction[]`) qui résout le niveau. Le test rejoue les coups et vérifie `isWon()`. Le test vérifie aussi que `moves.length ≤ parMoves`.
- **Boucle** : encoder la boucle attendue (typiquement via un helper `rectangleEdges` ou la liste explicite des arêtes), la jouer, vérifier `isValidLoop`, `areCluesSatisfied`, `getInsideWord` et `isWon`.
- **Sémantogramme** : vérifier que `rowClues` et `colClues` correspondent au comptage de la matrice `solution`, puis appliquer la solution et le `themeWord` et vérifier `isWon`.

**Ajouter un niveau sans son entrée dans le fichier de tests d'intégrité fait échouer le test concerné** (par construction : la map `SOLUTIONS` ou `LEVEL_IDS` doit être mise à jour). C'est intentionnel et bloquant.

Cette règle empêche de livrer un puzzle qu'on n'a pas su résoudre soi-même, et empêche les régressions dans le moteur (un changement de logique fait immédiatement tomber les tests d'intégrité des niveaux).

### Build vs runtime

- Les générateurs (`generators/`, `scripts/generate-levels.ts`) tournent **uniquement à la commande explicite** `make generate-levels`. Aucune autre cible (build, test, dev) ne les déclenche.
- Le dossier `generators/` n'est **jamais** importé depuis `app/` — son contenu (336 k mots, embeddings) ne doit pas finir dans le bundle runtime.
- Les niveaux JSON sont commités dans `app/games/<jeu>/challenges/<YYYY-MM>/<YYYY-MM-DD>-<index>.json`.

## Architecture

```
app/
├── root.tsx                       # Layout HTML, lang="fr"
├── routes.ts                      # Configuration des routes
├── app.css                        # Tailwind + variables globales
├── routes/
│   ├── home.tsx                   # /  — liste des jeux
│   ├── <jeu>.tsx                  # /<jeu> — sélecteur de niveau
│   └── <jeu>.$date.$index.tsx     # /<jeu>/:date/:index — partie
├── games/<jeu>/
│   ├── engine.ts                  # Logique pure, zéro React
│   ├── types.ts
│   ├── Board.tsx                  # Rendu SVG/DOM de la grille
│   └── challenges/
│       ├── index.ts               # Wrapper mince autour de buildChallengeIndex
│       └── <YYYY-MM>/             # JSON des niveaux
├── components/                    # Composants partagés (jamais spécifiques à un jeu)
└── lib/                           # Utilitaires, hooks, source de vérité partagée

generators/                        # Build-time uniquement, jamais bundlé
scripts/                           # Scripts CLI (génération de niveaux)
tests/
├── setup.ts                       # @testing-library/jest-dom matchers
├── unit/                          # Logique pure : moteurs, lib, generators, niveaux
└── component/                     # Rendu RTL : composants et hooks
```

## Architecture commune des moteurs de jeu

Séparation **moteur / rendu** stricte :

```ts
// app/games/<jeu>/engine.ts — logique pure, testable sans DOM
export type Level = { /* JSON parsé */ }
export type GameState = { /* état courant */ }
export type Move = { /* action joueur */ }

export function loadLevel(level: Level): GameState
export function applyMove(state: GameState, move: Move): GameState
export function isWon(state: GameState): boolean
```

- Aucun import React dans `engine.ts`.
- Toutes les transitions sont **immutables** (retournent un nouveau `GameState`).
- L'historique des coups est dans `state.history` (pour l'undo).
- Le composant React n'est qu'une projection visuelle de l'état.

## Qualité de code

### Source unique de vérité — pas de duplication

Tout pattern partagé entre les 3 jeux doit vivre dans `app/lib/` ou `app/components/`. **Ne pas dupliquer**, factoriser :

| Pattern | Source unique |
|---|---|
| Couleurs/accents par jeu | `app/lib/game-styles.ts` (`GAME_ACCENT`, `GAME_SIZE`, `isIceLevel`) |
| Catalogue des jeux | `app/lib/games-registry.ts` |
| Chargement des niveaux JSON | `app/lib/challenges-loader.ts` (`buildChallengeIndex`) |
| Clavier dans une page de jeu | `app/lib/useGameKeyboard.ts` (flèches + ZQSD + Espace/Entrée + Ctrl+Z + R) |
| Cycle de vie d'une partie | `app/lib/useLevelPlayLifecycle.ts` (isToday, dateChip, nextHref, écriture progression) |
| Lecture progression | `app/lib/useLocalProgress.ts` + `app/lib/localStorage.ts` |
| Statuts de complétion | `app/lib/completion.ts` (`unsolved` / `solved` / `perfect`) |
| Définitions Wiktionnaire | `app/components/WordDefinition.tsx` + `app/lib/wiktionary.ts` |

Avant d'écrire un nouveau composant ou hook, **vérifier qu'il n'existe pas déjà** un équivalent dans `lib/` ou `components/`. Avant de copier-coller du code entre 2 routes/jeux, **extraire** dans `lib/`.

### Atomicité

- **Une fonction = une responsabilité** : les moteurs séparent strictement chargement / move / win check / helpers.
- **Pas d'effets dans les fonctions du moteur** (pas de console.log, pas de localStorage, pas de fetch).
- **Pas de "managers" ou de classes-fourre-tout** — fonctions pures sur des structures plates.
- **Composants courts** (< 250 lignes). Si une page dépasse, extraire des sous-composants ou des hooks.

### TypeScript

- `strict: true`. **Aucun `any`, aucun `@ts-ignore`, aucun `as unknown as X`** sans justification documentée.
- Les `// eslint-disable-next-line` sont autorisés mais **rares** et toujours commentés (ex. hydratation SSR-safe).
- Préférer les types unions discriminés (`{ type: 'move'; ... } | { type: 'reset' }`) aux énumérations.

### Style

- Prettier : pas de point-virgule, single quotes, 100 cols, trailing comma all.
- Pas de commentaires qui décrivent **ce que** le code fait — seulement le **pourquoi** quand non évident (contraintes, invariants, workarounds).
- Pas de TODO/FIXME/HACK commités. Si le travail n'est pas fini, ouvrir un ticket ou laisser la branche non mergée.

### Conventions de nommage

- Composants React : `PascalCase.tsx`.
- Modules de logique et hooks : `camelCase.ts` (`useGameKeyboard.ts`, `wiktionary.ts`).
- Tests unitaires : `tests/unit/<sujet>.test.ts`. Tests de composants : `tests/component/<Sujet>.test.tsx`.
- `~/*` est l'alias de `app/*` (configuré dans `tsconfig.json` ET `vitest.config.ts`).

## Tests

### Couverture attendue

- **Moteurs (`app/games/*/engine.ts`)** : ≥ 90 % statements et branches. Toute fonction exportée doit être testée.
- **`app/lib/`** : ≥ 90 % statements pour les utilitaires non-triviaux. Les hooks (`use*.ts`) sont testés via `renderHook` de React Testing Library.
- **Composants critiques** (`VictoryOverlay`, `LevelTile`, `ChallengeListPage`) : tests RTL qui couvrent les branches visibles (états locked/solved/perfect, navigation clavier, accessibilité ARIA).
- **Générateurs** : un test par jeu qui appelle `generate<Jeu>Level` pour quelques dates et vérifie la solvabilité.
- **Tests d'intégrité de niveaux** : voir règle impérative ci-dessus, **un par niveau livré**.

### Atomicité des tests

- Un `it(...)` = **une assertion ou un scénario clair**, pas une longue séquence d'assertions sans rapport.
- Pas de mocks d'`engine.ts` dans les tests — les moteurs sont purs, on les appelle directement.
- Pas de mocks de `localStorage` — utiliser `window.localStorage.clear()` dans `beforeEach`/`afterEach`.
- Pas de tests dépendants de l'ordre. Pas d'état partagé entre tests.

### Tests de composants

- Toujours wrapper avec `<MemoryRouter>` (les composants utilisent `Link`/`useNavigate`).
- Préférer `userEvent` à `fireEvent` pour les interactions clavier/souris.
- Tester l'**API observable** : ce que voit l'utilisateur (texte, ARIA, navigation), pas l'état React interne.

### Commandes

```bash
make test            # tous les tests une fois
make test-watch      # mode watch
make test-coverage   # rapport coverage v8
make check           # build + lint + typecheck + test (pré-commit complet)
```

## Qualité d'expérience des jeux

### Clavier — obligatoire pour tout jeu

Toute interaction de jeu doit être faisable **sans souris**. Convention partagée via `useGameKeyboard` :

| Touche | Action |
|---|---|
| Flèches **↑↓←→** ou **ZQSD** | Déplacer le curseur (Boucle, Sémantogramme) ou le joueur (Sokomot) |
| **Espace** ou **Entrée** | Action principale (toggle arête, cycle case, etc.) |
| **Ctrl+Z** / **Cmd+Z** | Annuler le dernier coup (Sokomot) |
| **R** | Recommencer le niveau (Sokomot) |

Dans la **modale de victoire** (`VictoryOverlay`) :

| Touche | Action |
|---|---|
| **←** / **Backspace** / **Échap** | Retour à la liste des niveaux |
| **Entrée** ou **Espace** | Rejouer le niveau |
| **→** | Niveau suivant (si pas le dernier) |

Le hook ignore les frappes quand le focus est dans un `<input>`/`<textarea>` (option `ignoreInputs`), pour ne pas casser les champs de saisie (ex. devinette de thème en Sémantogramme).

La **synchronisation souris/clavier** est obligatoire : survoler une case avec la souris met aussi à jour la sélection clavier (props `onHoverCell` / `onHoverEdge`), pour ne jamais avoir deux curseurs distincts.

### Navigation et progression

- 4 niveaux par jour (indices 1..4), tailles **croissantes monotones** selon `GAME_SIZE`.
- Le niveau N+1 est **verrouillé tant que N n'est pas complété** (badge cadenas + tooltip explicatif).
- La date du jour affiche « **Défi du jour** » dans la barre du haut. Les autres jours affichent la date longue (« 7 mai 2026 »).
- Les **archives** sont groupées par mois, **accordéon avec un seul mois ouvert** à la fois.
- À la victoire, l'overlay propose **Retour / Rejouer / Suivant →**. Le bouton « Suivant » est masqué au niveau 4.

### Statuts visuels de complétion

Trois états (`app/lib/completion.ts`) avec sémantique stricte :

| Statut | Condition | Couleur |
|---|---|---|
| `unsolved` | jamais résolu | gris (texte d'accent neutre) |
| `solved` | résolu, mais `moves > parMoves` | **ambre** |
| `perfect` | résolu avec `moves ≤ parMoves` | **vert émeraude** |

La modale de victoire et les checkmarks reflètent ce statut : variante `perfect` célèbre fort (🎉, gradient vert), `solved` félicite plus discrètement (👍, gradient ambre).

### Couleurs d'accent par jeu

Source unique : `app/lib/game-styles.ts`.

| Jeu | Accent | Usage |
|---|---|---|
| Sokomot | sky → indigo | barres de cartes, ring de hover, badges de taille |
| Boucle | emerald → teal | id |
| Sémantogramme | amber → orange | id |

Tout composant qui rend des éléments dépendant du jeu **consomme `GAME_ACCENT[gameId]`** plutôt que de coder en dur les classes Tailwind.

### Animations et timing

- L'overlay de victoire de **Sokomot** attend **280 ms** après la victoire pour laisser le slide CSS (`duration-200`) terminer avant de s'afficher.
- L'overlay anime son apparition (`animate-fade-in-up`) ; la carte intérieure fait `animate-pop`.
- Les transitions de blocs / arêtes / cellules utilisent `duration-200` (pas plus, pour rester réactif).

### Mot du jour et définitions

- Tout niveau a un **mot cible** (Sokomot/Boucle) ou un **thème** (Sémantogramme).
- À l'arrivée sur la page de jeu, on **précharge** la définition Wiktionnaire (`prefetchDefinition`) pour qu'elle soit instantanée à la victoire.
- Le mot envoyé au Wiktionnaire est `level.canonicalWord ?? level.target.word` — préserve les **accents** (le display est ASCII pour la grille, le canonical avec accents pour l'API).
- Endpoint utilisé : **`fr.wiktionary.org/w/api.php`** (action=query, prop=extracts). Le REST `/api/rest_v1/page/definition` ne marche **pas** sur le Wiktionnaire FR (501).
- Cache module-level + dédup des requêtes en cours (`cache` + `inflight` dans `WordDefinition.tsx`).
- Si l'API échoue ou n'a pas de définition : on n'affiche **rien**, pas de message d'erreur.
- Priorisation : **Nom commun** d'abord, puis adjectif/verbe (voir `parseFrenchDefinition`).

### Dictionnaire (génération)

- `generators/words-fr-raw.json` : dictionnaire français complet (336 k mots, ~4.5 MB), licence MIT.
- `generators/wordlists.ts` filtre :
  - mots dont la version sans accents est `[A-Z]+` ;
  - longueurs 3 à 7 ;
  - dédup après normalisation.
- Chaque entrée garde **deux formes** : `display` (ASCII pour la grille) et `canonical` (avec accents pour le Wiktionnaire).

### Accessibilité

- Tous les boutons/liens ont un **label visible** ou `aria-label` explicite.
- Les niveaux verrouillés ont `aria-disabled="true"` et un `aria-label` explicatif (« Niveau 3 verrouillé. Termine d'abord le niveau 2 »).
- La modale de victoire a `role="dialog"`, `aria-modal="true"` et `aria-labelledby` qui pointe sur son titre.
- Mode sombre supporté partout (classes `dark:` Tailwind).

## Format des niveaux

- Chaque jeu définit son `Level` typé dans `app/games/<jeu>/types.ts`.
- Les niveaux sont des fichiers JSON dans `app/games/<jeu>/challenges/<YYYY-MM>/<YYYY-MM-DD>-<index>.json`.
- **Aucun calcul coûteux à l'exécution** — tout est précalculé offline (notamment les embeddings sémantiques pour Sémantogramme).
- Le champ `solution` (Sokomot) ou équivalent est uniquement lu par les **tests d'intégrité**, pas par le moteur runtime.
- Le champ `parMoves` définit l'objectif pour le statut `perfect`.

## Pattern critique — remount par `key`

Les pages `<jeu>.$date.$index.tsx` exposent un **wrapper** qui force un remount complet via `key={`${date}-${index}`}` à chaque changement d'URL :

```tsx
export default function SokomotPlayRoute() {
  const { date = '', index = '' } = useParams<{ date: string; index: string }>()
  return <SokomotPlay key={`${date}-${index}`} />
}
```

Sans ce wrapper, le `useReducer` interne garde l'état du niveau précédent quand l'utilisateur passe au niveau suivant via le bouton « Suivant ». **Ne pas retirer ce pattern.**

## SSR-safe localStorage

- `app/lib/localStorage.ts` détecte `typeof window` avant tout accès — appel safe pendant le rendu serveur.
- `useLocalProgress` lit le localStorage **dans un `useEffect`** (pas pendant le render) et écoute l'événement `storage` pour la sync cross-onglets.
- Si le localStorage est indisponible (mode privé, quota plein), les écritures échouent silencieusement.

## Commandes

| Commande | Action |
|---|---|
| `make install` | Installer les dépendances |
| `make start` | Démarrer le serveur de développement |
| `make build` | Compiler pour la production |
| `make test` | Lancer les tests Vitest (171 tests à ce jour) |
| `make test-coverage` | Tests + rapport de couverture v8 |
| `make typecheck` | Vérifier les types TypeScript |
| `make fix` | Formater (Prettier) + linter (ESLint) |
| `make check` | Toutes les vérifications (build + lint + typecheck + test) |
| `make generate-levels` | **(Manuel uniquement)** Régénérer les défis quotidiens |

> Le serveur dev tourne sur le port **2222** par défaut.

## Hors scope v1

- Comptes utilisateurs / authentification
- Niveaux quotidiens partagés (nécessite back-end)
- Classements
- Génération procédurale de niveaux à l'exécution
- Solveur automatique côté UI
- Internationalisation (français uniquement)
- Mode multijoueur
