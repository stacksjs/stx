import { describe, expect, test } from 'bun:test'
import { MemoryAnalyticsStorage } from '../src/storage/memory'
import type { AnalyticsEvent, PageView } from '../src/types'

function makePageView(overrides: Partial<PageView> = {}): PageView {
  return {
    id: crypto.randomUUID(),
    path: '/home',
    timestamp: Date.now(),
    ...overrides,
  }
}

function makeEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    id: crypto.randomUUID(),
    name: 'click',
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('MemoryAnalyticsStorage', () => {
  test('savePageView and getPageViews', async () => {
    const storage = new MemoryAnalyticsStorage()
    const view = makePageView()
    await storage.savePageView(view)

    const views = await storage.getPageViews()
    expect(views).toHaveLength(1)
    expect(views[0].path).toBe('/home')
  })

  test('saveEvent and getEvents', async () => {
    const storage = new MemoryAnalyticsStorage()
    const event = makeEvent({ name: 'signup' })
    await storage.saveEvent(event)

    const events = await storage.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('signup')
  })

  test('count returns total of page views and events', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView())
    await storage.savePageView(makePageView())
    await storage.saveEvent(makeEvent())

    expect(await storage.count()).toBe(3)
  })

  test('clear removes all data', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView())
    await storage.saveEvent(makeEvent())
    await storage.clear()

    expect(await storage.count()).toBe(0)
    expect(await storage.getPageViews()).toHaveLength(0)
    expect(await storage.getEvents()).toHaveLength(0)
  })

  test('getPageViews filters by date range', async () => {
    const storage = new MemoryAnalyticsStorage()
    const now = Date.now()
    await storage.savePageView(makePageView({ timestamp: now - 86400000 * 3 })) // 3 days ago
    await storage.savePageView(makePageView({ timestamp: now - 86400000 })) // 1 day ago
    await storage.savePageView(makePageView({ timestamp: now }))

    const views = await storage.getPageViews({
      from: new Date(now - 86400000 * 2),
      to: new Date(now + 1000),
    })
    expect(views).toHaveLength(2)
  })

  test('getPageViews filters by path', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView({ path: '/about' }))
    await storage.savePageView(makePageView({ path: '/home' }))
    await storage.savePageView(makePageView({ path: '/about' }))

    const views = await storage.getPageViews({ path: '/about' })
    expect(views).toHaveLength(2)
  })

  test('getPageViews respects limit', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView())
    await storage.savePageView(makePageView())
    await storage.savePageView(makePageView())

    const views = await storage.getPageViews({ limit: 2 })
    expect(views).toHaveLength(2)
  })

  test('getEvents filters by event name', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.saveEvent(makeEvent({ name: 'click' }))
    await storage.saveEvent(makeEvent({ name: 'signup' }))
    await storage.saveEvent(makeEvent({ name: 'click' }))

    const events = await storage.getEvents({ event: 'click' })
    expect(events).toHaveLength(2)
  })

  test('getEvents filters by path', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.saveEvent(makeEvent({ path: '/home' }))
    await storage.saveEvent(makeEvent({ path: '/about' }))

    const events = await storage.getEvents({ path: '/home' })
    expect(events).toHaveLength(1)
  })

  test('getEvents filters by date range', async () => {
    const storage = new MemoryAnalyticsStorage()
    const now = Date.now()
    await storage.saveEvent(makeEvent({ timestamp: now - 86400000 * 5 }))
    await storage.saveEvent(makeEvent({ timestamp: now }))

    const events = await storage.getEvents({
      from: new Date(now - 86400000),
    })
    expect(events).toHaveLength(1)
  })

  test('getStats computes totalPageViews and uniqueVisitors', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView({ sessionId: 'a' }))
    await storage.savePageView(makePageView({ sessionId: 'a' }))
    await storage.savePageView(makePageView({ sessionId: 'b' }))

    const stats = await storage.getStats()
    expect(stats.totalPageViews).toBe(3)
    expect(stats.uniqueVisitors).toBe(2)
  })

  test('getStats computes topPages', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView({ path: '/home' }))
    await storage.savePageView(makePageView({ path: '/about' }))
    await storage.savePageView(makePageView({ path: '/home' }))

    const stats = await storage.getStats()
    expect(stats.topPages[0]).toEqual({ path: '/home', views: 2 })
    expect(stats.topPages[1]).toEqual({ path: '/about', views: 1 })
  })

  test('getStats computes topReferrers', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView({ referrer: 'https://google.com' }))
    await storage.savePageView(makePageView({ referrer: 'https://google.com' }))
    await storage.savePageView(makePageView({ referrer: 'https://twitter.com' }))
    await storage.savePageView(makePageView()) // no referrer

    const stats = await storage.getStats()
    expect(stats.topReferrers).toHaveLength(2)
    expect(stats.topReferrers[0]).toEqual({ referrer: 'https://google.com', count: 2 })
  })

  test('getStats computes topCountries', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView({ country: 'US' }))
    await storage.savePageView(makePageView({ country: 'US' }))
    await storage.savePageView(makePageView({ country: 'DE' }))

    const stats = await storage.getStats()
    expect(stats.topCountries[0]).toEqual({ country: 'US', count: 2 })
    expect(stats.topCountries[1]).toEqual({ country: 'DE', count: 1 })
  })

  test('getStats computes averageDuration', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView({ duration: 1000 }))
    await storage.savePageView(makePageView({ duration: 3000 }))
    await storage.savePageView(makePageView()) // no duration

    const stats = await storage.getStats()
    expect(stats.averageDuration).toBe(2000)
  })

  test('getStats averageDuration is undefined when no durations', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView())

    const stats = await storage.getStats()
    expect(stats.averageDuration).toBeUndefined()
  })

  test('getStats computes event aggregation', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.saveEvent(makeEvent({ name: 'click' }))
    await storage.saveEvent(makeEvent({ name: 'click' }))
    await storage.saveEvent(makeEvent({ name: 'signup' }))

    const stats = await storage.getStats()
    expect(stats.events).toBeDefined()
    expect(stats.events![0]).toEqual({ name: 'click', count: 2 })
    expect(stats.events![1]).toEqual({ name: 'signup', count: 1 })
  })

  test('getStats with groupBy day', async () => {
    const storage = new MemoryAnalyticsStorage()
    const day1 = new Date('2025-01-15T10:00:00Z').getTime()
    const day2 = new Date('2025-01-16T10:00:00Z').getTime()
    await storage.savePageView(makePageView({ timestamp: day1 }))
    await storage.savePageView(makePageView({ timestamp: day1 + 1000 }))
    await storage.savePageView(makePageView({ timestamp: day2 }))

    const stats = await storage.getStats({ groupBy: 'day' })
    expect(stats.pageViewsByPeriod).toBeDefined()
    expect(stats.pageViewsByPeriod).toHaveLength(2)
    expect(stats.pageViewsByPeriod![0].count).toBe(2)
    expect(stats.pageViewsByPeriod![1].count).toBe(1)
  })

  test('getStats with groupBy month', async () => {
    const storage = new MemoryAnalyticsStorage()
    const jan = new Date('2025-01-15T10:00:00Z').getTime()
    const feb = new Date('2025-02-15T10:00:00Z').getTime()
    await storage.savePageView(makePageView({ timestamp: jan }))
    await storage.savePageView(makePageView({ timestamp: feb }))

    const stats = await storage.getStats({ groupBy: 'month' })
    expect(stats.pageViewsByPeriod).toBeDefined()
    expect(stats.pageViewsByPeriod).toHaveLength(2)
  })

  test('getStats returns empty result for empty storage', async () => {
    const storage = new MemoryAnalyticsStorage()
    const stats = await storage.getStats()

    expect(stats.totalPageViews).toBe(0)
    expect(stats.uniqueVisitors).toBe(0)
    expect(stats.topPages).toHaveLength(0)
    expect(stats.topReferrers).toHaveLength(0)
    expect(stats.topCountries).toHaveLength(0)
    expect(stats.averageDuration).toBeUndefined()
  })

  test('getStats events is undefined when no events', async () => {
    const storage = new MemoryAnalyticsStorage()
    await storage.savePageView(makePageView())

    const stats = await storage.getStats()
    expect(stats.events).toBeUndefined()
  })
})
