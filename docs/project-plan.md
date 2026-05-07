# Plan projet — secretgame

Plateforme web de mini-jeux logico-spatiaux, full front-end.

---

## 1. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| Framework | **Remix** (Vite) | demandé ; SSR + nested routes ; bonne ergonomie front |
| Langage | **TypeScript** strict | sécurité de typage critique pour les moteurs de jeu |
| Style | **Tailwind CSS** | itération rapide ; suffisant pour des UI puzzle |
| Tests | **Vitest** + **Testing Library** | rapide, intégration native Vite |
| Lint/Format | **Biome** ou ESLint + Prettier | au choix |
| Déploiement | **Vercel** | adapté à Remix, déploiement zéro-config |

**Pas de back-end** dans la v1. Les niveaux sont des fichiers JSON livrés statiquement. Pas de comptes, pas de scores serveur. La progression locale est stockée en `localStorage`.

---

## 2. Structure de répertoire

```
secretgame/
├── docs/
│   ├── existing-games.md
│   ├── new-games.md
│   └── project-plan.md
├── app/
│   ├── root.tsx
│   ├── routes/
│   │   ├── _index.tsx              # Home : liste des jeux
│   │   ├── sokomot.$levelId.tsx    # Page jeu Sokomot
│   │   ├── boucle.$levelId.tsx     # Page jeu Boucle
│   │   └── semantogramme.$levelId.tsx   # Page jeu Sémantogramme
│   ├── games/
│   │   ├── sokomot/
│   │   │   ├── engine.ts           # Logique pure : état, transitions
│   │   │   ├── engine.test.ts
│   │   │   ├── types.ts
│   │   │   ├── Board.tsx           # Rendu de la grille
│   │   │   ├── Controls.tsx        # Flèches, undo, reset
│   │   │   └── levels/
│   │   │       ├── 001-intro.json
│   │   │       ├── 002-ice-basic.json
│   │   │       └── ...
│   │   ├── boucle/
│   │   │   ├── engine.ts
│   │   │   ├── engine.test.ts
│   │   │   ├── types.ts
│   │   │   ├── Board.tsx
│   │   │   ├── EdgeOverlay.tsx     # Tracé des arêtes
│   │   │   └── levels/
│   │   └── semantogramme/
│   │       ├── engine.ts
│   │       ├── types.ts
│   │       ├── Board.tsx
│   │       └── levels/
│   ├── components/
│   │   ├── GameCard.tsx            # Vignette home
│   │   ├── GameLayout.tsx          # Header + zone de jeu + footer
│   │   └── ...
│   ├── lib/
│   │   ├── localStorage.ts         # Wrapper progression
│   │   └── games-registry.ts       # Catalogue des jeux disponibles
│   └── styles/
│       └── tailwind.css
├── public/
│   └── ...
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 3. Routing

| Route | Composant | Rôle |
|---|---|---|
| `/` | `_index.tsx` | Home, liste des jeux disponibles avec vignettes |
| `/sokomot` | `sokomot._index.tsx` | Sélecteur de niveau Sokomot |
| `/sokomot/:levelId` | `sokomot.$levelId.tsx` | Joue un niveau spécifique |
| `/boucle` | `boucle._index.tsx` | Sélecteur de niveau Boucle |
| `/boucle/:levelId` | `boucle.$levelId.tsx` | Joue un niveau Boucle |
| `/semantogramme` | `semantogramme._index.tsx` | Sélecteur Sémantogramme |
| `/semantogramme/:levelId` | `semantogramme.$levelId.tsx` | Joue un niveau Sémantogramme |

Chargement du niveau : `loader` Remix lit le JSON statique correspondant et le passe au composant.

---

## 4. Architecture commune des moteurs de jeu

Chaque jeu suit le même pattern, séparation stricte **moteur / rendu** :

### 4.1 Moteur (logique pure, testable sans DOM)

```ts
// app/games/sokomot/engine.ts

export type Level = { /* JSON parsé */ };
export type GameState = { /* état courant */ };
export type Move = { /* action joueur */ };

export function loadLevel(level: Level): GameState;
export function applyMove(state: GameState, move: Move): GameState;
export function isWon(state: GameState): boolean;
export function canMove(state: GameState, move: Move): boolean;
```

Avantages :
- 100 % testable en Vitest sans rendu.
- Réutilisable (mode replay, solveur, génération).
- Le composant React est juste une projection visuelle de l'état.

### 4.2 Rendu (composants React)

```tsx
// app/games/sokomot/Board.tsx

