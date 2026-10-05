import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { levelFile } from '../../generators/calendar'
import {
  displayWord,
  filesToClean,
  keptOnClean,
  publishedWords,
  wordsOfDate,
} from '../../scripts/level-files'

describe('scripts/level-files : --clean', () => {
  it('range chaque niveau dans le dossier de son mois', () => {
    expect(levelFile('2026-10-04', 4)).toBe('2026-10/2026-10-04-4.json')
  })

  it('--clean vise chaque niveau du filtre', () => {
    expect(filesToClean(['2026-10-03', '2026-10-04'], [1, 4])).toEqual([
      '2026-10/2026-10-03-1.json',
      '2026-10/2026-10-03-4.json',
      '2026-10/2026-10-04-1.json',
      '2026-10/2026-10-04-4.json',
    ])
  })

  it("--clean épargne les grilles de base fixées d'Angle mort", () => {
    const files = filesToClean(['2026-10-03', '2026-10-04'], [3, 4], keptOnClean('anglemort'))
    expect(files).toEqual([
      '2026-10/2026-10-03-3.json',
      '2026-10/2026-10-03-4.json',
      '2026-10/2026-10-04-3.json',
    ])
  })

  it('--clean ne supprime aucun fichier Sémantogramme', () => {
    expect(
      filesToClean(['2026-10-03', '2026-10-04'], [1, 4], keptOnClean('semantogramme')),
    ).toEqual([])
  })

  it('--clean supprime tout le filtre des jeux sans exception', () => {
    expect(filesToClean(['2026-10-04'], [1, 2], keptOnClean('boucle'))).toHaveLength(2)
  })
})

describe('scripts/level-files : mots publiés', () => {
  let root: string
  const wordOf = (level: { solutionWord?: string }) => level.solutionWord ?? ''

  async function writeLevel(date: string, index: 1 | 2 | 3 | 4, word: string) {
    const file = path.join(root, levelFile(date, index))
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, JSON.stringify({ solutionWord: word }))
  }

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'ptitjeux-levels-'))
  })

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  it('compare les mots sous leur forme affichée, sans accents', () => {
    expect(displayWord('Été')).toBe('ETE')
  })

  it('relève les mots de tous les niveaux, sauf ceux à régénérer', async () => {
    await writeLevel('2026-09-30', 1, 'chat')
    await writeLevel('2026-10-01', 1, 'éclair')
    await writeLevel('2026-10-01', 2, 'route')
    const skip = new Set([levelFile('2026-10-01', 2)])
    expect(await publishedWords(root, wordOf, skip)).toEqual(new Set(['CHAT', 'ECLAIR']))
  })

  it("relève les mots d'une date, en ignorant les niveaux absents", async () => {
    await writeLevel('2026-10-01', 1, 'chat')
    await writeLevel('2026-10-01', 3, 'route')
    await writeLevel('2026-10-02', 1, 'velo')
    expect(await wordsOfDate(root, wordOf, '2026-10-01', [1, 2, 3, 4])).toEqual(['CHAT', 'ROUTE'])
  })
})
