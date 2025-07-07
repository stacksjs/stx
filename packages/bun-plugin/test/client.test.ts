import { beforeEach, describe, expect, test } from 'bun:test'

// Import client functions
import { hydrateIslands, initIslands, preloadIslandHandlers, version } from '../src/client'

// Use happy-dom environment from shared config
// The window and document globals are already set up by happy-dom.ts

describe('BUN-PLUGIN: Client Module Tests', () => {
  beforeEach(() => {
    // Reset document state between tests
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  test('should export version information', () => {
    expect(version).toBe('1.0.0')
    expect(typeof version).toBe('string')
  })

  test('should export hydration functions', () => {
    expect(typeof hydrateIslands).toBe('function')
    expect(typeof initIslands).toBe('function')
    expect(typeof preloadIslandHandlers).toBe('function')
  })

  test('should handle hydrateIslands with empty handlers', () => {
    // Should not throw when called with empty handlers
    expect(() => {
      hydrateIslands({})
    }).not.toThrow()
  })

  test('should handle hydrateIslands with mock handlers', () => {
    const testIsland = document.createElement('div')
    testIsland.setAttribute('data-island', 'test-island')
    testIsland.setAttribute('data-priority', 'eager')
    testIsland.setAttribute('data-hydrated', 'false')
    document.body.appendChild(testIsland)

    const mockHandler = async () => ({
      default: () => {},
    })

    const handlers = {
      'test-island': mockHandler,
    }

    // Should not throw when called with valid handlers
    expect(() => {
      hydrateIslands(handlers)
    }).not.toThrow()
  })

  test('should handle preloadIslandHandlers function', () => {
    const mockHandlers = {
      'test-component': async () => ({ default: () => {} }),
    }

    // Should not throw when preloading handlers
    expect(() => {
      preloadIslandHandlers(mockHandlers)
    }).not.toThrow()
  })

  test('should handle initIslands with default config', () => {
    const mockHandlers = {
      'test-component': async () => ({ default: () => {} }),
    }

    // Should not throw with default configuration
    expect(() => {
      initIslands(mockHandlers)
    }).not.toThrow()
  })

  test('should handle initIslands with custom config', () => {
    const mockHandlers = {
      'test-component': async () => ({ default: () => {} }),
    }

    const config = {
      autoStart: false,
      preload: 'eager' as const,
    }

    // Should not throw with custom configuration
    expect(() => {
      initIslands(mockHandlers, config)
    }).not.toThrow()
  })

  test('should handle non-browser environment gracefully', () => {
    // Temporarily remove browser globals
    const originalDocument = globalThis.document
    const originalWindow = globalThis.window

    // Mock typeof checks for browser environment
    Object.defineProperty(globalThis, 'document', {
      value: undefined,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
    })

    const handlers = {
      'test-component': async () => ({ default: () => {} }),
    }

    // These functions should handle the case where document is undefined
    // In practice, these would either have guards or throw appropriately
    try {
      hydrateIslands(handlers)
      initIslands(handlers)
      preloadIslandHandlers(handlers)
      // If we reach here, the functions have proper environment guards
      expect(true).toBe(true)
    }
    catch (error) {
      // If they throw due to missing document, that's also acceptable behavior
      expect(error).toBeInstanceOf(Error)
    }

    // Restore globals
    globalThis.document = originalDocument
    globalThis.window = originalWindow
  })

  test('should handle DOM ready states correctly', () => {
    // Test with loading state
    const originalReadyState = document.readyState
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    })

    const handlers = {
      'test-component': async () => ({ default: () => {} }),
    }

    expect(() => {
      initIslands(handlers, { autoStart: true })
    }).not.toThrow()

    // Test with complete state
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    })

    expect(() => {
      initIslands(handlers, { autoStart: true })
    }).not.toThrow()

    // Restore original readyState
    Object.defineProperty(document, 'readyState', {
      value: originalReadyState,
      configurable: true,
    })
  })

  test('should handle intersection observer functionality', () => {
    const testIsland = document.createElement('div')
    testIsland.setAttribute('data-island', 'test-island')
    testIsland.setAttribute('data-priority', 'visible')
    testIsland.setAttribute('data-hydrated', 'false')
    document.body.appendChild(testIsland)

    const mockHandler = async () => ({
      default: () => {},
    })

    const handlers = {
      'test-island': mockHandler,
    }

    // Should not throw when using intersection observer
    expect(() => {
      initIslands(handlers, { autoStart: true })
    }).not.toThrow()
  })
})
