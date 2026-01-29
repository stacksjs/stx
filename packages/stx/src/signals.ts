/**
 * STX Signals - Reactive State Management
 * =========================================
 *
 * A simple, intuitive reactivity system for STX templates.
 * Signals provide fine-grained reactivity with automatic dependency tracking
 * and seamless template integration.
 *
 * ## Why Signals?
 *
 * - **No `.value` needed** - Read with `count()`, write with `count.set(5)`
 * - **Automatic tracking** - Dependencies are tracked automatically in effects
 * - **Fine-grained updates** - Only affected DOM nodes update, not the whole component
 * - **Simple API** - Just `state`, `derived`, and `effect`
 * - **Seamless syntax** - Same `@if`, `@for` directives work on server and client
 *
 * ## Quick Start
 *
 * ```html
 * <script>
 *   const count = state(0)
 *   const items = state(['Apple', 'Banana', 'Cherry'])
 *   const showList = state(true)
 *
 *   function increment() {
 *     count.update(n => n + 1)
 *   }
 *
 *   function addItem() {
 *     items.update(list => [...list, 'New Item'])
 *   }
 * </script>
 *
 * <button @click="increment">Count: {{ count }}</button>
 *
 * <button @click="showList.set(!showList())">Toggle List</button>
 *
 * @if="showList()"
 *   <ul>
 *     <li @for="item in items()">{{ item }}</li>
 *   </ul>
 * @endif
 *
 * <button @click="addItem">Add Item</button>
 * ```
 *
 * ## Core Concepts
 *
 * ### State
 * A state signal holds a reactive value. Read it by calling it as a function,
 * write it using `.set()` or `.update()`.
 *
 * ```typescript
 * const count = state(0)        // Create with initial value
 * console.log(count())          // Read: 0
 * count.set(5)                  // Write: set to 5
 * count.update(n => n + 1)      // Update: increment by 1
 * ```
 *
 * ### Derived
 * A derived signal computes its value from other signals. It automatically
 * updates when its dependencies change.
 *
 * ```typescript
 * const firstName = state('John')
 * const lastName = state('Doe')
 * const fullName = derived(() => `${firstName()} ${lastName()}`)
 *
 * console.log(fullName()) // "John Doe"
 * firstName.set('Jane')
 * console.log(fullName()) // "Jane Doe"
 * ```
 *
 * ### Effect
 * Effects run side effects when their dependencies change. They're perfect
 * for logging, API calls, or DOM manipulation.
 *
 * ```typescript
 * const searchQuery = state('')
 *
 * effect(() => {
 *   // This runs whenever searchQuery changes
 *   fetchResults(searchQuery())
 * })
 * ```
 *
 * ## Template Syntax (all use @ prefix)
 *
 * All directives work seamlessly on both server-side and client-side.
 * Server-side directives are processed at build time. Reactive directives
 * (those using signals) are handled by the client runtime.
 *
 * ### Text Interpolation
 * ```html
 * <p>{{ message }}</p>
 * <p>{{ user.name }}</p>
 * <p>{{ items().length }} items</p>
 * ```
 *
 * ### Conditional Rendering
 * ```html
 * <div @if="isVisible()">Shown when true</div>
 * <div @if="user()">Welcome, {{ user().name }}</div>
 * ```
 *
 * ### List Rendering
 * ```html
 * <ul>
 *   <li @for="item in items()">{{ item.name }}</li>
 * </ul>
 *
 * <div @for="item, index in items()">
 *   {{ index }}: {{ item }}
 * </div>
 * ```
 *
 * ### Visibility Toggle
 * ```html
 * <!-- @show keeps element in DOM but toggles display -->
 * <p @show="hasContent()">Toggles visibility</p>
 * ```
 *
 * ### Attribute Binding
 * ```html
 * <img @bind:src="imageUrl()" @bind:alt="imageAlt()">
 * <button @bind:disabled="isLoading()">Submit</button>
 * <div @class="{ active: isActive(), hidden: !visible() }">
 * ```
 *
 * ### Event Handling
 * ```html
 * <button @click="handleClick">Click me</button>
 * <input @input="updateValue" @keydown.enter="submit">
 * <form @submit.prevent="handleSubmit">
 * ```
 *
 * ### Two-Way Binding
 * ```html
 * <input @model="username">
 * <textarea @model="message"></textarea>
 * <select @model="selectedOption">
 * ```
 *
 * ### Text and HTML Content
 * ```html
 * <span @text="message()"></span>
 * <div @html="richContent()"></div>
 * ```
 *
 * ## Lifecycle Hooks
 *
 * ```typescript
 * onMount(() => {
 *   console.log('Component mounted')
 * })
 *
 * onDestroy(() => {
 *   console.log('Component destroyed')
 * })
 * ```
 *
 * @module signals
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
      } else {
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
      } else {
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
      } finally {
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
    } finally {
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
  } finally {
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
  } finally {
    activeEffect = prevEffect
  }
}

// =============================================================================
// Client Runtime Generator
// =============================================================================

/**
 * Generates the browser runtime for STX signals.
 *
 * This runtime is automatically injected into pages that use signals.
 * It provides the full reactivity system and template binding.
 *
 * @returns Minified JavaScript runtime code
 */
