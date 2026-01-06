/**
 * STX Composables
 *
 * Vue-inspired composable utilities for STX components:
 * - Lifecycle hooks (onMount, onDestroy, onUpdate)
 * - Refs for DOM element references
 * - Watch and computed for reactivity
 *
 * @module composables
 */

// =============================================================================
// Types
// =============================================================================

export type LifecycleHook = () => void | (() => void)
export type CleanupFn = () => void
export type WatchCallback<T> = (newValue: T, oldValue: T | undefined) => void | CleanupFn
export type WatchSource<T> = () => T

export interface Ref<T> {
  value: T | null
  readonly current: T | null
}

export interface ComponentInstance {
  id: string
  element: Element | null
  mountHooks: LifecycleHook[]
  destroyHooks: CleanupFn[]
  updateHooks: LifecycleHook[]
  refs: Map<string, Ref<any>>
  watchers: Array<{ stop: () => void }>
  isMounted: boolean
}

// =============================================================================
// Component Context
// =============================================================================

/** Current component being set up */
let currentInstance: ComponentInstance | null = null

/** All registered component instances */
const instances = new Map<string, ComponentInstance>()

/** Generate unique component ID */
let componentIdCounter = 0
function generateId(): string {
  return `stx-${++componentIdCounter}-${Date.now().toString(36)}`
}

/**
 * Create a new component instance context.
 * Called internally when a component script starts executing.
 */
export function createComponentInstance(element?: Element): ComponentInstance {
  const instance: ComponentInstance = {
    id: generateId(),
    element: element || null,
    mountHooks: [],
    destroyHooks: [],
    updateHooks: [],
    refs: new Map(),
    watchers: [],
    isMounted: false,
  }

  instances.set(instance.id, instance)
  return instance
}

/**
 * Set the current component instance context.
 */
export function setCurrentInstance(instance: ComponentInstance | null): void {
  currentInstance = instance
}

/**
 * Get the current component instance context.
 */
export function getCurrentInstance(): ComponentInstance | null {
  return currentInstance
}

/**
 * Get or create an instance for a component.
 */
function getOrWarnInstance(hookName: string): ComponentInstance | null {
  if (!currentInstance) {
    console.warn(`[stx] ${hookName} must be called within a component setup.`)
    return null
  }
  return currentInstance
}

// =============================================================================
// Lifecycle Hooks
// =============================================================================

/**
 * Register a callback to run when the component is mounted to the DOM.
 *
 * @example
 * ```html
 * <script client>
 * import { onMount } from 'stx'
 *
 * onMount(() => {
 *   console.log('Component mounted!')
 *
 *   // Return cleanup function (optional)
 *   return () => {
 *     console.log('Cleanup on unmount')
 *   }
 * })
 * </script>
 * ```
 */
export function onMount(hook: LifecycleHook): void {
  const instance = getOrWarnInstance('onMount')
  if (instance) {
    instance.mountHooks.push(hook)
  }
}

/**
 * Register a callback to run when the component is destroyed/unmounted.
 *
 * @example
 * ```html
 * <script client>
 * import { onMount, onDestroy } from 'stx'
 *
 * onMount(() => {
 *   const interval = setInterval(() => console.log('tick'), 1000)
 *
 *   onDestroy(() => {
 *     clearInterval(interval)
 *   })
 * })
 * </script>
 * ```
 */
export function onDestroy(hook: CleanupFn): void {
  const instance = getOrWarnInstance('onDestroy')
  if (instance) {
    instance.destroyHooks.push(hook)
  }
}

/**
 * Register a callback to run when the component updates.
 *
 * @example
 * ```html
 * <script client>
 * import { onUpdate } from 'stx'
 *
 * onUpdate(() => {
 *   console.log('Component updated!')
 * })
 * </script>
 * ```
 */
export function onUpdate(hook: LifecycleHook): void {
  const instance = getOrWarnInstance('onUpdate')
  if (instance) {
    instance.updateHooks.push(hook)
  }
}

/**
 * Alias for onMount - matches common naming conventions.
 */
export const onMounted = onMount

/**
 * Alias for onDestroy - matches Vue naming.
 */
export const onUnmounted = onDestroy

/**
 * Alias for onUpdate - matches Vue naming.
 */
export const onUpdated = onUpdate

// =============================================================================
// Refs (DOM References)
// =============================================================================

/**
 * Create a ref for holding a DOM element reference.
 *
 * @example
 * ```html
 * <script client>
 * import { ref, onMount } from 'stx'
 *
 * const inputRef = ref<HTMLInputElement>()
 *
 * onMount(() => {
 *   inputRef.value?.focus()
 * })
 * </script>
 *
 * <template>
 *   <input type="text" @ref="inputRef" />
 * </template>
 * ```
 */
