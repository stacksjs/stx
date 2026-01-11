/**
 * Computed Properties Module
 *
 * Provides reactive computed values with automatic dependency tracking.
 * Computed properties automatically update when their dependencies change,
 * and are cached until dependencies are modified.
 *
 * @example
 * ```typescript
 * const firstName = ref('John')
 * const lastName = ref('Doe')
 *
 * const fullName = computed(() => `${firstName.value} ${lastName.value}`)
 *
 * console.log(fullName.value) // 'John Doe'
 * firstName.value = 'Jane'
 * console.log(fullName.value) // 'Jane Doe'
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface Ref<T> {
  value: T
  /** Subscribe to value changes */
  subscribe: (callback: (value: T) => void) => () => void
  /** Get raw value without tracking */
  peek: () => T
}

export interface ComputedRef<T> extends Ref<T> {
  /** Force recalculation */
  invalidate: () => void
  /** Check if value is dirty (needs recalculation) */
  readonly dirty: boolean
  /** Get all dependencies */
  readonly deps: Set<Ref<unknown>>
}

export interface WritableComputedRef<T> extends ComputedRef<T> {
  value: T
}

export interface ComputedOptions<T> {
  /** Getter function */
  get: () => T
  /** Optional setter function */
  set?: (value: T) => void
  /** Lazy evaluation (default: true) */
  lazy?: boolean
  /** Custom equality check */
  equals?: (a: T, b: T) => boolean
}

export interface WatchOptions {
  /** Run immediately with current value */
  immediate?: boolean
  /** Deep watch for object changes */
  deep?: boolean
  /** Flush timing: 'pre' | 'post' | 'sync' */
  flush?: 'pre' | 'post' | 'sync'
  /** Stop watching after first change */
  once?: boolean
}

export interface WatchStopHandle {
  (): void
  pause: () => void
  resume: () => void
}

// ============================================================================
// Internal State
// ============================================================================

// Current effect being tracked
let activeEffect: (() => void) | null = null

// Stack of effects for nested computed
const effectStack: (() => void)[] = []

// WeakMap to store dependencies for each ref
const refDeps = new WeakMap<Ref<unknown>, Set<() => void>>()

// ============================================================================
// Ref Implementation
// ============================================================================

/**
 * Create a reactive reference
 */
export function ref<T>(initialValue: T): Ref<T> {
  let value = initialValue
  const subscribers = new Set<(value: T) => void>()

  const refObj: Ref<T> = {
    get value() {
      // Track dependency
      if (activeEffect) {
        let deps = refDeps.get(refObj as Ref<unknown>)
        if (!deps) {
          deps = new Set()
          refDeps.set(refObj as Ref<unknown>, deps)
        }
        deps.add(activeEffect)
      }
      return value
    },

    set value(newValue: T) {
      if (!Object.is(value, newValue)) {
        value = newValue

        // Notify subscribers
        subscribers.forEach((callback) => callback(newValue))

        // Trigger dependent effects
        const deps = refDeps.get(refObj as Ref<unknown>)
        if (deps) {
          deps.forEach((effect) => effect())
        }
      }
    },

    subscribe(callback: (value: T) => void): () => void {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },

    peek(): T {
      return value
    },
  }

  return refObj
}

/**
 * Check if a value is a ref
 */
export function isRef<T>(value: unknown): value is Ref<T> {
  return (
    value !== null
    && typeof value === 'object'
    && 'value' in value
    && 'subscribe' in value
    && 'peek' in value
  )
}

/**
 * Unwrap a ref to get its value
 */
export function unref<T>(value: T | Ref<T>): T {
  return isRef(value) ? value.value : value
}

/**
 * Convert all properties of an object to refs
 */
export function toRefs<T extends object>(
  obj: T
): { [K in keyof T]: Ref<T[K]> } {
  const result = {} as { [K in keyof T]: Ref<T[K]> }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = ref(obj[key])
    }
  }

  return result
}

/**
 * Create a shallow reactive object
 */
