import { describe, expect, it } from 'vitest'
import { buildChallengeIndex } from '~/lib/challenges-loader'

type FakeLevel = { id: string }

describe('lib/challenges-loader', () => {
  it('indexe les niveaux par date et par index (1-based)', () => {
    const modules: Record<string, FakeLevel> = {
      './2026-05/2026-05-01-1.json': { id: 'A' },
      './2026-05/2026-05-01-2.json': { id: 'B' },
      './2026-05/2026-05-02-1.json': { id: 'C' },
    }
    const idx = buildChallengeIndex(modules)
    expect(idx.getLevel('2026-05-01', 1)).toEqual({ id: 'A' })
    expect(idx.getLevel('2026-05-01', 2)).toEqual({ id: 'B' })
    expect(idx.getLevel('2026-05-02', 1)).toEqual({ id: 'C' })
  })

  it('expose la liste complète d\'une journée via getChallenge', () => {
    const modules: Record<string, FakeLevel> = {
      './a/2026-05-01-1.json': { id: 'A' },
      './a/2026-05-01-2.json': { id: 'B' },
      './a/2026-05-01-3.json': { id: 'C' },
      './a/2026-05-01-4.json': { id: 'D' },
    }
    const idx = buildChallengeIndex(modules)
    expect(idx.getChallenge('2026-05-01')).toEqual([
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' },
    ])
  })

  it('retourne undefined pour une date inconnue', () => {
    const idx = buildChallengeIndex<FakeLevel>({})
    expect(idx.getChallenge('2026-05-01')).toBeUndefined()
    expect(idx.getLevel('2026-05-01', 1)).toBeUndefined()
  })

  it('retourne undefined pour un index inexistant', () => {
    const modules: Record<string, FakeLevel> = {
      './x/2026-05-01-1.json': { id: 'A' },
    }
    const idx = buildChallengeIndex(modules)
    expect(idx.getLevel('2026-05-01', 2)).toBeUndefined()
    expect(idx.getLevel('2026-05-01', 99)).toBeUndefined()
  })

  it('ignore les fichiers qui ne matchent pas le pattern <date>-<index>.json', () => {
    const modules: Record<string, FakeLevel> = {
      './README.md': { id: 'should be ignored' },
      './2026-05/index.ts': { id: 'should be ignored' },
      './2026-05/2026-05-01.json': { id: 'no index' },
      './2026-05/2026-05-01-1.json': { id: 'kept' },
    }
    const idx = buildChallengeIndex(modules)
    expect(idx.getAllDates()).toEqual(['2026-05-01'])
    expect(idx.getLevel('2026-05-01', 1)).toEqual({ id: 'kept' })
  })

  it('getAllDates retourne les dates triées', () => {
    const modules: Record<string, FakeLevel> = {
      './a/2026-12-15-1.json': { id: 'A' },
      './a/2026-04-02-1.json': { id: 'B' },
      './a/2026-08-30-1.json': { id: 'C' },
      './a/2026-04-01-1.json': { id: 'D' },
    }
    const idx = buildChallengeIndex(modules)
    expect(idx.getAllDates()).toEqual([
      '2026-04-01',
      '2026-04-02',
      '2026-08-30',
      '2026-12-15',
    ])
  })

  it('reconnaît le pattern peu importe la profondeur du dossier', () => {
    const modules: Record<string, FakeLevel> = {
      './2026-05-01-1.json': { id: 'flat' },
      './foo/bar/baz/2026-06-02-3.json': { id: 'deep' },
    }
    const idx = buildChallengeIndex(modules)
    expect(idx.getLevel('2026-05-01', 1)).toEqual({ id: 'flat' })
    expect(idx.getLevel('2026-06-02', 3)).toEqual({ id: 'deep' })
  })
})
