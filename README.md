# Ptitjeux

Plateforme web de mini-jeux logico-spatiaux, full front-end.

Trois jeux dans la version actuelle :

- **Sokomot** — pousser des blocs-lettres pour former un mot (Sokoban × Wordle, avec mode glace).
- **Boucle** — tracer une boucle fermée pour encercler le mot du jour (Slitherlink × mot caché).
- **Sémantogramme** — identifier les mots liés à un thème caché dans une grille (Nonogram × Semantle).

## Démarrage rapide

```bash
make install
make start
```

L'application est disponible sur `http://localhost:2222`.

## Documentation

- [docs/existing-games.md](docs/existing-games.md) — catalogue de jeux existants qui inspirent le projet.
- [docs/new-games.md](docs/new-games.md) — spécifications détaillées des jeux.
- [docs/project-plan.md](docs/project-plan.md) — plan d'architecture et roadmap.
- [AGENTS.md](AGENTS.md) — guide pour les agents IA (Claude, etc.).

## Stack

React Router 7 (Framework Mode), React 19, TypeScript, Tailwind CSS v4, Vitest.

Aucun backend : niveaux en JSON statique, progression en `localStorage`.

## Commandes principales

```bash
make help            # Lister toutes les commandes
make start           # Démarrer en développement
make build           # Compiler pour la production
make test            # Lancer les tests
make check           # Build + lint + typecheck + tests
```