export function Board({ state, onMove }: Props) {
  return (
    <div className="grid">
      {/* projection visuelle de state */}
    </div>
  );
}
```

Le composant page orchestre :
- Chargement du niveau via `useLoaderData`.
- État local via `useReducer` qui appelle `applyMove`.
- Gestion clavier / touch / boutons.
- Détection de victoire et UI associée.

---

## 5. Spécifications par jeu

### 5.1 Sokomot

**Format de niveau** (cf. `docs/new-games.md` §1).

**Moteur** :
- État : position joueur, position des blocs, nombre de coups, historique (pour undo).
- Move : direction (`up`/`down`/`left`/`right`).
- Logique de poussée : un bloc poussé bouge si la case derrière est libre.
- Logique de glace : si le joueur ou un bloc est sur une case glace, il glisse jusqu'à un obstacle.
- Victoire : les blocs alignés dans `target.cells` épèlent `target.word`.

**UI** :
- Grille SVG ou CSS Grid.
- Cases : sol normal, glace (motif), murs, zone cible (lettres fantômes).
- Blocs : carrés avec lettre.
- Personnage : icône simple.
- Contrôles : flèches clavier + boutons mobile + undo + reset.

**Niveaux v1** : 8-12 niveaux, dont 3-4 utilisent la glace.

### 5.2 Boucle

**Format de niveau** (cf. `docs/new-games.md` §2).

**Moteur** :
- État : ensemble d'arêtes activées par le joueur.
- Move : toggle d'une arête.
- Validation : la sélection forme une boucle fermée unique, respecte les indices, et les lettres internes forment `solutionWord`.

**UI** :
- Grille SVG : cases avec lettres + arêtes cliquables entre cases.
- Indices numériques affichés sur les cases concernées.
- Feedback visuel : arêtes valides en couleur, conflits en rouge léger.
- Bouton "vérifier" + "reset".

**Niveaux v1** : 6-10 niveaux progressifs (3×3 → 7×7).

### 5.3 Sémantogramme

**Format de niveau** (cf. `docs/new-games.md` §3).

**Moteur** :
- État : pour chaque case, statut `unmarked` / `in` / `out`.
- Move : changer le statut d'une case.
- Validation : nombre de cases `in` par ligne = `rowClues[i]`, par colonne = `colClues[j]`, et les cases `in` correspondent à `solution`.
- Pas de calcul sémantique runtime — toute la donnée est précalculée dans le JSON.

**UI** :
- Grille avec mots dans les cases.
- Chiffres en marge gauche (lignes) et en haut (colonnes).
- Clic gauche = marquer IN, clic droit = marquer OUT, clic répété = effacer.
- Compteur live "X/Y IN posés sur cette ligne" pour aider la déduction.
- Champ de saisie pour proposer le mot-thème en fin de partie.

**Niveaux v1** : 6-10 niveaux progressifs (4×4 → 8×8). Génération offline avec embeddings.

---

## 6. Home page

Liste les jeux disponibles avec :
- Nom du jeu + courte description.
- Vignette ou rendu miniature animé.
- Indicateur de progression locale (X/Y niveaux complétés).
- Lien vers le sélecteur de niveau du jeu.

**Source de données** : `app/lib/games-registry.ts`, fichier statique :

```ts
export const games = [
  {
    id: 'sokomot',
    name: 'Sokomot',
    tagline: 'Pousse les lettres pour former un mot',
    levelCount: 12,
    cover: '/img/sokomot.png',
  },
  // ...
];
```

---

## 7. Persistance locale

Pas de back-end. `localStorage` stocke :

```ts
type Progress = {
  [gameId: string]: {
    [levelId: string]: {
      completed: boolean;
      bestMoves?: number;
      lastPlayedAt: string;
    };
  };
};
```

Wrapper centralisé dans `app/lib/localStorage.ts` pour :
- Lecture/écriture typée.
- SSR-safe (pas d'accès `window` à l'init).

---

## 8. Tests

- Chaque moteur a sa suite Vitest qui couvre :
  - Chargement de niveau.
  - Transitions de mouvements / coups invalides.
  - Détection de victoire.
  - Cas particuliers (glace, indices Slitherlink ambigus, symétrie autour d'un coin…).
- Smoke test de chaque page Remix avec Testing Library.

---

## 9. Roadmap d'implémentation

### Étape 1 — Bootstrap
- [ ] Init projet Remix + Vite + TS + Tailwind + Vitest
- [ ] Layout commun, route `/` minimal
- [ ] Registry des jeux + composant `GameCard`

### Étape 2 — Sokomot v1
- [ ] Types + format de niveau
- [ ] Moteur (sans glace) + tests
- [ ] Composant `Board` + contrôles clavier
- [ ] 4-5 niveaux d'introduction
- [ ] Page `/sokomot/:levelId` complète

### Étape 3 — Sokomot mode glace
- [ ] Extension du moteur (glissade) + tests
- [ ] Rendu visuel des cases glace
- [ ] 3-4 niveaux avec glace

### Étape 4 — Boucle v1
- [ ] Types + format de niveau
- [ ] Moteur (validation boucle + indices + mot) + tests
- [ ] Composant SVG arêtes + interaction clic
- [ ] 5-6 niveaux

### Étape 5 — Sémantogramme v1
- [ ] Types + format de niveau (centres avec types case/arête/coin)
- [ ] Moteur (vérif symétrie + mot) + tests
- [ ] Composant pinceau + feedback symétrie
- [ ] 4-5 niveaux

### Étape 6 — Polish
- [ ] Animations de victoire
- [ ] Persistance progression
- [ ] Responsive mobile (touch)
- [ ] Page sélecteur de niveau par jeu

### Étape 7 — Déploiement
- [ ] Setup Vercel
- [ ] Domaine custom (optionnel)
- [ ] Analytics minimal (Vercel Analytics)

---

## 10. Hors scope v1

- Comptes utilisateurs / authentification
- Niveaux quotidiens partagés (nécessite back-end)
- Classements
- Génération procédurale de niveaux
- Solveur automatique
- Internationalisation (français uniquement v1)
- Mode multijoueur
