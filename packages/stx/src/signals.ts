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

  // ==========================================================================
  // Global Helpers (Feature #5)
  // ==========================================================================

  const globalHelpers = {
    // Number formatting
    fmt(n) {
      if (n == null) return '0';
      n = Number(n);
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n);
    },

    // Date formatting
    formatDate(date, format = 'YYYY-MM-DD') {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },

    // Time ago formatting
    timeAgo(date) {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const seconds = Math.floor((now - d) / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
      if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
      if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
      return d.toLocaleDateString();
    },

    // Debounce function
    debounce(fn, delay = 300) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    // Throttle function
    throttle(fn, limit = 300) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    // Capitalize first letter
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Truncate string
    truncate(str, length = 50, suffix = '...') {
      if (!str || str.length <= length) return str || '';
      return str.slice(0, length) + suffix;
    },

    // JSON stringify (safe)
    json(value, indent = 2) {
      try {
        return JSON.stringify(value, null, indent);
      } catch (e) {
        return String(value);
      }
    },

    // Pluralize
    pluralize(count, singular, plural) {
      const p = plural || singular + 's';
      return count === 1 ? singular : p;
    },

    // Clamp number
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    // Currency formatting
    currency(value, symbol = '$', decimals = 2) {
      if (value == null) return symbol + '0.00';
      return symbol + Number(value).toFixed(decimals).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
    },

    // Percentage formatting
    percent(value, decimals = 0) {
      if (value == null) return '0%';
      return (Number(value) * 100).toFixed(decimals) + '%';
    }
  };

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
  // Auto-unwrap Signals (Feature #1)
  // ==========================================================================

  // Create a proxy that auto-unwraps signals when accessed
  function createAutoUnwrapProxy(scope) {
    return new Proxy(scope, {
      get(target, prop) {
        const val = target[prop];
        // If it's a signal or derived, call it to get the value
        if (val && typeof val === 'function' && (val._isSignal || val._isDerived)) {
          return val();
        }
        return val;
      }
    });
  }

  // ==========================================================================
  // Pipe Syntax Support (Feature #2)
  // ==========================================================================

  // Parse and execute pipe expressions like "value | fmt" or "value | truncate:20"
  // Must distinguish single | (pipe) from || (logical OR) and ?? (nullish coalescing)
  function parsePipeExpression(expr, scope) {
    // Find pipe operators: single | that's not part of || or preceded by ?
    // We need to find | that is:
    // 1. Not preceded by | or ?
    // 2. Not followed by |
    // Use a manual scan to handle this correctly
    let pipeIndex = -1;
    let inString = false;
    let stringChar = '';
    let depth = 0; // Track parentheses/brackets depth

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      const prevChar = i > 0 ? expr[i - 1] : '';
      const nextChar = i < expr.length - 1 ? expr[i + 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'" || char === '\`') && prevChar !== '\\\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
        continue;
      }

      if (inString) continue;

      // Track depth for parentheses and brackets
      if (char === '(' || char === '[' || char === '{') depth++;
      if (char === ')' || char === ']' || char === '}') depth--;

      // Only look for pipes at top level (depth 0)
      if (depth !== 0) continue;

      // Check for single pipe (not || and not ??)
      if (char === '|') {
        // Skip if it's || (logical OR)
        if (nextChar === '|') {
          i++; // Skip next |
          continue;
        }
        // Skip if preceded by | (second part of ||)
        if (prevChar === '|') continue;
        // Skip if preceded by ? (part of ??)
        if (prevChar === '?') continue;

        // Found a pipe operator
        pipeIndex = i;
        break;
      }
    }

    if (pipeIndex === -1) return null;

    const valueExpr = expr.slice(0, pipeIndex).trim();
    const pipeChain = expr.slice(pipeIndex + 1).trim();

    // Parse all pipes in the chain, being careful about || and ??
    const pipes = [];
    let currentPipe = '';
    inString = false;
    stringChar = '';
    depth = 0;

    for (let i = 0; i < pipeChain.length; i++) {
      const char = pipeChain[i];
      const prevChar = i > 0 ? pipeChain[i - 1] : '';
      const nextChar = i < pipeChain.length - 1 ? pipeChain[i + 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'" || char === '\`') && prevChar !== '\\\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
        currentPipe += char;
        continue;
      }

      if (inString) {
        currentPipe += char;
        continue;
      }

      // Track depth
      if (char === '(' || char === '[' || char === '{') depth++;
      if (char === ')' || char === ']' || char === '}') depth--;

      // Check for pipe at top level
      if (depth === 0 && char === '|' && nextChar !== '|' && prevChar !== '|' && prevChar !== '?') {
        // End of current pipe, start new one
        if (currentPipe.trim()) {
          const parts = currentPipe.trim().split(':');
          pipes.push({
            name: parts[0].trim(),
            args: parts.slice(1).map(a => a.trim())
          });
        }
        currentPipe = '';
      } else {
        currentPipe += char;
      }
    }

    // Add last pipe
    if (currentPipe.trim()) {
      const parts = currentPipe.trim().split(':');
      pipes.push({
        name: parts[0].trim(),
        args: parts.slice(1).map(a => a.trim())
      });
    }

    if (pipes.length === 0) return null;

    return { valueExpr, pipes };
  }

  function executePipeExpression(valueExpr, pipes, scope) {
    // First evaluate the base expression
    let value;
    try {
      const fn = new Function(...Object.keys(scope), 'return ' + valueExpr);
      value = fn(...Object.values(scope));
    } catch (e) {
      console.warn('[STX] Pipe base expression error:', valueExpr, e);
      return '';
    }

    // Apply each pipe/filter
    for (const pipe of pipes) {
      const filterFn = scope[pipe.name] || globalHelpers[pipe.name];
      if (typeof filterFn === 'function') {
        try {
          // Parse args - they might be numbers, strings, or expressions
          const parsedArgs = pipe.args.map(arg => {
            // Try to parse as number
            if (/^-?\\d+(\\.\\d+)?$/.test(arg)) return Number(arg);
            // Try to parse as string (quoted)
            if (/^['"].*['"]$/.test(arg)) return arg.slice(1, -1);
            // Try to evaluate as expression in scope
            try {
              const fn = new Function(...Object.keys(scope), 'return ' + arg);
              return fn(...Object.values(scope));
            } catch (e) {
              return arg;
            }
          });
          value = filterFn(value, ...parsedArgs);
        } catch (e) {
          console.warn('[STX] Pipe filter error:', pipe.name, e);
        }
      } else {
        console.warn('[STX] Unknown pipe/filter:', pipe.name);
      }
    }

    return value;
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
  // Declarative Data Fetching (Feature #6 - useFetch)
  // ==========================================================================

  function useFetch(urlOrFn, options = {}) {
    const data = state(options.initialData ?? null);
    const loading = state(true);
    const error = state(null);

    const fetchData = async () => {
      loading.set(true);
      error.set(null);

      try {
        const url = typeof urlOrFn === 'function' ? urlOrFn() : urlOrFn;
        if (!url) {
          loading.set(false);
          return;
        }

        const fetchOptions = {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        };

        if (options.body) {
          fetchOptions.body = typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body);
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }

        const result = await response.json();

        // Apply transform if provided
        const transformed = options.transform ? options.transform(result) : result;
        data.set(transformed);
      } catch (e) {
        console.error('[STX] useFetch error:', e);
        error.set(e.message || 'Fetch failed');
        if (options.onError) options.onError(e);
      } finally {
        loading.set(false);
      }
    };

    // Auto-fetch on mount unless disabled
    if (options.immediate !== false) {
      onMount(fetchData);
    }

    // If urlOrFn is a function, watch for changes and refetch
    if (typeof urlOrFn === 'function') {
      effect(() => {
        const url = urlOrFn();
        if (url && options.immediate !== false) {
          fetchData();
        }
      });
    }

    return {
      data,
      loading,
      error,
      refetch: fetchData,
      // Convenience getters
      get isLoading() { return loading(); },
      get hasError() { return !!error(); },
      get isEmpty() { return !loading() && !data(); }
    };
  }

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

  function toValue(expr, el, enableAutoUnwrap = true) {
    try {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expr.trim())) {
        return expr;
      }
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      const baseScope = { ...componentScope, ...(elementScope || {}), ...globalHelpers };

      // Check for pipe syntax (Feature #2)
      const pipeResult = parsePipeExpression(expr, baseScope);
      if (pipeResult) {
        // Use auto-unwrap proxy for pipe expressions
        const unwrapScope = enableAutoUnwrap ? createAutoUnwrapProxy(baseScope) : baseScope;
        return executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope);
      }

      // Use auto-unwrap proxy if enabled (Feature #1)
      const scope = enableAutoUnwrap ? createAutoUnwrapProxy(baseScope) : baseScope;
      const fn = new Function(...Object.keys(baseScope), 'return ' + expr);
      return fn(...Object.values(scope));
    } catch (e) {
      console.warn('[STX] Expression error:', expr, e);
      return '';
    }
  }

  // ==========================================================================
  // Event Handler Shorthand (Feature #8)
  // ==========================================================================

  function parseEventShorthand(expr, scope) {
    const trimmed = expr.trim();

    // Handle !variable toggle: "!visible" -> toggle the signal
    if (/^!\\w+$/.test(trimmed)) {
      const varName = trimmed.slice(1);
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return () => signal.set(!signal());
      }
      return null;
    }

    // Handle variable++ increment: "count++" -> increment the signal
    if (/^\\w+\\+\\+$/.test(trimmed)) {
      const varName = trimmed.slice(0, -2);
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return () => signal.update(n => n + 1);
      }
      return null;
    }

    // Handle variable-- decrement: "count--" -> decrement the signal
    if (/^\\w+--$/.test(trimmed)) {
      const varName = trimmed.slice(0, -2);
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return () => signal.update(n => n - 1);
      }
      return null;
    }

    // Handle += and -= operators: "count += 5"
    const assignMatch = trimmed.match(/^(\\w+)\\s*([+\\-*\\/])=\\s*(.+)$/);
    if (assignMatch) {
      const [, varName, op, valueExpr] = assignMatch;
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return () => {
          const addValue = toValue(valueExpr, null, true);
          signal.update(n => {
            switch (op) {
              case '+': return n + addValue;
              case '-': return n - addValue;
              case '*': return n * addValue;
              case '/': return n / addValue;
              default: return n;
            }
          });
        };
      }
      return null;
    }

    // Handle simple assignment: "count = 5" or "visible = false"
    const simpleAssignMatch = trimmed.match(/^(\\w+)\\s*=\\s*(.+)$/);
    if (simpleAssignMatch && !trimmed.includes('==') && !trimmed.includes('=>')) {
      const [, varName, valueExpr] = simpleAssignMatch;
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return () => {
          const newValue = toValue(valueExpr, null, true);
          signal.set(newValue);
        };
      }
      return null;
    }

    return null;
  }

  function executeHandler(expr, event, el) {
    try {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expr.trim())) {
        return;
      }
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      const scope = { ...componentScope, ...(elementScope || {}), ...globalHelpers };

      // Check for shorthand syntax (Feature #8)
      const shorthandFn = parseEventShorthand(expr, scope);
      if (shorthandFn) {
        shorthandFn();
        return;
      }

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
          const parentEl = el.parentNode;
          // Capture scope NOW before effects run asynchronously
          // Use the passed scope parameter (not global componentScope) to preserve context
          // through nested @if/@for processing where componentScope may be restored
          const capturedScope = { ...scope, ...(findElementScope(parentEl) || {}), ...globalHelpers };
          parts.forEach(part => {
            const match = part.match(/^\\{\\{\\s*(.+?)\\s*\\}\\}$/);
            if (match) {
              const expr = match[1];
              // Skip placeholder expressions like __TITLE__ (build-time placeholders)
              if (/^__[A-Z_]+__$/.test(expr.trim())) {
                fragment.appendChild(document.createTextNode(part));
                return;
              }
              const span = document.createElement('span');
              fragment.appendChild(span);
              // Use captured scope, not dynamic lookup
              effect(() => {
                try {
                  // Check for pipe syntax (Feature #2)
                  const pipeResult = parsePipeExpression(expr, capturedScope);
                  if (pipeResult) {
                    const unwrapScope = createAutoUnwrapProxy(capturedScope);
                    span.textContent = executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope);
                  } else {
                    // Use auto-unwrap proxy (Feature #1)
                    const unwrapScope = createAutoUnwrapProxy(capturedScope);
                    const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
                    span.textContent = fn(...Object.values(unwrapScope));
                  }
                } catch (e) {
                  console.warn('[STX] Expression error:', expr, e);
                  span.textContent = '';
                }
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
      bindFor(el, scope);
      return;
    }

    // Handle @if (conditional rendering)
    if (el.hasAttribute('@if')) {
      bindIf(el, scope);
      return;
    }

    // Handle @show (visibility toggle - keeps element in DOM)
    if (el.hasAttribute('@show')) {
      bindShow(el, el.getAttribute('@show'), scope);
    }

    // Handle @model (two-way binding)
    if (el.hasAttribute('@model')) {
      bindModel(el, el.getAttribute('@model'), scope);
    }

    // Capture scope once for all attribute bindings on this element
    // Use the passed scope parameter to preserve context through nested processing
    const attrCapturedScope = { ...scope, ...(findElementScope(el) || {}), ...globalHelpers };

    const evalAttrExpr = (expr) => {
      try {
        if (/^__[A-Z_]+__$/.test(expr.trim())) return expr;

        // Check for pipe syntax (Feature #2)
        const pipeResult = parsePipeExpression(expr, attrCapturedScope);
        if (pipeResult) {
          const unwrapScope = createAutoUnwrapProxy(attrCapturedScope);
          return executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope);
        }

        // Use auto-unwrap proxy (Feature #1)
        const unwrapScope = createAutoUnwrapProxy(attrCapturedScope);
        const fn = new Function(...Object.keys(attrCapturedScope), 'return ' + expr);
        return fn(...Object.values(unwrapScope));
      } catch (e) {
        console.warn('[STX] Attribute expression error:', expr, e);
        return '';
      }
    };

    // Handle attributes
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name;
      const value = attr.value;

      // @bind:attr OR :attr shorthand (Feature #4) for dynamic attribute binding
      if (name.startsWith('@bind:') || (name.startsWith(':') && !name.startsWith('::'))) {
        const attrName = name.startsWith('@bind:') ? name.slice(6) : name.slice(1);
        effect(() => {
          const v = evalAttrExpr(value);
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
        bindClass(el, value, scope);
        el.removeAttribute(name);
      } else if (name === '@style') {
        bindStyle(el, value, scope);
        el.removeAttribute(name);
      } else if (name === '@text') {
        effect(() => {
          el.textContent = evalAttrExpr(value);
        });
        el.removeAttribute(name);
      } else if (name === '@html') {
        effect(() => {
          el.innerHTML = evalAttrExpr(value);
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

  function bindShow(el, expr, passedScope = componentScope) {
    const originalDisplay = el.style.display || '';
    // Capture scope at setup time - use passed scope to preserve context
    const capturedScope = { ...passedScope, ...(findElementScope(el) || {}) };

    const evalExpr = () => {
      try {
        const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
        return fn(...Object.values(capturedScope));
      } catch (e) {
        console.warn('[STX] Show expression error:', expr, e);
        return false;
      }
    };

    effect(() => {
      el.style.display = evalExpr() ? originalDisplay : 'none';
    });
    el.removeAttribute('@show');
  }

  function bindModel(el, expr, passedScope = componentScope) {
    const tag = el.tagName.toLowerCase();
    const type = el.type;

    const getValue = () => toValue(expr, el);
    const setValue = (val) => {
      try {
        // Check component scope first, then element scope - use passed scope
        const elementScope = findElementScope(el);
        const scope = { ...passedScope, ...(elementScope || {}) };

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

  function bindClass(el, expr, passedScope = componentScope) {
    const originalClasses = el.className;
    // Capture scope at setup time - use passed scope to preserve context
    const capturedScope = { ...passedScope, ...(findElementScope(el) || {}) };

    const evalExpr = () => {
      try {
        const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
        return fn(...Object.values(capturedScope));
      } catch (e) {
        console.warn('[STX] Class expression error:', expr, e);
        return '';
      }
    };

    effect(() => {
      const value = evalExpr();
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
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

  function bindStyle(el, expr, passedScope = componentScope) {
    // Capture scope at setup time - use passed scope to preserve context
    const capturedScope = { ...passedScope, ...(findElementScope(el) || {}) };

    const evalExpr = () => {
      try {
        const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
        return fn(...Object.values(capturedScope));
      } catch (e) {
        console.warn('[STX] Style expression error:', expr, e);
        return {};
      }
    };

    effect(() => {
      const value = evalExpr();
      if (typeof value === 'object' && value !== null) {
        Object.assign(el.style, value);
      } else if (typeof value === 'string') {
        el.style.cssText = value;
      }
    });
  }

  function bindFor(el, passedScope = componentScope) {
    const expr = el.getAttribute('@for');
    const match = expr.match(/^\\s*(\\w+)(?:\\s*,\\s*(\\w+))?\\s+(?:in|of)\\s+(.+)\\s*$/);

    if (!match) {
      console.warn('[STX] Invalid @for:', expr);
      return;
    }

    const [, itemName, indexName, listExpr] = match;
    const parent = el.parentNode;

    // Guard: if element has no parent, it's detached - skip processing
    if (!parent) {
      console.warn('[STX] bindFor: element has no parent, skipping');
      return;
    }

    const placeholder = document.createComment('stx-for');
    const isTemplate = el.tagName === 'TEMPLATE';

    // Check if element also has @if - need to handle together
    const ifExpr = el.getAttribute('@if');

    // Feature #3: Check for @loading and @empty siblings/content
    const loadingExpr = el.getAttribute('@loading');
    const emptyExpr = el.getAttribute('@empty');

    // Look for sibling elements with @for-loading or @for-empty
    let loadingTemplate = null;
    let emptyTemplate = null;

    // Check next siblings for @for-loading and @for-empty
    let sibling = el.nextElementSibling;
    while (sibling) {
      if (sibling.hasAttribute('@for-loading')) {
        loadingTemplate = sibling.cloneNode(true);
        loadingTemplate.removeAttribute('@for-loading');
        sibling.remove();
        sibling = el.nextElementSibling;
        continue;
      }
      if (sibling.hasAttribute('@for-empty')) {
        emptyTemplate = sibling.cloneNode(true);
        emptyTemplate.removeAttribute('@for-empty');
        sibling.remove();
        sibling = el.nextElementSibling;
        continue;
      }
      break;
    }

    // Capture the scope NOW before element is removed from DOM
    const capturedScope = findElementScope(el) || findElementScope(parent);

    parent.insertBefore(placeholder, el);
    parent.removeChild(el);

    // For <template> elements, use the content; otherwise clone the element
    let templateContent;
    if (isTemplate) {
      templateContent = el.content;
    } else {
      const wrapper = el.cloneNode(true);
      wrapper.removeAttribute('@for');
      wrapper.removeAttribute('@loading');
      wrapper.removeAttribute('@empty');
      // Also remove @if - we'll handle it inline
      if (ifExpr) wrapper.removeAttribute('@if');
      templateContent = wrapper;
    }

    let currentElements = [];
    let loadingElement = null;
    let emptyElement = null;

    // Helper to evaluate with captured scope
    const evalExpr = (expression, extraScope = {}) => {
      try {
        // Skip placeholder expressions like __TITLE__ (build-time placeholders)
        if (/^__[A-Z_]+__$/.test(expression.trim())) {
          return expression;
        }
        // Use passedScope instead of componentScope to preserve context through nested processing
        const scope = { ...passedScope, ...(capturedScope || {}), ...globalHelpers, ...extraScope };
        const fn = new Function(...Object.keys(scope), 'return ' + expression);
        return fn(...Object.values(scope));
      } catch (e) {
        console.warn('[STX] Expression error:', expression, e);
        return '';
      }
    };

    // Helper to show loading state
    const showLoading = () => {
      hideLoading();
      hideEmpty();
      if (loadingTemplate) {
        loadingElement = loadingTemplate.cloneNode(true);
        parent.insertBefore(loadingElement, placeholder);
      }
    };

    // Helper to hide loading state
    const hideLoading = () => {
      if (loadingElement) {
        loadingElement.remove();
        loadingElement = null;
      }
    };

    // Helper to show empty state
    const showEmpty = () => {
      hideLoading();
      hideEmpty();
      if (emptyTemplate) {
        emptyElement = emptyTemplate.cloneNode(true);
        parent.insertBefore(emptyElement, placeholder);
        processElement(emptyElement);
      }
    };

    // Helper to hide empty state
    const hideEmpty = () => {
      if (emptyElement) {
        emptyElement.remove();
        emptyElement = null;
      }
    };

    effect(() => {
      currentElements.forEach(e => e.remove());
      currentElements = [];
      hideLoading();
      hideEmpty();

      // Check loading state if @loading attribute provided (Feature #3)
      if (loadingExpr) {
        const isLoading = evalExpr(loadingExpr);
        if (isLoading) {
          showLoading();
          return;
        }
      }

      // Always evaluate list first to track it as a dependency
      const list = evalExpr(listExpr);

      // If there's an @if condition, check it (after reading list to ensure dependency tracking)
      if (ifExpr) {
        const ifValue = evalExpr(ifExpr);
        if (!ifValue) {
          // Condition is false, don't render any items
          return;
        }
      }

      if (!Array.isArray(list)) return;

      // Check empty state (Feature #3)
      if (list.length === 0) {
        if (emptyExpr) {
          // If @empty has an expression, evaluate it
          const emptyContent = evalExpr(emptyExpr);
          if (emptyContent && typeof emptyContent === 'string') {
            const textNode = document.createTextNode(emptyContent);
            parent.insertBefore(textNode, placeholder);
            currentElements.push(textNode);
          }
        } else if (emptyTemplate) {
          showEmpty();
        }
        return;
      }

      list.forEach((item, index) => {
        // Build item scope using passedScope instead of componentScope
        const itemScope = { ...passedScope, ...(capturedScope || {}), ...globalHelpers };
        itemScope[itemName] = item;
        if (indexName) itemScope[indexName] = index;

        // Pass scope explicitly to processElement instead of modifying global componentScope
        if (isTemplate) {
          // For templates, clone and insert each child node
          Array.from(templateContent.childNodes).forEach(node => {
            const clone = node.cloneNode(true);
            parent.insertBefore(clone, placeholder);
            if (clone.nodeType === 1) processElement(clone, itemScope);
            currentElements.push(clone);
          });
        } else {
          const clone = templateContent.cloneNode(true);
          parent.insertBefore(clone, placeholder);
          processElement(clone, itemScope);
          currentElements.push(clone);
        }
      });
    });
  }

  function bindIf(el, passedScope = componentScope) {
    const expr = el.getAttribute('@if');
    const parent = el.parentNode;

    // Guard: if element has no parent, it's detached - skip processing
    if (!parent) {
      console.warn('[STX] bindIf: element has no parent, skipping');
      return;
    }

    const placeholder = document.createComment('stx-if');
    let isInserted = true;
    let currentNodes = [];

    // Handle <template> elements specially - clone their content
    const isTemplate = el.tagName === 'TEMPLATE';

    // Capture BOTH element scope AND passedScope NOW before anything changes
    // passedScope may contain @for iteration variables or parent component signals
    const capturedElementScope = findElementScope(el);
    const capturedComponentScope = { ...passedScope };

    parent.insertBefore(placeholder, el);
    el.removeAttribute('@if');

    if (isTemplate) {
      // For templates, we need to handle the content fragment
      const content = el.content;
      currentNodes = Array.from(content.childNodes).map(n => n.cloneNode(true));
      // Insert cloned content initially
      currentNodes.forEach(node => parent.insertBefore(node, placeholder.nextSibling));
      el.remove(); // Remove the template element itself
    }

    // Helper to evaluate with captured scope
    const evalExpr = (expression) => {
      try {
        // Skip placeholder expressions like __TITLE__ (build-time placeholders)
        if (/^__[A-Z_]+__$/.test(expression.trim())) {
          return expression;
        }
        // Use captured componentScope (with @for vars) merged with element scope
        const scope = { ...capturedComponentScope, ...(capturedElementScope || {}) };
        const fn = new Function(...Object.keys(scope), 'return ' + expression);
        return fn(...Object.values(scope));
      } catch (e) {
        console.warn('[STX] Expression error:', expression, e);
        return '';
      }
    };

    // Track if children have been processed
    let childrenProcessed = false;

    // Helper to process children with captured scope
    const processChildrenWithScope = () => {
      // Build the combined scope for children - no need to modify global componentScope
      // Just pass the scope explicitly to processElement
      const childScope = { ...capturedComponentScope, ...(capturedElementScope || {}) };

      Array.from(el.childNodes).forEach(child => processElement(child, childScope));

      childrenProcessed = true;
    };

    effect(() => {
      const value = evalExpr(expr);

      if (isTemplate) {
        if (value && !isInserted) {
          // Re-insert cloned content
          currentNodes = Array.from(el.content.childNodes).map(n => n.cloneNode(true));
          currentNodes.forEach(node => parent.insertBefore(node, placeholder.nextSibling));
          // Process the new nodes for nested directives with captured scope - pass scope explicitly
          const childScope = { ...capturedComponentScope, ...(capturedElementScope || {}) };
          currentNodes.forEach(node => {
            if (node.nodeType === 1) processElement(node, childScope);
          });
          isInserted = true;
        } else if (!value && isInserted) {
          // Remove all current nodes
          currentNodes.forEach(node => node.remove());
          currentNodes = [];
          isInserted = false;
        }
      } else {
        if (value && !isInserted) {
          parent.insertBefore(el, placeholder.nextSibling);
          // Process children if not already done
          if (!childrenProcessed) {
            processChildrenWithScope();
          }
          isInserted = true;
        } else if (!value && isInserted) {
          el.remove();
          isInserted = false;
        }
        // Also process children on initial render if element is visible
        if (value && isInserted && !childrenProcessed) {
          processChildrenWithScope();
        }
      }
    });
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  // ==========================================================================
  // $: Computed Shorthand Support (Feature #7)
  // ==========================================================================

  // Helper function for $: reactive declarations (transformed by compiler)
  // Usage: $computed(() => count * 2) is shorthand for derived()
  function $computed(fn) {
    return derived(fn);
  }

  // Helper for watching a value with auto-unwrap
  function $watch(deps, fn) {
    effect(() => {
      // Access all dependencies to track them
      const values = Array.isArray(deps) ? deps.map(d => {
        if (typeof d === 'function' && (d._isSignal || d._isDerived)) return d();
        return d;
      }) : (typeof deps === 'function' && (deps._isSignal || deps._isDerived)) ? [deps()] : [deps];

      fn(...values);
    });
  }

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
    useFetch,
    $computed,
    $watch,
    helpers: globalHelpers,
    _mountCallbacks: mountCallbacks,
    _destroyCallbacks: destroyCallbacks,
    _scopes: {}  // Component-level scopes
  };

  // Also expose globally for convenience
  window.state = state;
  window.derived = derived;
  window.effect = effect;
  window.batch = batch;
  window.onMount = onMount;
  window.onDestroy = onDestroy;
  window.useFetch = useFetch;
  window.$computed = $computed;
  window.$watch = $watch;

  // ==========================================================================
  // Auto-initialization
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    // Track which scoped elements have been processed
    const processedScopes = new Set();

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

    // Process scoped components FIRST (their scripts have already registered scope variables)
    document.querySelectorAll('[data-stx-scope]').forEach(el => {
      const scopeId = el.getAttribute('data-stx-scope');
      processedScopes.add(el);
      const scopeVars = window.stx._scopes && window.stx._scopes[scopeId];

      // Merge component scope vars into componentScope (don't restore - keep for head elements)
      // This ensures expressions can access component variables even for elements
      // where findElementScope might not work (e.g., cloned elements not yet in DOM)
      if (scopeVars) {
        componentScope = { ...componentScope, ...scopeVars };
      }

      processElement(el);

      // Run scope-specific mount callbacks
      if (scopeVars && scopeVars.__mountCallbacks) {
        scopeVars.__mountCallbacks.forEach(fn => fn());
      }
    });

    // Auto-process elements with data-stx-auto (skip already processed scoped elements)
    document.querySelectorAll('[data-stx-auto]').forEach(el => {
      // Process element but skip children that are in scoped containers
      processElementSkipScopes(el, processedScopes);
    });

    // Process <head> elements (title, meta) that may contain {{ }} expressions
    // Use componentScope which now contains variables from processed components
    const headElements = document.querySelectorAll('head title, head meta[content]');
    headElements.forEach(el => {
      if (el.tagName === 'TITLE') {
        const text = el.textContent;
        if (text && text.includes('{{')) {
          effect(() => {
            try {
              let result = text;
              const matches = text.match(/\{\{\s*(.+?)\s*\}\}/g);
              if (matches) {
                matches.forEach(match => {
                  const expr = match.replace(/^\{\{\s*|\s*\}\}$/g, '');
                  const fn = new Function(...Object.keys(componentScope), 'return ' + expr);
                  const value = fn(...Object.values(componentScope));
                  result = result.replace(match, value != null ? value : '');
                });
              }
              el.textContent = result;
            } catch (e) {
              console.warn('[STX] Title expression error:', e);
            }
          });
        }
      } else if (el.tagName === 'META') {
        const content = el.getAttribute('content');
        if (content && content.includes('{{')) {
          effect(() => {
            try {
              let result = content;
              const matches = content.match(/\{\{\s*(.+?)\s*\}\}/g);
              if (matches) {
                matches.forEach(match => {
                  const expr = match.replace(/^\{\{\s*|\s*\}\}$/g, '');
                  const fn = new Function(...Object.keys(componentScope), 'return ' + expr);
                  const value = fn(...Object.values(componentScope));
                  result = result.replace(match, value != null ? value : '');
                });
              }
              el.setAttribute('content', result);
            } catch (e) {
              console.warn('[STX] Meta expression error:', e);
            }
          });
        }
      }
    });
  });

  // Helper to process elements while skipping already-processed scoped containers
  function processElementSkipScopes(el, processedScopes) {
    if (processedScopes.has(el)) return;
    if (el.nodeType === Node.TEXT_NODE) {
      processElement(el);
      return;
    }
    if (el.nodeType !== Node.ELEMENT_NODE) return;
    // Skip scoped elements - they were already processed
    if (el.hasAttribute && el.hasAttribute('data-stx-scope')) return;
    // Process this element's directives without recursing into children
    // (we'll handle children manually to skip scoped ones)
    const hasFor = el.hasAttribute && el.hasAttribute('@for');
    const hasIf = el.hasAttribute && el.hasAttribute('@if');
    if (hasFor) { bindFor(el); return; }
    if (hasIf) { bindIf(el); return; }
    // Process other attributes...
    if (el.hasAttribute && el.hasAttribute('@show')) bindShow(el, el.getAttribute('@show'));
    if (el.hasAttribute && el.hasAttribute('@model')) bindModel(el, el.getAttribute('@model'));
    // Process children, skipping scoped containers
    Array.from(el.childNodes).forEach(child => processElementSkipScopes(child, processedScopes));
  }
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