export function ref<T = HTMLElement>(initialValue: T | null = null): Ref<T> {
  const r: Ref<T> = {
    value: initialValue,
    get current() {
      return this.value
    },
  }

  // Register with current instance if available
  const instance = getCurrentInstance()
  if (instance) {
    const refId = `ref-${instance.refs.size}`
    instance.refs.set(refId, r)
  }

  return r
}

/**
 * Create a named ref that can be bound via @ref="name" in templates.
 */
export function namedRef<T = HTMLElement>(name: string, initialValue: T | null = null): Ref<T> {
  const r = ref<T>(initialValue)

  const instance = getCurrentInstance()
  if (instance) {
    instance.refs.set(name, r)
  }

  return r
}

// =============================================================================
// Watch & Computed
// =============================================================================

/**
 * Watch a reactive source and run a callback when it changes.
 *
 * @example
 * ```html
 * <script client>
 * import { watch } from 'stx'
 * import { counterStore } from '@stores'
 *
 * watch(
 *   () => counterStore.count,
 *   (newVal, oldVal) => {
 *     console.log(`Count changed: ${oldVal} → ${newVal}`)
 *   }
 * )
 * </script>
 * ```
 */
export function watch<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options: { immediate?: boolean } = {},
): () => void {
  let oldValue: T | undefined
  let cleanup: CleanupFn | void
  let isActive = true

  const run = () => {
    if (!isActive) return

    const newValue = source()

    if (oldValue !== newValue || options.immediate) {
      // Run previous cleanup if exists
      if (cleanup) cleanup()

      // Run callback and capture cleanup
      cleanup = callback(newValue, oldValue)
      oldValue = newValue
    }
  }

  // Initial run
  if (options.immediate) {
    run()
  } else {
    oldValue = source()
  }

  // Poll for changes (simple implementation)
  // In a real reactive system, this would use signals or proxies
  const intervalId = setInterval(run, 16) // ~60fps

  const stop = () => {
    isActive = false
    clearInterval(intervalId)
    if (cleanup) cleanup()
  }

  // Register with instance for automatic cleanup
  const instance = getCurrentInstance()
  if (instance) {
    instance.watchers.push({ stop })
    instance.destroyHooks.push(stop)
  }

  return stop
}

/**
 * Create a computed value that updates when dependencies change.
 *
 * @example
 * ```html
 * <script client>
 * import { computed } from 'stx'
 * import { counterStore } from '@stores'
 *
 * const doubleCount = computed(() => counterStore.count * 2)
 *
 * // Access value
 * console.log(doubleCount.value)
 * </script>
 * ```
 */
export function computed<T>(getter: () => T): { readonly value: T } {
  let cachedValue: T
  let isDirty = true

  const computedRef = {
    get value(): T {
      if (isDirty) {
        cachedValue = getter()
        isDirty = false

        // Mark dirty after a tick to allow for updates
        queueMicrotask(() => {
          isDirty = true
        })
      }
      return cachedValue
    },
  }

  return computedRef
}

// =============================================================================
// Component Runtime
// =============================================================================

/**
 * Initialize a component and run its setup.
 * This is called by the STX runtime when a component is created.
 */
export function setupComponent(
  element: Element,
  setup: () => void,
): ComponentInstance {
  const instance = createComponentInstance(element)

  // Set as current instance during setup
  setCurrentInstance(instance)

  try {
    setup()
  } finally {
    setCurrentInstance(null)
  }

  return instance
}

/**
 * Mount a component instance - runs onMount hooks.
 */
export function mountComponent(instance: ComponentInstance): void {
  if (instance.isMounted) return

  instance.isMounted = true

  for (const hook of instance.mountHooks) {
    try {
      const cleanup = hook()
      if (typeof cleanup === 'function') {
        instance.destroyHooks.push(cleanup)
      }
    } catch (error) {
      console.error('[stx] Error in onMount hook:', error)
    }
  }
}

/**
 * Update a component instance - runs onUpdate hooks.
 */
export function updateComponent(instance: ComponentInstance): void {
  if (!instance.isMounted) return

  for (const hook of instance.updateHooks) {
    try {
      const cleanup = hook()
      if (typeof cleanup === 'function') {
        instance.destroyHooks.push(cleanup)
      }
    } catch (error) {
      console.error('[stx] Error in onUpdate hook:', error)
    }
  }
}

/**
 * Destroy a component instance - runs cleanup and onDestroy hooks.
 */
export function destroyComponent(instance: ComponentInstance): void {
  if (!instance.isMounted) return

  // Stop all watchers
  for (const watcher of instance.watchers) {
    watcher.stop()
  }

  // Run destroy hooks
  for (const hook of instance.destroyHooks) {
    try {
      hook()
    } catch (error) {
      console.error('[stx] Error in onDestroy hook:', error)
    }
  }

  // Clear refs
  for (const ref of instance.refs.values()) {
    ref.value = null
  }

  instance.isMounted = false
  instances.delete(instance.id)
}

