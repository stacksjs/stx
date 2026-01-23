/**
 * Workbox Integration Test Suite
 *
 * Tests for:
 * - Strategy mapping
 * - Workbox service worker generation
 * - Runtime caching configuration
 * - Plugin generation
 */

import type { StxOptions } from '../../src/types'
import { describe, expect, test } from 'bun:test'
import {
  generateWorkboxConfig,
  generateWorkboxServiceWorker,
  isWorkboxEnabled,
} from '../../src/pwa/workbox'
import {
  mapStrategyToWorkbox,
  getWorkboxStrategyName,
  generatePatternMatcher,
  convertRouteToWorkbox,
  generateRuntimeCaching,
  createExpirationPlugin,
  createCacheableResponsePlugin,
  createBackgroundSyncPlugin,
  type StxCacheStrategy,
} from '../../src/pwa/workbox-strategies'
import { generateServiceWorkerAuto, isWorkboxEnabled as checkWorkboxFromSW } from '../../src/pwa/service-worker'

// ============================================================================
// Strategy Mapping Tests
// ============================================================================

describe('Workbox Strategy Mapping', () => {
  describe('mapStrategyToWorkbox', () => {
    test('should map cache-first to CacheFirst', () => {
      const result = mapStrategyToWorkbox('cache-first')

      expect(result.className).toBe('CacheFirst')
      expect(result.importFrom).toBe('workbox-strategies')
    })

    test('should map network-first to NetworkFirst', () => {
      const result = mapStrategyToWorkbox('network-first')

      expect(result.className).toBe('NetworkFirst')
    })

    test('should map stale-while-revalidate to StaleWhileRevalidate', () => {
      const result = mapStrategyToWorkbox('stale-while-revalidate')

      expect(result.className).toBe('StaleWhileRevalidate')
    })

    test('should map network-only to NetworkOnly', () => {
      const result = mapStrategyToWorkbox('network-only')

      expect(result.className).toBe('NetworkOnly')
    })

    test('should map cache-only to CacheOnly', () => {
      const result = mapStrategyToWorkbox('cache-only')

      expect(result.className).toBe('CacheOnly')
    })

    test('should default to NetworkFirst for unknown strategies', () => {
      // @ts-expect-error testing invalid input
      const result = mapStrategyToWorkbox('invalid-strategy')

      expect(result.className).toBe('NetworkFirst')
    })
  })

  describe('getWorkboxStrategyName', () => {
    test('should return strategy class name', () => {
      expect(getWorkboxStrategyName('cache-first')).toBe('CacheFirst')
      expect(getWorkboxStrategyName('network-first')).toBe('NetworkFirst')
      expect(getWorkboxStrategyName('stale-while-revalidate')).toBe('StaleWhileRevalidate')
    })
  })
})

// ============================================================================
// Pattern Matcher Tests
// ============================================================================

describe('Pattern Matcher Generation', () => {
  describe('generatePatternMatcher', () => {
    test('should handle file extension patterns (*.js)', () => {
      const matcher = generatePatternMatcher('*.js')

      expect(matcher).toContain('request.destination')
      expect(matcher).toContain('script')
    })

    test('should handle file extension patterns (*.css)', () => {
      const matcher = generatePatternMatcher('*.css')

      expect(matcher).toContain('style')
    })

    test('should handle image extension patterns', () => {
      const matcher = generatePatternMatcher('*.png')

      expect(matcher).toContain('image')
    })

    test('should handle font extension patterns', () => {
      const matcher = generatePatternMatcher('*.woff2')

      expect(matcher).toContain('font')
    })

    test('should handle glob patterns ending with /**', () => {
      const matcher = generatePatternMatcher('/api/**')

      expect(matcher).toContain('url.pathname.startsWith')
      expect(matcher).toContain('/api')
    })

    test('should handle glob patterns ending with /*', () => {
      const matcher = generatePatternMatcher('/static/*')

      expect(matcher).toContain('url.pathname.startsWith')
      expect(matcher).toContain('/static')
      expect(matcher).toContain('includes')
    })

    test('should handle patterns with * in the middle', () => {
      const matcher = generatePatternMatcher('/images/*.png')

      expect(matcher).toContain('startsWith')
      expect(matcher).toContain('endsWith')
    })

    test('should handle exact path patterns', () => {
      const matcher = generatePatternMatcher('/')

      expect(matcher).toContain('url.pathname')
      expect(matcher).toContain("'/'")
    })
  })
})

