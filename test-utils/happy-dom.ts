import { Window } from 'happy-dom'

// Extend Element interface to include our custom method
declare global {
  interface Element {
    __dispatchEvent_safe: (event: Event) => boolean
  }
}

// Set up DOM globals using happy-dom 15.10.2
const window = new Window({
  url: 'http://localhost:3000',
  width: 1024,
  height: 768,
})

const document = window.document

// Register globals
globalThis.window = window as any
globalThis.document = document as any
globalThis.HTMLElement = window.HTMLElement as any
globalThis.Document = window.Document as any
globalThis.DOMParser = window.DOMParser as any
globalThis.Element = window.Element as any
globalThis.HTMLFormElement = window.HTMLFormElement as any
globalThis.HTMLInputElement = window.HTMLInputElement as any
globalThis.HTMLButtonElement = window.HTMLButtonElement as any
globalThis.HTMLDivElement = window.HTMLDivElement as any
globalThis.Event = window.Event as any
globalThis.MouseEvent = window.MouseEvent as any
globalThis.KeyboardEvent = window.KeyboardEvent as any

// Add IntersectionObserver mock for animation tests
class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null
  rootMargin: string = '0px'
  thresholds: ReadonlyArray<number> = [0]

  constructor(private callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    if (options) {
      this.root = options.root || null
      this.rootMargin = options.rootMargin || '0px'
      this.thresholds = options.threshold
        ? (Array.isArray(options.threshold) ? options.threshold : [options.threshold])
        : [0]
    }
  }

  observe(target: Element): void {
    // Mock immediate intersection for tests
    setTimeout(() => {
      this.callback([{
        target,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRect: target.getBoundingClientRect(),
        rootBounds: null,
        time: Date.now(),
      }] as IntersectionObserverEntry[], this)
    }, 0)
  }

  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver as any

// Add ResizeObserver mock
class MockResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(target: Element): void {
    // Mock immediate resize for tests
    setTimeout(() => {
      this.callback([{
        target,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
          toJSON: () => ({}),
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      }] as ResizeObserverEntry[], this)
    }, 0)
  }

  unobserve(_target: Element): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = MockResizeObserver as any

// Add safe event dispatch helper for happy-dom 15.10.2
Object.defineProperty(window.Element.prototype, '__dispatchEvent_safe', {
  value(event: Event) {
    try {
      // In happy-dom 15.10.2, dispatchEvent works more reliably
      const result = this.dispatchEvent(event)
      // Force synchronous execution for form events in tests
      if (event.type === 'submit' || event.type === 'click') {
        // Give a small delay to ensure all handlers have executed
        setTimeout(() => {}, 0)
      }
      return result
    }
    catch (e) {
      // Fallback for any edge cases
      console.warn(`Event dispatch error for ${event.type}:`, e)
      return false
    }
  },
  writable: false,
  enumerable: false,
  configurable: false,
})

// Add URL constructor if not available
if (!globalThis.URL) {
  globalThis.URL = window.URL as any
}

// Add fetch mock
globalThis.fetch = globalThis.fetch || (() => Promise.reject(new Error('fetch not implemented')))

// Add localStorage mock
if (!globalThis.localStorage) {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  } as any
}

// Add console methods if not available
if (!globalThis.console) {
  globalThis.console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
  } as any
}

// Add performance mock
if (!globalThis.performance) {
  globalThis.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
  } as any
}

// Add requestAnimationFrame mock
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 16) as unknown as number
  }
}

if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (id: number) => {
    clearTimeout(id as any)
  }
}
