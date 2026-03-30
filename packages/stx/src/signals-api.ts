/**
 * STX Signals API - Reactive State Management (Build-time API)
 * =============================================================
 *
 * This module contains all TypeScript-level exports for the STX signals
 * reactivity system: types, state management functions, lifecycle hooks,
 * and utility functions used at build time.
 *
 * The runtime string generators live in signals.ts.
 *
 * @module signals-api
 */

// =============================================================================
// Types
// =============================================================================

/**
 * A reactive state signal.
 *
 * Call it to read the value, use `.set()` to write, or `.update()` to transform.
 *
 * @example
 * ```typescript
 * const count = state(0)
 * count()           // Read: 0
 * count.set(5)      // Write: 5
 * count.update(n => n + 1)  // Update: 6
 * ```
 */
export interface Signal<T> {
  /** Read the current value */
  (): T
  /** Set a new value */
  set(value: T): void
  /** Update the value using a function */
  update(fn: (current: T) => T): void
  /** Subscribe to changes (returns unsubscribe function) */
  subscribe(callback: (value: T, prev: T) => void): () => void
  /** Internal marker */
  readonly _isSignal: true
}

/**
 * A derived (computed) signal that automatically updates when dependencies change.
 *
 * @example
 * ```typescript
 * const doubled = derived(() => count() * 2)
 * doubled()  // Read the computed value
 * ```
 */
export interface DerivedSignal<T> {
  /** Read the current computed value */
  (): T
  /** Internal marker */
  readonly _isDerived: true
}

/**
 * Options for creating effects.
 */
export interface EffectOptions {
  /** Run the effect immediately (default: true) */
  immediate?: boolean
  /** Name for debugging */
  name?: string
}

/**
 * Cleanup function returned by effects.
 */
export type CleanupFn = () => void

/**
 * Lifecycle hook callback.
 */
export type LifecycleCallback = () => void | CleanupFn | Promise<void>

// =============================================================================
// Internal State
// =============================================================================

/** Currently running effect for dependency tracking */
let activeEffect: (() => void) | null = null

/** Effect stack for nested effects */
const effectStack: (() => void)[] = []

/** Batching state */
let isBatching = false
const pendingEffects = new Set<() => void>()

/** Lifecycle hooks for current component */
const mountCallbacks: LifecycleCallback[] = []
const destroyCallbacks: LifecycleCallback[] = []

// =============================================================================
// Core Reactivity
// =============================================================================

/**
 * Creates a reactive state signal.
 *
 * State signals are the foundation of STX reactivity. They hold a value that,
 * when changed, automatically updates any derived signals or effects that
 * depend on it.
 *
 * @param initialValue - The initial value for the signal
 * @returns A signal that can be read, set, and subscribed to
 *
 * @example Basic usage
 * ```typescript
 * const count = state(0)
 *
 * // Read the value
 * console.log(count())  // 0
 *
 * // Set a new value
 * count.set(5)
 * console.log(count())  // 5
 *
 * // Update based on current value
 * count.update(n => n + 1)
 * console.log(count())  // 6
 * ```
 *
 * @example With objects
 * ```typescript
 * const user = state({ name: 'Alice', age: 30 })
 *
 * // Update the whole object
 * user.set({ name: 'Bob', age: 25 })
 *
 * // Or update a property (creates new object for immutability)
 * user.update(u => ({ ...u, age: u.age + 1 }))
 * ```
 *
 * @example With arrays
 * ```typescript
 * const items = state<string[]>([])
 *
 * // Add an item
 * items.update(arr => [...arr, 'new item'])
 *
 * // Remove an item
 * items.update(arr => arr.filter(i => i !== 'remove me'))
 * ```
 */
export function state<T>(initialValue: T): Signal<T> {
  let value = initialValue
  const subscribers = new Set<(value: T, prev: T) => void>()
  const effects = new Set<() => void>()

  // The signal function (getter)
  const signal = (() => {
    // Track this signal as a dependency of the current effect
    if (activeEffect) {
      effects.add(activeEffect)
    }
    return value
  }) as Signal<T>

  // Set a new value
  signal.set = (newValue: T) => {
    if (!Object.is(newValue, value)) {
      const prev = value
      value = newValue

      // Notify subscribers
      subscribers.forEach(cb => cb(value, prev))

      // Trigger effects
      if (isBatching) {
        effects.forEach(effect => pendingEffects.add(effect))
      }
else {
        effects.forEach(effect => effect())
      }
    }
  }

  // Update using a function
  signal.update = (fn: (current: T) => T) => {
    signal.set(fn(value))
  }

  // Subscribe to changes
  signal.subscribe = (callback: (value: T, prev: T) => void) => {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }

  // Mark as signal
  Object.defineProperty(signal, '_isSignal', { value: true, writable: false })

  return signal
}