export function shallowRef<T>(initialValue: T): Ref<T> {
  return ref(initialValue)
}

// ============================================================================
// Computed Implementation
// ============================================================================

/**
 * Create a computed property with automatic dependency tracking
 */
export function computed<T>(getter: () => T): ComputedRef<T>
export function computed<T>(options: ComputedOptions<T>): WritableComputedRef<T>
export function computed<T>(
  getterOrOptions: (() => T) | ComputedOptions<T>
): ComputedRef<T> | WritableComputedRef<T> {
  const isFunction = typeof getterOrOptions === 'function'
  const getter = isFunction ? getterOrOptions : getterOrOptions.get
  const setter = isFunction ? undefined : getterOrOptions.set
  const equals = isFunction ? Object.is : (getterOrOptions.equals || Object.is)

  let cachedValue: T
  let dirty = true
  const deps = new Set<Ref<unknown>>()
  const subscribers = new Set<(value: T) => void>()

  // Effect to track dependencies
  const effect = () => {
    dirty = true
    // Notify subscribers
    if (subscribers.size > 0) {
      const newValue = computedRef.value
      subscribers.forEach((callback) => callback(newValue))
    }
  }

  // Calculate value and track dependencies
  function calculate(): T {
    // Clear previous deps
    deps.clear()

    // Push to effect stack
    const previousEffect = activeEffect
    activeEffect = effect
    effectStack.push(effect)

    try {
      const newValue = getter()
      return newValue
    }
    finally {
      // Pop from effect stack
      effectStack.pop()
      activeEffect = previousEffect
    }
  }

  const computedRef: WritableComputedRef<T> = {
    get value(): T {
      // Track this computed as a dependency
      if (activeEffect) {
        let computedDeps = refDeps.get(computedRef as unknown as Ref<unknown>)
        if (!computedDeps) {
          computedDeps = new Set()
          refDeps.set(computedRef as unknown as Ref<unknown>, computedDeps)
        }
        computedDeps.add(activeEffect)
      }

      // Recalculate if dirty
      if (dirty) {
        const newValue = calculate()
        if (!equals(cachedValue, newValue)) {
          cachedValue = newValue
        }
        dirty = false
      }

      return cachedValue
    },

    set value(newValue: T) {
      if (setter) {
        setter(newValue)
      }
      else {
        console.warn('Computed property is readonly')
      }
    },

    subscribe(callback: (value: T) => void): () => void {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },

    peek(): T {
      if (dirty) {
        cachedValue = getter()
        dirty = false
      }
      return cachedValue
    },

    invalidate(): void {
      dirty = true
    },

    get dirty(): boolean {
      return dirty
    },

    get deps(): Set<Ref<unknown>> {
      return deps
    },
  }

  return computedRef
}

// ============================================================================
// Watch Implementation
// ============================================================================

/**
 * Watch a reactive source and run a callback when it changes
 */
