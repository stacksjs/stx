/**
 * STX Signals API — module-import path for reactive primitives.
 * =============================================================
 *
 * This module exports `state`, `derived`, `effect`, `batch`, `untrack`,
 * `peek`, `isSignal`, `isDerived`, `onMount`, `onDestroy` as standalone
 * TypeScript functions. They have their own subscriber sets, effect
 * tracking, and batching — fully self-contained reactivity.
 *
 * ## Why this exists alongside `signals.ts`
 *
 * stx ships TWO independent reactive implementations:
 *
 *   1. **This file (`signals-api.ts`)** — module-import path. Used by
 *      composables, stores, SSR/server code, and tests that import
 *      from `'@stacksjs/stx'` and run in Node (or browser) without
 *      going through the stx bundler.
 *
 *   2. **The runtime template literal in `signals.ts`** — generated as
 *      a JS string and injected into client pages. Owns its own
 *      subscribers; populates `window.stx.{state, derived, …}`.
 *
 * The stx bundler rewrites `<script client>` imports of these symbols
 * to destructure from `window.stx`. So a `const count = state(0)` in a
 * client script ends up using the runtime version (#2). The same call
 * in an unbundled context — a composable test, an SSR helper — uses
 * this file (#1).
 *
 * **Important**: signals created in one impl are invisible to the other.
 * A `state()` returned by this module cannot be `.set()`-ed from inside
 * a client page's `<script>` block (and vice versa). The two reactive
 * worlds are disjoint by design — they exist because bundled and
 * non-bundled contexts need different code-generation strategies.
 *
 * ## Parity contract
 *
 * Both implementations expose the same public surface and must behave
 * equivalently. Pinned by `test/reactivity/dual-impl-parity.test.ts`,
 * which executes the same suite against both. When parity drifts, fix
 * the lagging side — don't update only one.
 *
 * See stacksjs/stx#1712 for the architectural rationale.
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
  /** Vue-compatible value accessor */
  value: T
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
  /** Vue-compatible read-only value accessor */
  readonly value: T
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

import {
  enqueueEffect,
  getActiveSubscriber,
  isBatching,
  restoreActiveSubscriber,
  runBatched,
  setActiveSubscriber,
  withoutTracking,
} from './reactive-tracking'

/*
 * Dependency tracking and batching live in `reactive-tracking.ts`, not here.
 *
 * They used to be module-local, and `reactivity.ts` had its own set under
 * different names. Two variables of the same shape in two modules is what made
 * `ref()` with `effect()` and `state()` with `watchEffect()` silently inert: a
 * read recorded itself against whichever module's variable happened to be set
 * (stacksjs/stx#1885). One owner, so a read is tracked by whatever is
 * listening regardless of which module minted the value.
 */

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
    const subscriber = getActiveSubscriber()
    if (subscriber) {
      effects.add(subscriber)
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
      if (isBatching()) {
        effects.forEach(effect => enqueueEffect(effect))
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
  Object.defineProperty(signal, 'value', {
    get: () => signal(),
    set: (newValue: T) => signal.set(newValue),
    configurable: true,
  })

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
      if (isBatching()) {
        effects.forEach(effect => enqueueEffect(effect))
      }
else {
        effects.forEach(effect => effect())
      }
    }
  }

  const signal = (() => {
    // Track this derived signal as a dependency
    const subscriber = getActiveSubscriber()
    if (subscriber) {
      effects.add(subscriber)
    }

    // Recompute if dirty
    if (isDirty) {
      const prevEffect = setActiveSubscriber(markDirty)

      try {
        cachedValue = compute()
      }
finally {
        restoreActiveSubscriber(prevEffect)
      }

      isDirty = false
    }

    return cachedValue
  }) as DerivedSignal<T>

  Object.defineProperty(signal, '_isDerived', { value: true, writable: false })
  Object.defineProperty(signal, 'value', {
    get: () => signal(),
    configurable: true,
  })

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

    const prevEffect = setActiveSubscriber(runEffect)

    try {
      // Only a FUNCTION is a cleanup. An effect body is an expression as often
      // as it is a block, and an expression has a value: `effect(() =>
      // el.textContent = name())` returns the assigned string. Storing that and
      // calling it on the next run threw "cleanup is not a function", so the
      // most ordinary effect in any framework crashed on its second run — and
      // only on the second, which is why it read as correct.
      const result = fn()
      cleanup = typeof result === 'function' ? result : undefined
    }
