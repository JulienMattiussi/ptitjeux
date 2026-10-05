import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  dateLabel,
  dateLabelShort,
  dateRange,
  daysBetween,
  formatDate,
  monthKey,
  monthLabel,
  parseDate,
  shouldShowFutureDates,
  todayString,
} from '~/lib/dates'

describe('lib/dates', () => {
  it('formatDate renvoie YYYY-MM-DD avec des zéros devant', () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe('2026-01-01')
    expect(formatDate(new Date(2026, 4, 7))).toBe('2026-05-07')
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('parseDate inverse formatDate', () => {
    const d = new Date(2026, 4, 7)
    expect(parseDate(formatDate(d)).getTime()).toBe(d.getTime())
  })

  it('daysBetween compte les jours, en négatif vers le passé', () => {
    expect(daysBetween('2026-09-01', '2026-10-01')).toBe(30)
    expect(daysBetween('2026-10-01', '2026-09-01')).toBe(-30)
  })

  it("daysBetween ignore le changement d'heure", () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })

  it('monthKey extrait YYYY-MM', () => {
    expect(monthKey('2026-04-15')).toBe('2026-04')
    expect(monthKey('2026-12-31')).toBe('2026-12')
  })

  it('monthLabel formate en français', () => {
    expect(monthLabel('2026-04')).toBe('avril 2026')
    expect(monthLabel('2026-08')).toBe('août 2026')
    expect(monthLabel('2026-12')).toBe('décembre 2026')
  })

  it('dateLabel formate complet en français', () => {
    expect(dateLabel('2026-05-07')).toBe('7 mai 2026')
    expect(dateLabel('2026-01-01')).toBe('1 janvier 2026')
  })

  it('dateLabelShort donne le jour court avec numéro', () => {
    // 1er mai 2026 = vendredi
    expect(dateLabelShort('2026-05-01')).toBe('ven. 01')
    // 7 mai 2026 = jeudi
    expect(dateLabelShort('2026-05-07')).toBe('jeu. 07')
  })

  it('dateRange énumère inclusivement', () => {
    expect(dateRange('2026-04-29', '2026-05-02')).toEqual([
      '2026-04-29',
      '2026-04-30',
      '2026-05-01',
      '2026-05-02',
    ])
  })

  it('dateRange accepte une seule date', () => {
    expect(dateRange('2026-05-07', '2026-05-07')).toEqual(['2026-05-07'])
  })
})

describe('lib/dates : drapeaux de dev', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('todayString renvoie la date du jour à Paris par défaut', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-05T12:00:00+02:00'))
    expect(todayString('2027-09-30')).toBe('2026-10-05')
    vi.useRealTimers()
  })

  it('todayString se fige sur la dernière date disponible avec VITE_FREEZE_TODAY', () => {
    vi.stubEnv('VITE_FREEZE_TODAY', 'last-available')
    expect(todayString('2027-09-30')).toBe('2027-09-30')
  })

  it('shouldShowFutureDates suit VITE_SHOW_FUTURE_DAYS', () => {
    expect(shouldShowFutureDates()).toBe(false)
    vi.stubEnv('VITE_SHOW_FUTURE_DAYS', '1')
    expect(shouldShowFutureDates()).toBe(true)
  })
})

describe('lib/dates : jour du défi', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('change à minuit heure de Paris, quel que soit le fuseau du serveur', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // 23 h 30 UTC le 4 octobre : déjà le 5 à Paris.
    vi.setSystemTime(new Date('2026-10-04T23:30:00Z'))
    expect(todayString()).toBe('2026-10-05')
  })
})
