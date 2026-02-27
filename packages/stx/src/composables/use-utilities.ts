/**
 * useToggle, useCounter, useClickOutside, useFocus, useAsync
 *
 * General-purpose utility composables with auto-cleanup.
 * SSR-safe — DOM-dependent composables return no-op stubs when `window` is unavailable.
 */

// =============================================================================
// Types
// =============================================================================

export interface ToggleRef {
  /** Current boolean value */
  readonly value: boolean
  /** Subscribe to changes */
  subscribe: (fn: (value: boolean) => void) => () => void
}

export interface CounterOptions {
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
}

export interface CounterRef {
  /** Current count */
  readonly count: number
  /** Increment by step (default 1) */
  inc: (step?: number) => void
  /** Decrement by step (default 1) */
  dec: (step?: number) => void
  /** Set to an exact value */
  set: (value: number) => void
  /** Reset to initial value */
  reset: () => void
  /** Subscribe to count changes */
  subscribe: (fn: (count: number) => void) => () => void
}

export interface ClickOutsideRef {
  /** Remove the listener */
  remove: () => void
}

export interface FocusRef {
  /** Whether the element is currently focused */
  readonly isFocused: boolean
  /** Programmatically focus the element */
  focus: () => void
  /** Programmatically blur the element */
  blur: () => void
  /** Subscribe to focus-state changes */
  subscribe: (fn: (isFocused: boolean) => void) => () => void
}

export type AsyncState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncRef<T> {
  /** Current async state */
  readonly state: AsyncState
  /** Whether the async operation is running */
  readonly isLoading: boolean
  /** Error from the last invocation (null if none) */
  readonly error: Error | null
  /** Result data (null until resolved) */
  readonly data: T | null
  /** Execute (or re-execute) the async function */
  execute: (...args: any[]) => Promise<T | null>
  /** Subscribe to state changes */
  subscribe: (fn: (snapshot: { state: AsyncState, data: T | null, error: Error | null }) => void) => () => void
}

export interface AsyncOptions {
  /** Execute immediately on creation */
  immediate?: boolean
}

// =============================================================================
// useToggle
// =============================================================================

/**
 * Boolean toggle with reactive subscription.
 *
 * @example
 * ```ts
 * const [open, toggle, setOpen] = useToggle(false)
 * toggle()       // true
 * setOpen(false)  // false
 * open.subscribe(v => console.log('open:', v))
 * ```
 */
export function useToggle(initial: boolean = false): [ToggleRef, () => void, (v: boolean) => void] {
  let current = initial
  const listeners: Set<(value: boolean) => void> = new Set()

  const notify = () => listeners.forEach(fn => fn(current))

  const toggle = () => {
    current = !current
    notify()
  }

  const set = (v: boolean) => {
    if (v !== current) {
      current = v
      notify()
    }
  }

  const ref: ToggleRef = {
    get value() { return current },
    subscribe(fn: (value: boolean) => void) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }

  return [ref, toggle, set]
}

// =============================================================================
// useCounter
// =============================================================================

/**
 * Numeric counter with min/max bounds.
 *
 * @example
 * ```ts
 * const counter = useCounter(0, { min: 0, max: 10 })
 * counter.inc()   // 1
 * counter.dec(3)  // 0 (clamped to min)
 * counter.set(5)  // 5
 * counter.reset() // 0
 * ```
 */
export function useCounter(initial: number = 0, options: CounterOptions = {}): CounterRef {
  const { min = -Infinity, max = Infinity } = options
  let current = clamp(initial, min, max)
  const listeners: Set<(count: number) => void> = new Set()

  const notify = () => listeners.forEach(fn => fn(current))

  function clamp(v: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, v))
  }

  return {
    get count() { return current },
    inc(step = 1) {
      current = clamp(current + step, min, max)
      notify()
    },
    dec(step = 1) {
      current = clamp(current - step, min, max)
      notify()
    },
    set(value: number) {
      current = clamp(value, min, max)
      notify()
    },
    reset() {
      current = clamp(initial, min, max)
      notify()
    },
    subscribe(fn: (count: number) => void) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}

