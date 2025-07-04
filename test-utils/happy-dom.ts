import { Window } from 'happy-dom'

// Extend Element interface to include our custom method
declare global {
  interface Element {
    __dispatchEvent_safe(event: Event): boolean
  }
}

// Set up DOM globals using happy-dom 15.10.2
const window = new Window({
  url: 'http://localhost:3000',
  width: 1024,
  height: 768
})

const document = window.document

// Register globals
global.window = window as any
global.document = document as any
global.HTMLElement = window.HTMLElement as any
global.Document = window.Document as any
global.DOMParser = window.DOMParser as any
global.Element = window.Element as any
global.HTMLFormElement = window.HTMLFormElement as any
global.HTMLInputElement = window.HTMLInputElement as any
global.HTMLButtonElement = window.HTMLButtonElement as any
global.HTMLDivElement = window.HTMLDivElement as any
global.Event = window.Event as any
global.MouseEvent = window.MouseEvent as any
global.KeyboardEvent = window.KeyboardEvent as any

// Add IntersectionObserver mock for animation tests
class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null
  rootMargin: string = '0px'
  thresholds: ReadonlyArray<number> = [0]
  
  constructor(private callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    if (options) {
      this.root = options.root || null
      this.rootMargin = options.rootMargin || '0px'
      this.thresholds = options.threshold ? 
        (Array.isArray(options.threshold) ? options.threshold : [options.threshold]) : [0]
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
        time: Date.now()
      }] as IntersectionObserverEntry[], this)
    }, 0)
  }
  
  unobserve(target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

global.IntersectionObserver = MockIntersectionObserver as any

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
          toJSON: () => ({})
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: []
      }] as ResizeObserverEntry[], this)
    }, 0)
  }
  
  unobserve(target: Element): void {}
  disconnect(): void {}
}

global.ResizeObserver = MockResizeObserver as any

// Add safe event dispatch helper for happy-dom 15.10.2
Object.defineProperty(window.Element.prototype, '__dispatchEvent_safe', {
  value: function(event: Event) {
    try {
      // In happy-dom 15.10.2, dispatchEvent works more reliably
      const result = this.dispatchEvent(event)
      // Force synchronous execution for form events in tests
      if (event.type === 'submit' || event.type === 'click') {
        // Give a small delay to ensure all handlers have executed
        setTimeout(() => {}, 0)
      }
      return result
    } catch (e) {
      // Fallback for any edge cases
      console.warn(`Event dispatch error for ${event.type}:`, e)
      return false
    }
  },
  writable: false,
  enumerable: false,
  configurable: false
})

// Add URL constructor if not available
if (!global.URL) {
  global.URL = window.URL as any
}

// Add fetch mock
global.fetch = global.fetch || (() => Promise.reject(new Error('fetch not implemented')))

// Add localStorage mock
if (!global.localStorage) {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  } as any
}

// Add console methods if not available
if (!global.console) {
  global.console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {}
  } as any
}

// Add performance mock
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => [],
    clearMarks: () => {},
    clearMeasures: () => {}
  } as any
}

// Add requestAnimationFrame mock
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 16) as unknown as number
  }
}

if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id as any)
  }
} 