finally {
      restoreActiveSubscriber(prevEffect)
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
  runBatched(fn)
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

/**
 * Run and clear every callback registered with {@link onMount}.
 *
 * Both queues used to be write-only: `onMount` and `onDestroy` pushed, and
 * nothing anywhere drained them (stacksjs/stx#1811). Two consequences, and the
 * first is the one that bites — a composable registering cleanup via
 * `onDestroy` got no cleanup, silently. The code reads as correct, passes
 * review, and does nothing. The second is a slow leak: nothing cleared the
 * arrays, so every registration retained its closure for the life of the
 * process, and the retained objects were precisely the ones the author expected
 * to be released.
 *
 * The client runtime drains its equivalents, so leaving these undrained also
 * broke the dual-implementation parity CLAUDE.md item 40 requires: the same
 * public API did something on one side and nothing on the other.
 *
 * Drains before invoking, so a callback that registers another is queued for
 * the next drain rather than running inside this one.
 *
 * Errors are contained per callback: one throwing hook must not swallow the
 * rest, which is the same lesson as the page-setup loop in #1805.
 */
export function runMountCallbacks(): void {
  // A mount callback may return its own teardown — the shape LifecycleCallback
  // declares. It used to be dropped here, so the teardown never ran (#1857).
  // It is parked on the destroy queue rather than run now, so it fires when
  // runDestroyCallbacks() is called, which is the point of returning it.
  drain(mountCallbacks, 'onMount', destroyCallbacks)
}

/** Run and clear every callback registered with {@link onDestroy}. */
export function runDestroyCallbacks(): void {
  // No sink: a cleanup returned by a cleanup has nowhere meaningful to go, and
  // parking it back on this queue would keep it alive across drains forever.
  drain(destroyCallbacks, 'onDestroy')
}

function drain(queue: LifecycleCallback[], label: string, sink?: LifecycleCallback[]): void {
  const pending = queue.splice(0, queue.length)
  for (const callback of pending) {
    try {
      const cleanup = callback()
      if (sink && typeof cleanup === 'function')
        sink.push(cleanup as LifecycleCallback)
    }
    catch (error) {
      console.error(`[stx] ${label} callback threw:`, error)
    }
  }
}

/**
 * How many callbacks are queued. Exposed for tests and diagnostics — a queue
 * that only ever grows is the shape of the defect above.
 */
export function pendingLifecycleCounts(): { mount: number, destroy: number } {
  return { mount: mountCallbacks.length, destroy: destroyCallbacks.length }
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
  return withoutTracking(fn)
}

/**
 * The function returned by {@link useOptimistic} to apply an optimistic update.
 * Returns a `settle` function that removes this specific optimistic entry (call
 * it to roll back, e.g. in a `catch`). If a `settleWhen` promise is passed, the
 * entry is removed automatically when that promise settles (success or error).
 */
export type AddOptimistic<A> = (action: A, settleWhen?: PromiseLike<unknown>) => () => void

/**
 * React-19-style optimistic state, adapted to signals.
 *
 * Shows an immediate, optimistic value layered on top of `base` while an async
 * action is in flight, then falls back to `base` as the source of truth once the
 * real update lands. Returns `[optimistic, addOptimistic]`:
 *
 * - `optimistic` is a derived signal: `base` with every pending action folded in
 *   via `reducer`.
 * - `addOptimistic(action)` queues an optimistic action (visible immediately) and
 *   returns a `settle()` to remove it. Pass a promise as the 2nd arg to auto-settle.
 *
 * The optimistic overlay is discarded automatically the moment `base` changes —
 * i.e. when the server/store confirms the real value — so the happy path needs
 * no cleanup. On error, `base` doesn't change, so call the returned `settle()`
 * (or pass the action promise) to roll back.
 *
 * Unlike React, there is no render cycle: pass the SIGNAL (or a getter) as `base`
 * so the overlay stays reactive. A plain value is accepted but won't track changes.
 *
 * ```ts
 * const likes = state(10)
 * const [optimisticLikes, addOptimistic] = useOptimistic(likes, (cur, delta) => cur + delta)
 *
 * async function toggleLike() {
 *   const settle = addOptimistic(liked() ? -1 : 1)   // optimisticLikes() updates now
 *   try { await api.like() }                          // on success, `likes` updates → overlay clears
 *   catch { settle() }                                // on error, roll back
 * }
 * ```
 *
 * @see stacksjs/stx#1742
 */
export function useOptimistic<T, A>(
  base: Signal<T> | DerivedSignal<T> | (() => T) | T,
  reducer: (current: T, action: A) => T,
): [DerivedSignal<T>, AddOptimistic<A>] {
  const readBase = (typeof base === 'function' ? base : () => base) as () => T
  // Each entry is a unique object so settle() removes exactly the one it owns,
  // even when two identical action values are queued.
  interface Entry { action: A }
  const pending = state<Entry[]>([])

  const optimistic = derived<T>(() =>
    pending().reduce<T>((acc, entry) => reducer(acc, entry.action), readBase()),
  )

  // When the real base value changes (the action landed / store confirmed), the
  // optimistic overlay is stale — discard it so base is the source of truth.
  // `peek` the pending read so this effect only re-runs on base change, not when
  // addOptimistic queues a new entry (which would clear it instantly).
  let primed = false
  effect(() => {
    readBase() // track base only
    if (!primed) {
      primed = true
      return
    }
    if (peek(() => pending().length))
      pending.set([])
  })

  const addOptimistic: AddOptimistic<A> = (action, settleWhen) => {
    const entry: Entry = { action }
    pending.set([...pending(), entry])
    const settle = (): void => {
      const next = pending().filter(e => e !== entry)
      if (next.length !== pending().length)
        pending.set(next)
    }
    if (settleWhen && typeof settleWhen.then === 'function') {
      Promise.resolve(settleWhen).then(settle, settle)
    }
    return settle
  }

  return [optimistic, addOptimistic]
}
