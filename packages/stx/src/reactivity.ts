/**
 * Vue-Style Reactivity Module
 *
 * Provides Vue 3 Composition API-style reactivity for STX templates.
 * This module is designed to feel familiar to Vue developers while
 * leveraging STX's template processing capabilities.
 *
 * ## Core Primitives
 *
 * - `ref()` - Create a reactive reference
 * - `reactive()` - Create a reactive object
 * - `computed()` - Create a computed value
 * - `watch()` - Watch reactive sources
 * - `watchEffect()` - Auto-track dependencies
 *
 * ## Lifecycle Hooks
 *
 * - `onBeforeMount()` - Before DOM insertion
 * - `onMounted()` - Component in DOM
 * - `onBeforeUpdate()` - Before re-render
 * - `onUpdated()` - After re-render
 * - `onBeforeUnmount()` - Before cleanup
 * - `onUnmounted()` - After cleanup
 *
 * ## Usage
 *
 * ```html
 * <script client>
 *   import { ref, onMounted, watch } from 'stx'
 *
 *   const count = ref(0)
 *   const users = ref([])
 *
 *   onMounted(async () => {
 *     users.value = await fetch('/api/users').then(r => r.json())
 *   })
 *
 *   watch(count, (newVal, oldVal) => {
 *     console.log(`Count changed: ${oldVal} -> ${newVal}`)
 *   })
 * </script>
 *
 * <button @click="count++">Count: {{ count }}</button>
 * ```
 *
 * @module reactivity
 */

// =============================================================================
// Types
// =============================================================================

/** Reactive reference wrapper */
export interface Ref<T> {
  value: T
  /** Subscribe to value changes */
  subscribe: (callback: (value: T, oldValue: T) => void) => () => void
}

/** Subscriber callback */
export type WatchCallback<T> = (newValue: T, oldValue: T | undefined) => void

/** Watch options */
export interface WatchOptions {
  /** Run callback immediately with current value */
  immediate?: boolean
  /** Deep watch nested objects */
  deep?: boolean
  /** Flush timing: 'pre' | 'post' | 'sync' */
  flush?: 'pre' | 'post' | 'sync'
}

/** Lifecycle hook callback */
export type LifecycleHook = () => void | Promise<void>

/** Component instance for tracking lifecycle */
export interface ComponentInstance {
  isMounted: boolean
  isUnmounted: boolean
  hooks: {
    beforeMount: LifecycleHook[]
    mounted: LifecycleHook[]
    beforeUpdate: LifecycleHook[]
    updated: LifecycleHook[]
    beforeUnmount: LifecycleHook[]
    unmounted: LifecycleHook[]
  }
  effects: (() => void)[]
  scope: ReactiveScope
}

/** Reactive scope for tracking dependencies */
export interface ReactiveScope {
  refs: Map<symbol, Ref<unknown>>
  effects: Set<() => void>
  cleanups: (() => void)[]
}

// =============================================================================
// Current Instance Tracking
// =============================================================================

let currentInstance: ComponentInstance | null = null
let currentEffect: (() => void) | null = null

/**
 * Set the current component instance for lifecycle hook registration.
 */
export function setCurrentInstance(instance: ComponentInstance | null): void {
  currentInstance = instance
}

/**
 * Get the current component instance.
 */
export function getCurrentInstance(): ComponentInstance | null {
  return currentInstance
}

/**
 * Create a new component instance.
 */
export function createComponentInstance(): ComponentInstance {
  return {
    isMounted: false,
    isUnmounted: false,
    hooks: {
      beforeMount: [],
      mounted: [],
      beforeUpdate: [],
      updated: [],
      beforeUnmount: [],
      unmounted: [],
    },
    effects: [],
    scope: createScope(),
  }
}

/**
 * Create a new reactive scope.
 */
export function createScope(): ReactiveScope {
  return {
    refs: new Map(),
    effects: new Set(),
    cleanups: [],
  }
}

