import { describe, expect, it } from 'vitest'
import { isWon as anglemortIsWon, loadLevel as anglemortLoad } from '~/games/anglemort/engine'
import { areCluesSatisfied, isValidLoop, isWon as boucleIsWon } from '~/games/boucle/engine'
import { isGridSolved, isWon as semanIsWon, setThemeGuess } from '~/games/semantogramme/engine'
import { isWon as sokomotIsWon } from '~/games/sokomot/engine'
import { LEVEL_INDICES, type LevelIndex } from '~/games/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { generateAngleMortLevel } from '../../generators/anglemort'
import { generateBoucleLevel } from '../../generators/boucle'
import { generateSemantogrammeLevel } from '../../generators/semantogramme'
import { loadCuration } from '../../generators/semantogramme-curation'
import { generateSokomotLevel } from '../../generators/sokomot'
import { playExpectedLoop } from '../helpers/boucle'
import { applySolution, cluesOf } from '../helpers/semantogramme'
import { replaySolution } from '../helpers/sokomot'

/**
 * Les 4 générateurs rejoués sur un large échantillon de dates, pour détecter
 * les régressions silencieuses : niveau impossible, solution invalide,
 * dépassement de parMoves, contraintes structurelles cassées (ligne sans case
 * thème, périmètre…).
 *
 * Complète les tests d'intégrité (`<jeu>.levels.test.ts`) qui ne couvrent
 * que les niveaux **publiés** : ici, les générateurs tournent sur d'autres
 * dates, ce qui attrape leurs régressions avant le prochain
 * `make generate-levels`.
 */

// 24 dates hors du calendrier publié pour la plupart : premiers, milieux et
// fins de mois, sur deux années.
const SAMPLE_DATES = [
  '2025-01-01',
  '2025-02-28',
  '2025-03-15',
  '2025-04-01',
  '2025-05-10',
  '2025-06-20',
  '2025-07-04',
  '2025-08-31',
  '2025-09-15',
  '2025-10-10',
  '2025-11-30',
  '2025-12-25',
  '2026-01-01',
  '2026-02-14',
  '2026-03-21',
  '2026-04-15',
  '2026-05-15',
  '2026-06-30',
  '2026-07-14',
  '2026-08-15',
  '2026-09-09',
  '2026-10-31',
  '2026-11-11',
  '2026-12-31',
]

/**
 * Angle mort : chaque date tire une grille de base différente. Le niveau 3
 * coûte deux à trois minutes de solveur par grille : on n'en rejoue que deux.
 */
const ANGLEMORT_SAMPLES: Record<LevelIndex, readonly string[]> = {
  1: SAMPLE_DATES,
  2: SAMPLE_DATES,
  3: SAMPLE_DATES.slice(0, 2),
  4: SAMPLE_DATES,
}

describe('générateurs : robustesse sur un large échantillon de dates', () => {
  describe('anglemort', () => {
    const cases = LEVEL_INDICES.flatMap((idx) =>
      ANGLEMORT_SAMPLES[idx].map((date) => [date, idx] as const),
    )
    it.each(cases)('date %s, niveau %s : gagnant et bien formé', (date, idx) => {
      const level = generateAngleMortLevel(date, idx)
      const { width, height } = GAME_SIZE.anglemort(idx)
      // Les versions tournées d'un quart de tour sont en portrait.
      expect([level.width, level.height].sort(), 'taille').toEqual([width, height].sort())
      const state = { ...anglemortLoad(level), guards: level.solution }
      expect(anglemortIsWon(state), 'non gagnant').toBe(true)
      expect(level.solution.length, 'parMoves').toBe(level.parMoves)
    })
  })

  describe('boucle', () => {
    it.each(SAMPLE_DATES)('date %s : 4 niveaux résolubles et bien formés', (date) => {
      for (const idx of LEVEL_INDICES) {
        const level = generateBoucleLevel(date, idx)
        expect({ width: level.width, height: level.height }, `${date}/${idx}`).toEqual(
          GAME_SIZE.boucle(idx),
        )
        expect(level.solutionWord.length, `${date}/${idx} longueur du mot`).toBe(level.width)

        const { state, edges } = playExpectedLoop(level)
        expect(isValidLoop(state.edges), `${date}/${idx} boucle invalide`).toBe(true)
        expect(areCluesSatisfied(state), `${date}/${idx} indices KO`).toBe(true)
        expect(boucleIsWon(state), `${date}/${idx} non gagnant`).toBe(true)
        expect(edges.length, `${date}/${idx} dépasse parMoves`).toBeLessThanOrEqual(level.parMoves)
      }
    })
  })

  describe('semantogramme', () => {
    // Le générateur ne connaît que les dates du calendrier de curation.
    const SEMANTOGRAMME_SAMPLE = loadCuration()
      .schedule['1'].map((t) => t.date)
      .filter((_, i) => i % 17 === 0)

    it.each(SEMANTOGRAMME_SAMPLE)('date %s : 4 niveaux résolubles et bien formés', (date) => {
      for (const idx of LEVEL_INDICES) {
        const level = generateSemantogrammeLevel(date, idx)
        expect({ width: level.width, height: level.height }, `${date}/${idx}`).toEqual(
          GAME_SIZE.semantogramme(idx),
        )
        const clues = cluesOf(level.solution)
        expect(clues, `${date}/${idx} indices`).toEqual({
          rowClues: level.rowClues,
          colClues: level.colClues,
        })
        for (const n of [...clues.rowClues, ...clues.colClues]) {
          expect(n > 0 && n < level.width, `${date}/${idx} ligne ou colonne uniforme`).toBe(true)
        }
        const state = applySolution(level)
        expect(isGridSolved(state), `${date}/${idx} grille non résolue`).toBe(true)
        expect(semanIsWon(setThemeGuess(state, level.themeWord)), `${date}/${idx}`).toBe(true)
      }
    })
  })

  describe('sokomot', () => {
    // Les solveurs tournent pendant la génération (lents surtout pour L3/L4) :
    // 6 dates × 4 niveaux suffisent à attraper les bugs du générateur.
    const SOKOMOT_SAMPLE = SAMPLE_DATES.slice(0, 6)

    it.each(SOKOMOT_SAMPLE)(
      'date %s : 4 niveaux générés avec solution valide',
      (date) => {
        for (const idx of LEVEL_INDICES) {
          const level = generateSokomotLevel(date, idx)
          expect(sokomotIsWon(replaySolution(level)), `${date}/${idx} non résolu`).toBe(true)
          expect(level.solution.length, `${date}/${idx} parMoves`).toBe(level.parMoves)
        }
      },
      120_000,
    )
  })
})
