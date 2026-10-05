import { describe, expect, it } from 'vitest'
import { dateRange } from '~/lib/dates'
import { GAME_IDS } from '~/lib/game-styles'
import { committedChallenges } from '../helpers/levels'

/**
 * Les pages de liste ne reçoivent que les bornes du calendrier
 * (`loadListRoute`) et en déduisent chaque jour : un jour manquant y
 * apparaîtrait quand même, vers un niveau introuvable.
 */
describe('calendrier publié', () => {
  it.each(GAME_IDS)('%s : un défi chaque jour, sans trou', (game) => {
    const dates = committedChallenges(game).getAllDates()
    expect(dates).toEqual(dateRange(dates[0], dates[dates.length - 1]))
  })
})