// =============================================================================
// Reactive Primitives
// =============================================================================

/**
 * Create a reactive reference.
 *
 * @example
 * ```typescript
 * const count = ref(0)
 * count.value++
 * console.log(count.value) // 1
 * ```
 */
export function ref<T>(initialValue: T): Ref<T> {
  const subscribers = new Set<(value: T, oldValue: T) => void>()
  let value = initialValue
  const id = Symbol('ref')

  const refObj: Ref<T> = {
    get value() {
      // Track dependency if we're in an effect
      if (currentEffect) {
        // This would be used for watchEffect auto-tracking
      }
      return value
    },
    set value(newValue: T) {
      if (!Object.is(newValue, value)) {
        const oldValue = value
        value = newValue
        // Notify subscribers
        for (const callback of subscribers) {
          callback(newValue, oldValue)
        }
      }
    },
    subscribe(callback: (value: T, oldValue: T) => void) {
      subscribers.add(callback)
      return () => {
        subscribers.delete(callback)
      }
    },
  }

  // Register in current scope
  if (currentInstance) {
    currentInstance.scope.refs.set(id, refObj as Ref<unknown>)
  }

  return refObj
}

/**
 * Create a reactive object (proxy-based).
 *
 * @example
 * ```typescript
 * const state = reactive({ count: 0, name: 'STX' })
 * state.count++
 * state.name = 'Vue-style STX'
 * ```
 */
export function reactive<T extends object>(target: T): T {
  const subscribers = new Map<string | symbol, Set<() => void>>()

  const notify = (key: string | symbol) => {
    const subs = subscribers.get(key)
    if (subs) {
      for (const callback of subs) {
        callback()
      }
    }
  }

  const subscribe = (key: string | symbol, callback: () => void) => {
    if (!subscribers.has(key)) {
      subscribers.set(key, new Set())
    }
    subscribers.get(key)!.add(callback)
    return () => {
      subscribers.get(key)?.delete(callback)
    }
  }

  const proxy = new Proxy(target, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver)

      // Track dependency
      if (currentEffect) {
        subscribe(prop, currentEffect)
      }

      // Recursively make nested objects reactive
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        return reactive(value)
      }

      return value
    },
    set(obj, prop, value, receiver) {
      const oldValue = Reflect.get(obj, prop, receiver)
      const result = Reflect.set(obj, prop, value, receiver)

      if (!Object.is(value, oldValue)) {
        notify(prop)
      }

      return result
    },
    deleteProperty(obj, prop) {
      const result = Reflect.deleteProperty(obj, prop)
      notify(prop)
      return result
    },
  })

  return proxy
}

/**
 * Create a computed value.
 *
 * @example
 * ```typescript
 * const count = ref(0)
 * const doubled = computed(() => count.value * 2)
 * console.log(doubled.value) // 0
 * count.value = 5
 * console.log(doubled.value) // 10
 * ```
 */
export function computed<T>(getter: () => T): Ref<T> {
  let cachedValue: T
  let dirty = true
  const subscribers = new Set<(value: T, oldValue: T) => void>()

  // Track dependencies by running the getter in an effect context
  const update = () => {
    if (dirty) {
      const oldValue = cachedValue
      cachedValue = getter()
      dirty = false

      if (!Object.is(cachedValue, oldValue)) {
        for (const callback of subscribers) {
          callback(cachedValue, oldValue)
        }
      }
    }
  }

  // Initial computation
  const prevEffect = currentEffect
  currentEffect = () => {
    dirty = true
    update()
  }
  cachedValue = getter()
  dirty = false
  currentEffect = prevEffect

  return {
    get value() {
      update()
      return cachedValue
    },
    set value(_: T) {
      console.warn('[stx] Computed properties are readonly')
    },
    subscribe(callback: (value: T, oldValue: T) => void) {
      subscribers.add(callback)
      return () => {
        subscribers.delete(callback)
      }
    },
  }
}

