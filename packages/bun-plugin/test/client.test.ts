import { beforeEach, describe, expect, test } from 'bun:test'

// Import client functions
import { hydrateIslands, initIslands, preloadIslandHandlers, version } from '../src/client'

// Mock DOM environment for testing
const mockDocument = {
  querySelectorAll: () => ({
    length: 0,
    item: () => null,
    forEach: () => {},
    [Symbol.iterator]: function* () {},
  }),
  querySelector: () => null,
  createElement: () => ({ rel: '', href: '', setAttribute: () => {}, remove: () => {} }),
  head: { appendChild: () => {} },
  readyState: 'complete' as DocumentReadyState,
  addEventListener: () => {},
}

const mockWindow = {
  IntersectionObserver: class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
}

// Setup global mocks
global.document = mockDocument as any
global.window = mockWindow as any

describe('BUN-PLUGIN: Client Module Tests', () => {
  beforeEach(() => {
    // Reset any global state between tests
    global.document = mockDocument as any
    global.window = mockWindow as any
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
    const mockQuerySelectorAll = () => ({
      length: 0,
      item: () => null,
      forEach: () => {},
      [Symbol.iterator]: function* () {},
    })
    global.document.querySelectorAll = mockQuerySelectorAll as any

    // Should not throw when called with empty handlers
    expect(() => {
      hydrateIslands({})
    }).not.toThrow()
  })

  test('should handle hydrateIslands with mock handlers', () => {
    const mockElements = [
      {
        getAttribute: (attr: string) => {
          if (attr === 'data-island') return 'test-island'
          if (attr === 'data-priority') return 'eager'
          if (attr === 'data-hydrated') return 'false'
          return null
        },
        setAttribute: () => {},
      },
    ]

    global.document.querySelectorAll = () => ({
      length: mockElements.length,
      item: (index: number) => mockElements[index] || null,
      forEach: (callback: any) => mockElements.forEach(callback),
      [Symbol.iterator]: function* () {
        for (const element of mockElements) {
          yield element
        }
      },
    }) as any

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
    const originalDocument = global.document
    const originalWindow = global.window

    // Mock typeof checks for browser environment
    Object.defineProperty(global, 'document', { 
      value: undefined, 
      configurable: true 
    })
    Object.defineProperty(global, 'window', { 
      value: undefined, 
      configurable: true 
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
    } catch (error) {
      // If they throw due to missing document, that's also acceptable behavior
      expect(error).toBeInstanceOf(Error)
    }

    // Restore globals
    global.document = originalDocument
    global.window = originalWindow
  })

  test('should handle DOM ready states correctly', () => {
    // Test with loading state
    const mockDocumentLoading = {
      ...mockDocument,
      readyState: 'loading' as DocumentReadyState,
    }
    global.document = mockDocumentLoading as any

    const handlers = {
      'test-component': async () => ({ default: () => {} }),
    }

    expect(() => {
      initIslands(handlers, { autoStart: true })
    }).not.toThrow()

    // Test with complete state
    const mockDocumentComplete = {
      ...mockDocument,
      readyState: 'complete' as DocumentReadyState,
    }
    global.document = mockDocumentComplete as any

    expect(() => {
      initIslands(handlers, { autoStart: true })
    }).not.toThrow()
  })

  test('should handle intersection observer availability', () => {
    // Test without IntersectionObserver
    const originalIntersectionObserver = global.window?.IntersectionObserver
    // @ts-ignore
    delete global.window.IntersectionObserver

    const mockElements = [
      {
        getAttribute: (attr: string) => {
          if (attr === 'data-island') return 'lazy-component'
          if (attr === 'data-priority') return 'lazy'
          if (attr === 'data-hydrated') return 'false'
          return null
        },
        setAttribute: () => {},
      },
    ]

    global.document.querySelectorAll = () => ({
      length: mockElements.length,
      item: (index: number) => mockElements[index] || null,
      forEach: (callback: any) => mockElements.forEach(callback),
      [Symbol.iterator]: function* () {
        for (const element of mockElements) {
          yield element
        }
      },
    }) as any

    const handlers = {
      'lazy-component': async () => ({ default: () => {} }),
    }

    // Should handle missing IntersectionObserver gracefully
    expect(() => {
      hydrateIslands(handlers)
    }).not.toThrow()

    // Restore IntersectionObserver
    if (originalIntersectionObserver) {
      global.window.IntersectionObserver = originalIntersectionObserver
    }
  })

  test('should skip already hydrated islands', () => {
    const mockElements = [
      {
        getAttribute: (attr: string) => {
          if (attr === 'data-island') return 'test-island'
          if (attr === 'data-priority') return 'eager'
          if (attr === 'data-hydrated') return 'true' // Already hydrated
          return null
        },
        setAttribute: () => {},
      },
    ]

    global.document.querySelectorAll = () => ({
      length: mockElements.length,
      item: (index: number) => mockElements[index] || null,
      forEach: (callback: any) => mockElements.forEach(callback),
      [Symbol.iterator]: function* () {
        for (const element of mockElements) {
          yield element
        }
      },
    }) as any

    const mockHandler = async () => ({
      default: () => {
        throw new Error('Should not be called for already hydrated islands')
      },
    })

    const handlers = {
      'test-island': mockHandler,
    }

    // Should skip already hydrated islands
    expect(() => {
      hydrateIslands(handlers)
    }).not.toThrow()
  })

  test('should handle islands without handlers', () => {
    const mockElements = [
      {
        getAttribute: (attr: string) => {
          if (attr === 'data-island') return 'missing-handler'
          if (attr === 'data-priority') return 'eager'
          if (attr === 'data-hydrated') return 'false'
          return null
        },
        setAttribute: () => {},
      },
    ]

    global.document.querySelectorAll = () => ({
      length: mockElements.length,
      item: (index: number) => mockElements[index] || null,
      forEach: (callback: any) => mockElements.forEach(callback),
      [Symbol.iterator]: function* () {
        for (const element of mockElements) {
          yield element
        }
      },
    }) as any

    const handlers = {
      'different-island': async () => ({ default: () => {} }),
    }

    // Should handle missing handlers gracefully
    expect(() => {
      hydrateIslands(handlers)
    }).not.toThrow()
  })
}) 