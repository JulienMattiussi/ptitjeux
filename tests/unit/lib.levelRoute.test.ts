import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameChallenges } from '~/lib/challenges-loader'
import { loadLevelRoute, loadListRoute } from '~/lib/levelRoute'

const challenges = gameChallenges({
  './2026-10/2026-10-04-1.json': async () => ({ id: 'hier' }),
  './2026-10/2026-10-05-2.json': async () => ({ id: "aujourd'hui" }),
  './2026-10/2026-10-06-1.json': async () => ({ id: 'demain' }),
})

async function load(date: string, index: string) {
  const { data, init } = await loadLevelRoute({ date, index }, challenges)
  return { ...data, status: init?.status }
}

describe('lib/levelRoute', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-05T12:00:00+02:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('loadListRoute renvoie les bornes du calendrier', () => {
    expect(loadListRoute(challenges)).toEqual({ firstDate: '2026-10-04', lastDate: '2026-10-06' })
  })

  it('charge un niveau publié', async () => {
    expect(await load('2026-10-05', '2')).toMatchObject({
      level: { id: "aujourd'hui" },
      status: 200,
    })
  })

  it('répond 404 pour un niveau absent', async () => {
    expect(await load('2026-10-05', '1')).toMatchObject({ level: null, status: 404 })
  })

  it('répond 404 pour un défi à venir', async () => {
    expect(await load('2026-10-06', '1')).toMatchObject({ level: null, status: 404 })
  })

  it('ouvre les défis à venir avec VITE_SHOW_FUTURE_DAYS', async () => {
    vi.stubEnv('VITE_SHOW_FUTURE_DAYS', '1')
    expect((await load('2026-10-06', '1')).level).toEqual({ id: 'demain' })
  })

  it.each([
    ['2026-10-04', '01'],
    ['2026-10-04', '1.0'],
    ['2026-10-04', '5'],
    ['04-10-2026', '1'],
  ])('répond 404 pour une URL mal formée (%s/%s)', async (date, index) => {
    expect((await load(date, index)).status).toBe(404)
  })
})