export function watch<T>(
  source: Ref<T> | (() => T),
  callback: (newValue: T, oldValue: T | undefined) => void,
  options: WatchOptions = {}
): WatchStopHandle {
  const { immediate = false, deep = false, flush = 'pre', once = false } = options

  let oldValue: T | undefined
  let isActive = true
  let isPaused = false

  // Get value from source
  const getValue = (): T => {
    if (isRef(source)) {
      return deep ? deepClone(source.value) : source.value
    }
    return source()
  }

  // Run the callback
  const run = () => {
    if (!isActive || isPaused) return

    const newValue = getValue()

    // Skip if values are equal and not first run
    if (oldValue !== undefined && Object.is(oldValue, newValue) && !deep) {
      return
    }

    // Schedule callback based on flush timing
    const executeCallback = () => {
      callback(newValue, oldValue)
      oldValue = deep ? deepClone(newValue) : newValue

      // Stop if once option is set
      if (once) {
        stop()
      }
    }

    if (flush === 'sync') {
      executeCallback()
    }
    else if (flush === 'post') {
      queueMicrotask(executeCallback)
    }
    else {
      // 'pre' - use Promise for next tick
      Promise.resolve().then(executeCallback)
    }
  }

  // Setup tracking
  let unsubscribe: (() => void) | null = null

  if (isRef(source)) {
    unsubscribe = source.subscribe(() => run())
  }
  else {
    // For getter functions, create a computed to track dependencies
    const tracked = computed(source)
    unsubscribe = tracked.subscribe(() => run())
  }

  // Run immediately if requested
  if (immediate) {
    oldValue = undefined
    run()
  }
  else {
    oldValue = getValue()
  }

  // Stop handle
  const stop: WatchStopHandle = () => {
    isActive = false
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  stop.pause = () => {
    isPaused = true
  }

  stop.resume = () => {
    isPaused = false
  }

  return stop
}

/**
 * Watch multiple sources
 */
export function watchMultiple<T extends readonly Ref<unknown>[]>(
  sources: [...T],
  callback: (
    newValues: { [K in keyof T]: T[K] extends Ref<infer V> ? V : never },
    oldValues: { [K in keyof T]: T[K] extends Ref<infer V> ? V | undefined : never }
  ) => void,
  options: WatchOptions = {}
): WatchStopHandle {
  const { immediate = false, once = false } = options

  let oldValues: unknown[] = sources.map((s) => (isRef(s) ? s.value : undefined))
  let isActive = true
  let isPaused = false

  const run = () => {
    if (!isActive || isPaused) return

    const newValues = sources.map((s) => (isRef(s) ? s.value : undefined))

    callback(
      newValues as { [K in keyof T]: T[K] extends Ref<infer V> ? V : never },
      oldValues as { [K in keyof T]: T[K] extends Ref<infer V> ? V | undefined : never }
    )

    oldValues = [...newValues]

    if (once) {
      stop()
    }
  }

  // Subscribe to all sources
  const unsubscribes = sources.map((source) => {
    if (isRef(source)) {
      return source.subscribe(() => run())
    }
    return () => {}
  })

  if (immediate) {
    run()
  }

  const stop: WatchStopHandle = () => {
    isActive = false
    unsubscribes.forEach((unsub) => unsub())
  }

  stop.pause = () => {
    isPaused = true
  }

  stop.resume = () => {
    isPaused = false
  }

  return stop
}

/**
 * Watch and run effect immediately, auto-tracking dependencies
 */
export function watchEffect(
  effect: () => void | (() => void),
  options: Pick<WatchOptions, 'flush'> = {}
): WatchStopHandle {
  const { flush = 'pre' } = options

  let cleanup: (() => void) | void
  let isActive = true
  let isPaused = false

  const run = () => {
    if (!isActive || isPaused) return

    // Run cleanup from previous effect
    if (cleanup) {
      cleanup()
    }

    // Run effect
    const previousEffect = activeEffect
    activeEffect = run
    effectStack.push(run)

    try {
      cleanup = effect()
    }
    finally {
      effectStack.pop()
      activeEffect = previousEffect
    }
  }

  // Schedule initial run
  if (flush === 'sync') {
    run()
  }
  else if (flush === 'post') {
    queueMicrotask(run)
  }
  else {
    Promise.resolve().then(run)
  }

  const stop: WatchStopHandle = () => {
    isActive = false
    if (cleanup) {
      cleanup()
    }
  }

  stop.pause = () => {
    isPaused = true
  }

  stop.resume = () => {
    isPaused = false
  }

  return stop
}

// ============================================================================
// Template Integration
// ============================================================================

/**
 * Process @computed directives in templates
 */
export function processComputedDirectives(
  template: string,
  context: Record<string, unknown> = {},
  _filePath?: string
): string {
  // Match @computed(name, expression)
  const computedRegex = /@computed\s*\(\s*(\w+)\s*,\s*(.+?)\s*\)/gi

  return template.replace(computedRegex, (_, name, expression) => {
    try {
      // Create computed in context
      const fn = new Function(...Object.keys(context), `return ${expression}`)
      const value = fn(...Object.values(context))
      ;(context as Record<string, unknown>)[name] = value

      return `<!-- computed: ${name} = ${value} -->`
    }
    catch (error) {
      return `<!-- computed error: ${name} - ${error} -->`
    }
  })
}

/**
 * Process @watch directives in templates
 */
export function processWatchDirectives(
  template: string,
  _context: Record<string, unknown> = {},
  _filePath?: string
): string {
  // Match @watch(source, handler)
  const watchRegex = /@watch\s*\(\s*(\w+)\s*\)\s*([\s\S]*?)@endwatch/gi

  return template.replace(watchRegex, (_, source, handler) => {
    const watchId = `watch-${Math.random().toString(36).substring(2, 9)}`

    return `
      <script data-watch="${watchId}">
        (function() {
          // Watch implementation for ${source}
          const handler = ${handler.trim()};
          if (window.__stxState && window.__stxState['${source}']) {
            window.__stxState['${source}'].subscribe(function(newValue) {
              handler(newValue);
            });
          }
        })();
      </script>
    `
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Deep clone a value
 */
function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as unknown as T
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T
  }

  if (value instanceof Map) {
    const map = new Map()
    value.forEach((v, k) => map.set(deepClone(k), deepClone(v)))
    return map as unknown as T
  }

  if (value instanceof Set) {
    const set = new Set()
    value.forEach((v) => set.add(deepClone(v)))
    return set as unknown as T
  }

  const cloned = {} as T
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      ;(cloned as Record<string, unknown>)[key] = deepClone(
        (value as Record<string, unknown>)[key]
      )
    }
  }

  return cloned
}

