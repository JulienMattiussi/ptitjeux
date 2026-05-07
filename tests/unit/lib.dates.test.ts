import { describe, expect, it } from 'vitest'
import {
  compareDates,
  dateLabel,
  dateLabelShort,
  dateRange,
  formatDate,
  monthKey,
  monthLabel,
  parseDate,
} from '~/lib/dates'

describe('lib/dates', () => {
  it('formatDate renvoie YYYY-MM-DD avec padding', () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe('2026-01-01')
    expect(formatDate(new Date(2026, 4, 7))).toBe('2026-05-07')
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('parseDate inverse formatDate', () => {
    const d = new Date(2026, 4, 7)
    expect(parseDate(formatDate(d)).getTime()).toBe(d.getTime())
  })

  it('compareDates ordonne chronologiquement', () => {
    expect(compareDates('2026-04-01', '2026-04-02')).toBe(-1)
    expect(compareDates('2026-04-02', '2026-04-01')).toBe(1)
    expect(compareDates('2026-04-01', '2026-04-01')).toBe(0)
    // Tri lexicographique = chronologique grâce au padding
    expect(['2026-05-01', '2026-04-30'].sort(compareDates)).toEqual([
      '2026-04-30',
      '2026-05-01',
    ])
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

  it('dateRange supporte une seule date', () => {
    expect(dateRange('2026-05-07', '2026-05-07')).toEqual(['2026-05-07'])
  })
})
