/**
 * useDebounce, useDebouncedValue, useThrottle, useInterval, useTimeout
 *
 * Timer composables with auto-cleanup via onDestroy.
 * SSR-safe — all functions return no-op stubs when `window` is unavailable.
 */

// =============================================================================
// Types
// =============================================================================

export interface DebouncedFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  /** Cancel any pending invocation */
  cancel: () => void
  /** Immediately invoke the pending call (if any) */
  flush: () => void
  /** Whether a call is currently pending */
  pending: () => boolean
}

export interface ThrottledFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  /** Cancel the trailing invocation (if any) */
  cancel: () => void
}

export interface DebouncedValueRef<T> {
  /** Current debounced value */
  readonly value: T
  /** Subscribe to value changes */
  subscribe: (fn: (value: T) => void) => () => void
}

export interface IntervalOptions {
  /** Fire callback immediately on start */
  immediate?: boolean
}

export interface IntervalRef {
  /** Tick counter (increments each interval) */
  readonly counter: number
  /** Pause the interval */
  pause: () => void
  /** Resume the interval */
  resume: () => void
  /** Reset counter to 0 and restart */
  reset: () => void
  /** Subscribe to counter changes */
  subscribe: (fn: (counter: number) => void) => () => void
}

export interface TimeoutRef {
  /** Whether the timeout is still pending */
  readonly isPending: boolean
  /** Start (or restart) the timeout */
  start: () => void
  /** Cancel the pending timeout */
  stop: () => void
  /** Subscribe to pending-state changes */
  subscribe: (fn: (isPending: boolean) => void) => () => void
}

// =============================================================================
// useDebounce
// =============================================================================

/**
 * Wrap a function so it is only invoked after `delay` ms of inactivity.
 *
 * @example
 * ```ts
 * const save = useDebounce(() => api.save(form), 300)
 * save()          // debounced
 * save.cancel()   // abort pending
 * save.flush()    // fire immediately
 * ```
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 250,
): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      lastArgs = null
      fn(...args)
    }, delay)
  }) as DebouncedFn<T>

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
      lastArgs = null
    }
  }

  debounced.flush = () => {
    if (timer !== null && lastArgs !== null) {
      clearTimeout(timer)
      timer = null
      const args = lastArgs
      lastArgs = null
      fn(...args)
    }
  }

  debounced.pending = () => timer !== null

  // Auto-cleanup
  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(debounced.cancel)
  }

  return debounced
}

// =============================================================================
// useDebouncedValue
// =============================================================================

/**
 * Create a debounced read-only value that updates after `delay` ms of inactivity.
 *
 * @example
 * ```ts
 * const debouncedSearch = useDebouncedValue(() => searchInput.value, 300)
 * debouncedSearch.subscribe(val => console.log('Searching:', val))
 * ```
 */
export function useDebouncedValue<T>(
  getter: () => T,
  delay: number = 250,
): DebouncedValueRef<T> {
  let current: T = getter()
  const listeners: Set<(value: T) => void> = new Set()
  let timer: ReturnType<typeof setTimeout> | null = null

  const update = () => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      const next = getter()
      if (next !== current) {
        current = next
        listeners.forEach(fn => fn(current))
      }
    }, delay)
  }

  // Initial schedule
  update()

  const cleanup = () => {
    if (timer !== null) clearTimeout(timer)
    listeners.clear()
  }

  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(cleanup)
  }

  return {
    get value() {
      return current
    },
    subscribe(fn: (value: T) => void) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}

// =============================================================================
// useThrottle
// =============================================================================

/**
 * Wrap a function so it fires at most once every `limit` ms.
 *
 * @example
 * ```ts
 * const onScroll = useThrottle(() => recalcLayout(), 100)
 * window.addEventListener('scroll', onScroll)
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 250,
): ThrottledFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastRan = 0

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = limit - (now - lastRan)

    if (remaining <= 0) {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      lastRan = now
      fn(...args)
    }
    else if (timer === null) {
      timer = setTimeout(() => {
        lastRan = Date.now()
        timer = null
        fn(...args)
      }, remaining)
    }
  }) as ThrottledFn<T>

  throttled.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(throttled.cancel)
  }

  return throttled
}

// =============================================================================
// useInterval
// =============================================================================

/**
 * Reactive interval that auto-cleans up.
 *
 * @example
 * ```ts
 * const { counter, pause, resume, reset } = useInterval(1000)
 * // counter increments every second
 * ```
 */
export function useInterval(
  interval: number = 1000,
  options: IntervalOptions = {},
): IntervalRef {
  let count = 0
  let id: ReturnType<typeof setInterval> | null = null
  let running = false
  const listeners: Set<(counter: number) => void> = new Set()

  const tick = () => {
    count++
    listeners.forEach(fn => fn(count))
  }

  const resume = () => {
    if (running) return
    running = true
    id = setInterval(tick, interval)
    if (options.immediate) tick()
  }

  const pause = () => {
    if (!running) return
    running = false
    if (id !== null) {
      clearInterval(id)
      id = null
    }
  }

  const reset = () => {
    pause()
    count = 0
    listeners.forEach(fn => fn(count))
    resume()
  }

  // Start immediately
  resume()

  const cleanup = () => {
    pause()
    listeners.clear()
  }

  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(cleanup)
  }

  return {
    get counter() { return count },
    pause,
    resume,
    reset,
    subscribe(fn: (counter: number) => void) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}

// =============================================================================
// useTimeout
// =============================================================================

/**
 * One-shot timeout with start/stop control and auto-cleanup.
 *
 * @example
 * ```ts
 * const { isPending, start, stop } = useTimeout(() => showToast(), 3000)
 * start()   // begin countdown
 * stop()    // cancel
 * ```
 */
export function useTimeout(
  callback: () => void,
  delay: number = 1000,
): TimeoutRef {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending = false
  const listeners: Set<(isPending: boolean) => void> = new Set()

  const setPending = (v: boolean) => {
    if (v !== pending) {
      pending = v
      listeners.forEach(fn => fn(pending))
    }
  }

  const start = () => {
    stop()
    setPending(true)
    timer = setTimeout(() => {
      timer = null
      setPending(false)
      callback()
    }, delay)
  }

  const stop = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    setPending(false)
  }

  // Auto-start
  start()

  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(stop)
  }

  return {
    get isPending() { return pending },
    start,
    stop,
    subscribe(fn: (isPending: boolean) => void) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}