/**
 * Creates a derived signal that automatically computes its value from other signals.
 *
 * Derived signals are lazy - they only recompute when read after a dependency
 * has changed. They're perfect for computed values that depend on other state.
 *
 * @param compute - A function that computes the derived value
 * @returns A read-only signal with the computed value
 *
 * @example Basic derived value
 * ```typescript
 * const count = state(5)
 * const doubled = derived(() => count() * 2)
 *
 * console.log(doubled())  // 10
 * count.set(10)
 * console.log(doubled())  // 20
 * ```
 *
 * @example Combining multiple signals
 * ```typescript
 * const firstName = state('John')
 * const lastName = state('Doe')
 *
 * const fullName = derived(() => `${firstName()} ${lastName()}`)
 * console.log(fullName())  // "John Doe"
 * ```
 *
 * @example Filtering and transforming
 * ```typescript
 * const items = state([1, 2, 3, 4, 5])
 * const filter = state('even')
 *
 * const filteredItems = derived(() => {
 *   const list = items()
 *   return filter() === 'even'
 *     ? list.filter(n => n % 2 === 0)
 *     : list.filter(n => n % 2 !== 0)
 * })
 * ```
 */
export function derived<T>(compute: () => T): DerivedSignal<T> {
  let cachedValue: T
  let isDirty = true
  const effects = new Set<() => void>()

  // Mark as dirty when dependencies change
  const markDirty = () => {
    if (!isDirty) {
      isDirty = true
      // Propagate to dependent effects
      if (isBatching) {
        effects.forEach(effect => pendingEffects.add(effect))
      }
else {
        effects.forEach(effect => effect())
      }
    }
  }

  const signal = (() => {
    // Track this derived signal as a dependency
    if (activeEffect) {
      effects.add(activeEffect)
    }

    // Recompute if dirty
    if (isDirty) {
      const prevEffect = activeEffect
      activeEffect = markDirty
      effectStack.push(markDirty)

      try {
        cachedValue = compute()
      }
finally {
        effectStack.pop()
        activeEffect = prevEffect
      }

      isDirty = false
    }

    return cachedValue
  }) as DerivedSignal<T>

  Object.defineProperty(signal, '_isDerived', { value: true, writable: false })

  return signal
}

/**
 * Creates a side effect that runs when its dependencies change.
 *
 * Effects automatically track which signals they read and re-run whenever
 * those signals change. They're perfect for syncing state with external
 * systems, logging, or triggering side effects.
 *
 * @param fn - The effect function to run
 * @param options - Optional configuration
 * @returns A cleanup function to stop the effect
 *
 * @example Basic effect
 * ```typescript
 * const count = state(0)
 *
 * effect(() => {
 *   console.log(`Count changed to: ${count()}`)
 * })
 *
 * count.set(1)  // Logs: "Count changed to: 1"
 * count.set(2)  // Logs: "Count changed to: 2"
 * ```
 *
 * @example Effect with cleanup
 * ```typescript
 * const isActive = state(true)
 *
 * effect(() => {
 *   if (isActive()) {
 *     const interval = setInterval(() => console.log('tick'), 1000)
 *     // Return cleanup function
 *     return () => clearInterval(interval)
 *   }
 * })
 * ```
 *
 * @example Fetching data
 * ```typescript
 * const userId = state(1)
 * const user = state(null)
 *
 * effect(async () => {
 *   const id = userId()
 *   const response = await fetch(`/api/users/${id}`)
 *   user.set(await response.json())
 * })
 * ```
 */
