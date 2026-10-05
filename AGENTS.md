# Ptitjeux — Agent File

## Description du projet

Plateforme web de mini-jeux logico-spatiaux, **sans back-end métier** (ni base de données, ni compte) : un serveur React Router (SSR) rend les pages et n'envoie au navigateur que ce que chacune affiche.
Les niveaux sont des fichiers JSON statiques, lus par le serveur et envoyés un par un au navigateur (`loader` des routes).
La progression locale est stockée dans `localStorage`.

Quatre jeux :

1. **Sokomot** — Sokoban × Wordle. Pousser des blocs-lettres pour former un mot dans la zone cible. Variante "mode glace".
2. **Boucle** — Slitherlink × mot caché. Tracer une boucle fermée sur une grille de lettres ; les lettres encerclées forment le mot caché.
3. **Sémantogramme** — Nonogram × Semantle. Identifier les mots liés à un thème caché dans une grille, à l'aide de chiffres en marge façon Nonogram.
4. **Angle mort** : placement pur, sans mot. Chef de la sécurité corrompu, le joueur place et oriente ses vigiles pour que toute la salle soit éclairée sauf un couloir unique, de l'entrée au diamant, par lequel passe son complice cambrioleur.

Voir [docs/new-games.md](docs/new-games.md) pour les spécifications détaillées et [docs/project-plan.md](docs/project-plan.md) pour le plan global.

## Stack technique

| Outil | Usage |
|---|---|
| React Router 7 (Framework Mode) | Anciennement Remix ; SSR, routes déclarées dans `app/routes.ts` |
| React 19 + TypeScript strict | UI |
| Vite 8 | Build / dev server |
| Tailwind CSS v4 | Styles via `@tailwindcss/vite` |
| Vitest + Testing Library | Tests unitaires et composants |
| knip | Code mort (`make knip`) |
| Prettier | Formatage |
| ESLint flat config (typescript-eslint) | Linting |

> Note : React Router 7 est l'évolution officielle de Remix v2 (fusion en 2025). On utilise le mode "Framework" : routes déclarées dans `app/routes.ts`, SSR, types générés (`+types`).

## Règles impératives

### Langue

- Tout le contenu **visible dans l'interface** (textes, labels, messages, titres, erreurs) est **en français**.
- Les commits, identifiants techniques, noms de variables, types, et **commentaires de code** sont en **anglais ou en français** mais cohérents au sein d'un fichier — la base est globalement en français côté commentaires métier.

### Chaque niveau doit être vérifié par un test d'intégrité

**Tout niveau livré (Sokomot, Boucle, Sémantogramme, Angle mort) doit avoir un test d'intégrité dans `tests/unit/<jeu>.levels.test.ts` qui prouve sa résolubilité.**