/**
 * Create a debounced computed
 */
export function debouncedComputed<T>(
  getter: () => T,
  delay: number = 100
): ComputedRef<T> {
  const result = ref<T>(getter())
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debouncedUpdate = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      result.value = getter()
    }, delay)
  }

  // Initial calculation with dependency tracking
  const tracked = computed(getter)
  tracked.subscribe(() => debouncedUpdate())

  return {
    get value() {
      return result.value
    },
    set value(_: T) {
      console.warn('Debounced computed is readonly')
    },
    subscribe: result.subscribe,
    peek: result.peek,
    invalidate() {
      debouncedUpdate()
    },
    get dirty() {
      return false
    },
    get deps() {
      return new Set<Ref<unknown>>()
    },
  }
}

/**
 * Create a throttled computed
 */
export function throttledComputed<T>(
  getter: () => T,
  limit: number = 100
): ComputedRef<T> {
  const result = ref<T>(getter())
  let lastRun = 0

  const throttledUpdate = () => {
    const now = Date.now()
    if (now - lastRun >= limit) {
      lastRun = now
      result.value = getter()
    }
  }

  const tracked = computed(getter)
  tracked.subscribe(() => throttledUpdate())

  return {
    get value() {
      return result.value
    },
    set value(_: T) {
      console.warn('Throttled computed is readonly')
    },
    subscribe: result.subscribe,
    peek: result.peek,
    invalidate() {
      throttledUpdate()
    },
    get dirty() {
      return false
    },
    get deps() {
      return new Set<Ref<unknown>>()
    },
  }
}

// ============================================================================
// Aliased Exports (to avoid conflicts with other modules)
// ============================================================================

// Export with 'stx' prefix to avoid naming conflicts
export {
  ref as stxRef,
  computed as stxComputed,
  watch as stxWatch,
  watchMultiple as stxWatchMultiple,
  watchEffect as stxWatchEffect,
  isRef as stxIsRef,
  unref as stxUnref,
  toRefs as stxToRefs,
  shallowRef as stxShallowRef,
  debouncedComputed as stxDebouncedComputed,
  throttledComputed as stxThrottledComputed,
}

// ============================================================================
// Exports
// ============================================================================

export default {
  ref,
  computed,
  watch,
  watchMultiple,
  watchEffect,
  isRef,
  unref,
  toRefs,
  shallowRef,
  debouncedComputed,
  throttledComputed,
  processComputedDirectives,
  processWatchDirectives,
}