export function effect(fn: () => void | CleanupFn, options: EffectOptions = {}): CleanupFn {
  let cleanup: CleanupFn | void
  let isDisposed = false

  const runEffect = () => {
    // Don't run if disposed
    if (isDisposed) return

    // Run previous cleanup
    if (cleanup) {
      cleanup()
      cleanup = undefined
    }

    const prevEffect = activeEffect
    activeEffect = runEffect
    effectStack.push(runEffect)

    try {
      cleanup = fn()
    }
finally {
      effectStack.pop()
      activeEffect = prevEffect
    }
  }

  // Run immediately unless disabled
  if (options.immediate !== false) {
    runEffect()
  }

  // Return cleanup function that fully disposes the effect
  return () => {
    isDisposed = true
    if (cleanup) cleanup()
  }
}

/**
 * Batches multiple signal updates into a single effect run.
 *
 * Use this when updating multiple signals at once to avoid redundant
 * effect executions.
 *
 * @param fn - Function containing multiple signal updates
 *
 * @example
 * ```typescript
 * const firstName = state('John')
 * const lastName = state('Doe')
 *
 * // Without batch: effect runs twice
 * // With batch: effect runs once
 * batch(() => {
 *   firstName.set('Jane')
 *   lastName.set('Smith')
 * })
 * ```
 */
export function batch(fn: () => void): void {
  if (isBatching) {
    fn()
    return
  }

  isBatching = true
  try {
    fn()
  }
finally {
    isBatching = false
    // Run all pending effects
    pendingEffects.forEach(effect => effect())
    pendingEffects.clear()
  }
}

// =============================================================================
// Lifecycle Hooks
// =============================================================================

/**
 * Registers a callback to run when the component mounts (is inserted into the DOM).
 *
 * @param callback - Function to run on mount. Can return a cleanup function.
 *
 * @example
 * ```typescript
 * onMount(() => {
 *   console.log('Component is now in the DOM')
 *
 *   // Optional: return cleanup function
 *   return () => console.log('Cleanup on unmount')
 * })
 * ```
 *
 * @example Fetching initial data
 * ```typescript
 * const data = state(null)
 *
 * onMount(async () => {
 *   data.set(await fetchInitialData())
 * })
 * ```
 */
export function onMount(callback: LifecycleCallback): void {
  mountCallbacks.push(callback)
}

/**
 * Registers a callback to run when the component is destroyed (removed from the DOM).
 *
 * @param callback - Function to run on destroy
 *
 * @example
 * ```typescript
 * onDestroy(() => {
 *   console.log('Component is being removed')
 *   // Clean up subscriptions, timers, etc.
 * })
 * ```
 */
export function onDestroy(callback: LifecycleCallback): void {
  destroyCallbacks.push(callback)
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if a value is a signal.
 *
 * @param value - Value to check
 * @returns True if the value is a signal
 *
 * @example
 * ```typescript
 * const count = state(0)
 * isSignal(count)  // true
 * isSignal(5)      // false
 * ```
 */
export function isSignal(value: unknown): value is Signal<unknown> {
  return typeof value === 'function' && (value as any)._isSignal === true
}

/**
 * Checks if a value is a derived signal.
 *
 * @param value - Value to check
 * @returns True if the value is a derived signal
 */
export function isDerived(value: unknown): value is DerivedSignal<unknown> {
  return typeof value === 'function' && (value as any)._isDerived === true
}

/**
 * Unwraps a signal to get its raw value.
 * If the value is not a signal, returns it as-is.
 *
 * @param value - A signal or plain value
 * @returns The unwrapped value
 *
 * @example
 * ```typescript
 * const count = state(5)
 * untrack(count)  // 5
 * untrack(10)     // 10
 * ```
 */
export function untrack<T>(value: T | Signal<T> | DerivedSignal<T>): T {
  if (isSignal(value) || isDerived(value)) {
    return value()
  }
  return value
}

/**
 * Reads a signal's value without tracking it as a dependency.
 *
 * Use this when you need to read a signal inside an effect but don't want
 * the effect to re-run when that signal changes.
 *
 * @param fn - Function to run without tracking
 * @returns The function's return value
 *
 * @example
 * ```typescript
 * const count = state(0)
 * const other = state(0)
 *
 * effect(() => {
 *   // This effect only re-runs when `count` changes
 *   console.log(count())
 *
 *   // Reading `other` without tracking
 *   const otherValue = peek(() => other())
 * })
 * ```
 */
export function peek<T>(fn: () => T): T {
  const prevEffect = activeEffect
  activeEffect = null
  try {
    return fn()
  }
finally {
    activeEffect = prevEffect
  }
}