// =============================================================================
// Client Runtime Script
// =============================================================================

/**
 * Generate the client-side runtime script for lifecycle management.
 */
export function generateLifecycleRuntime(): string {
  return `
// STX Lifecycle Runtime
(function() {
  if (typeof window === 'undefined') return;

  const instances = new Map();
  let currentInstance = null;
  let idCounter = 0;

  function generateId() {
    return 'stx-' + (++idCounter) + '-' + Date.now().toString(36);
  }

  function createInstance(element) {
    const instance = {
      id: generateId(),
      element: element,
      mountHooks: [],
      destroyHooks: [],
      updateHooks: [],
      refs: new Map(),
      watchers: [],
      isMounted: false
    };
    instances.set(instance.id, instance);
    return instance;
  }

  window.STX = window.STX || {};

  // Lifecycle hooks
  window.STX.onMount = function(hook) {
    if (currentInstance) currentInstance.mountHooks.push(hook);
  };

  window.STX.onDestroy = function(hook) {
    if (currentInstance) currentInstance.destroyHooks.push(hook);
  };

  window.STX.onUpdate = function(hook) {
    if (currentInstance) currentInstance.updateHooks.push(hook);
  };

  // Aliases
  window.STX.onMounted = window.STX.onMount;
  window.STX.onUnmounted = window.STX.onDestroy;
  window.STX.onUpdated = window.STX.onUpdate;

  // Refs
  window.STX.ref = function(initialValue) {
    const r = { value: initialValue || null };
    Object.defineProperty(r, 'current', {
      get: function() { return this.value; }
    });
    if (currentInstance) {
      currentInstance.refs.set('ref-' + currentInstance.refs.size, r);
    }
    return r;
  };

  // Watch
  window.STX.watch = function(source, callback, options) {
    options = options || {};
    let oldValue;
    let cleanup;
    let isActive = true;

    function run() {
      if (!isActive) return;
      const newValue = source();
      if (oldValue !== newValue || options.immediate) {
        if (cleanup) cleanup();
        cleanup = callback(newValue, oldValue);
        oldValue = newValue;
      }
    }

    if (options.immediate) {
      run();
    } else {
      oldValue = source();
    }

    const intervalId = setInterval(run, 16);

    function stop() {
      isActive = false;
      clearInterval(intervalId);
      if (cleanup) cleanup();
    }

    if (currentInstance) {
      currentInstance.watchers.push({ stop: stop });
      currentInstance.destroyHooks.push(stop);
    }

    return stop;
  };

  // Computed
  window.STX.computed = function(getter) {
    let cached;
    let dirty = true;
    return {
      get value() {
        if (dirty) {
          cached = getter();
          dirty = false;
          queueMicrotask(function() { dirty = true; });
        }
        return cached;
      }
    };
  };

  // Component management
  window.STX.setupComponent = function(element, setup) {
    const instance = createInstance(element);
    currentInstance = instance;
    try {
      setup();
    } finally {
      currentInstance = null;
    }
    return instance;
  };

  window.STX.mountComponent = function(instance) {
    if (instance.isMounted) return;
    instance.isMounted = true;
    instance.mountHooks.forEach(function(hook) {
      try {
        const cleanup = hook();
        if (typeof cleanup === 'function') {
          instance.destroyHooks.push(cleanup);
        }
      } catch (e) {
        console.error('[stx] onMount error:', e);
      }
    });
  };

  window.STX.destroyComponent = function(instance) {
    if (!instance.isMounted) return;
    instance.watchers.forEach(function(w) { w.stop(); });
    instance.destroyHooks.forEach(function(hook) {
      try { hook(); } catch (e) { console.error('[stx] onDestroy error:', e); }
    });
    instance.refs.forEach(function(ref) { ref.value = null; });
    instance.isMounted = false;
    instances.delete(instance.id);
  };

  // Auto-bind refs from @ref attributes
  window.STX.bindRefs = function(root, refs) {
    if (!root) return;
    root.querySelectorAll('[data-ref]').forEach(function(el) {
      const refName = el.getAttribute('data-ref');
      if (refs[refName]) {
        refs[refName].value = el;
      }
    });
  };

  // MutationObserver for automatic lifecycle management
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // Handle removed nodes
      mutation.removedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.__stx_instance__) {
          window.STX.destroyComponent(node.__stx_instance__);
        }
      });
    });
  });

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  console.log('[stx] Lifecycle runtime initialized');
})();
`;
}

// =============================================================================
// Export helpers for client-side usage
// =============================================================================

// Re-export for convenient importing
export { ref as createRef }
