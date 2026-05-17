import { describe, expect, it } from 'vitest'
import {
  applyMove,
  isWon as sokomotIsWon,
  loadLevel as sokomotLoad,
} from '~/games/sokomot/engine'
import {
  areCluesSatisfied,
  isValidLoop,
  isWon as boucleIsWon,
  loadLevel as boucleLoad,
  toggleEdge,
} from '~/games/boucle/engine'
import {
  isGridSolved,
  isWon as semanIsWon,
  loadLevel as semanLoad,
  setCellStatus,
  setThemeGuess,
} from '~/games/semantogramme/engine'
import type { Coord, Edge } from '~/games/boucle/types'
import { generateSokomotLevel } from '../../generators/sokomot'
import { generateBoucleLevel } from '../../generators/boucle'
import { generateSemantogrammeLevel } from '../../generators/semantogramme'

/**
 * Tests « heavy » qui appellent les 3 générateurs sur un large échantillon
 * de dates pour détecter les régressions silencieuses : niveau impossible,
 * solution invalide, dépassement de parMoves, contraintes structurelles
 * cassées (ligne sans IN, perimeter…).
 *
 * Complète les tests d'intégrité (`<jeu>.levels.test.ts`) qui ne couvrent
 * que les niveaux **commités**. Ici on appelle directement les générateurs
 * sur des dates additionnelles, ce qui attrape les régressions du
 * générateur avant le prochain `make generate-levels`.
 */

// 24 dates couvrant : 1er du mois (souvent un seed différent), bornes
// d'année bissextile (2024-02-29 hors plage commitée → bonne couverture),
// premiers et milieux de mois sur plusieurs mois.
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

const INDICES = [1, 2, 3, 4] as const

function insideCellsToBoundary(cells: Coord[]): Edge[] {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`))
  const isIn = (x: number, y: number) => set.has(`${x},${y}`)
  const out: Edge[] = []
  for (const [cx, cy] of cells) {
    if (!isIn(cx, cy - 1)) out.push({ x: cx, y: cy, orientation: 'horizontal' })
    if (!isIn(cx, cy + 1)) out.push({ x: cx, y: cy + 1, orientation: 'horizontal' })
    if (!isIn(cx - 1, cy)) out.push({ x: cx, y: cy, orientation: 'vertical' })
    if (!isIn(cx + 1, cy)) out.push({ x: cx + 1, y: cy, orientation: 'vertical' })
  }
  return out
}

describe('générateurs : robustesse sur un large échantillon de dates', () => {
  describe('boucle', () => {
    it.each(SAMPLE_DATES)('date %s : 4 niveaux résolubles et bien formés', (date) => {
      for (const idx of INDICES) {
        const level = generateBoucleLevel(date, idx)
        expect(level.width, `${date}/${idx} width`).toBe(3 + idx)
        expect(level.height, `${date}/${idx} height`).toBe(3 + idx)
        expect(level.solutionWord.length, `${date}/${idx} word length`).toBe(level.height)
        expect(level.solutionInsideCells, `${date}/${idx} sans cells`).toBeDefined()

        const edges = insideCellsToBoundary(level.solutionInsideCells!)
        let state = boucleLoad(level)
        for (const e of edges) state = toggleEdge(state, e)
        expect(isValidLoop(state.edges), `${date}/${idx} boucle invalide`).toBe(true)
        expect(areCluesSatisfied(state), `${date}/${idx} indices KO`).toBe(true)
        expect(boucleIsWon(state), `${date}/${idx} non gagnant`).toBe(true)

        if (level.parMoves !== undefined) {
          expect(
            edges.length,
            `${date}/${idx} solution dépasse parMoves`,
          ).toBeLessThanOrEqual(level.parMoves)
        }
      }
    })
  })

  describe('semantogramme', () => {
    it.each(SAMPLE_DATES)('date %s : 4 niveaux résolubles et bien formés', (date) => {
      for (const idx of INDICES) {
        const level = generateSemantogrammeLevel(date, idx)
        expect(level.width, `${date}/${idx} width`).toBe(3 + idx)
        expect(level.height, `${date}/${idx} height`).toBe(3 + idx)

        // Cohérence rowClues / colClues.
        for (let y = 0; y < level.height; y++) {
          const expected = level.solution[y].filter(Boolean).length
          expect(level.rowClues[y], `${date}/${idx} rowClue[${y}]`).toBe(expected)
        }
        for (let x = 0; x < level.width; x++) {
          let count = 0
          for (let y = 0; y < level.height; y++) if (level.solution[y][x]) count++
          expect(level.colClues[x], `${date}/${idx} colClue[${x}]`).toBe(count)
        }

        // Au moins un IN par ligne et par colonne, au moins un OUT par ligne.
        for (let y = 0; y < level.height; y++) {
          expect(level.solution[y].some(Boolean), `${date}/${idx} ligne ${y} sans IN`).toBe(true)
          expect(level.rowClues[y], `${date}/${idx} ligne ${y} pleine`).toBeLessThan(level.width)
        }
        for (let x = 0; x < level.width; x++) {
          let any = false
          for (let y = 0; y < level.height; y++) if (level.solution[y][x]) any = true
          expect(any, `${date}/${idx} colonne ${x} sans IN`).toBe(true)
        }

        // Résoluble en appliquant la solution.
        let state = semanLoad(level)
        for (let y = 0; y < level.height; y++) {
          for (let x = 0; x < level.width; x++) {
            state = setCellStatus(state, x, y, level.solution[y][x] ? 'in' : 'out')
          }
        }
        expect(isGridSolved(state), `${date}/${idx} grille non résolue`).toBe(true)
        state = setThemeGuess(state, level.themeWord)
        expect(semanIsWon(state), `${date}/${idx} pas gagnant`).toBe(true)
      }
    })
  })

  describe('sokomot', () => {
    // Le solver A* tourne pendant la génération (lent surtout pour L3/L4).
    // On échantillonne donc 6 dates × 4 niveaux ≈ 1-2 min — suffisant pour
    // attraper les bugs de générateur sans bloquer trop la CI.
    const SOKOMOT_SAMPLE = SAMPLE_DATES.slice(0, 6)

    it.each(SOKOMOT_SAMPLE)(
      'date %s : 4 niveaux générés avec solution valide',
      (date) => {
        for (const idx of INDICES) {
          const level = generateSokomotLevel(date, idx)
          expect(level.solution, `${date}/${idx} sans solution`).toBeDefined()

          let state = sokomotLoad(level)
          for (const move of level.solution!) state = applyMove(state, move)
          expect(sokomotIsWon(state), `${date}/${idx} non résolu`).toBe(true)

          if (level.parMoves !== undefined) {
            expect(
              level.solution!.length,
              `${date}/${idx} solution dépasse parMoves`,
            ).toBeLessThanOrEqual(level.parMoves)
          }
        }
      },
      120_000,
    )
  })
})
