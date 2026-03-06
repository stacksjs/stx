import { describe, expect, test, beforeEach } from 'bun:test'
import { trackPageView, trackEvent, shouldTrack } from '../src/tracker'
import { configureAnalytics, resetAnalytics } from '../src/analytics'
import { MemoryAnalyticsStorage } from '../src/storage/memory'
import type { AnalyticsConfig } from '../src/types'

describe('trackPageView', () => {
  beforeEach(() => {
    resetAnalytics()
    configureAnalytics({ storage: new MemoryAnalyticsStorage() })
  })

  test('creates a PageView from plain object', async () => {
    const view = await trackPageView({
      path: '/test',
      referrer: 'https://google.com',
      userAgent: 'TestBot/1.0',
      sessionId: 'sess-1',
    })

    expect(view.id).toBeTruthy()
    expect(view.path).toBe('/test')
    expect(view.referrer).toBe('https://google.com')
    expect(view.userAgent).toBe('TestBot/1.0')
    expect(view.sessionId).toBe('sess-1')
    expect(view.timestamp).toBeGreaterThan(0)
  })

  test('creates a PageView from Request', async () => {
    const request = new Request('https://example.com/about', {
      headers: {
        'referer': 'https://google.com',
        'user-agent': 'TestBot/2.0',
      },
    })

    const view = await trackPageView(request)
    expect(view.path).toBe('/about')
    expect(view.referrer).toBe('https://google.com')
    expect(view.userAgent).toBe('TestBot/2.0')
  })

  test('creates a PageView with no referrer', async () => {
    const view = await trackPageView({ path: '/home' })
    expect(view.path).toBe('/home')
    expect(view.referrer).toBeUndefined()
  })

  test('creates a PageView with no sessionId', async () => {
    const view = await trackPageView({ path: '/home' })
    expect(view.sessionId).toBeUndefined()
  })
})

describe('trackEvent', () => {
  beforeEach(() => {
    resetAnalytics()
    configureAnalytics({ storage: new MemoryAnalyticsStorage() })
  })

  test('creates an AnalyticsEvent', async () => {
    const event = await trackEvent('click', { button: 'signup' })

    expect(event.id).toBeTruthy()
    expect(event.name).toBe('click')
    expect(event.data).toEqual({ button: 'signup' })
    expect(event.timestamp).toBeGreaterThan(0)
  })

  test('creates an event without data', async () => {
    const event = await trackEvent('pageload')
    expect(event.name).toBe('pageload')
    expect(event.data).toBeUndefined()
  })

  test('extracts path from Request', async () => {
    const request = new Request('https://example.com/pricing')
    const event = await trackEvent('click', undefined, request)
    expect(event.path).toBe('/pricing')
  })

  test('extracts path and sessionId from plain object', async () => {
    const event = await trackEvent('click', undefined, { path: '/about', sessionId: 's1' })
    expect(event.path).toBe('/about')
    expect(event.sessionId).toBe('s1')
  })
})

describe('shouldTrack', () => {
  test('returns true when no ignorePaths', () => {
    const config: AnalyticsConfig = {
      storage: new MemoryAnalyticsStorage(),
      ignorePaths: [],
    }
    expect(shouldTrack('/anything', config)).toBe(true)
  })

  test('returns true when ignorePaths is undefined', () => {
    const config: AnalyticsConfig = {
      storage: new MemoryAnalyticsStorage(),
    }
    expect(shouldTrack('/anything', config)).toBe(true)
  })

  test('excludes exact match paths', () => {
    const config: AnalyticsConfig = {
      storage: new MemoryAnalyticsStorage(),
      ignorePaths: ['/health', '/api/ping'],
    }
    expect(shouldTrack('/health', config)).toBe(false)
    expect(shouldTrack('/api/ping', config)).toBe(false)
    expect(shouldTrack('/home', config)).toBe(true)
  })

  test('excludes paths matching glob with *', () => {
    const config: AnalyticsConfig = {
      storage: new MemoryAnalyticsStorage(),
      ignorePaths: ['/api/*'],
    }
    expect(shouldTrack('/api/users', config)).toBe(false)
    expect(shouldTrack('/api/posts/1', config)).toBe(false)
    expect(shouldTrack('/home', config)).toBe(true)
  })

  test('supports multiple glob patterns', () => {
    const config: AnalyticsConfig = {
      storage: new MemoryAnalyticsStorage(),
      ignorePaths: ['/health', '/api/*', '/_stx/*'],
    }
    expect(shouldTrack('/health', config)).toBe(false)
    expect(shouldTrack('/api/data', config)).toBe(false)
    expect(shouldTrack('/_stx/analytics/pageview', config)).toBe(false)
    expect(shouldTrack('/about', config)).toBe(true)
  })
})
