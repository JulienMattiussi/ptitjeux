import { describe, expect, it } from 'vitest'
import { isWon, loadLevel } from '~/games/anglemort/engine'
import type { Level } from '~/games/anglemort/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { generateAngleMortLevel } from '../../generators/anglemort'
import {
  BASES,
  SCHEDULE_DAYS,
  isFixedBaseLevel,
  levelOrigin,
  loadFixedBase,
} from '../../generators/anglemort-schedule'
import { emptyStats } from '../../generators/anglemort-stats'
import { VARIANTS } from '../../generators/anglemort-symmetry'
import { challengeFile } from '../../generators/calendar'
import { hasUniqueCorridor } from '../helpers/anglemort'

// Niveau 4 seulement : sa génération n'appelle pas le solveur. Quelques
// secondes par grille quand même, bien plus sous l'instrumentation de la
// couverture : délai large pour les tests qui génèrent.
const DATES = ['2026-09-01', '2026-09-04']
const GENERATION_TIMEOUT = 60_000

const wins = (level: Level) =>
  isWon({ ...loadLevel(level), guards: level.solution, moves: level.solution.length })

describe('anglemort/generator (niveau 4)', { timeout: GENERATION_TIMEOUT }, () => {
  it.each(DATES)('%s : la solution gagne en parMoves poses', (date) => {
    const level = generateAngleMortLevel(date, 4)
    expect(wins(level)).toBe(true)
    expect(level.solution).toHaveLength(level.parMoves)
  })

  it.each(DATES)('%s : le couloir est unique', (date) => {
    expect(hasUniqueCorridor(generateAngleMortLevel(date, 4))).toBe(true)
  })

  it.each(DATES)('%s : grille à la taille du niveau, avec au moins un miroir', (date) => {
    const level = generateAngleMortLevel(date, 4)
    const { width, height } = GAME_SIZE.anglemort(4)
    // Les quarts de tour donnent des versions portrait.
    expect([level.width, level.height].sort()).toEqual([width, height].sort())
    expect(level.mirrors.length).toBeGreaterThan(0)
  })

  it('une symétrie de la même base garde la même solution, transformée', () => {
    // 2026-09-01 et 2026-10-21 : même base 0, versions 0 et 1 (quart de tour).
    const a = generateAngleMortLevel('2026-09-01', 4)
    const b = generateAngleMortLevel('2026-10-21', 4)
    expect([b.width, b.height]).toEqual([a.height, a.width])
    expect(b.solution).toHaveLength(a.solution.length)
    expect(wins(b)).toBe(true)
  })

  it('les statistiques comptent les tentatives et signalent la réussite', () => {
    const stats = emptyStats()
    const events: string[] = []
    stats.onEvent = (e) => events.push(e.type)
    generateAngleMortLevel('2026-09-06', 4, { stats })
    expect(stats.attempts).toBeGreaterThan(0)
    expect(events.at(-1)).toBe('success')
  })
})

describe('anglemort/schedule', () => {
  // Figés : les changer redistribuerait tous les niveaux publiés.
  it('le cycle compte 395 jours et 50 bases, assez pour leurs 8 symétries', () => {
    expect(SCHEDULE_DAYS).toBe(395)
    expect(BASES).toBe(50)
    expect(BASES * VARIANTS.length).toBeGreaterThanOrEqual(SCHEDULE_DAYS)
  })

  it.each([
    ['2026-09-02', 1, 0],
    ['2026-10-04', 33, 0],
    ['2026-10-19', 48, 0],
    ['2027-09-30', 44, 7],
  ])('%s : base %i, version %i', (date, base, variant) => {
    expect(levelOrigin(date)).toEqual({ base, variant })
  })

  it("le calendrier commence par la base 0 dans sa version d'origine", () => {
    expect(levelOrigin('2026-09-01')).toEqual({ base: 0, variant: 0 })
  })

  it('chaque base revient 50 jours plus tard dans la version suivante', () => {
    expect(levelOrigin('2026-09-04')).toEqual({ base: 3, variant: 0 })
    expect(levelOrigin('2026-10-24')).toEqual({ base: 3, variant: 1 })
  })

  it('le calendrier boucle après son dernier jour', () => {
    expect(levelOrigin('2027-10-01')).toEqual(levelOrigin('2026-09-01'))
  })

  it("repère les grilles de base fixées, dont la grille d'essai du niveau 4", () => {
    expect(isFixedBaseLevel('2026-10-04', 4)).toBe(true)
    expect(isFixedBaseLevel('2026-10-04', 3)).toBe(false)
    expect(isFixedBaseLevel('2026-10-05', 4)).toBe(false)
  })

  it("refuse un fichier qui n'est pas la version d'origine de la base annoncée", () => {
    expect(() => loadFixedBase(challengeFile('anglemort', '2026-10-04', 4), 32)).toThrow(/base 32/)
  })

  it("relit une grille fixée telle qu'elle est publiée", () => {
    const level = loadFixedBase(challengeFile('anglemort', '2026-10-04', 4), 33)
    expect(generateAngleMortLevel('2026-10-04', 4)).toEqual(level)
  })
})
