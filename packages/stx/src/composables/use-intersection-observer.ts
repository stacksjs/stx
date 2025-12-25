/**
 * useIntersectionObserver - Reactive Intersection Observer API
 *
 * Track element visibility for lazy loading, infinite scroll, and animations.
 *
 * @example
 * ```ts
 * // Basic visibility tracking
 * const { isVisible, stop } = useIntersectionObserver(element)
 *
 * // Lazy loading images
 * useIntersectionObserver(imgElement, (entry) => {
 *   if (entry.isIntersecting) {
 *     imgElement.src = imgElement.dataset.src
 *   }
 * }, { once: true })
 *
 * // Infinite scroll
 * useIntersectionObserver(sentinelElement, () => {
 *   loadMoreItems()
 * }, { rootMargin: '100px' })
 * ```
 */

export interface IntersectionObserverOptions {
  /** Root element for intersection (default: viewport) */
  root?: Element | Document | null
  /** Margin around root (e.g., '10px' or '10px 20px') */
  rootMargin?: string
  /** Threshold(s) at which to trigger (0-1) */
  threshold?: number | number[]
  /** Only trigger once then disconnect */
  once?: boolean
  /** Start observing immediately */
  immediate?: boolean
}

export interface IntersectionState {
  isIntersecting: boolean
  intersectionRatio: number
  boundingClientRect: DOMRectReadOnly | null
  intersectionRect: DOMRectReadOnly | null
  isVisible: boolean
  entry: IntersectionObserverEntry | null
}

export interface IntersectionObserverRef {
  /** Get current intersection state */
  get: () => IntersectionState
  /** Subscribe to intersection changes */
  subscribe: (fn: (state: IntersectionState) => void) => () => void
  /** Check if currently intersecting */
  isVisible: () => boolean
  /** Stop observing */
  stop: () => void
  /** Start/restart observing */
  start: () => void
}

type IntersectionCallback = (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void

/**
 * Observe element intersection with viewport or container
 */
export function useIntersectionObserver(
  target: Element | (() => Element | null) | null,
  callback?: IntersectionCallback,
  options: IntersectionObserverOptions = {}
): IntersectionObserverRef {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    once = false,
    immediate = true,
  } = options

  let state: IntersectionState = {
    isIntersecting: false,
    intersectionRatio: 0,
    boundingClientRect: null,
    intersectionRect: null,
    isVisible: false,
    entry: null,
  }

  let listeners: Array<(state: IntersectionState) => void> = []
  let observer: IntersectionObserver | null = null
  let isActive = false

  const getElement = (): Element | null => {
    if (typeof target === 'function') return target()
    return target
  }

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const handleIntersect: IntersectionObserverCallback = (entries) => {
    const entry = entries[0]
    if (!entry) return

    state = {
      isIntersecting: entry.isIntersecting,
      intersectionRatio: entry.intersectionRatio,
      boundingClientRect: entry.boundingClientRect,
      intersectionRect: entry.intersectionRect,
      isVisible: entry.isIntersecting,
      entry,
    }

    notify()

    if (callback) {
      callback(entry, observer!)
    }

    // Disconnect if once mode and intersecting
    if (once && entry.isIntersecting) {
      stop()
    }
  }

  const start = () => {
    if (typeof IntersectionObserver === 'undefined') return
    if (observer) return // Already observing

    const element = getElement()
    if (!element) return

    observer = new IntersectionObserver(handleIntersect, {
      root,
      rootMargin,
      threshold,
    })

    observer.observe(element)
    isActive = true
  }

  const stop = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    isActive = false
  }

  // Start immediately if requested
  if (immediate) {
    start()
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      listeners.push(fn)
      fn(state)

      // Start observing when first subscriber (if not immediate)
      if (listeners.length === 1 && !immediate && !isActive) {
        start()
      }

      return () => {
        listeners = listeners.filter(l => l !== fn)
        // Stop observing when no subscribers
        if (listeners.length === 0 && !callback) {
          stop()
        }
      }
    },
    isVisible: () => state.isVisible,
    stop,
    start,
  }
}

/**
 * Simple visibility check - returns true when element is in viewport
 */
export function useElementVisibility(
  target: Element | (() => Element | null) | null,
  options?: Omit<IntersectionObserverOptions, 'once'>
): {
  get: () => boolean
  subscribe: (fn: (visible: boolean) => void) => () => void
} {
  const observer = useIntersectionObserver(target, undefined, options)
  let listeners: Array<(visible: boolean) => void> = []
  let lastValue = false

  return {
    get: () => observer.isVisible(),
    subscribe: (fn) => {
      const unsub = observer.subscribe((state) => {
        if (state.isVisible !== lastValue) {
          lastValue = state.isVisible
          fn(state.isVisible)
        }
      })

      listeners.push(fn)
      fn(observer.isVisible())

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0) {
          unsub()
        }
      }
    },
  }
}

/**
 * Lazy load handler - triggers callback once when element becomes visible
 */
export function useLazyLoad(
  target: Element | (() => Element | null) | null,
  onVisible: () => void,
  options?: Omit<IntersectionObserverOptions, 'once'>
): { stop: () => void } {
  const observer = useIntersectionObserver(
    target,
    (entry) => {
      if (entry.isIntersecting) {
        onVisible()
      }
    },
    { ...options, once: true }
  )

  return { stop: observer.stop }
}

/**
 * Infinite scroll handler - triggers callback when sentinel element is visible
 */
export function useInfiniteScroll(
  sentinel: Element | (() => Element | null) | null,
  loadMore: () => void | Promise<void>,
  options: IntersectionObserverOptions & {
    /** Debounce time in ms */
    debounce?: number
  } = {}
): {
  stop: () => void
  start: () => void
  isLoading: () => boolean
} {
  const { debounce = 100, ...observerOptions } = options
  let isLoading = false
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null

  const observer = useIntersectionObserver(
    sentinel,
    async (entry) => {
      if (!entry.isIntersecting || isLoading) return

      // Debounce
      if (debounceTimeout) clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(async () => {
        isLoading = true
        try {
          await loadMore()
        } finally {
          isLoading = false
        }
      }, debounce)
    },
    { rootMargin: '100px', ...observerOptions }
  )

  return {
    stop: () => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
      observer.stop()
    },
    start: observer.start,
    isLoading: () => isLoading,
  }
}

/**
 * Track multiple elements' visibility
 */
export function useIntersectionObserverMultiple(
  targets: Element[] | (() => Element[]),
  callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void,
  options: Omit<IntersectionObserverOptions, 'once'> = {}
): {
  stop: () => void
  start: () => void
  observe: (element: Element) => void
  unobserve: (element: Element) => void
} {
  const { root = null, rootMargin = '0px', threshold = 0 } = options

  let observer: IntersectionObserver | null = null

  const getElements = (): Element[] => {
    if (typeof targets === 'function') return targets()
    return targets
  }

  const start = () => {
    if (typeof IntersectionObserver === 'undefined') return
    if (observer) return

    observer = new IntersectionObserver(callback, {
      root,
      rootMargin,
      threshold,
    })

    for (const element of getElements()) {
      observer.observe(element)
    }
  }

  const stop = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  const observe = (element: Element) => {
    observer?.observe(element)
  }

  const unobserve = (element: Element) => {
    observer?.unobserve(element)
  }

  // Start immediately
  start()

  return { stop, start, observe, unobserve }
}
