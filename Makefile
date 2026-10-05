.PHONY: default help install start build check-bundle preview lint knip format format-check typecheck test test-watch test-coverage verify-levels generate-levels fix check clean

default: help

help: ## Afficher les commandes disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Installer les dépendances
	npm install

start: ## Lancer l'application en développement (hot reload)
	npm run dev

build: ## Compiler l'application pour la production
	npm run build

check-bundle: build ## Vérifier qu'aucun fichier JS client ne dépasse la taille maximale
	npm run check:bundle

preview: build ## Prévisualiser le build de production
	npm run start

lint: ## Vérifier le code avec ESLint
	npm run lint

knip: ## Détecter le code mort (fichiers, exports, dépendances inutilisés)
	npm run knip

format: ## Formater le code avec Prettier
	npm run format

format-check: ## Vérifier le formatage avec Prettier
	npm run format:check

typecheck: ## Vérifier les types TypeScript
	npm run typecheck

test: ## Lancer les tests unitaires
	npm run test

test-watch: ## Lancer les tests en mode watch
	npm run test:watch

test-coverage: ## Lancer les tests avec rapport de couverture
	npm run test:coverage

verify-levels: ## Vérifications lourdes des niveaux (unicité, générateurs) : après chaque génération
	npm run verify:levels

# Garde-fous de la génération (solveurs gourmands) : mémoire de Node plafonnée,
# priorité processeur basse, durée maximale. Surchargeables : make generate-levels GEN_MEMORY=8192
GEN_MEMORY ?= 4096
GEN_TIMEOUT ?= 6h

generate-levels: ## Régénérer les défis quotidiens. Args : ARGS="--start 2026-05-01 --end 2026-05-07 --game sokomot --level 3"
	NODE_OPTIONS=--max-old-space-size=$(GEN_MEMORY) timeout $(GEN_TIMEOUT) nice -n 15 npm run generate:levels -- $(ARGS)

fix: format lint ## Formater et linter le code

check: check-bundle lint knip typecheck test ## Lancer toutes les vérifications (build et taille du bundle, lint, code mort, typecheck, tests)
	@echo "Toutes les vérifications passent."

clean: ## Supprimer les artefacts de build
	rm -rf build .react-router coverage node_modules