- **Sokomot** : rejouer la `solution` du niveau (`Direction[]`, `replaySolution` dans `tests/helpers/sokomot.ts`), vérifier `isWon`, `solution.length ≤ parMoves`, et que `placementOrder` donne les rangs 1 à n. Aucun mot ne sert deux fois sur l'ensemble des niveaux (même mécanisme que Boucle).
- **Boucle** : reconstruire la boucle attendue à partir de `solutionInsideCells` (son contour), la jouer, vérifier `isValidLoop`, `areCluesSatisfied`, `getInsideWord` et `isWon`. Aucun mot ne sert deux fois sur l'ensemble des niveaux : le générateur exclut les mots déjà publiés (`usedWords`, fourni par `scripts/generate-levels.ts`).
- **Sémantogramme** : vérifier que `rowClues` et `colClues` correspondent au comptage de la matrice `solution`, puis appliquer la solution et le `themeWord` et vérifier `isWon`. Le même test vérifie les règles de variété : mots d'un jour tous différents et différents des thèmes du jour (règle 2), aucun mot commun avec les deux jours précédents (règle 3), pas deux mots de la même famille dans une grille (règle 4), thèmes tous distincts. La curation (`generators/semantogramme-curation/`) a son propre test sur tout le corpus (`tests/unit/semantogramme.curation.test.ts`), règles dans `generators/semantogramme-curation.ts` ; voir [docs/semantogramme-curation.md](docs/semantogramme-curation.md). **Ne jamais régénérer l'année Sémantogramme** : les grilles publiées sont relues et jouées. `make generate-levels` l'ignore sans `--game semantogramme` explicite, et `--clean` ne supprime jamais ses fichiers (`keptOnClean`, `scripts/level-files.ts`). Un mot à corriger se corrige localement, dans la curation et dans le JSON du niveau (procédure dans [docs/semantogramme-curation.md](docs/semantogramme-curation.md)).
- **Angle mort** : rejouer la `solution` pose par pose (pose puis rotations), vérifier `isWon` et `moves ≤ parMoves`, puis prouver que le **couloir est unique** (`generators/anglemort-corridors.ts` : couloirs compatibles avec les indices, chaque concurrent déclaré impossible par le solveur). Plusieurs poses peuvent produire ce couloir, c'est voulu. Le test parcourt tous les niveaux présents (`committedLevels`, `tests/helpers/levels.ts`), sans map à tenir à jour. Chaque grille de base sert 8 fois (symétries, qui conservent l'unicité), selon un cycle figé de 395 jours et 50 bases (`generators/anglemort-schedule.ts`) : prolonger le calendrier ne doit jamais réattribuer les dates déjà publiées. `make test` prouve l'unicité sur chaque grille d'origine, `make verify-levels` sur tous les niveaux. La preuve dispose d'un budget de solveur plus large que la génération (budget par défaut d'`isCorridorUnique` dans `generators/anglemort-corridors.ts`, contre `RIVAL_NODES` dans `generators/anglemort-clues.ts`) : une variante tournée peut demander plus de calcul que sa grille d'origine. Au niveau 4, la génération n'appelle jamais le solveur (trop lent avec les miroirs) : elle ajoute des indices jusqu'à ce qu'un seul couloir soit possible par la forme, la preuve est donc immédiate. Certaines grilles de base sont fixées (`FIXED_BASES`, `generators/anglemort-schedule.ts`) : la génération relit leur fichier au lieu de les recalculer (la grille d'essai `2026-10-04-4.json` en base 33, et 5 bases gardées telles qu'avant le plafond de piliers), et `--clean` ne les supprime jamais (`scripts/level-files.ts`).

**Les tests d'intégrité parcourent tous les niveaux présents** (`committedLevels`, `tests/helpers/levels.ts`) : un niveau ajouté est vérifié d'office, et un niveau dont la solution enregistrée ne résout pas la grille fait échouer le test. C'est intentionnel et bloquant.

