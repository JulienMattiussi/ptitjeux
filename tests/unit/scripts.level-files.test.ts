import { describe, expect, it } from 'vitest'
import { isFixedBaseLevel } from '../../generators/anglemort-schedule'
import { filesToClean, levelFile } from '../../scripts/level-files'

describe('scripts/level-files', () => {
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
    const files = filesToClean(['2026-10-03', '2026-10-04'], [3, 4], isFixedBaseLevel)
    expect(files).toEqual([
      '2026-10/2026-10-03-3.json',
      '2026-10/2026-10-03-4.json',
      '2026-10/2026-10-04-3.json',
    ])
  })
})