// ============================================================================
// Plugin Generation Tests
// ============================================================================

describe('Plugin Generation', () => {
  describe('createExpirationPlugin', () => {
    test('should create expiration plugin with maxEntries', () => {
      const plugin = createExpirationPlugin({ maxEntries: 50 })

      expect(plugin.className).toBe('ExpirationPlugin')
      expect(plugin.importFrom).toBe('workbox-expiration')
      expect(plugin.options?.maxEntries).toBe(50)
    })

    test('should create expiration plugin with maxAgeSeconds', () => {
      const plugin = createExpirationPlugin({ maxAgeSeconds: 86400 })

      expect(plugin.options?.maxAgeSeconds).toBe(86400)
    })

    test('should create expiration plugin with all options', () => {
      const plugin = createExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 3600,
        purgeOnQuotaError: true,
      })

      expect(plugin.options?.maxEntries).toBe(100)
      expect(plugin.options?.maxAgeSeconds).toBe(3600)
      expect(plugin.options?.purgeOnQuotaError).toBe(true)
    })
  })

  describe('createCacheableResponsePlugin', () => {
    test('should create cacheable response plugin with statuses', () => {
      const plugin = createCacheableResponsePlugin({ statuses: [0, 200] })

      expect(plugin.className).toBe('CacheableResponsePlugin')
      expect(plugin.importFrom).toBe('workbox-cacheable-response')
      expect(plugin.options?.statuses).toEqual([0, 200])
    })

    test('should create cacheable response plugin with headers', () => {
      const plugin = createCacheableResponsePlugin({
        headers: { 'x-custom': 'value' },
      })

      expect(plugin.options?.headers).toEqual({ 'x-custom': 'value' })
    })
  })

  describe('createBackgroundSyncPlugin', () => {
    test('should create background sync plugin', () => {
      const plugin = createBackgroundSyncPlugin({ name: 'my-queue' })

      expect(plugin.className).toBe('BackgroundSyncPlugin')
      expect(plugin.importFrom).toBe('workbox-background-sync')
      expect(plugin.options?.name).toBe('my-queue')
    })

    test('should create background sync plugin with options', () => {
      const plugin = createBackgroundSyncPlugin({
        name: 'form-queue',
        maxRetentionTime: 1440,
        forceSyncFallback: true,
      })

      expect(plugin.options?.maxRetentionTime).toBe(1440)
      expect(plugin.options?.forceSyncFallback).toBe(true)
    })
  })
})

// ============================================================================
// Route Conversion Tests
// ============================================================================

describe('Route Conversion', () => {
  describe('convertRouteToWorkbox', () => {
    test('should convert basic route', () => {
      const result = convertRouteToWorkbox({
        pattern: '/api/*',
        strategy: 'network-first',
      })

      expect(result.urlPattern).toBe('/api/*')
      expect(result.handler).toBe('NetworkFirst')
    })

    test('should include expiration plugin when limits set', () => {
      const result = convertRouteToWorkbox({
        pattern: '/images/*',
        strategy: 'cache-first',
        maxAgeSeconds: 86400,
        maxEntries: 100,
      })

      expect(result.options?.plugins).toBeDefined()
      expect(result.options!.plugins!.length).toBeGreaterThan(0)
      expect(result.options!.plugins!.some(p => p.className === 'ExpirationPlugin')).toBe(true)
    })

    test('should include cacheable response plugin for network strategies', () => {
      const result = convertRouteToWorkbox({
        pattern: '/',
        strategy: 'network-first',
      })

      expect(result.options?.plugins?.some(p => p.className === 'CacheableResponsePlugin')).toBe(true)
    })

    test('should include cacheable response plugin for stale-while-revalidate', () => {
      const result = convertRouteToWorkbox({
        pattern: '/*.js',
        strategy: 'stale-while-revalidate',
      })

      expect(result.options?.plugins?.some(p => p.className === 'CacheableResponsePlugin')).toBe(true)
    })

    test('should not include cacheable response for cache-first', () => {
      const result = convertRouteToWorkbox({
        pattern: '/*.png',
        strategy: 'cache-first',
      })

      const hasPlugin = result.options?.plugins?.some(p => p.className === 'CacheableResponsePlugin')
      expect(hasPlugin).toBeFalsy()
    })
  })

  describe('generateRuntimeCaching', () => {
    test('should convert multiple routes', () => {
      const routes = [
        { pattern: '/', strategy: 'network-first' as StxCacheStrategy },
        { pattern: '*.js', strategy: 'stale-while-revalidate' as StxCacheStrategy },
        { pattern: '*.png', strategy: 'cache-first' as StxCacheStrategy },
      ]

      const result = generateRuntimeCaching(routes)

      expect(result.length).toBe(3)
      expect(result[0].handler).toBe('NetworkFirst')
      expect(result[1].handler).toBe('StaleWhileRevalidate')
      expect(result[2].handler).toBe('CacheFirst')
    })
  })
})

