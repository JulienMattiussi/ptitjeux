import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),
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
      exclude: ['generators/words-fr-raw.json'],
    },
  },
})
