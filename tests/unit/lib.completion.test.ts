import { describe, expect, it } from 'vitest'
import { aggregateCompletion, completionStatus } from '~/lib/completion'

describe('lib/completion — completionStatus', () => {
  it('unsolved sans progression', () => {
    expect(completionStatus(undefined, 10)).toBe('unsolved')
    expect(completionStatus({ completed: false, lastPlayedAt: '' }, 10)).toBe('unsolved')
  })

  it('solved si terminé sans parMoves connu', () => {
    expect(completionStatus({ completed: true, lastPlayedAt: '' }, undefined)).toBe('solved')
  })

  it('solved si terminé sans bestMoves', () => {
    expect(completionStatus({ completed: true, lastPlayedAt: '' }, 10)).toBe('solved')
  })

  it('perfect si bestMoves ≤ parMoves', () => {
    expect(completionStatus({ completed: true, bestMoves: 8, lastPlayedAt: '' }, 10)).toBe(
      'perfect',
    )
    expect(completionStatus({ completed: true, bestMoves: 10, lastPlayedAt: '' }, 10)).toBe(
      'perfect',
    )
  })

  it('solved si bestMoves > parMoves', () => {
    expect(completionStatus({ completed: true, bestMoves: 12, lastPlayedAt: '' }, 10)).toBe(
      'solved',
    )
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
