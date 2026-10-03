import { defineConfig } from 'vitest/config'
import base from './vitest.config'

/**
 * Vérifications lourdes des niveaux (`make verify-levels`), hors de
 * `make test` : preuve d'unicité complète d'Angle mort et générateurs
 * rejoués sur un large échantillon de dates. À lancer après chaque
 * `make generate-levels`.
 *
 * Pas de `mergeConfig` : il concatène les listes `include` au lieu de les
 * remplacer, ce qui relancerait aussi les tests rapides.
 */
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['tests/levels/**/*.test.ts'],
    testTimeout: 600_000,
    // Générateurs (dictionnaire de 336 k mots) et preuves d'unicité sont très
    // gourmands : peu de processus en parallèle pour ne pas saturer la machine.
    maxWorkers: 4,
  },
})
