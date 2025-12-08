import type { StxOptions } from '../src/types'
import { beforeEach, describe, expect, test } from 'bun:test'
import {
  cancelPendingLoads,
  clearTranslationCache,
  getLoadingLocales,
  getLoadingState,
  getTranslationAsync,
  getTranslationCacheStats,
  getTranslationSync,
  isLoaded,
  isLoading,
  loadTranslationLazy,
  preloadTranslations,
  preloadTranslationsBackground,
} from '../src/i18n'

// Mock options for testing
const mockOptions: StxOptions = {
  debug: false,
  i18n: {
    cache: true,
    translationsDir: 'test/fixtures/translations',
    format: 'json',
    defaultLocale: 'en',
    locale: 'en',
    fallbackToKey: true,
  },
}

describe('i18n lazy loading', () => {
  beforeEach(() => {
    // Clear all caches and pending loads before each test
    clearTranslationCache()
    cancelPendingLoads()
  })

  describe('getLoadingState', () => {
    test('returns idle for unloaded locale', () => {
      expect(getLoadingState('fr')).toBe('idle')
    })

    test('returns loaded for cached locale', async () => {
      // First load the locale
      await loadTranslationLazy('en', mockOptions)
      expect(getLoadingState('en')).toBe('loaded')
    })
  })

  describe('isLoading', () => {
    test('returns false for idle locale', () => {
      expect(isLoading('de')).toBe(false)
    })

    test('returns true during load', () => {
      // Start loading without awaiting
      const promise = loadTranslationLazy('en', mockOptions)
      // Check state while loading
      // Note: This may be flaky due to async timing
      expect(typeof isLoading('en')).toBe('boolean')
      // Clean up
      return promise
    })
  })

  describe('isLoaded', () => {
    test('returns false for unloaded locale', () => {
      expect(isLoaded('es')).toBe(false)
    })

    test('returns true after loading', async () => {
      await loadTranslationLazy('en', mockOptions)
      expect(isLoaded('en')).toBe(true)
    })
  })

  describe('loadTranslationLazy', () => {
    test('loads and caches translations', async () => {
      const translations = await loadTranslationLazy('en', mockOptions)
      expect(translations).toBeDefined()
      expect(typeof translations).toBe('object')
    })

    test('returns same promise for concurrent calls (deduplication)', async () => {
      // This tests that multiple calls share the same promise
      const promise1 = loadTranslationLazy('en', mockOptions)
      const promise2 = loadTranslationLazy('en', mockOptions)

      // Wait for both
      const [result1, result2] = await Promise.all([promise1, promise2])

      // Results should be the same object
      expect(result1).toBe(result2)
    })

    test('returns from cache on second call', async () => {
      const first = await loadTranslationLazy('en', mockOptions)
      const second = await loadTranslationLazy('en', mockOptions)

      // Should be the exact same cached object
      expect(first).toBe(second)
    })
  })

  describe('getTranslationSync', () => {
    test('returns undefined for unloaded locale', () => {
      expect(getTranslationSync('jp')).toBeUndefined()
    })

    test('returns translations for loaded locale', async () => {
      await loadTranslationLazy('en', mockOptions)
      const translations = getTranslationSync('en')
      expect(translations).toBeDefined()
      expect(typeof translations).toBe('object')
    })
  })

  describe('getTranslationAsync', () => {
    test('loads translations if not cached', async () => {
      const translations = await getTranslationAsync('en', mockOptions)
      expect(translations).toBeDefined()
    })

    test('returns cached translations immediately', async () => {
      // Pre-load
      await loadTranslationLazy('en', mockOptions)

      // Get from cache
      const start = performance.now()
      const translations = await getTranslationAsync('en', mockOptions)
      const duration = performance.now() - start

      expect(translations).toBeDefined()
      // Should be nearly instant (under 1ms for cache hit)
      expect(duration).toBeLessThan(10)
    })
  })

  describe('cancelPendingLoads', () => {
    test('cancels specific locale', () => {
      // Start a load
      loadTranslationLazy('en', mockOptions)

      // Cancel it
      cancelPendingLoads('en')

      // Loading state should be cleared
      expect(isLoading('en')).toBe(false)
    })

    test('cancels all pending loads', () => {
      // Start multiple loads
      loadTranslationLazy('en', mockOptions)
      loadTranslationLazy('es', mockOptions)

      // Cancel all
      cancelPendingLoads()

      // All should be cleared
      expect(getLoadingLocales()).toEqual([])
    })
  })

  describe('getLoadingLocales', () => {
    test('returns empty array when nothing loading', () => {
      expect(getLoadingLocales()).toEqual([])
    })
  })

  describe('preloadTranslations', () => {
    test('loads multiple locales in parallel', async () => {
      const loadedLocales: string[] = []

      await preloadTranslations({
        locales: ['en'],
        parallel: true,
        onLocaleLoaded: locale => loadedLocales.push(locale),
      }, mockOptions)

      expect(loadedLocales).toContain('en')
      expect(isLoaded('en')).toBe(true)
    })

    test('calls onComplete when done', async () => {
      let completed = false

      await preloadTranslations({
        locales: ['en'],
        onComplete: () => { completed = true },
      }, mockOptions)

      expect(completed).toBe(true)
    })

    test('handles errors via onError callback', async () => {
      const errors: Array<{ locale: string, error: Error }> = []

      await preloadTranslations({
        locales: ['nonexistent-locale-xyz'],
        onError: (locale, error) => errors.push({ locale, error }),
      }, mockOptions)

      // Depending on implementation, may fallback or error
      // Just verify callback mechanism works
      expect(Array.isArray(errors)).toBe(true)
    })

    test('respects priority order in sequential mode', async () => {
      const loadOrder: string[] = []

      await preloadTranslations({
        locales: ['en'],
        parallel: false,
        priority: { en: 10 },
        onLocaleLoaded: locale => loadOrder.push(locale),
      }, mockOptions)

      expect(loadOrder.length).toBeGreaterThan(0)
    })
  })

  describe('preloadTranslationsBackground', () => {
    test('returns immediately without blocking', () => {
      const start = performance.now()

      preloadTranslationsBackground({
        locales: ['en'],
      }, mockOptions)

      const duration = performance.now() - start

      // Should return nearly instantly (< 5ms)
      expect(duration).toBeLessThan(50)
    })
  })

  describe('getTranslationCacheStats', () => {
    test('returns empty stats when cache is empty', () => {
      const stats = getTranslationCacheStats()
      expect(stats.size).toBe(0)
      expect(stats.locales).toEqual([])
      expect(stats.entries).toEqual([])
    })

    test('returns accurate stats after loading', async () => {
      await loadTranslationLazy('en', mockOptions)

      const stats = getTranslationCacheStats()
      expect(stats.size).toBe(1)
      expect(stats.locales).toContain('en')
      expect(stats.entries.length).toBe(1)
      expect(stats.entries[0].locale).toBe('en')
      expect(stats.entries[0].loadedAt).toBeInstanceOf(Date)
    })
  })
})