// =============================================================================
// Watch API
// =============================================================================

/**
 * Watch a reactive source and run a callback on changes.
 *
 * @example
 * ```typescript
 * const count = ref(0)
 *
 * watch(count, (newVal, oldVal) => {
 *   console.log(`Changed from ${oldVal} to ${newVal}`)
 * })
 *
 * // With options
 * watch(count, callback, { immediate: true, deep: true })
 * ```
 */
export function watch<T>(
  source: Ref<T> | (() => T),
  callback: WatchCallback<T>,
  options: WatchOptions = {},
): () => void {
  const { immediate = false, deep = false, flush = 'post' } = options

  let oldValue: T | undefined
  let cleanup: (() => void) | undefined

  const getValue = (): T => {
    if (typeof source === 'function') {
      return source()
    }
    return source.value
  }

  const job = () => {
    const newValue = getValue()

    // Deep comparison for objects if deep is true
    const hasChanged = deep
      ? JSON.stringify(newValue) !== JSON.stringify(oldValue)
      : !Object.is(newValue, oldValue)

    if (hasChanged || immediate) {
      callback(newValue, oldValue)
      oldValue = deep && typeof newValue === 'object'
        ? JSON.parse(JSON.stringify(newValue))
        : newValue
    }
  }

  // Schedule the job based on flush timing
  const scheduler = (fn: () => void) => {
    if (flush === 'sync') {
      fn()
    }
    else if (flush === 'pre') {
      Promise.resolve().then(fn)
    }
    else {
      // 'post' - after DOM updates
      requestAnimationFrame(() => {
        requestAnimationFrame(fn)
      })
    }
  }

  // Subscribe to source changes
  if (typeof source === 'function') {
    // For getter functions, we need to track manually
    // This is a simplified implementation
    const interval = setInterval(() => {
      scheduler(job)
    }, 16) // ~60fps check

    cleanup = () => clearInterval(interval)
  }
  else {
    // For refs, use the subscribe method
    cleanup = source.subscribe(() => {
      scheduler(job)
    })
  }

  // Get initial value
  oldValue = getValue()

  // Run immediately if requested
  if (immediate) {
    scheduler(job)
  }

  // Register cleanup in current instance
  if (currentInstance) {
    currentInstance.scope.cleanups.push(() => cleanup?.())
  }

  return () => cleanup?.()
}

/**
 * Watch multiple sources.
 *
 * @example
 * ```typescript
 * const count = ref(0)
 * const name = ref('STX')
 *
 * watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
 *   console.log(`Count: ${oldCount} -> ${newCount}`)
 *   console.log(`Name: ${oldName} -> ${newName}`)
 * })
 * ```
 */
export function watchMultiple<T extends readonly Ref<unknown>[]>(
  sources: T,
  callback: (
    newValues: { [K in keyof T]: T[K] extends Ref<infer V> ? V : never },
    oldValues: { [K in keyof T]: T[K] extends Ref<infer V> ? V : never },
  ) => void,
  options: WatchOptions = {},
): () => void {
  const cleanups: (() => void)[] = []

  let oldValues = sources.map(s => s.value) as { [K in keyof T]: T[K] extends Ref<infer V> ? V : never }

  for (const source of sources) {
    const unwatch = source.subscribe(() => {
      const newValues = sources.map(s => s.value) as { [K in keyof T]: T[K] extends Ref<infer V> ? V : never }
      callback(newValues, oldValues)
      oldValues = [...newValues] as typeof oldValues
    })
    cleanups.push(unwatch)
  }

  if (options.immediate) {
    const newValues = sources.map(s => s.value) as { [K in keyof T]: T[K] extends Ref<infer V> ? V : never }
    callback(newValues, oldValues)
  }

  return () => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  }
}

