import { describe, expect, it } from 'vitest'
import { dateRange } from '~/lib/dates'
import { CALENDAR_END, CALENDAR_START } from '../../generators/calendar'
import { committedChallenges } from '../helpers/levels'
import { games } from '~/lib/games-registry'

const GAME_IDS = games.map((g) => g.id)

/**
 * Les pages de liste ne reçoivent que les bornes du calendrier
 * (`loadListRoute`) et en déduisent chaque jour : un jour manquant y
 * apparaîtrait quand même, vers un niveau introuvable.
 */
describe('calendrier publié', () => {
  it.each(GAME_IDS)('%s : un défi chaque jour du calendrier, sans trou', (game) => {
    expect(committedChallenges(game).getAllDates()).toEqual(dateRange(CALENDAR_START, CALENDAR_END))
  })
})
