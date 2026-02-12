/**
 * STX Composition API
 *
 * Provides Vue-compatible Composition API features:
 * - provide() / inject() for dependency injection across components
 * - defineEmits() for typed event emission
 * - defineExpose() for exposing component internals to template refs
 * - nextTick() for waiting on DOM updates
 * - getCurrentInstance() for accessing the current component instance
 * - onErrorCaptured() for error boundary handling
 *
 * @module composition-api
 */

// =============================================================================
// Component Instance Tracking
// =============================================================================

/** Represents a component instance in the stx component tree */
export interface StxComponentInstance {
  /** Unique scope ID for this instance */
  scopeId: string
  /** Parent component instance */
  parent: StxComponentInstance | null
  /** Provided values from this instance */
  provides: Map<string | symbol, unknown>
  /** Exposed public properties */
  exposed: Record<string, unknown> | null
  /** Template refs */
  refs: Record<string, Element | null>
  /** Component props */
  props: Record<string, unknown>
  /** Component attrs (non-prop attributes) */
  attrs: Record<string, unknown>
  /** Slot content */
  slots: Record<string, any>
  /** Emit function */
  emit: EmitFn
  /** Root element */
  el: Element | null
  /** Error captured hooks */
  errorCapturedHooks: Array<(error: Error, instance: StxComponentInstance | null, info: string) => boolean | void>
  /** Is mounted */
  isMounted: boolean
}

/** The currently active component instance (set during setup execution) */
let currentInstance: StxComponentInstance | null = null

/** Stack for nested component setup */
const instanceStack: StxComponentInstance[] = []

/** Global scope counter */
let scopeCounter = 0

/**
 * Generate a unique scope ID.
 */
export function generateScopeId(): string {
  return `stx-${++scopeCounter}`
}

/**
 * Create a new component instance.
 */
export function createComponentInstance(parent: StxComponentInstance | null = null): StxComponentInstance {
  const instance: StxComponentInstance = {
    scopeId: generateScopeId(),
    parent,
    provides: new Map(parent?.provides), // Inherit parent provides
    exposed: null,
    refs: {},
    props: {},
    attrs: {},
    slots: {},
    emit: () => {}, // Replaced by defineEmits
    el: null,
    errorCapturedHooks: [],
    isMounted: false,
  }
  return instance
}

/**
 * Set the current component instance for setup execution.
 * @internal
 */
export function setCurrentInstance(instance: StxComponentInstance | null): void {
  if (instance) {
    instanceStack.push(instance)
  }
  else if (instanceStack.length > 0) {
    instanceStack.pop()
  }
  currentInstance = instance || instanceStack[instanceStack.length - 1] || null
}

/**
 * Get the current component instance.
 * Must be called during component setup (inside <script> block).
 *
 * ```ts
 * const instance = getCurrentInstance()
 * console.log(instance?.props)
 * ```
 */
export function getCurrentInstance(): StxComponentInstance | null {
  return currentInstance
}

// =============================================================================
// provide() / inject()
// =============================================================================

/**
 * Provide a value for injection into descendant components.
 *
 * ```ts
 * // Parent component
 * provide('theme', 'dark')
 * provide('user', { name: 'Alice' })
 * ```
 *
 * @param key - Injection key (string or symbol)
 * @param value - The value to provide
 */
export function provide<T>(key: string | symbol, value: T): void {
  if (currentInstance) {
    currentInstance.provides.set(key, value)
  }
  else {
    // Global provide (outside component context) — store in global map
    globalProvides.set(key, value)
  }
}

/**
 * Inject a value provided by an ancestor component.
 *
 * ```ts
 * // Child component
 * const theme = inject('theme', 'light') // 'dark' if provided, 'light' as fallback
 * const user = inject<{ name: string }>('user')
 * ```
 *
 * @param key - Injection key to look up
 * @param defaultValue - Fallback value if not provided by any ancestor
 * @returns The injected value, or defaultValue if not found
 */