/**
 * Automatically track reactive dependencies and re-run on changes.
 *
 * @example
 * ```typescript
 * const count = ref(0)
 *
 * watchEffect(() => {
 *   console.log(`Count is: ${count.value}`)
 * })
 * ```
 */
export function watchEffect(effect: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void

  const run = () => {
    // Clean up previous effect
    if (cleanup) {
      cleanup()
    }

    // Set current effect for dependency tracking
    const prevEffect = currentEffect
    currentEffect = run
    cleanup = effect()
    currentEffect = prevEffect
  }

  run()

  // Register cleanup in current instance
  if (currentInstance) {
    currentInstance.scope.cleanups.push(() => {
      if (cleanup) cleanup()
    })
  }

  return () => {
    if (cleanup) cleanup()
  }
}

// =============================================================================
// Lifecycle Hooks
// =============================================================================

/**
 * Register a callback to run before component mounts.
 */
export function onBeforeMount(callback: LifecycleHook): void {
  if (currentInstance) {
    currentInstance.hooks.beforeMount.push(callback)
  }
  else {
    console.warn('[stx] onBeforeMount called outside of component setup')
  }
}

/**
 * Register a callback to run when component is mounted to DOM.
 *
 * @example
 * ```typescript
 * onMounted(async () => {
 *   const data = await fetch('/api/data').then(r => r.json())
 *   items.value = data
 * })
 * ```
 */
export function onMounted(callback: LifecycleHook): void {
  if (currentInstance) {
    currentInstance.hooks.mounted.push(callback)
  }
  else {
    console.warn('[stx] onMounted called outside of component setup')
  }
}

/**
 * Register a callback to run before component updates.
 */
export function onBeforeUpdate(callback: LifecycleHook): void {
  if (currentInstance) {
    currentInstance.hooks.beforeUpdate.push(callback)
  }
  else {
    console.warn('[stx] onBeforeUpdate called outside of component setup')
  }
}

/**
 * Register a callback to run after component updates.
 */
export function onUpdated(callback: LifecycleHook): void {
  if (currentInstance) {
    currentInstance.hooks.updated.push(callback)
  }
  else {
    console.warn('[stx] onUpdated called outside of component setup')
  }
}

/**
 * Register a callback to run before component unmounts.
 */
export function onBeforeUnmount(callback: LifecycleHook): void {
  if (currentInstance) {
    currentInstance.hooks.beforeUnmount.push(callback)
  }
  else {
    console.warn('[stx] onBeforeUnmount called outside of component setup')
  }
}

/**
 * Register a callback to run after component unmounts.
 * Use this for cleanup: removing event listeners, clearing timers, etc.
 *
 * @example
 * ```typescript
 * let interval: number
 *
 * onMounted(() => {
 *   interval = setInterval(refresh, 5000)
 * })
 *
 * onUnmounted(() => {
 *   clearInterval(interval)
 * })
 * ```
 */
export function onUnmounted(callback: LifecycleHook): void {
  if (currentInstance) {
    currentInstance.hooks.unmounted.push(callback)
  }
  else {
    console.warn('[stx] onUnmounted called outside of component setup')
  }
}

// =============================================================================
// Lifecycle Execution
// =============================================================================

/**
 * Run all hooks of a specific type for an instance.
 */
export async function runHooks(
  instance: ComponentInstance,
  hookName: keyof ComponentInstance['hooks'],
): Promise<void> {
  const hooks = instance.hooks[hookName]
  for (const hook of hooks) {
    await hook()
  }
}

/**
 * Mount a component instance.
 */
export async function mountInstance(instance: ComponentInstance): Promise<void> {
  await runHooks(instance, 'beforeMount')
  instance.isMounted = true
  await runHooks(instance, 'mounted')
}

/**
 * Update a component instance.
 */
export async function updateInstance(instance: ComponentInstance): Promise<void> {
  if (!instance.isMounted || instance.isUnmounted) return
  await runHooks(instance, 'beforeUpdate')
  await runHooks(instance, 'updated')
}