// =============================================================================
// useClickOutside
// =============================================================================

/**
 * Run a handler when clicking outside a target element.
 *
 * @example
 * ```ts
 * useClickOutside('#dropdown', () => closeDropdown())
 * useClickOutside(menuElement, () => closeMenu())
 * ```
 */
export function useClickOutside(
  target: string | Element,
  handler: (event: MouseEvent) => void,
): ClickOutsideRef {
  if (typeof window === 'undefined') {
    return { remove: () => {} }
  }

  const listener = (event: MouseEvent) => {
    const el = typeof target === 'string'
      ? document.querySelector(target)
      : target
    if (!el) return
    if (el === event.target || el.contains(event.target as Node)) return
    handler(event)
  }

  document.addEventListener('pointerdown', listener, true)

  const remove = () => {
    document.removeEventListener('pointerdown', listener, true)
  }

  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(remove)
  }

  return { remove }
}

// =============================================================================
// useFocus
// =============================================================================

/**
 * Track and control focus state of an element.
 *
 * @example
 * ```ts
 * const { isFocused, focus, blur } = useFocus('#search-input')
 * focus()
 * ```
 */
export function useFocus(target: string | Element): FocusRef {
  if (typeof window === 'undefined') {
    return {
      get isFocused() { return false },
      focus: () => {},
      blur: () => {},
      subscribe: () => () => {},
    }
  }

  let focused = false
  const listeners: Set<(isFocused: boolean) => void> = new Set()

  const resolve = (): Element | null =>
    typeof target === 'string' ? document.querySelector(target) : target

  const setFocused = (v: boolean) => {
    if (v !== focused) {
      focused = v
      listeners.forEach(fn => fn(focused))
    }
  }

  const onFocus = () => setFocused(true)
  const onBlur = () => setFocused(false)

  const el = resolve()
  if (el) {
    el.addEventListener('focus', onFocus)
    el.addEventListener('blur', onBlur)
    // Initialise from current state
    focused = document.activeElement === el
  }

  const remove = () => {
    const el = resolve()
    if (el) {
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('blur', onBlur)
    }
    listeners.clear()
  }

  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(remove)
  }

  return {
    get isFocused() { return focused },
    focus() {
      const el = resolve()
      if (el && typeof (el as HTMLElement).focus === 'function') {
        ;(el as HTMLElement).focus()
      }
    },
    blur() {
      const el = resolve()
      if (el && typeof (el as HTMLElement).blur === 'function') {
        ;(el as HTMLElement).blur()
      }
    },
    subscribe(fn: (isFocused: boolean) => void) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}

// =============================================================================
// useAsync
// =============================================================================

/**
 * Wrap an async function with reactive loading/error/data state.
 *
 * @example
 * ```ts
 * const { data, isLoading, error, execute } = useAsync(
 *   () => fetch('/api/users').then(r => r.json()),
 *   { immediate: true }
 * )
 * ```
 */
export function useAsync<T>(
  fn: (...args: any[]) => Promise<T>,
  options: AsyncOptions = {},
): AsyncRef<T> {
  let asyncState: AsyncState = 'idle'
  let data: T | null = null
  let error: Error | null = null
  const listeners: Set<(snapshot: { state: AsyncState, data: T | null, error: Error | null }) => void> = new Set()

  const notify = () => {
    const snapshot = { state: asyncState, data, error }
    listeners.forEach(fn => fn(snapshot))
  }

  const execute = async (...args: any[]): Promise<T | null> => {
    asyncState = 'loading'
    error = null
    notify()
    try {
      data = await fn(...args)
      asyncState = 'success'
      notify()
      return data
    }
    catch (e) {
      error = e instanceof Error ? e : new Error(String(e))
      asyncState = 'error'
      notify()
      return null
    }
  }

  if (options.immediate) {
    execute()
  }

  return {
    get state() { return asyncState },
    get isLoading() { return asyncState === 'loading' },
    get error() { return error },
    get data() { return data },
    execute,
    subscribe(fn) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}