// ============================================================================
// Workbox Config Generation Tests
// ============================================================================

describe('Workbox Config Generation', () => {
  describe('generateWorkboxConfig', () => {
    test('should return empty config when PWA disabled', () => {
      const options: StxOptions = {
        pwa: { enabled: false },
      }

      const config = generateWorkboxConfig(options)

      expect(config.modules.length).toBe(0)
    })

    test('should include required modules', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          routes: [
            { pattern: '/', strategy: 'network-first' },
          ],
        },
      }

      const config = generateWorkboxConfig(options)

      // Should have precaching and routing modules
      expect(config.modules.some(m => m.name === 'workbox-precaching')).toBe(true)
      expect(config.modules.some(m => m.name === 'workbox-routing')).toBe(true)
      expect(config.modules.some(m => m.name === 'workbox-strategies')).toBe(true)
    })

    test('should include expiration module when needed', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          routes: [
            { pattern: '/', strategy: 'cache-first', maxAgeSeconds: 3600 },
          ],
        },
      }

      const config = generateWorkboxConfig(options)

      expect(config.modules.some(m => m.name === 'workbox-expiration')).toBe(true)
    })

    test('should include background sync module when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          backgroundSync: {
            enabled: true,
            queueName: 'test-queue',
          },
        },
      }

      const config = generateWorkboxConfig(options)

      expect(config.modules.some(m => m.name === 'workbox-background-sync')).toBe(true)
    })

    test('should set skipWaiting and clientsClaim', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            skipWaiting: true,
            clientsClaim: true,
          },
        },
      }

      const config = generateWorkboxConfig(options)

      expect(config.skipWaiting).toBe(true)
      expect(config.clientsClaim).toBe(true)
    })

    test('should set offline fallback when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          offline: { enabled: true },
        },
      }

      const config = generateWorkboxConfig(options)

      expect(config.offlineFallback).toBe('/offline.html')
    })
  })
})

// ============================================================================
// Workbox Service Worker Generation Tests
// ============================================================================

