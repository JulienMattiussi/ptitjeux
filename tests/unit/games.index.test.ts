import { describe, expect, it } from 'vitest'
import { dayStatuses, getGameDates, lastAvailableDate } from '~/games'
import { getLevel } from '~/games/boucle/challenges'
import { levelKey, type GameProgress } from '~/lib/localStorage'

const DATE = '2026-09-01'

describe('games/index', () => {
  it('getGameDates renvoie les dates publiées, triées', () => {
    const dates = getGameDates('boucle')
    expect(dates[0]).toBe(DATE)
    expect(dates).toEqual([...dates].sort())
  })

  it('lastAvailableDate est la dernière date publiée', () => {
    expect(lastAvailableDate('boucle')).toBe(getGameDates('boucle').at(-1))
  })

  it('dayStatuses rapporte chaque niveau du jour à son objectif', () => {
    const par = getLevel(DATE, 2)!.parMoves
    const progress: GameProgress = {
      [levelKey(DATE, 1)]: { completed: true, bestMoves: 1, lastPlayedAt: '' },
      [levelKey(DATE, 2)]: { completed: true, bestMoves: par + 1, lastPlayedAt: '' },
    }
    expect(dayStatuses('boucle', DATE, progress)).toEqual([
      'perfect',
      'solved',
      'unsolved',
      'unsolved',
    ])
  })

  it('dayStatuses ne compte rien pour un jour sans défi', () => {
    expect(dayStatuses('boucle', '2099-01-01', {})).toEqual(Array(4).fill('unsolved'))
  })
})
