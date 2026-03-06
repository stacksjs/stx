import { describe, expect, test, beforeEach } from 'bun:test'
import {
  AnalyticsEngine,
  configureAnalytics,
  getAnalytics,
  getAnalyticsEngine,
  resetAnalytics,
} from '../src/analytics'
import { MemoryAnalyticsStorage } from '../src/storage/memory'

describe('configureAnalytics and resetAnalytics', () => {
  beforeEach(() => {
    resetAnalytics()
  })

  test('configureAnalytics sets up the engine', () => {
    const storage = new MemoryAnalyticsStorage()
    configureAnalytics({ storage })
    const engine = getAnalyticsEngine()
    expect(engine).toBeInstanceOf(AnalyticsEngine)
    expect(engine.storage).toBe(storage)
  })

  test('configureAnalytics uses defaults', () => {
    configureAnalytics({})
    const engine = getAnalyticsEngine()
    expect(engine.config.anonymize).toBe(true)
    expect(engine.config.sessionTimeout).toBe(1800000)
    expect(engine.storage).toBeInstanceOf(MemoryAnalyticsStorage)
  })

  test('resetAnalytics clears the engine', () => {
    const storage = new MemoryAnalyticsStorage()
    configureAnalytics({ storage })
    resetAnalytics()

    // Getting engine after reset creates a new default one
    const engine = getAnalyticsEngine()
    expect(engine.storage).not.toBe(storage)
  })

  test('getAnalyticsEngine creates default engine if not configured', () => {
    const engine = getAnalyticsEngine()
    expect(engine).toBeInstanceOf(AnalyticsEngine)
    expect(engine.config.anonymize).toBe(true)
  })
})

describe('getAnalytics', () => {
  beforeEach(() => {
    resetAnalytics()
  })

  test('returns correct stats after tracking', async () => {
    const storage = new MemoryAnalyticsStorage()
    configureAnalytics({ storage })
    const engine = getAnalyticsEngine()

    await engine.trackPageView({ path: '/home', sessionId: 'a' })
    await engine.trackPageView({ path: '/about', sessionId: 'a' })
    await engine.trackPageView({ path: '/home', sessionId: 'b' })

    const stats = await getAnalytics()
    expect(stats.totalPageViews).toBe(3)
    expect(stats.uniqueVisitors).toBe(2)
    expect(stats.topPages[0]).toEqual({ path: '/home', views: 2 })
    expect(stats.topPages[1]).toEqual({ path: '/about', views: 1 })
  })

  test('returns empty stats when no data', async () => {
    configureAnalytics({})
    const stats = await getAnalytics()
    expect(stats.totalPageViews).toBe(0)
    expect(stats.uniqueVisitors).toBe(0)
  })

  test('filters by date range', async () => {
    const storage = new MemoryAnalyticsStorage()
    configureAnalytics({ storage })

    const now = Date.now()
    await storage.savePageView({
      id: '1',
      path: '/old',
      timestamp: now - 86400000 * 10,
    })
    await storage.savePageView({
      id: '2',
      path: '/new',
      timestamp: now,
      sessionId: 's1',
    })

    const stats = await getAnalytics({
      from: new Date(now - 86400000),
    })
    expect(stats.totalPageViews).toBe(1)
    expect(stats.topPages[0].path).toBe('/new')
  })
})

describe('AnalyticsEngine', () => {
  test('trackPageView stores and returns view', async () => {
    const storage = new MemoryAnalyticsStorage()
    const engine = new AnalyticsEngine({ storage })

    const view = await engine.trackPageView({ path: '/test' })
    expect(view.path).toBe('/test')
    expect(view.id).toBeTruthy()

    const views = await engine.getPageViews()
    expect(views).toHaveLength(1)
  })

  test('trackPageView from Request', async () => {
    const storage = new MemoryAnalyticsStorage()
    const engine = new AnalyticsEngine({ storage })

    const request = new Request('https://example.com/dashboard', {
      headers: {
        'referer': 'https://google.com',
        'user-agent': 'Mozilla/5.0',
      },
    })

    const view = await engine.trackPageView(request)
    expect(view.path).toBe('/dashboard')
    expect(view.referrer).toBe('https://google.com')
    expect(view.userAgent).toBe('Mozilla/5.0')
  })

  test('trackPageView rejects ignored paths', async () => {
    const storage = new MemoryAnalyticsStorage()
    const engine = new AnalyticsEngine({
      storage,
      ignorePaths: ['/health'],
    })

    expect(engine.trackPageView({ path: '/health' })).rejects.toThrow('excluded from tracking')
  })

  test('trackEvent stores and returns event', async () => {
    const storage = new MemoryAnalyticsStorage()
    const engine = new AnalyticsEngine({ storage })

    const event = await engine.trackEvent('click', { button: 'cta' })
    expect(event.name).toBe('click')
    expect(event.data).toEqual({ button: 'cta' })

    const events = await engine.getEvents()
    expect(events).toHaveLength(1)
  })

  test('getStats delegates to storage', async () => {
    const storage = new MemoryAnalyticsStorage()
    const engine = new AnalyticsEngine({ storage })

    await engine.trackPageView({ path: '/a', sessionId: 'x' })
    await engine.trackPageView({ path: '/b', sessionId: 'y' })

    const stats = await engine.getStats()
    expect(stats.totalPageViews).toBe(2)
    expect(stats.uniqueVisitors).toBe(2)
  })
})