export function inject<T>(key: string | symbol, defaultValue?: T): T | undefined {
  // Walk up the instance tree
  let instance = currentInstance
  while (instance) {
    if (instance.provides.has(key)) {
      return instance.provides.get(key) as T
    }
    instance = instance.parent
  }

  // Check global provides
  if (globalProvides.has(key)) {
    return globalProvides.get(key) as T
  }

  return defaultValue
}

/** Global provide map (for app-level provides) */
const globalProvides = new Map<string | symbol, unknown>()

/**
 * Set a global provide value (used by createApp().provide()).
 * @internal
 */
export function setGlobalProvide<T>(key: string | symbol, value: T): void {
  globalProvides.set(key, value)
}

// =============================================================================
// defineEmits()
// =============================================================================

/** Type-safe emit function */
export type EmitFn<T extends string = string> = (event: T, ...args: any[]) => void

/**
 * Define the events a component can emit.
 * Returns a typed emit function.
 *
 * ```ts
 * const emit = defineEmits<{
 *   change: [value: string]
 *   'update:modelValue': [value: any]
 * }>()
 *
 * // Or with string array
 * const emit = defineEmits(['change', 'update:modelValue'])
 *
 * emit('change', 'newValue')
 * ```
 */
export function defineEmits<T extends Record<string, any[]> = Record<string, any[]>>(_events?: string[] | T): EmitFn<Extract<keyof T, string>> {
  const instance = currentInstance

  const emit = (event: string, ...args: any[]) => {
    // Server-side: no-op (SSR doesn't need events)
    if (typeof document === 'undefined')
      return

    // Client-side: dispatch CustomEvent on the component's scope element
    if (instance?.el) {
      instance.el.dispatchEvent(new CustomEvent(event, {
        detail: args.length === 1 ? args[0] : args,
        bubbles: true,
        cancelable: true,
      }))
    }
  }

  if (instance) {
    instance.emit = emit
  }

  return emit as EmitFn<Extract<keyof T, string>>
}

// =============================================================================
// defineExpose()
// =============================================================================

/**
 * Expose public properties from a component instance.
 * These properties become accessible via template refs from the parent.
 *
 * ```ts
 * const count = ref(0)
 * const increment = () => count.value++
 *
 * defineExpose({ count, increment })
 * ```
 *
 * @param exposed - Object of properties to expose
 */
export function defineExpose(exposed: Record<string, unknown>): void {
  if (currentInstance) {
    currentInstance.exposed = exposed
  }
}

// =============================================================================
// nextTick()
// =============================================================================

/**
 * Wait for the next DOM update cycle.
 *
 * ```ts
 * await nextTick()
 * // DOM is now updated
 *
 * // Or with callback:
 * nextTick(() => {
 *   // DOM is now updated
 * })
 * ```
 *
 * @param fn - Optional callback to run after the tick
 * @returns Promise that resolves after the next microtask
 */
export function nextTick(fn?: () => void): Promise<void> {
  const p = Promise.resolve()
  return fn ? p.then(fn) : p
}

// =============================================================================
// onErrorCaptured()
// =============================================================================

/**
 * Register an error captured hook.
 * Called when an error is captured from a descendant component.
 *
 * ```ts
 * onErrorCaptured((error, instance, info) => {
 *   console.error('Caught error:', error, info)
 *   return false // prevents further propagation
 * })
 * ```
 *
 * @param hook - Error handler function. Return false to stop propagation.
 */
export function onErrorCaptured(
  hook: (error: Error, instance: StxComponentInstance | null, info: string) => boolean | void,
): void {
  if (currentInstance) {
    currentInstance.errorCapturedHooks.push(hook)
  }
}

/**
 * Propagate an error up the component tree.
 * Calls onErrorCaptured hooks on each ancestor.
 * @internal
 */
export function handleError(error: Error, instance: StxComponentInstance | null, info: string): void {
  let current = instance?.parent
  while (current) {
    for (const hook of current.errorCapturedHooks) {
      const result = hook(error, instance, info)
      if (result === false)
        return // Stop propagation
    }
    current = current.parent
  }
}