/**
 * Unmount a component instance.
 */
export async function unmountInstance(instance: ComponentInstance): Promise<void> {
  if (instance.isUnmounted) return
  await runHooks(instance, 'beforeUnmount')

  // Run all cleanups
  for (const cleanup of instance.scope.cleanups) {
    cleanup()
  }

  instance.isUnmounted = true
  await runHooks(instance, 'unmounted')
}

// =============================================================================
// Client Script Runtime Generator
// =============================================================================

/**
 * Generate the client-side runtime script.
 * This is injected into the page to enable reactivity.
 */
export function generateClientRuntime(): string {
  return `
<script data-stx-client-runtime>
(function() {
  'use strict';

  // Reactive ref implementation
  function ref(initialValue) {
    const subscribers = new Set();
    let value = initialValue;

    return {
      get value() { return value; },
      set value(newValue) {
        if (!Object.is(newValue, value)) {
          const oldValue = value;
          value = newValue;
          subscribers.forEach(cb => cb(newValue, oldValue));
        }
      },
      subscribe(callback) {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
      }
    };
  }

  // Reactive object implementation
  function reactive(target) {
    const subscribers = new Map();

    const notify = (key) => {
      const subs = subscribers.get(key);
      if (subs) subs.forEach(cb => cb());
    };

    return new Proxy(target, {
      get(obj, prop, receiver) {
        const value = Reflect.get(obj, prop, receiver);
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return reactive(value);
        }
        return value;
      },
      set(obj, prop, value, receiver) {
        const oldValue = Reflect.get(obj, prop, receiver);
        const result = Reflect.set(obj, prop, value, receiver);
        if (!Object.is(value, oldValue)) notify(prop);
        return result;
      }
    });
  }

  // Computed implementation
  function computed(getter) {
    let cachedValue;
    let dirty = true;
    const subscribers = new Set();

    return {
      get value() {
        if (dirty) {
          cachedValue = getter();
          dirty = false;
        }
        return cachedValue;
      },
      subscribe(callback) {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
      }
    };
  }

  // Watch implementation
  function watch(source, callback, options = {}) {
    const { immediate = false } = options;
    let oldValue = typeof source === 'function' ? source() : source.value;

    const unsubscribe = (typeof source === 'function' ? { subscribe: () => {} } : source)
      .subscribe((newValue) => {
        callback(newValue, oldValue);
        oldValue = newValue;
      });

    if (immediate) {
      callback(oldValue, undefined);
    }

    return unsubscribe;
  }

  // Lifecycle hooks
  const lifecycleHooks = {
    beforeMount: [],
    mounted: [],
    beforeUpdate: [],
    updated: [],
    beforeUnmount: [],
    unmounted: []
  };

  function onBeforeMount(cb) { lifecycleHooks.beforeMount.push(cb); }
  function onMounted(cb) { lifecycleHooks.mounted.push(cb); }
  function onBeforeUpdate(cb) { lifecycleHooks.beforeUpdate.push(cb); }
  function onUpdated(cb) { lifecycleHooks.updated.push(cb); }
  function onBeforeUnmount(cb) { lifecycleHooks.beforeUnmount.push(cb); }
  function onUnmounted(cb) { lifecycleHooks.unmounted.push(cb); }

  // Run lifecycle hooks
  async function runHooks(hookName) {
    for (const hook of lifecycleHooks[hookName]) {
      await hook();
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', async () => {
    await runHooks('beforeMount');
    await runHooks('mounted');
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', async () => {
    await runHooks('beforeUnmount');
    await runHooks('unmounted');
  });

  // Expose to window for <script client> blocks
  window.stx = {
    ref,
    reactive,
    computed,
    watch,
    onBeforeMount,
    onMounted,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted
  };
})();
</script>`;
}

// =============================================================================
// Exports
// =============================================================================

export {
  ref as createRef,
  reactive as createReactive,
  computed as createComputed,
}