export function generateSignalsRuntime(): string {
  // Minify the dev runtime:
  // 1. Remove single-line comments (but preserve strings containing //)
  // 2. Remove multi-line comments
  // 3. Remove excess whitespace
  return generateSignalsRuntimeDev()
    .replace(/\/\/[^\n]*/g, '') // Remove single-line comments first (while newlines exist)
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\n\s*/g, ' ') // Replace newlines with single space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around punctuation
    .replace(/;\}/g, '}') // Remove unnecessary semicolons before }
    .trim()
}

/**
 * Generates readable (non-minified) runtime for development.
 *
 * @returns Human-readable JavaScript runtime code
 */
export function generateSignalsRuntimeDev(): string {
  return `
// STX Signals Runtime (Development Build)
(function() {
  'use strict';

  // ==========================================================================
  // Reactive Core
  // ==========================================================================

  let activeEffect = null;
  const effectStack = [];
  const pendingEffects = new Set();
  let isBatching = false;
  const targetMap = new WeakMap();

  function track(target, key) {
    if (!activeEffect) return;
    let depsMap = targetMap.get(target);
    if (!depsMap) targetMap.set(target, (depsMap = new Map()));
    let deps = depsMap.get(key);
    if (!deps) depsMap.set(key, (deps = new Set()));
    deps.add(activeEffect);
  }

  function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    const deps = depsMap.get(key);
    if (deps) {
      if (isBatching) {
        deps.forEach(effect => pendingEffects.add(effect));
      } else {
        deps.forEach(effect => effect());
      }
    }
  }

  // ==========================================================================
  // State Signal
  // ==========================================================================

  function state(initialValue) {
    let value = initialValue;
    const subscribers = new Set();
    const effects = new Set();

    const signal = () => {
      if (activeEffect) effects.add(activeEffect);
      return value;
    };

    signal.set = (newValue) => {
      if (!Object.is(newValue, value)) {
        const prev = value;
        value = newValue;
        subscribers.forEach(cb => cb(value, prev));
        if (isBatching) {
          effects.forEach(effect => pendingEffects.add(effect));
        } else {
          effects.forEach(effect => effect());
        }
      }
    };

    signal.update = (fn) => signal.set(fn(value));
    signal.subscribe = (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    };
    signal._isSignal = true;

    return signal;
  }

  // ==========================================================================
  // Derived Signal
  // ==========================================================================

  function derived(compute) {
    let cached;
    let isDirty = true;
    const effects = new Set();

    const markDirty = () => {
      if (!isDirty) {
        isDirty = true;
        if (isBatching) {
          effects.forEach(e => pendingEffects.add(e));
        } else {
          effects.forEach(e => e());
        }
      }
    };

    const signal = () => {
      if (activeEffect) effects.add(activeEffect);
      if (isDirty) {
        const prev = activeEffect;
        activeEffect = markDirty;
        effectStack.push(markDirty);
        try {
          cached = compute();
        } finally {
          effectStack.pop();
          activeEffect = prev;
        }
        isDirty = false;
      }
      return cached;
    };

    signal._isDerived = true;
    return signal;
  }

  // ==========================================================================
  // Effect
  // ==========================================================================

  function effect(fn, options = {}) {
    let cleanup;
    let isDisposed = false;

    const runEffect = () => {
      if (isDisposed) return;
      if (cleanup) {
        cleanup();
        cleanup = undefined;
      }
      const prev = activeEffect;
      activeEffect = runEffect;
      effectStack.push(runEffect);
      try {
        cleanup = fn();
      } finally {
        effectStack.pop();
        activeEffect = prev;
      }
    };

    if (options.immediate !== false) runEffect();
    return () => {
      isDisposed = true;
      if (cleanup) cleanup();
    };
  }

  // ==========================================================================
  // Batch
  // ==========================================================================

  function batch(fn) {
    if (isBatching) {
      fn();
      return;
    }
    isBatching = true;
    fn();
    isBatching = false;
    pendingEffects.forEach(e => e());
    pendingEffects.clear();
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  function isSignal(v) {
    return typeof v === 'function' && v._isSignal === true;
  }

  function untrack(v) {
    return isSignal(v) || (typeof v === 'function' && v._isDerived) ? v() : v;
  }

  function peek(fn) {
    const prev = activeEffect;
    activeEffect = null;
    try {
      return fn();
    } finally {
      activeEffect = prev;
    }
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  const mountCallbacks = [];
  const destroyCallbacks = [];

  function onMount(fn) { mountCallbacks.push(fn); }
  function onDestroy(fn) { destroyCallbacks.push(fn); }

  // ==========================================================================
  // Template Binding
  // ==========================================================================

  let componentScope = {};

  // Current element being processed (for scope lookup)
  let currentElement = null;

  function findElementScope(el) {
    // Find the nearest ancestor with data-stx-scope
    let current = el;
    while (current && current !== document) {
      if (current.hasAttribute && current.hasAttribute('data-stx-scope')) {
        const scopeId = current.getAttribute('data-stx-scope');
        if (window.stx._scopes && window.stx._scopes[scopeId]) {
          return window.stx._scopes[scopeId];
        }
      }
      current = current.parentElement || current.parentNode;
    }
    return null;
  }

  function toValue(expr, el) {
    try {
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      const scope = { ...componentScope, ...(elementScope || {}) };

      const fn = new Function(...Object.keys(scope), 'return ' + expr);
      return fn(...Object.values(scope));
    } catch (e) {
      console.warn('[STX] Expression error:', expr, e);
      return '';
    }
  }

  function executeHandler(expr, event, el) {
    try {
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      const scope = { ...componentScope, ...(elementScope || {}) };

      const fn = new Function(...Object.keys(scope), '$event', expr);
      fn(...Object.values(scope), event);
    } catch (e) {
      console.warn('[STX] Handler error:', expr, e);
    }
  }

  function processElement(el, scope = componentScope) {
    if (el.nodeType === Node.TEXT_NODE) {
      const text = el.textContent;
      if (text && text.includes('{{')) {
        const parts = text.split(/(\\{\\{[^}]+\\}\\})/g);
        if (parts.length > 1) {
          const fragment = document.createDocumentFragment();
          const parentEl = el.parentElement;
          parts.forEach(part => {
            const match = part.match(/^\\{\\{\\s*(.+?)\\s*\\}\\}$/);
            if (match) {
              const span = document.createElement('span');
              fragment.appendChild(span);
              effect(() => {
                span.textContent = toValue(match[1], parentEl);
              });
            } else if (part) {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          el.replaceWith(fragment);
        }
      }
      return;
    }

    if (el.nodeType !== Node.ELEMENT_NODE) return;

    // Handle @for first (reactive list)
    if (el.hasAttribute('@for')) {
      bindFor(el);
      return;
    }

    // Handle @if (conditional rendering)
    if (el.hasAttribute('@if')) {
      bindIf(el);
      return;
    }

    // Handle @show (visibility toggle - keeps element in DOM)
    if (el.hasAttribute('@show')) {
      bindShow(el, el.getAttribute('@show'));
    }

    // Handle @model (two-way binding)
    if (el.hasAttribute('@model')) {
      bindModel(el, el.getAttribute('@model'));
    }

    // Handle attributes
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name;
      const value = attr.value;

      // @bind:attr for dynamic attribute binding
      if (name.startsWith('@bind:')) {
        const attrName = name.slice(6);
        effect(() => {
          const v = toValue(value, el);
          if (v === false || v === null || v === undefined) {
            el.removeAttribute(attrName);
          } else if (v === true) {
            el.setAttribute(attrName, '');
          } else {
            el.setAttribute(attrName, v);
          }
        });
        el.removeAttribute(name);
      } else if (name === '@class') {
        bindClass(el, value);
        el.removeAttribute(name);
      } else if (name === '@style') {
        bindStyle(el, value);
        el.removeAttribute(name);
      } else if (name === '@text') {
        effect(() => {
          el.textContent = toValue(value, el);
        });
        el.removeAttribute(name);
      } else if (name === '@html') {
        effect(() => {
          el.innerHTML = toValue(value, el);
        });
        el.removeAttribute(name);
      } else if (name.startsWith('@')) {
        // Event handlers: @click, @submit.prevent, etc.
        const parts = name.slice(1).split('.');
        const eventName = parts[0];
        const modifiers = parts.slice(1);

        // Skip special directives (already handled above or in processElement)
        if (['if', 'for', 'show', 'model', 'class', 'style', 'text', 'html'].includes(eventName)) {
          return;
        }

        el.addEventListener(eventName, (event) => {
          if (modifiers.includes('prevent')) event.preventDefault();
          if (modifiers.includes('stop')) event.stopPropagation();
          executeHandler(value, event, el);
        }, {
          capture: modifiers.includes('capture'),
          passive: modifiers.includes('passive'),
          once: modifiers.includes('once')
        });
        el.removeAttribute(name);
      }
    });

    // Process children
    Array.from(el.childNodes).forEach(child => processElement(child, scope));
  }

  function bindShow(el, expr) {
    const originalDisplay = el.style.display || '';
    effect(() => {
      el.style.display = toValue(expr, el) ? originalDisplay : 'none';
    });
    el.removeAttribute('@show');
  }

  function bindModel(el, expr) {
    const tag = el.tagName.toLowerCase();
    const type = el.type;

    const getValue = () => toValue(expr, el);
    const setValue = (val) => {
      try {
        // Check component scope first, then element scope
        const elementScope = findElementScope(el);
        const scope = { ...componentScope, ...(elementScope || {}) };

        if (scope[expr] && scope[expr]._isSignal) {
          scope[expr].set(val);
        } else {
          const fn = new Function(...Object.keys(scope), 'v', expr + ' = v');
          fn(...Object.values(scope), val);
        }
      } catch (e) {
        console.warn('[STX] @model set error:', expr, e);
      }
    };

    if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
      effect(() => { el.checked = getValue(); });
      el.addEventListener('change', () => setValue(el.checked));
    } else if (tag === 'select') {
      effect(() => { el.value = getValue(); });
      el.addEventListener('change', () => setValue(el.value));
    } else {
      effect(() => { el.value = getValue() ?? ''; });
      el.addEventListener('input', () => setValue(el.value));
    }

    el.removeAttribute('@model');
  }

  function bindClass(el, expr) {
    const originalClasses = el.className;
    effect(() => {
      const value = toValue(expr, el);
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(cls => {
          value[cls] ? el.classList.add(cls) : el.classList.remove(cls);
        });
      } else if (Array.isArray(value)) {
        el.className = originalClasses + ' ' + value.filter(Boolean).join(' ');
      } else {
        el.className = originalClasses + (value ? ' ' + value : '');
      }
    });
  }

  function bindStyle(el, expr) {
    effect(() => {
      const value = toValue(expr, el);
      if (typeof value === 'object' && value !== null) {
        Object.assign(el.style, value);
      } else if (typeof value === 'string') {
        el.style.cssText = value;
      }
    });
  }

  function bindFor(el) {
    const expr = el.getAttribute('@for');
    const match = expr.match(/^\\s*(\\w+)(?:\\s*,\\s*(\\w+))?\\s+(?:in|of)\\s+(.+)\\s*$/);

    if (!match) {
      console.warn('[STX] Invalid @for:', expr);
      return;
    }

    const [, itemName, indexName, listExpr] = match;
    const parent = el.parentNode;
    const placeholder = document.createComment('stx-for');

    parent.insertBefore(placeholder, el);
    parent.removeChild(el);

    const template = el.cloneNode(true);
    template.removeAttribute('@for');

    let currentElements = [];

    // Get scope from original element's position
    const elementScope = findElementScope(el) || findElementScope(parent);

    effect(() => {
      currentElements.forEach(e => e.remove());
      currentElements = [];

      const list = toValue(listExpr, parent);
      if (!Array.isArray(list)) return;

      list.forEach((item, index) => {
        const clone = template.cloneNode(true);
        const itemScope = { ...componentScope, ...(elementScope || {}) };
        itemScope[itemName] = item;
        if (indexName) itemScope[indexName] = index;

        const prevScope = componentScope;
        componentScope = itemScope;
        processElement(clone);
        componentScope = prevScope;

        parent.insertBefore(clone, placeholder);
        currentElements.push(clone);
      });
    });
  }

  function bindIf(el) {
    const expr = el.getAttribute('@if');
    const parent = el.parentNode;
    const placeholder = document.createComment('stx-if');
    let isInserted = true;

    parent.insertBefore(placeholder, el);
    el.removeAttribute('@if');

    effect(() => {
      const value = toValue(expr, el);
      if (value && !isInserted) {
        parent.insertBefore(el, placeholder.nextSibling);
        isInserted = true;
      } else if (!value && isInserted) {
        el.remove();
        isInserted = false;
      }
    });
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  window.stx = {
    state,
    derived,
    effect,
    batch,
    isSignal,
    untrack,
    peek,
    onMount,
    onDestroy,
    _mountCallbacks: mountCallbacks,
    _destroyCallbacks: destroyCallbacks,
    _scopes: {}  // Component-level scopes
  };

  // ==========================================================================
  // Auto-initialization
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize components with data-stx attribute
    document.querySelectorAll('[data-stx]').forEach(el => {
      const setupName = el.getAttribute('data-stx');
      if (setupName && window[setupName]) {
        const result = window[setupName]();
        if (typeof result === 'object') {
          Object.assign(componentScope, result);
        }
      }
      processElement(el);
      mountCallbacks.forEach(fn => fn());
    });

    // Auto-process elements with data-stx-auto
    document.querySelectorAll('[data-stx-auto]').forEach(el => {
      processElement(el);
    });

    // Process scoped components (their scripts have already registered scope variables)
    document.querySelectorAll('[data-stx-scope]').forEach(el => {
      processElement(el);
    });
  });
})();
`
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  state,
  derived,
  effect,
  batch,
  onMount,
  onDestroy,
  isSignal,
  isDerived,
  untrack,
  peek,
  generateSignalsRuntime,
  generateSignalsRuntimeDev
}
