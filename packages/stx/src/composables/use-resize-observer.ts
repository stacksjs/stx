/**
 * useResizeObserver - Resize Observer API wrapper
 *
 * Monitor element size changes reactively.
 *
 * @example
 * ```ts
 * const observer = useResizeObserver(element)
 * observer.subscribe(entries => {
 *   console.log('Size changed:', entries[0].contentRect)
 * })
 *
 * // With callback
 * useResizeObserver(element, (entries) => {
 *   console.log('Width:', entries[0].contentRect.width)
 * })
 * ```
 */

export interface ResizeObserverSize {
  width: number
  height: number
  inlineSize: number
  blockSize: number
}

export interface ResizeObserverState {
  /** Content box size */
  contentRect: DOMRectReadOnly | null
  /** Content box size (width/height) */
  contentBoxSize: ResizeObserverSize | null
  /** Border box size */
  borderBoxSize: ResizeObserverSize | null
  /** Device pixel content box size */
  devicePixelContentBoxSize: ResizeObserverSize | null
}

export interface ResizeObserverOptions {
  /** Which box model to observe */
  box?: 'content-box' | 'border-box' | 'device-pixel-content-box'
}

export interface ResizeObserverRef {
  /** Get current state */
  get: () => ResizeObserverState
  /** Subscribe to resize events */
  subscribe: (fn: (entries: ResizeObserverEntry[]) => void) => () => void
  /** Start observing */
  observe: () => void
  /** Stop observing */
  disconnect: () => void
  /** Check if ResizeObserver is supported */
  isSupported: () => boolean
}

/**
 * Check if ResizeObserver API is supported
 */
function isResizeObserverSupported(): boolean {
  return typeof window !== 'undefined' && 'ResizeObserver' in window
}

/**
 * Extract size from ResizeObserverSize array
 */
function extractSize(sizes: readonly ResizeObserverSize[] | undefined): ResizeObserverSize | null {
  if (!sizes || sizes.length === 0) return null
  const size = sizes[0]
  return {
    width: size.inlineSize,
    height: size.blockSize,
    inlineSize: size.inlineSize,
    blockSize: size.blockSize,
  }
}

/**
 * Observe element size changes
 */
export function useResizeObserver(
  target: Element | (() => Element | null) | null,
  callback?: (entries: ResizeObserverEntry[]) => void,
  options: ResizeObserverOptions = {}
): ResizeObserverRef {
  const supported = isResizeObserverSupported()

  let state: ResizeObserverState = {
    contentRect: null,
    contentBoxSize: null,
    borderBoxSize: null,
    devicePixelContentBoxSize: null,
  }
  let listeners: Array<(entries: ResizeObserverEntry[]) => void> = []
  let observer: ResizeObserver | null = null

  const getElement = (): Element | null => {
    if (typeof target === 'function') return target()
    return target
  }

  const notify = (entries: ResizeObserverEntry[]) => {
    // Update state from first entry
    if (entries.length > 0) {
      const entry = entries[0]
      state = {
        contentRect: entry.contentRect,
        contentBoxSize: extractSize(entry.contentBoxSize),
        borderBoxSize: extractSize(entry.borderBoxSize),
        devicePixelContentBoxSize: extractSize(entry.devicePixelContentBoxSize),
      }
    }

    // Call callback if provided
    if (callback) callback(entries)

    // Notify subscribers
    listeners.forEach(fn => fn(entries))
  }

  const observe = () => {
    if (!supported) return

    const element = getElement()
    if (!element) return

    // Create observer if needed
    if (!observer) {
      observer = new ResizeObserver(notify)
    }

    observer.observe(element, { box: options.box })
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      if (listeners.length === 0) {
        observe()
      }
      listeners.push(fn)

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0 && !callback) {
          disconnect()
        }
      }
    },
    observe,
    disconnect,
    isSupported: () => supported,
  }
}

/**
 * Observe multiple elements
 */
export function useResizeObserverMultiple(
  targets: Element[] | (() => Element[]),
  callback?: (entries: ResizeObserverEntry[]) => void,
  options: ResizeObserverOptions = {}
): ResizeObserverRef & { states: () => Map<Element, ResizeObserverState> } {
  const supported = isResizeObserverSupported()

  const statesMap = new Map<Element, ResizeObserverState>()
  let listeners: Array<(entries: ResizeObserverEntry[]) => void> = []
  let observer: ResizeObserver | null = null

  const getElements = (): Element[] => {
    if (typeof targets === 'function') return targets()
    return targets
  }

  const notify = (entries: ResizeObserverEntry[]) => {
    // Update states for each entry
    for (const entry of entries) {
      statesMap.set(entry.target, {
        contentRect: entry.contentRect,
        contentBoxSize: extractSize(entry.contentBoxSize),
        borderBoxSize: extractSize(entry.borderBoxSize),
        devicePixelContentBoxSize: extractSize(entry.devicePixelContentBoxSize),
      })
    }

    // Call callback if provided
    if (callback) callback(entries)

    // Notify subscribers
    listeners.forEach(fn => fn(entries))
  }

  const observe = () => {
    if (!supported) return

    const elements = getElements()
    if (elements.length === 0) return

    // Create observer if needed
    if (!observer) {
      observer = new ResizeObserver(notify)
    }

    for (const element of elements) {
      observer.observe(element, { box: options.box })
    }
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    statesMap.clear()
  }

  return {
    get: () => statesMap.values().next().value || {
      contentRect: null,
      contentBoxSize: null,
      borderBoxSize: null,
      devicePixelContentBoxSize: null,
    },
    states: () => statesMap,
    subscribe: (fn) => {
      if (listeners.length === 0) {
        observe()
      }
      listeners.push(fn)

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0 && !callback) {
          disconnect()
        }
      }
    },
    observe,
    disconnect,
    isSupported: () => supported,
  }
}

/**
 * Get element dimensions reactively
 */
export function useElementSize(
  target: Element | (() => Element | null) | null
): {
  get: () => { width: number; height: number }
  subscribe: (fn: (size: { width: number; height: number }) => void) => () => void
  isSupported: () => boolean
} {
  let size = { width: 0, height: 0 }
  let listeners: Array<(size: { width: number; height: number }) => void> = []

  const observer = useResizeObserver(target, (entries) => {
    if (entries.length > 0) {
      const rect = entries[0].contentRect
      size = { width: rect.width, height: rect.height }
      listeners.forEach(fn => fn(size))
    }
  })

  return {
    get: () => size,
    subscribe: (fn) => {
      listeners.push(fn)
      fn(size)

      if (listeners.length === 1) {
        observer.observe()
      }

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0) {
          observer.disconnect()
        }
      }
    },
    isSupported: observer.isSupported,
  }
}

/**
 * Check if ResizeObserver is supported (standalone function)
 */
export function hasResizeObserver(): boolean {
  return isResizeObserverSupported()
}
