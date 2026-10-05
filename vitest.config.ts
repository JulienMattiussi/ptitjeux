import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  // Les drapeaux de dev du `.env.local` (jours futurs, date figée) ne doivent
  // pas changer le résultat des tests.
  envDir: false,
  resolve: {
    alias: {
      '~': resolve(import.meta.dirname, 'app'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Chaque processus charge les niveaux JSON de tous les jeux : sans plafond,
    // Vitest en lance presque un par cœur et peut saturer la mémoire.
    maxWorkers: '50%',
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['app/games/**/engine.ts', 'app/lib/**', 'generators/**/*.ts'],
      // Seuils d'AGENTS.md : moteurs et utilitaires partagés.
      thresholds: {
        // Par fichier : un module bien couvert ne doit pas en masquer un faible.
        perFile: true,
        'app/games/**/engine.ts': { statements: 90, branches: 90 },
        'app/lib/**': { statements: 90 },
      },
    },
  },
})