describe('Workbox Service Worker Generation', () => {
  describe('generateWorkboxServiceWorker', () => {
    test('should return empty string when PWA disabled', () => {
      const options: StxOptions = {
        pwa: { enabled: false },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toBe('')
    })

    test('should generate valid service worker code', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test App' },
          serviceWorker: {
            cacheVersion: '2.0.0',
          },
        },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toContain('workbox-sw.js')
      expect(sw).toContain('CACHE_VERSION')
      expect(sw).toContain('2.0.0')
    })

    test('should include precaching code', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
        },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toContain('precacheAndRoute')
      expect(sw).toContain('PRECACHE_MANIFEST')
    })

    test('should include runtime caching', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          routes: [
            { pattern: '/api/*', strategy: 'network-first' },
            { pattern: '*.js', strategy: 'stale-while-revalidate' },
          ],
        },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toContain('registerRoute')
      expect(sw).toContain('NetworkFirst')
      expect(sw).toContain('StaleWhileRevalidate')
    })

    test('should include skipWaiting when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            skipWaiting: true,
          },
        },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toContain('self.skipWaiting()')
    })

    test('should include clients.claim when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            clientsClaim: true,
          },
        },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toContain('self.clients.claim()')
    })

    test('should include push handlers when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          push: { enabled: true },
        },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toContain('push')
      expect(sw).toContain('notificationclick')
    })

    test('should include background sync when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          backgroundSync: {
            enabled: true,
            queueName: 'my-queue',
          },
        },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toContain('Queue')
      expect(sw).toContain('my-queue')
    })

    test('should include message handlers', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
        },
      }

      const sw = generateWorkboxServiceWorker(options)

      expect(sw).toContain("addEventListener('message'")
      expect(sw).toContain('SKIP_WAITING')
      expect(sw).toContain('CLEAR_CACHE')
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Workbox Integration', () => {
  describe('isWorkboxEnabled', () => {
    test('should return false when PWA disabled', () => {
      const options: StxOptions = {
        pwa: { enabled: false },
      }

      expect(isWorkboxEnabled(options)).toBe(false)
    })

    test('should return false when useWorkbox is false', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            useWorkbox: false,
          },
        },
      }

      expect(isWorkboxEnabled(options)).toBe(false)
    })

    test('should return true when useWorkbox is true', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            useWorkbox: true,
          },
        },
      }

      expect(isWorkboxEnabled(options)).toBe(true)
    })

    test('should match service-worker module check', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            useWorkbox: true,
          },
        },
      }

      expect(isWorkboxEnabled(options)).toBe(checkWorkboxFromSW(options))
    })
  })

  describe('generateServiceWorkerAuto', () => {
    test('should generate native SW when Workbox disabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            useWorkbox: false,
            cacheVersion: '1.0.0',
          },
        },
      }

      const sw = generateServiceWorkerAuto(options)

      // Native SW does not import workbox-sw.js
      expect(sw).not.toContain('workbox-sw.js')
      expect(sw).toContain('Auto-generated by stx')
    })

    test('should generate Workbox SW when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            useWorkbox: true,
            cacheVersion: '1.0.0',
          },
        },
      }

      const sw = generateServiceWorkerAuto(options)

      expect(sw).toContain('workbox-sw.js')
      expect(sw).toContain('Generated by stx with Workbox')
    })

    test('should return empty string when PWA disabled', () => {
      const options: StxOptions = {
        pwa: { enabled: false },
      }

      const sw = generateServiceWorkerAuto(options)

      expect(sw).toBe('')
    })
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  test('should handle empty routes', () => {
    const options: StxOptions = {
      pwa: {
        enabled: true,
        manifest: { name: 'Test' },
        routes: [],
      },
    }

    const sw = generateWorkboxServiceWorker(options)

    expect(sw).toBeTruthy()
    expect(sw).toContain('workbox')
  })

  test('should handle missing optional config', () => {
    const options: StxOptions = {
      pwa: {
        enabled: true,
        manifest: { name: 'Test' },
      },
    }

    const sw = generateWorkboxServiceWorker(options)
    const config = generateWorkboxConfig(options)

    expect(sw).toBeTruthy()
    expect(config.skipWaiting).toBe(true) // Default
    expect(config.clientsClaim).toBe(true) // Default
  })

  test('should handle all strategies in routes', () => {
    const strategies: StxCacheStrategy[] = [
      'cache-first',
      'network-first',
      'stale-while-revalidate',
      'network-only',
      'cache-only',
    ]

    const options: StxOptions = {
      pwa: {
        enabled: true,
        manifest: { name: 'Test' },
        routes: strategies.map((strategy, i) => ({
          pattern: `/route-${i}`,
          strategy,
        })),
      },
    }

    const sw = generateWorkboxServiceWorker(options)

    expect(sw).toContain('CacheFirst')
    expect(sw).toContain('NetworkFirst')
    expect(sw).toContain('StaleWhileRevalidate')
    expect(sw).toContain('NetworkOnly')
    expect(sw).toContain('CacheOnly')
  })
})