Cette règle empêche de livrer un puzzle qu'on n'a pas su résoudre soi-même, et empêche les régressions dans le moteur (un changement de logique fait immédiatement tomber les tests d'intégrité des niveaux).

### Build vs runtime

- Les générateurs (`generators/`, `scripts/generate-levels.ts`) n'écrivent des niveaux qu'à la commande explicite `make generate-levels`. Les tests les appellent en mémoire (`tests/unit/*.generator.test.ts`, `make verify-levels`), sans rien écrire ; build et dev ne les touchent pas.
- Le dossier `generators/` n'est **jamais** importé depuis `app/` — son contenu (336 k mots, curation Sémantogramme) ne doit pas finir dans le bundle runtime.
- Les niveaux JSON sont commités dans `app/games/<jeu>/challenges/<YYYY-MM>/<YYYY-MM-DD>-<index>.json`.

## Architecture

```
app/
├── root.tsx                       # Layout HTML, lang="fr"
├── routes.ts                      # Configuration des routes
├── app.css                        # Tailwind + variables globales
├── routes/
│   ├── home.tsx                   # /  — liste des jeux
│   ├── <jeu>.tsx                  # /<jeu> : liste des niveaux (ChallengeListPage)
│   └── <jeu>.$date.$index.tsx     # /<jeu>/:date/:index : partie
├── games/
│   ├── types.ts                   # LevelIndex, LEVEL_INDICES
│   ├── thumbnails.ts              # Miniature de chaque jeu (accueil, tuiles)
│   └── <jeu>/
│       ├── engine.ts              # Logique pure, zéro React
│       ├── types.ts
│       ├── Board.tsx              # Rendu SVG/DOM de la grille
│       ├── Thumbnail.tsx          # Mini-illustration du jeu
│       └── challenges/
│           ├── index.ts           # Wrapper mince autour de gameChallenges (import.meta.glob paresseux)
│           └── <YYYY-MM>/         # JSON des niveaux
├── components/                    # Composants partagés (jamais spécifiques à un jeu)
└── lib/                           # Utilitaires, hooks, source de vérité partagée

generators/                        # Build-time uniquement, jamais bundlé (modules décrits dans generators/README.md)
scripts/                           # Scripts CLI (génération de niveaux)
tests/
├── setup.ts                       # @testing-library/jest-dom matchers
├── helpers/                       # Tous les niveaux publiés, rejeu des solutions, rendu d'une route avec son loader
├── unit/                          # Logique pure : moteurs, lib, generators, niveaux
├── component/                     # Rendu RTL : composants et hooks
└── levels/                        # Vérifications lourdes (make verify-levels) : unicité, générateurs en masse
```

## Architecture commune des moteurs de jeu

Séparation **moteur / rendu** stricte :

```ts
// app/games/<jeu>/engine.ts : logique pure, testable sans DOM
export function loadLevel(level: Level): GameState
export function toggleEdge(state: GameState, edge: Edge): GameState // transitions propres au jeu
export type Action = { type: 'toggle'; edge: Edge } | { type: 'reset' }
export function reducer(state: GameState, action: Action): GameState
export function isWon(state: GameState): boolean
```

- Aucun import React dans `engine.ts`.
- Toutes les transitions sont **immutables** (retournent un nouveau `GameState`).
- L'annulation ne vit pas dans les moteurs : chaque page enveloppe le `reducer` avec `withUndo` (`app/lib/undoable.ts`), qui garde la pile des états précédents.
- Le composant React n'est qu'une projection visuelle de l'état.

## Qualité de code

### Source unique de vérité — pas de duplication

Tout pattern partagé entre les jeux doit vivre dans `app/lib/` ou `app/components/`. **Ne pas dupliquer**, factoriser :

| Pattern | Source unique |
|---|---|
| Couleurs/accents et tailles par jeu | `app/lib/game-styles.ts` (`GameId`, `GAME_ACCENT`, `GAME_SIZE`) |
| Catalogue des jeux | `app/lib/games-registry.ts` (`games`, `findGame`) |
| Chargement des niveaux JSON | `app/lib/challenges-loader.ts` (`gameChallenges` : dates, chargement d'un seul niveau) |
| `loader` des pages de liste et de partie | `app/lib/levelRoute.ts` (`loadListRoute`, `loadLevelRoute`, `PlayProps`) |
| Index des niveaux d'un jour | `app/games/types.ts` (`LevelIndex`, `LEVEL_INDICES`) |
| Miniature de chaque jeu | `app/games/thumbnails.ts` (`THUMBNAILS`) |
| Page « liste des niveaux » | `app/components/ChallengeListPage.tsx` (+ `ArchiveAccordion`, `LevelTile`) |
| Cadre d'une page de partie | `app/components/GameLayout.tsx`, `GameFrame.tsx`, `PlaySidebar.tsx`, `HelpBox.tsx` |
| Clavier dans une page de jeu | `app/lib/useGameKeyboard.ts` (flèches + ZQSD/WASD + Espace/Entrée + Ctrl+Z + R + Échap) |
| Clavier hors des pages de jeu | `app/lib/useGridNavigation.ts` + `app/lib/spatialFocus.ts` (attribut `data-nav-item`) |
| Cycle de vie d'une partie | `app/lib/useLevelPlayLifecycle.ts` (titre, retour, niveau suivant, variante de victoire, enregistrement du statut) |
| Progression | `app/lib/localStorage.ts` (`levelKey`, `recordWin`) + `app/lib/useLocalProgress.ts` |
| Statuts de complétion | `app/lib/completion.ts` (`unsolved` / `solved` / `perfect`, `SolvedStatus`, `victoryVariant`, `dayStatuses`) |
| Modale de victoire | `app/components/VictoryOverlay.tsx` + `app/components/ParObjective.tsx` (« Objectif N atteint ») |
| Coches de complétion | `app/components/CheckMark.tsx` |
| Direction et curseur de case (clavier) | `app/lib/cursor.ts` (`Direction`, `CellCursor`, `moveCellCursor`) |
| Accents et pluriels | `app/lib/text.ts` (`stripAccents`, `plural`) |
| Dates (format, libellés français, drapeaux de dev) | `app/lib/dates.ts` |
| Balises SEO et de partage | `app/lib/seo.ts` (`pageMeta`, `gameListMeta`, `gamePlayMeta`) |
| Ref toujours à jour | `app/lib/useLatestRef.ts` |
| Appui long au doigt (équivalent du clic droit) | `app/lib/useLongPress.ts` |
| Page « niveau introuvable » | `app/components/LevelNotFound.tsx` |
| Définitions Wiktionnaire | `app/components/WordDefinition.tsx` + `app/lib/wiktionary.ts` |
| Compteur de coups + objectif (sidebar) | `app/components/MovesCard.tsx` (extras du jeu en `children`) |
| Boutons Annuler (Ctrl+Z) / Recommencer (R) | `app/components/PlayControls.tsx` |
| Aide « Coincé ? » (au-delà de 2 × `parMoves`) | `app/lib/useHint.ts` + `app/components/HintButton.tsx` (prop `hint` de `MovesCard`) |
| Annulation (tous les jeux) | `app/lib/undoable.ts` (`withUndo`, `undoable`) |
| Icônes SVG, bouton secondaire, ligne de statut | `app/components/icons.tsx`, `OutlineButton.tsx`, `StatusRow.tsx` |
| Carte d'un jeu (accueil) | `app/components/GameCard.tsx` |

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
- `make format` couvre tout le code (`app/`, `tests/`, `generators/`, `scripts/`, configs racine). Exclus via `.prettierignore` : niveaux JSON générés, dictionnaire, données de curation Sémantogramme.
- Pas de commentaires qui décrivent **ce que** le code fait — seulement le **pourquoi** quand non évident (contraintes, invariants, workarounds).
- Pas de TODO/FIXME/HACK commités. Si le travail n'est pas fini, ouvrir un ticket ou laisser la branche non mergée.

### Conventions de nommage

- Composants React : `PascalCase.tsx`.
- Modules de logique et hooks : `camelCase.ts` (`useGameKeyboard.ts`, `wiktionary.ts`).
- Tests unitaires : `tests/unit/<préfixe>.<module>.test.ts`, avec le préfixe `<jeu>` pour le code d'un jeu (`boucle.engine`, `anglemort.corridors`), `lib` pour `app/lib`, `generators` pour un module commun des générateurs, `scripts` pour `scripts/`, `games` pour ce qui concerne tous les jeux.
- Tests de composants et de hooks : `tests/component/<Composant>.test.tsx` ou `<useHook>.test.tsx` ; `<Jeu>Board` pour le plateau d'un jeu ; `routes.<sujet>.test.tsx` pour les routes.
- `~/*` est l'alias de `app/*` (configuré dans `tsconfig.json` ET `vitest.config.ts`).

## Tests

### Couverture attendue

- **Moteurs (`app/games/*/engine.ts`)** : ≥ 90 % statements et branches. Toute fonction exportée doit être testée.
- **`app/lib/`** : ≥ 90 % statements pour les utilitaires non-triviaux. Les hooks (`use*.ts`) sont testés via `renderHook` de React Testing Library.
- **Composants critiques** (`VictoryOverlay`, `LevelTile`, `ChallengeListPage`) : tests RTL qui couvrent les branches visibles (états locked/solved/perfect, navigation clavier, accessibilité ARIA).
- **Générateurs** : un test par jeu qui appelle `generate<Jeu>Level` pour quelques dates et vérifie la solvabilité. Le balayage sur un large échantillon de dates (`tests/levels/generators.bulk.test.ts`) tourne dans `make verify-levels`.
- **Tests d'intégrité de niveaux** : voir règle impérative ci-dessus, **un par niveau livré**.

### Atomicité des tests

- Un `it(...)` = **une assertion ou un scénario clair**, pas une longue séquence d'assertions sans rapport.
- Pas de mocks d'`engine.ts` dans les tests — les moteurs sont purs, on les appelle directement.
- Pas de mocks de `localStorage` — utiliser `window.localStorage.clear()` dans `beforeEach`/`afterEach`.
- Pas de tests dépendants de l'ordre. Pas d'état partagé entre tests.

### Tests de composants

- Toujours wrapper avec `<MemoryRouter>` (les composants utilisent `Link`/`useNavigate`) ; une route avec son `loader` se rend avec `renderRoute` (`tests/helpers/routes.tsx`).
- Préférer `userEvent` à `fireEvent` pour les interactions clavier/souris.
- Tester l'**API observable** : ce que voit l'utilisateur (texte, ARIA, navigation), pas l'état React interne.

### Commandes

```bash
make test            # tous les tests une fois
make test-watch      # mode watch
make test-coverage   # rapport coverage v8
make knip            # code mort : fichiers, exports, dépendances inutilisés
make knip-production # ce que seuls les tests utilisent : à trier à la main (les primitives des moteurs sont exportées pour être testées)
make check           # build + lint + knip + typecheck + test (pré-commit complet)
make verify-levels   # vérifications lourdes des niveaux, après chaque make generate-levels
```

## Qualité d'expérience des jeux

### Clavier — obligatoire pour tout jeu

Toute interaction de jeu doit être faisable **sans souris**. Convention partagée via `useGameKeyboard` :

| Touche | Action |
|---|---|
| Flèches **↑↓←→**, **ZQSD** (AZERTY) ou **WASD** (QWERTY) | Déplacer le curseur (Boucle, Sémantogramme, Angle mort) ou le joueur (Sokomot) |
| **Espace** ou **Entrée** | Action principale (toggle arête, cycle case, etc.). Si le jeu fournit `onSecondaryAction`, Entrée la déclenche et seul Espace reste l'action principale (Angle mort : Espace pose ou retire, Entrée fait pivoter). |
| **Ctrl+Z** / **Cmd+Z** | Annuler le dernier coup (tous les jeux) |
| **R** | Recommencer le niveau (tous les jeux ; Ctrl+R reste le rechargement du navigateur) |
| **Échap** | Quitter la partie, retour à la liste des niveaux (tous les jeux) |
| **1**, **2**, **3** | Choisir le type de vigile à poser (Angle mort, dès que le lot mélange plusieurs types). Lus aussi par position physique (`event.code`) : sur AZERTY, la rangée des chiffres produit `&`, `é`, `"` sans Majuscule. |

`useGameKeyboard` ignore les frappes quand le focus est dans un `<input>`/`<textarea>` (option `ignoreInputs`), pour ne pas casser les champs de saisie (ex. devinette de thème en Sémantogramme).

Dans la **modale de victoire** (`VictoryOverlay`) :

| Touche | Action |
|---|---|
| **←** / **Backspace** / **Échap** | Retour à la liste des niveaux |
| **Entrée** ou **Espace** | Rejouer le niveau |
| **→** | Niveau suivant (si pas le dernier) |

Hors des pages de jeu (accueil, liste des niveaux), `app/lib/useGridNavigation.ts` rend tout faisable au clavier :

| Touche | Action |
|---|---|
| Flèches / ZQSD / WASD | Déplacer le focus vers l'élément `data-nav-item` le plus proche à l'écran (`app/lib/spatialFocus.ts`), quelle que soit la mise en page |
| **Entrée** ou **Espace** | Entrer dans le jeu, lancer le niveau, ouvrir/fermer un mois |
| **Retour arrière** ou **Échap** | Page précédente (liste des niveaux → accueil) |

La première flèche se pose sur un élément utile (sur la liste : le jour d'où l'on revient via `?from=`, sinon le défi du jour). Tout nouvel élément cliquable de navigation porte `data-nav-item=""` et un contour `focus-visible` lisible. Les niveaux verrouillés restent focalisables (pour lire pourquoi), sans effet à l'activation.

La **synchronisation souris/clavier** est obligatoire : survoler une case avec la souris met aussi à jour la sélection clavier (props `onHoverCell` / `onHoverEdge`), pour ne jamais avoir deux curseurs distincts.

### Navigation et progression

- 4 niveaux par jour (indices 1..4), tailles **croissantes monotones** selon `GAME_SIZE`.
- Le niveau N+1 est **verrouillé tant que N n'est pas complété** (badge cadenas + tooltip explicatif).
- La date du jour affiche « **Défi du jour** » dans la barre du haut. Les autres jours affichent la date longue (« 7 mai 2026 »).
- Le défi change à **minuit, heure de Paris**, pour tout le monde (`todayString`, `app/lib/dates.ts`) : le serveur et le navigateur calculent ainsi le même jour.
- Un défi à venir n'est pas publié : la liste ne le montre pas et son URL répond 404 (`loadLevelRoute`), sauf avec `VITE_SHOW_FUTURE_DAYS=1`. Une URL mal formée (date hors `YYYY-MM-DD`, index hors 1 à 4) répond aussi 404.
- Les **archives** sont groupées par mois, **accordéon avec un seul mois ouvert** à la fois.
- À la victoire, l'overlay propose **← Niveaux / Rejouer / Suivant →**. Le bouton « Suivant » est masqué au niveau 4.

### Statuts visuels de complétion

Trois états (`app/lib/completion.ts`) avec sémantique stricte :

| Statut | Condition | Couleur |
|---|---|---|
| `unsolved` | jamais résolu | gris (texte d'accent neutre) |
| `solved` | résolu, mais `moves > parMoves` | **ambre** |
| `perfect` | résolu avec `moves ≤ parMoves` | **vert émeraude** |

La modale de victoire et les checkmarks reflètent ce statut : variante `perfect` célèbre fort (🎉, gradient vert), `solved` félicite plus discrètement (👍, gradient ambre).

Le statut est **enregistré à la victoire** dans la sauvegarde (`recordWin`), jamais recalculé : les listes n'ont ainsi besoin que des bornes du calendrier, pas des niveaux. Un statut parfait est conservé : rejouer en plus de coups ne fait pas repasser le niveau en ambre.

### Couleurs d'accent par jeu

Source unique : `app/lib/game-styles.ts`.

| Jeu | Accent | Usage |
|---|---|---|
| Sokomot | sky → indigo | barres de cartes, ring de hover, badges de taille |
| Boucle | emerald → teal | id |
| Sémantogramme | amber → orange | id |
| Angle mort | violet → fuchsia | id |

Tout composant qui rend des éléments dépendant du jeu **consomme `GAME_ACCENT[gameId]`** plutôt que de coder en dur les classes Tailwind.

### Animations et timing

- L'overlay de victoire de **Sokomot** attend **280 ms** après la victoire pour laisser le slide CSS (`duration-200`) terminer avant de s'afficher.
- Dans **Angle mort**, l'overlay attend que le cambrioleur ait traversé le couloir (`useThiefWalk`, 140 ms par case, plus un pas de pause au diamant).
- L'overlay anime son apparition (`animate-fade-in-up`) ; la carte intérieure fait `animate-pop`.
- Les transitions de blocs / arêtes / cellules utilisent `duration-200` (pas plus, pour rester réactif).

### Aide

Quand le joueur dépasse le double de `parMoves` (`HINT_PAR_FACTOR` dans `app/lib/useHint.ts`), un bouton « Coincé ? Un peu d'aide ? » apparaît à droite du compteur de coups. Une fois proposé, il reste proposé (annuler ou recommencer ne le retire pas) ; une fois révélée, l'aide reste affichée jusqu'à la fin de la partie. Ce qu'elle révèle dépend du jeu :

| Jeu | Aide |
|---|---|
| Sokomot | Rang de pose de chaque lettre, tiré de la `solution` (`placementOrder`) |
| Boucle | Le mot à encercler |
| Sémantogramme | Le ou les domaines de sens du thème (champ `domains` du niveau, tiré de `domains.json`) ; un domaine qui trahit le thème est écarté, à défaut on montre la catégorie (`helpDomains` dans `generators/semantogramme-curation.ts`) |
| Angle mort | Le couloir attendu, teinté sur la grille (`expectedCorridor`) |

### Mot du jour et définitions

- Tout niveau à mots a un **mot cible** (Sokomot/Boucle) ou un **thème** (Sémantogramme). Angle mort n'a pas de mot.
- Un même jour, deux jeux ne font jamais chercher le même mot (`tests/unit/games.daily-words.test.ts`) : `scripts/generate-levels.ts` exclut les mots déjà publiés par les autres jeux à cette date. Les thèmes Sémantogramme étant fixés par la curation, une collision se règle en régénérant le niveau de l'autre jeu.
- À l'arrivée sur la page de jeu, on **précharge** la définition Wiktionnaire (`prefetchDefinition`) pour qu'elle soit instantanée à la victoire.
- Le mot envoyé au Wiktionnaire est `level.canonicalWord` (Sokomot, Boucle) ou `level.themeWord` (Sémantogramme) : il garde les **accents** (la grille affiche la forme ASCII).
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
- **Jamais tous les niveaux d'un coup** : le navigateur ne reçoit que les bornes du calendrier, première et dernière date (listes, `loadListRoute` ; le calendrier est continu, vérifié par `games.calendar.test.ts`), ou le niveau joué (partie, `loadLevelRoute`).
- **Aucun calcul coûteux à l'exécution** — tout est précalculé offline (Sémantogramme : grilles tirées d'une curation écrite à la main, aucun calcul sémantique).
- Le champ `solution` (Sokomot) ou équivalent est lu par les **tests d'intégrité** et par l'**aide** (voir « Aide »), jamais par la logique de jeu, sauf Sémantogramme, dont `solution` définit la grille résolue.
- Le champ `parMoves` définit l'objectif pour le statut `perfect`.

## Pattern critique — remount par `key`

Les pages `<jeu>.$date.$index.tsx` chargent leur niveau dans un `loader` (côté serveur), puis exposent un **wrapper** qui affiche `LevelNotFound` si le niveau n'existe pas, et sinon force un remount complet via `key` à chaque changement de niveau :

```tsx
export function loader({ params }: { params: LevelParams }) {
  return loadLevelRoute(params, challenges)
}

export default function SokomotPlayRoute({ loaderData }: Route.ComponentProps) {
  const { date, idx, level, lastDate } = loaderData
  if (!level) return <LevelNotFound backHref="/sokomot" />
  return <SokomotPlay key={`${date}-${idx}`} level={level} date={date} idx={idx} lastDate={lastDate} />
}
```

Sans ce wrapper, le `useReducer` interne garde l'état du niveau précédent quand l'utilisateur passe au niveau suivant via le bouton « Suivant ». Il garantit aussi à la partie un niveau toujours défini. **Ne pas retirer ce pattern.**

## SSR-safe localStorage

- `app/lib/localStorage.ts` détecte `typeof window` avant tout accès — appel safe pendant le rendu serveur.
- `useLocalProgress` lit le localStorage **dans un `useEffect`** (pas pendant le render) et écoute l'événement `storage` pour la sync cross-onglets.
- Si le localStorage est indisponible (mode privé, quota plein), les écritures échouent silencieusement.

## Drapeaux de dev

Dans `.env.local` (non versionné) : `VITE_SHOW_FUTURE_DAYS=1` montre les défis à venir dans les archives, `VITE_FREEZE_TODAY=last-available` fige « aujourd'hui » sur le dernier défi publié (`app/lib/dates.ts`). Les tests les ignorent (`envDir: false` dans `vitest.config.ts`) pour ne pas dépendre de la machine.

## Commandes

| Commande | Action |
|---|---|
| `make install` | Installer les dépendances |
| `make start` | Démarrer le serveur de développement |
| `make build` | Compiler pour la production |
| `make test` | Lancer les tests Vitest |
| `make test-coverage` | Tests + rapport de couverture v8 |
| `make typecheck` | Vérifier les types TypeScript |
| `make format` / `make lint` | Formater (Prettier) / linter (ESLint) |
| `make fix` | Formater (Prettier) + linter (ESLint) |
| `make knip` | Code mort : fichiers, exports et dépendances inutilisés (`knip.json`) |
| `make knip-production` | Ce que seuls les tests utilisent, à trier à la main |
| `make format-check` | Vérifier le formatage sans écrire |
| `make preview` | Build puis serveur de production local |
| `make clean` | Supprimer build, couverture et `node_modules` |
| `make check` | Toutes les vérifications (build + lint + knip + typecheck + test) |
| `make verify-levels` | Vérifications lourdes des niveaux (`tests/levels/`, config `vitest.levels.config.ts`) : unicité du couloir de chaque niveau d'Angle mort, générateurs rejoués sur un large échantillon de dates. À lancer après chaque `make generate-levels`. |
| `make generate-levels` | **(Manuel uniquement)** Régénérer les défis quotidiens (Sémantogramme exclu sauf `--game semantogramme`) |

> Le serveur dev tourne sur le port **2222** par défaut.
>
> **Node 24** requis (`engines` dans `package.json`). Sous Node 25, le `localStorage` natif de Node masque celui de jsdom et fait échouer les tests.

## Hors scope v1

- Comptes utilisateurs / authentification
- Niveaux quotidiens partagés (nécessite back-end)
- Classements
- Génération procédurale de niveaux à l'exécution
- Solveur automatique côté UI
- Internationalisation (français uniquement)
- Mode multijoueur
