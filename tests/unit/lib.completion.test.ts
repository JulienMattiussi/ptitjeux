import { describe, expect, it } from 'vitest'
import {
  aggregateCompletion,
  completionStatus,
  dayStatuses,
  victoryVariant,
} from '~/lib/completion'
import { levelKey, type GameProgress } from '~/lib/localStorage'

describe('lib/completion : completionStatus', () => {
  it('unsolved sans progression enregistrée', () => {
    expect(completionStatus(undefined)).toBe('unsolved')
  })

  it('reprend le statut enregistré à la victoire', () => {
    expect(completionStatus({ status: 'perfect', lastPlayedAt: '' })).toBe('perfect')
    expect(completionStatus({ status: 'solved', lastPlayedAt: '' })).toBe('solved')
  })
})

describe('lib/completion — aggregateCompletion', () => {
  it('renvoie unsolved sur une liste vide', () => {
    expect(aggregateCompletion([])).toBe('unsolved')
  })

  it('perfect si tous parfaits', () => {
    expect(aggregateCompletion(['perfect', 'perfect', 'perfect', 'perfect'])).toBe('perfect')
  })

  it('solved si tous terminés mais pas tous parfaits', () => {
    expect(aggregateCompletion(['perfect', 'solved', 'perfect', 'solved'])).toBe('solved')
    expect(aggregateCompletion(['solved', 'solved', 'solved'])).toBe('solved')
  })

  it('unsolved si au moins un non terminé', () => {
    expect(aggregateCompletion(['perfect', 'perfect', 'unsolved', 'perfect'])).toBe('unsolved')
    expect(aggregateCompletion(['solved', 'unsolved'])).toBe('unsolved')
  })
})

describe('lib/completion — victoryVariant', () => {
  it('perfect si moves <= parMoves', () => {
    expect(victoryVariant(5, 10)).toBe('perfect')
    expect(victoryVariant(10, 10)).toBe('perfect')
  })

  it('solved si moves > parMoves', () => {
    expect(victoryVariant(12, 10)).toBe('solved')
  })
})

describe('lib/completion : dayStatuses', () => {
  it('lit le statut enregistré de chaque niveau du jour', () => {
    const progress: GameProgress = {
      [levelKey('2026-09-01', 1)]: { status: 'perfect', lastPlayedAt: '' },
      [levelKey('2026-09-01', 2)]: { status: 'solved', lastPlayedAt: '' },
    }
    expect(dayStatuses('2026-09-01', progress)).toEqual([
      'perfect',
      'solved',
      'unsolved',
      'unsolved',
    ])
  })
})