// =============================================================================
// useSlots() / useAttrs()
// =============================================================================

/**
 * Get the current component's slots.
 *
 * ```ts
 * const slots = useSlots()
 * if (slots.header) {
 *   // render header slot
 * }
 * ```
 */
export function useSlots(): Record<string, any> {
  return currentInstance?.slots ?? {}
}

/**
 * Get the current component's non-prop attributes.
 *
 * ```ts
 * const attrs = useAttrs()
 * // attrs contains all attributes not declared as props
 * ```
 */
export function useAttrs(): Record<string, unknown> {
  return currentInstance?.attrs ?? {}
}

// =============================================================================
// Server-side Context Integration
// =============================================================================

/**
 * Integrate provide/inject with the server-side template context.
 * Called during component rendering in process.ts.
 * @internal
 */
export function createProvideContext(parentContext: Record<string, any>): Record<string, any> {
  const provides = parentContext.__provides ? new Map(Object.entries(parentContext.__provides)) : new Map()

  return {
    ...parentContext,
    __provides: provides,
    __provide(key: string | symbol, value: unknown) {
      provides.set(key, value)
    },
    __inject(key: string | symbol, defaultValue?: unknown) {
      if (provides.has(key))
        return provides.get(key)
      // Walk up parent provides
      if (parentContext.__provides) {
        const parentProvides = parentContext.__provides instanceof Map
          ? parentContext.__provides
          : new Map(Object.entries(parentContext.__provides))
        if (parentProvides.has(key))
          return parentProvides.get(key)
      }
      return defaultValue
    },
  }
}

// =============================================================================
// Client Runtime Code Generation
// =============================================================================

/**
 * Generate the client-side runtime code for the Composition API.
 * This is injected into the page's runtime script.
 * @internal
 */
export function generateCompositionRuntime(): string {
  return `
// STX Composition API Runtime
(function() {
  const _provides = new Map();
  const _scopes = window.__stx_scopes || (window.__stx_scopes = {});
  const _exposed = window.__stx_exposed || (window.__stx_exposed = {});

  // provide() stores values in the nearest scope's provide map
  window.__stx_provide = function(key, value) {
    _provides.set(key, value);
  };

  // inject() walks up DOM ancestors with data-stx-scope to find provided values
  window.__stx_inject = function(key, defaultValue, el) {
    // Walk up the DOM tree
    let current = el ? el.closest('[data-stx-scope]') : null;
    while (current) {
      const scopeId = current.getAttribute('data-stx-scope');
      const scope = _scopes[scopeId];
      if (scope && scope.__provided && scope.__provided.has(key)) {
        return scope.__provided.get(key);
      }
      current = current.parentElement ? current.parentElement.closest('[data-stx-scope]') : null;
    }
    // Check global provides
    if (_provides.has(key)) return _provides.get(key);
    return defaultValue;
  };

  // defineEmits() returns an emit function
  window.__stx_defineEmits = function(scopeId) {
    return function emit(event, ...args) {
      const el = document.querySelector('[data-stx-scope="' + scopeId + '"]');
      if (el) {
        el.dispatchEvent(new CustomEvent(event, {
          detail: args.length === 1 ? args[0] : args,
          bubbles: true,
          cancelable: true
        }));
      }
    };
  };

  // defineExpose() registers exposed properties
  window.__stx_defineExpose = function(scopeId, exposed) {
    _exposed[scopeId] = exposed;
  };

  // nextTick()
  window.__stx_nextTick = function(fn) {
    return Promise.resolve().then(fn);
  };

  // Template ref resolution
  window.__stx_resolveRefs = function(scopeId) {
    const scope = document.querySelector('[data-stx-scope="' + scopeId + '"]');
    if (!scope) return {};
    const refs = {};
    scope.querySelectorAll('[data-stx-ref]').forEach(function(el) {
      refs[el.getAttribute('data-stx-ref')] = el;
    });
    return refs;
  };
})();
`
}
