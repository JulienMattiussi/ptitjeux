.PHONY: help install start build preview lint format format-check typecheck test test-watch test-coverage fix check clean

default: help

help: ## Afficher les commandes disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Installer les dépendances
	npm install

start: ## Lancer l'application en développement (hot reload)
	npm run dev

build: ## Compiler l'application pour la production
	npm run build

preview: build ## Prévisualiser le build de production
	npm run start

lint: ## Vérifier le code avec ESLint
	npm run lint

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

fix: format lint ## Formater et linter le code

check: build lint typecheck test ## Lancer toutes les vérifications (build, lint, typecheck, tests)
	@echo "Toutes les vérifications passent."

clean: ## Supprimer les artefacts de build
	rm -rf build .react-router coverage node_modules
