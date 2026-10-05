import { describe, expect, it } from 'vitest'
import { isWon } from '~/games/sokomot/engine'
import type { Level } from '~/games/sokomot/types'
import { LEVEL_INDICES } from '~/games/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { stripAccents } from '~/lib/text'
import { Rng } from '../../generators/random'
import { generateSokomotLevel, isIceIndex } from '../../generators/sokomot'
import { buildBorderWalls } from '../../generators/sokomot-grid'
import { tryGenerateSokobanPullChain } from '../../generators/sokomot-pullchain'
import { replaySolution } from '../helpers/sokomot'

const DATE = '2026-10-07'
// Les niveaux 3 et 4 passent par les solveurs, qui prennent quelques secondes.
const SOLVER_TIMEOUT = 30_000

describe('sokomot/generator', () => {
  it('isIceIndex cible niveaux 2 et 4 uniquement', () => {
    expect(LEVEL_INDICES.map(isIceIndex)).toEqual([false, true, false, true])
  })

  it.each(LEVEL_INDICES)(
    'niveau %s : taille, longueur du mot et glace attendues',
    (i) => {
      const level = generateSokomotLevel(DATE, i)
      expect({ width: level.width, height: level.height }).toEqual(GAME_SIZE.sokomot(i))
      expect(level.target.word).toHaveLength(2 + i)
      expect(level.blocks).toHaveLength(2 + i)
      expect(level.ice.length > 0).toBe(isIceIndex(i))
      expect(level.name.includes('glace')).toBe(isIceIndex(i))
    },
    SOLVER_TIMEOUT,
  )

  it("niveau 4 : tout l'intérieur est gelé", () => {
    const level = generateSokomotLevel(DATE, 4)
    expect(level.ice).toHaveLength((level.width - 2) * (level.height - 2))
  })

  it.each(LEVEL_INDICES)(
    'niveau %s : la solution stockée gagne en parMoves coups',
    (i) => {
      const level = generateSokomotLevel(DATE, i)
      expect(isWon(replaySolution(level))).toBe(true)
      expect(level.solution).toHaveLength(level.parMoves)
    },
    SOLVER_TIMEOUT,
  )

  it.each(LEVEL_INDICES)(
    'niveau %s : le mot affiché est le canonicalWord sans accents',
    (i) => {
      const level = generateSokomotLevel(DATE, i)
      expect(stripAccents(level.canonicalWord).toUpperCase()).toBe(level.target.word)
    },
    SOLVER_TIMEOUT,
  )

  it('génération déterministe (même date et index, même niveau)', () => {
    expect(generateSokomotLevel(DATE, 2)).toEqual(generateSokomotLevel(DATE, 2))
  })

  it('génération qui varie selon la date', () => {
    const words = ['2026-10-01', '2026-10-02', '2026-10-03'].map(
      (d) => generateSokomotLevel(d, 1).target.word,
    )
    expect(new Set(words).size).toBeGreaterThan(1)
  })

  it('écarte les mots déjà publiés', () => {
    const first = generateSokomotLevel(DATE, 1)
    const other = generateSokomotLevel(DATE, 1, { usedWords: new Set([first.target.word]) })
    expect(other.target.word).not.toBe(first.target.word)
  })
})

describe('sokomot/pullchain (niveau 3)', () => {
  const draft = (() => {
    for (let attempt = 0; ; attempt++) {
      const found = tryGenerateSokobanPullChain(new Rng(`test:${attempt}`), 'MOTUS', 9, 8, 2)
      if (found) return found
    }
  })()

  it("aucun obstacle intérieur ni glace : seulement les murs d'enceinte", () => {
    expect(draft.walls).toEqual(buildBorderWalls(9, 8))
    expect(draft.ice).toEqual([])
  })

  it('aucun bloc ne part sur sa cible', () => {
    draft.blocks.forEach((b, i) => expect(b.pos).not.toEqual(draft.targets[i]))
  })

  it('la solution générée à rebours gagne', () => {
    const level: Level = {
      id: 'test',
      name: 'test',
      width: 9,
      height: 8,
      player: draft.player,
      walls: draft.walls,
      ice: draft.ice,
      blocks: draft.blocks,
      target: { word: 'MOTUS', cells: draft.targets },
      parMoves: draft.solution.length,
      solution: draft.solution,
      canonicalWord: 'motus',
    }
    expect(isWon(replaySolution(level))).toBe(true)
  })
})
