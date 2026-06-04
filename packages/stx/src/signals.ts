/**
 * STX Signals - Reactive State Management
 * =========================================
 *
 * This module re-exports the build-time signals API from signals-api.ts
 * and provides the client runtime string generators.
 *
 * @module signals
 */

import { state, derived, effect, batch, onMount, onDestroy, isSignal, isDerived, untrack, peek } from './signals-api'

export * from './signals-api'

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
  // Use Bun.Transpiler for minification, then fix ASI edge cases.
  // Bun.Transpiler strips newlines but doesn't always insert semicolons at
  // statement boundaries like `}var` or `}let`. While Bun's parser handles
  // these, browsers in strict mode may reject them.
  try {
    // Strip `console.log(...)` calls before minification. They're useful in dev
    // (and the dev build keeps them via generateSignalsRuntimeDev), but in prod
    // they're noise — every nav fires ~15 log lines and they show up in
    // consumer DevTools. `console.warn` / `console.error` are preserved so
    // real problems still surface. See stacksjs/stx#1668 bug 8.
    const stripped = stripConsoleLog(generateSignalsRuntimeDev())
    const transpiler = new Bun.Transpiler({ loader: 'js', minifyWhitespace: true })
    let minified = transpiler.transformSync(stripped)
    // Insert semicolons at `}keyword` boundaries where ASI would have applied
    // with a newline but doesn't on a single line
    minified = minified.replace(/\}(var |let |const |function )/g, '};$1')
    return minified
  }
  catch {
    // Fallback: return dev runtime unminified (larger but correct)
    return generateSignalsRuntimeDev()
  }
}

/**
 * Strips every `console.log(...)` call site from the source, replacing each
 * with `0` (a valid no-op expression statement). Preserves `console.warn` and
 * `console.error` — those signal real problems and should still reach the
 * consumer's DevTools. String contents are respected so a literal `(` or `)`
 * inside a logged message doesn't confuse the paren matcher.
 */
function stripConsoleLog(src: string): string {
  const out: string[] = []
  let i = 0
  const needle = 'console.log('
  while (i < src.length) {
    const hit = src.indexOf(needle, i)
    if (hit === -1) {
      out.push(src.slice(i))
      break
    }
    out.push(src.slice(i, hit))
    // Walk past the call, respecting nested parens and string literals.
    let depth = 1
    let j = hit + needle.length
    while (j < src.length && depth > 0) {
      const c = src[j]
      if (c === '"' || c === '\'' || c === '`') {
        const quote = c
        j++
        while (j < src.length && src[j] !== quote) {
          if (src[j] === '\\')
            j++ // skip escaped char
          j++
        }
        j++ // skip closing quote
        continue
      }
      if (c === '(') depth++
      else if (c === ')') depth--
      j++
    }
    out.push('0')
    i = j
  }
  return out.join('')
}

/**
 * Generates readable (non-minified) runtime for development.
 *
 * @returns Human-readable JavaScript runtime code
 */
export function generateSignalsRuntimeDev(): string {
  return `
// STX Signals Runtime (Development Build)
console.log('[stx] signals runtime loading');
// Pre-initialization shim: capture onMount/onDestroy calls made before the runtime IIFE runs
// (e.g. from partial scripts that execute before the full runtime is ready)
if(!window.__stx_early_mounts)window.__stx_early_mounts=[];
if(!window.__stx_early_destroys)window.__stx_early_destroys=[];
if(!window.onMount)window.onMount=function(fn){window.__stx_early_mounts.push(fn)};
if(!window.onDestroy)window.onDestroy=function(fn){window.__stx_early_destroys.push(fn)};
console.log('[stx] entering IIFE');
(function() {
  'use strict';

  // Inject x-cloak CSS to prevent FOUC (Flash of Unstyled Content)
  // Elements with x-cloak are hidden until the runtime removes the attribute after mount
  var cloakStyle = document.createElement('style');
  cloakStyle.textContent = '[x-cloak] { display: none !important; }';
  document.head.appendChild(cloakStyle);

  // ==========================================================================
  // Reactive Core
  // ==========================================================================

  let activeEffect = null;
  const effectStack = [];
  const pendingEffects = new Set();
  let isBatching = false;
  let activeDisposers = null; // Array | null — when non-null, effects auto-register their dispose fn
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
      }
catch (e) {
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
      }
else {
        deps.forEach(effect => effect());
      }
    }
  }

  // ==========================================================================
  // Auto-unwrap Signals (Feature #1)
  // ==========================================================================

  // Create a proxy that auto-unwraps signals when accessed.
  // For stx stores (objects with _isStxStore), recursively wrap so nested
  // signal properties auto-unwrap too — this is what makes template
  // expressions like store.someSignal (no parens) and store.x === 'y'
  // resolve to the value. Action methods on the store pass through as
  // functions because they don't carry _isSignal/_isDerived markers.
  function createAutoUnwrapProxy(scope) {
    return new Proxy(scope, {
      get(target, prop) {
        const val = target[prop];
        // If it's a signal or derived, call it to get the value
        if (val && typeof val === 'function' && (val._isSignal || val._isDerived)) {
          return val();
        }
        // If it's an stx store, return a recursively-unwrapping wrapper so
        // store.signalProp resolves to the value in template expressions
        if (val && typeof val === 'object' && val._isStxStore) {
          return createAutoUnwrapProxy(val);
        }
        return val;
      },
      set(target, prop, value) {
        const cur = target[prop];
        if (cur && typeof cur === 'function' && cur._isSignal && typeof cur.set === 'function') {
          cur.set(value);
          return true;
        }
        target[prop] = value;
        return true;
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
        }
else if (char === stringChar) {
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
        }
else if (char === stringChar) {
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
      }
else {
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
    }
catch (e) {
      if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Pipe base expression error:', valueExpr, e);
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
            }
catch (e) {
              return arg;
            }
          });
          value = filterFn(value, ...parsedArgs);
        }
catch (e) {
          if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Pipe filter error:', pipe.name, e);
        }
      }
else {
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
      if (activeEffect) {
        effects.add(activeEffect);
      }
      return value;
    };

    signal.set = (newValue) => {
      console.log('[stx] signal.set:', value, '->', newValue, 'effects:', effects.size);
      if (!Object.is(newValue, value)) {
        const prev = value;
        value = newValue;
        subscribers.forEach(cb => cb(value, prev));
        if (isBatching) {
          effects.forEach(effect => pendingEffects.add(effect));
        }
else {
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

    // Vue-compatible .value getter/setter for templates that use signal.value syntax
    Object.defineProperty(signal, 'value', {
      get() { return signal(); },
      set(v) { signal.set(v); },
      configurable: true
    });

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
        }
else {
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
        }
finally {
          effectStack.pop();
          activeEffect = prev;
        }
        isDirty = false;
      }
      return cached;
    };

    signal._isDerived = true;

    // Vue-compatible .value getter for templates that use computed.value syntax
    Object.defineProperty(signal, 'value', {
      get() { return signal(); },
      configurable: true
    });

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
      }
      catch (e) {
        // Auto-dispose effects that fail — prevents zombie subscriptions
        // from body-level processElement walking into mount-scoped content.
        isDisposed = true;
        // Only log if this is likely a real error, not a stale SPA effect.
        // Stale effects reference variables from a previous page's scope that no longer exist.
        if (e instanceof ReferenceError) {
          // Silently dispose — this is expected during SPA navigation when
          // old effects fire against the new page's scope. Don't re-throw.
        } else {
          throw e;
        }
      }
      finally {
        effectStack.pop();
        activeEffect = prev;
      }
    };

    if (options.immediate !== false) runEffect();
    const dispose = () => {
      isDisposed = true;
      if (cleanup) cleanup();
    };
    // Auto-register with active tracker
    if (activeDisposers) activeDisposers.push(dispose);
    return dispose;
  }

  // ==========================================================================
  // Effect Tracking
  // ==========================================================================

  function trackEffects(fn) {
    var parentDisposers = activeDisposers;
    var disposers = [];
    activeDisposers = disposers;
    try {
      fn();
    }
finally {
      activeDisposers = parentDisposers;
      if (parentDisposers) {
        disposers.forEach(function(d) { parentDisposers.push(d); });
      }
    }
    return function disposeAll() {
      disposers.forEach(function(d) { try { d(); }
catch (e) { console.warn('[stx] dispose error:', e); } });
      disposers.length = 0;
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
    }
finally {
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

  // Drain any early mount/destroy calls captured by the pre-initialization shim
  if (window.__stx_early_mounts) { window.__stx_early_mounts.forEach(function(fn) { mountCallbacks.push(fn); }); window.__stx_early_mounts = null; }
  if (window.__stx_early_destroys) { window.__stx_early_destroys.forEach(function(fn) { destroyCallbacks.push(fn); }); window.__stx_early_destroys = null; }

  // ==========================================================================
  // WebSocket Composable
  // ==========================================================================

  function useWebSocket(url, options) {
    options = options || {};
    var ws = state(null);
    var status = state('CLOSED');
    var lastMessage = state(null);
    var error = state(null);

    var reconnectAttempts = 0;
    var maxReconnects = options.reconnect === false ? 0 : (options.maxReconnects || 10);
    var reconnectDelay = options.reconnectDelay || 1000;
    var reconnectTimer = null;
    var manualClose = false;
    var listeners = {};

    function connect() {
      if (ws() && ws().readyState <= 1) return;
      manualClose = false;
      status.set('CONNECTING');
      error.set(null);

      var socket = new WebSocket(url);

      socket.onopen = function() {
        status.set('OPEN');
        reconnectAttempts = 0;
        if (options.onOpen) options.onOpen(socket);
      };

      socket.onmessage = function(event) {
        var data = event.data;
        try { data = JSON.parse(data); } catch(e) {}
        lastMessage.set(data);
        if (options.onMessage) options.onMessage(data, event);
        // Dispatch to channel listeners
        if (data && data.channel && data.event) {
          var key = data.channel + ':' + data.event;
          var fns = listeners[key];
          if (fns) {
            for (var i = 0; i < fns.length; i++) {
              fns[i](data.data);
            }
          }
        }
      };

      socket.onerror = function(event) {
        error.set(event);
        if (options.onError) options.onError(event);
      };

      socket.onclose = function(event) {
        status.set('CLOSED');
        ws.set(null);
        if (options.onClose) options.onClose(event);
        if (!manualClose && reconnectAttempts < maxReconnects) {
          reconnectAttempts++;
          var delay = reconnectDelay * Math.min(reconnectAttempts, 5);
          reconnectTimer = setTimeout(connect, delay);
        }
      };

      ws.set(socket);
    }

    function send(data) {
      var socket = ws();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(typeof data === 'string' ? data : JSON.stringify(data));
      }
    }

    function close() {
      manualClose = true;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      var socket = ws();
      if (socket) socket.close();
    }

    function subscribe(channel) {
      send({ type: 'subscribe', channel: channel });
      return {
        listen: function(event, handler) {
          var key = channel + ':' + event;
          if (!listeners[key]) listeners[key] = [];
          listeners[key].push(handler);
          return this;
        },
        leave: function() {
          send({ type: 'unsubscribe', channel: channel });
          // Remove all listeners for this channel
          var prefix = channel + ':';
          for (var key in listeners) {
            if (key.indexOf(prefix) === 0) {
              delete listeners[key];
            }
          }
        }
      };
    }

    if (options.immediate !== false) {
      connect();
    }

    onDestroy(function() {
      close();
      listeners = {};
    });

    return {
      ws: ws,
      status: status,
      lastMessage: lastMessage,
      error: error,
      send: send,
      close: close,
      connect: connect,
      subscribe: subscribe
    };
  }

  // ==========================================================================
  // Declarative Data Fetching (Feature #6 - useFetch)
  // ==========================================================================

  function useFetch(urlOrFn, options = {}) {
    const data = state(options.initialData ?? null);
    const loading = state(true);
    const error = state(null);
    if (options.suspense) registerSuspense(loading, error);

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
      }
catch (e) {
        console.error('[STX] useFetch error:', e);
        // Store Error objects (not just messages) so consumers can use
        // .message, .stack, instanceof Error. Matches the composable's
        // shape; pinned by use-fetch-parity.test.ts (#1726).
        error.set(e instanceof Error ? e : new Error(String(e)));
        if (options.onError) options.onError(e);
      }
finally {
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
  // Template Refs (useRef)
  // ==========================================================================

  function useRef(name) {
    return {
      get current() {
        return componentScope.$refs ? componentScope.$refs[name] : null;
      },
      get value() {
        return this.current;
      }
    };
  }

  // ==========================================================================
  // Navigation API
  // ==========================================================================

  function navigate(url, forceReload) {
    if (forceReload) {
      window.location.href = url;
      return;
    }
    if (window.stxRouter && typeof window.stxRouter.navigate === 'function') {
      window.stxRouter.navigate(url);
    }
else {
      window.location.href = url;
    }
  }

  function goBack() { window.history.back(); }
  function goForward() { window.history.forward(); }

  // Route params — set by server injection or parsed from URL on client navigation
  var _routeParams = state({});

  // setRouteParams: called by the server-injected script to set initial params
  function setRouteParams(params) {
    _routeParams.set(params || {});
  }

  // Listen for SPA navigation to update params
  window.addEventListener('stx:navigate', function(e) {
    // Parse params from URL if route patterns are registered
    // For now, reset params — the server will inject them on full loads
    // and the page's script can set them via setRouteParams() on SPA nav
    if (e.detail && e.detail.params) {
      _routeParams.set(e.detail.params);
    }
  });

  // Apply any server-injected params (set before runtime loaded)
  if ((window.stx && window.stx._rp) || window.__stx_rp) {
    _routeParams.set(window.stx?._rp || window.__stx_rp);
  }

  function useRoute() {
    return {
      get path() { return window.location.pathname; },
      get fullPath() { return window.location.pathname + window.location.search + window.location.hash; },
      get hash() { return window.location.hash; },
      get query() {
        var params = {};
        new URLSearchParams(window.location.search).forEach(function(v, k) { params[k] = v; });
        return params;
      },
      get params() { return _routeParams(); }
    };
  }

  function useSearchParams() {
    var params = state(Object.fromEntries(new URLSearchParams(window.location.search)));
    var syncFromUrl = function() {
      params.set(Object.fromEntries(new URLSearchParams(window.location.search)));
    };
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('stx:navigate', syncFromUrl);
    return {
      data: params,
      get: function(key) { return params()[key]; },
      set: function(key, value) {
        var url = new URL(window.location.href);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
        syncFromUrl();
      },
      setAll: function(obj) {
        var url = new URL(window.location.href);
        Object.keys(obj).forEach(function(k) { url.searchParams.set(k, obj[k]); });
        window.history.pushState({}, '', url);
        syncFromUrl();
      }
    };
  }

  // ==========================================================================
  // Advanced Data Fetching (useQuery / useMutation)
  // ==========================================================================

  var _queryCache = {};

  // Suspense registry (#1742). A query created with { suspense: true } pushes
  // { el, loading, error } here at creation time (which runs during partial-scope
  // script execution, BEFORE the <Suspense> boundary inits on content-load).
  // Each boundary then CLAIMS the descendant entries for which it is the nearest
  // [data-stx-suspense] ancestor, and aggregates their loading/error signals.
  // Kept on the window (one registry per page) rather than a per-instance
  // closure so a boundary and the queries it claims agree even if the page
  // somehow has more than one runtime instance (e.g. across test files).
  function suspenseRegistry() {
    if (typeof window === 'undefined') return [];
    return window.__stx_suspense_registry || (window.__stx_suspense_registry = []);
  }
  function registerSuspense(loading, error) {
    var el = (typeof window !== 'undefined' && window.__STX_CURRENT_ELEMENT__) || null;
    suspenseRegistry().push({ el: el, loading: loading, error: error });
  }

  function useQuery(url, options) {
    options = options || {};
    var staleTime = options.staleTime || 0;
    var cacheTime = options.cacheTime || 300000; // 5 min default
    var cacheKey = options.cacheKey || (typeof url === 'function' ? null : url);
    var data = state(options.initialData || null);
    var loading = state(true);
    var error = state(null);
    var isStale = state(false);
    if (options.suspense) registerSuspense(loading, error);

    var fetchData = async function() {
      var resolvedUrl = typeof url === 'function' ? url() : url;
      if (!resolvedUrl) { loading.set(false); return; }
      var key = cacheKey || resolvedUrl;

      // Check cache
      var cached = _queryCache[key];
      if (cached && (Date.now() - cached.timestamp < staleTime)) {
        data.set(cached.data);
        loading.set(false);
        isStale.set(false);
        if (options.onSuccess) options.onSuccess(cached.data);
        return;
      }

      // Stale-while-revalidate
      if (cached) {
        data.set(cached.data);
        isStale.set(true);
      }

      loading.set(true);
      error.set(null);
      try {
        var fetchOpts = { method: 'GET', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } };
        var response = await fetch(resolvedUrl, fetchOpts);
        if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        var result = await response.json();
        var transformed = options.transform ? options.transform(result) : result;
        data.set(transformed);
        isStale.set(false);
        _queryCache[key] = { data: transformed, timestamp: Date.now() };
        if (options.onSuccess) options.onSuccess(transformed);
        // Schedule cache eviction
        setTimeout(function() { delete _queryCache[key]; }, cacheTime);
      }
catch (e) {
        error.set(e.message || 'Query failed');
        if (options.onError) options.onError(e);
      }
finally {
        loading.set(false);
      }
    };

    if (options.immediate !== false) {
      onMount(fetchData);
    }

    // refetchOnFocus
    if (options.refetchOnFocus) {
      document.addEventListener('visibilitychange', function() {
        if (!document.hidden) fetchData();
      });
    }

    // refetchInterval
    if (options.refetchInterval) {
      var intervalId = setInterval(fetchData, options.refetchInterval);
      onDestroy(function() { clearInterval(intervalId); });
    }

    return {
      data: data,
      loading: loading,
      error: error,
      isStale: isStale,
      refetch: fetchData,
      invalidate: function() {
        var key = cacheKey || (typeof url === 'function' ? url() : url);
        delete _queryCache[key];
        return fetchData();
      }
    };
  }

  function useMutation(url, options) {
    options = options || {};
    var data = state(null);
    var loading = state(false);
    var error = state(null);

    var mutate = async function(body) {
      loading.set(true);
      error.set(null);
      var previousData = data();

      // Optimistic update
      if (options.optimisticData) {
        var optimistic = typeof options.optimisticData === 'function' ? options.optimisticData(body) : options.optimisticData;
        data.set(optimistic);
      }

      try {
        var resolvedUrl = typeof url === 'function' ? url() : url;
        var fetchOpts = {
          method: options.method || 'POST',
          headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
          body: typeof body === 'string' ? body : JSON.stringify(body)
        };
        var response = await fetch(resolvedUrl, fetchOpts);
        if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        var result = await response.json();
        var transformed = options.transform ? options.transform(result) : result;
        data.set(transformed);
        if (options.onSuccess) options.onSuccess(transformed);
        // Invalidate related queries
        if (options.invalidateQueries) {
          options.invalidateQueries.forEach(function(key) { delete _queryCache[key]; });
        }
        return transformed;
      }
catch (e) {
        error.set(e.message || 'Mutation failed');
        // Rollback optimistic update
        if (options.optimisticData) data.set(previousData);
        if (options.onError) options.onError(e);
        throw e;
      }
finally {
        loading.set(false);
      }
    };

    return {
      data: data,
      loading: loading,
      error: error,
      mutate: mutate,
      reset: function() { data.set(null); error.set(null); loading.set(false); }
    };
  }

  // ==========================================================================
  // Optimistic State (useOptimistic) — stacksjs/stx#1742
  // ==========================================================================
  // Mirrors signals-api.ts useOptimistic. Shows base + pending actions while an
  // async action is in flight; the overlay is discarded the moment base changes
  // (server confirmed). Returns [optimistic, addOptimistic]. addOptimistic
  // returns a settle() to roll back; pass a promise as the 2nd arg to auto-settle.
  function useOptimistic(base, reducer) {
    var readBase = (typeof base === 'function') ? base : function() { return base; };
    var pending = state([]);
    var optimistic = derived(function() {
      return pending().reduce(function(acc, entry) { return reducer(acc, entry.action); }, readBase());
    });
    var primed = false;
    effect(function() {
      readBase(); // track base only
      if (!primed) { primed = true; return; }
      if (peek(function() { return pending().length; })) pending.set([]);
    });
    function addOptimistic(action, settleWhen) {
      var entry = { action: action };
      pending.set(pending().concat([entry]));
      var settle = function() {
        var next = pending().filter(function(e) { return e !== entry; });
        if (next.length !== pending().length) pending.set(next);
      };
      if (settleWhen && typeof settleWhen.then === 'function') {
        Promise.resolve(settleWhen).then(settle, settle);
      }
      return settle;
    }
    return [optimistic, addOptimistic];
  }

  // ==========================================================================
  // Template Binding
  // ==========================================================================

  let componentScope = { $refs: {} };

  // Current element being processed (for scope lookup)
  let currentElement = null;

  function findElementScope(el) {
    let current = el;
    while (current && current !== document) {
      // Check element-local scope first (from stx.mount())
      if (current.__stx_scope) {
        return current.__stx_scope;
      }
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
        const piped = executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope);
        return (piped && typeof piped === 'function' && (piped._isSignal || piped._isDerived)) ? piped() : piped;
      }

      // Use auto-unwrap proxy if enabled (Feature #1)
      const scope = enableAutoUnwrap ? createAutoUnwrapProxy(baseScope) : baseScope;
      const fn = new Function(...Object.keys(baseScope), 'return ' + expr);
      const result = fn(...Object.values(scope));
      // Post-eval unwrap — see evalAttrExpr note for the reason.
      return (result && typeof result === 'function' && (result._isSignal || result._isDerived)) ? result() : result;
    }
catch (e) {
      if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Expression error:', expr, e);
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

    // Bare function reference: "@click=\\"foo\\"" should invoke foo($event),
    // matching Alpine/Vue/Svelte. Without this the expression falls through
    // to the generic new Function() path and is evaluated as a discarded
    // identifier statement — silently a no-op. See stacksjs/stx#1695.
    const bareIdMatch = trimmed.match(/^([a-zA-Z_$][\\w$]*)$/);
    if (bareIdMatch) {
      const fn = scope[bareIdMatch[1]];
      if (typeof fn === 'function' && !fn._isSignal) {
        return ($event) => fn($event);
      }
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
        shorthandFn(event);
        return;
      }

      const fn = new Function(...Object.keys(scope), '$event', expr);
      fn(...Object.values(scope), event);
    }
catch (e) {
      // Event handlers fire on user interaction, not reactive re-runs — there's no
      // async-hydration race to silence. Surfacing TypeError/ReferenceError is what
      // turns "@click does nothing, no warning" into a 5-second debug. See #1694.
      console.warn('[STX] Handler error:', expr, e);
    }
  }

  // Lazy hydration: defer processElement for subtrees marked with stx-hydrate.
  // Triggers: "visible" (IntersectionObserver), "idle" (requestIdleCallback),
  // "interaction" (mouseenter/click/focus), "media:<query>" (matchMedia).
  function deferHydration(el, trigger, scope) {
    if (el.__stx_hydration_scheduled) return;
    el.__stx_hydration_scheduled = true;

    var run = function() {
      if (el.__stx_hydrated) return;
      el.__stx_hydrated = true;
      el.__stx_hydration_cancel = null; // trigger consumed — nothing left to cancel
      el.removeAttribute('stx-hydrate');
      var sid = el.getAttribute && el.getAttribute('data-stx-scope');

      // Everything downstream of the island setup running: merge the now-
      // registered scope, bind the subtree, flush onMount, announce hydration.
      // Factored out so the async chunked path can run it from a <script> load
      // event while the inline path runs it synchronously (#1746).
      var finishHydrate = function() {
        var effectiveScope = scope;
        if (sid) {
          var reg = window.stx._scopes ? window.stx._scopes[sid] : null;
          if (reg) effectiveScope = Object.assign({}, scope || {}, reg);
        }
        // Walk children and process them with the (now scope-merged) context
        Array.from(el.children).forEach(function(child) { processElement(child, effectiveScope); });
        // Also process the element itself (attributes/bindings on the host)
        processAttributesOnly(el, effectiveScope);
        // Fire this scope's onMount now that it has actually hydrated — the
        // initial mount pass deferred it for stx-hydrate scopes so onMount lands
        // on hydration, not at page load (#1746). Guarded by __mounted so it
        // never double-fires with the eager path.
        var sv = sid && window.stx._scopes ? window.stx._scopes[sid] : null;
        if (sv && sv.__mountCallbacks && !sv.__mounted) {
          sv.__mounted = true;
          sv.__mountCallbacks.forEach(function(fn) { try { fn(); } catch (e) { console.error('[stx] onMount error:', e); } });
        }
        window.dispatchEvent(new CustomEvent('stx:hydrated', { detail: { el: el, trigger: trigger } }));
      };

      // Island (#1746): the component's setup script was emitted inert
      // (type="stx/island") so the browser skipped it at parse. Run it now — it
      // registers the scope (signals + methods) AND runs any side-effectful
      // setup (e.g. a fetch in the <script client> body) at hydration time.
      var islandScript = sid ? document.querySelector('script[data-stx-island="' + sid + '"]') : null;
      if (islandScript && !islandScript.__stx_ran) {
        islandScript.__stx_ran = true;
        var chunkSrc = islandScript.getAttribute && islandScript.getAttribute('data-stx-src');
        if (chunkSrc) {
          // Chunked island (production build): the IIFE lives in a separate
          // file fetched only now. Load it via a real <script src> (CSP-clean —
          // no eval/new Function) and defer ALL downstream work to its load
          // event, since the scope isn't registered until the chunk executes.
          var s = document.createElement('script');
          s.src = chunkSrc;
          // Subresource Integrity (opt-in at build): pin the chunk's bytes.
          var integ = islandScript.getAttribute('data-stx-integrity');
          if (integ) s.integrity = integ;
          s.onload = finishHydrate;
          s.onerror = function() { console.error('[stx] island chunk load failed:', sid, chunkSrc); finishHydrate(); };
          document.head.appendChild(s);
          return; // finishHydrate runs from the chunk's load event
        }
        // Inline island (dev / SSR / chunking off): execute synchronously.
        // eslint-disable-next-line no-new-func
        try { (new Function(islandScript.textContent))(); }
        catch (e) { console.error('[stx] island setup error:', sid, e); }
      }
      finishHydrate();
    };

    // Record how to cancel a still-pending trigger so SPA navigation can tear it
    // down — otherwise an unhydrated island's observer/timer/listener leaks and
    // may fire run() on a detached element after the page swapped (#1746).
    // Cleared once run() fires (it guards on __stx_hydrated anyway).
    if (trigger === 'idle') {
      if (typeof requestIdleCallback === 'function') {
        var idleId = requestIdleCallback(run, { timeout: 2000 });
        el.__stx_hydration_cancel = function() { if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId); };
      }
      else {
        var idleTimer = setTimeout(run, 200);
        el.__stx_hydration_cancel = function() { clearTimeout(idleTimer); };
      }
    }
    else if (trigger === 'visible') {
      if (typeof IntersectionObserver === 'function') {
        var io = new IntersectionObserver(function(entries) {
          entries.forEach(function(e) {
            if (e.isIntersecting) { io.disconnect(); run(); }
          });
        }, { rootMargin: '50px' });
        io.observe(el);
        el.__stx_hydration_cancel = function() { io.disconnect(); };
      } else {
        run(); // fallback: no IO support, hydrate immediately
      }
    }
    else if (trigger === 'interaction') {
      var events = ['mouseenter', 'click', 'focusin', 'touchstart'];
      var handler = function() {
        events.forEach(function(ev) { el.removeEventListener(ev, handler); });
        run();
      };
      events.forEach(function(ev) { el.addEventListener(ev, handler, { once: true, passive: true }); });
      el.__stx_hydration_cancel = function() { events.forEach(function(ev) { el.removeEventListener(ev, handler); }); };
    }
    else if (trigger && trigger.indexOf('media:') === 0) {
      var query = trigger.slice(6);
      var mql = window.matchMedia(query);
      if (mql.matches) run();
      else {
        var mqHandler = function(e) {
          if (e.matches) { mql.removeEventListener('change', mqHandler); run(); }
        };
        mql.addEventListener('change', mqHandler);
        el.__stx_hydration_cancel = function() { mql.removeEventListener('change', mqHandler); };
      }
    }
    else {
      // Unknown trigger — hydrate immediately
      run();
    }
  }

  // Minimal attribute-only pass for the host element of a deferred subtree.
  // The full walk happens on children via processElement.
  function processAttributesOnly(el, scope) {
    // Just call processElement but mark it as already visited to prevent
    // infinite recursion via the stx-hydrate check below.
    el.__stx_hydrated = true;
    processElement(el, scope);
  }

  function processElement(el, scope = componentScope) {
    // Debug: log every element with x-class or @click
    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute) {
      if (el.hasAttribute('x-class') || el.hasAttribute('@click')) {
        console.log('[stx] processElement:', el.tagName, 'x-class:', el.hasAttribute('x-class'), '@click:', el.hasAttribute('@click'));
      }
    }
    // Lazy hydration: if this element has stx-hydrate and hasn't been hydrated
    // yet, defer its subtree processing until the trigger fires.
    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute && el.hasAttribute('stx-hydrate') && !el.__stx_hydrated) {
      var trigger = el.getAttribute('stx-hydrate') || 'idle';
      deferHydration(el, trigger, scope);
      return;
    }

    if (el.nodeType === Node.ELEMENT_NODE && el.tagName === 'BUTTON' && el.hasAttribute && el.hasAttribute('@click')) {

    }
    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute) {
      // x-data elements: the reactive bridge has registered their scope into window.stx._scopes.
      // Merge that scope into the processing scope and continue — we handle all directives.
      // Server renames x-data → data-stx-xdata, so check both.
      if (el.hasAttribute('x-data') || el.hasAttribute('data-stx-xdata') || el.__stx_scope) {
        var xdScope = el.__stx_scope || (findElementScope(el) || {});
        if (xdScope && Object.keys(xdScope).length > 0) {
          scope = { ...scope, ...xdScope };
        }
      }
      // v-memo / @memo — skip re-processing if dependency values haven't changed
      if (el.hasAttribute('data-stx-memo')) {
        var memoExpr = el.getAttribute('data-stx-memo');
        try {
          var memoScope = { ...scope, ...(findElementScope(el) || {}), ...globalHelpers };
          var memoFn = new Function(...Object.keys(memoScope), 'return ' + memoExpr);
          var memoVals = JSON.stringify(memoFn(...Object.values(memoScope)));
          if (el.__stx_memo_prev === memoVals) {
            return; // Dependencies unchanged — skip re-processing
          }
          el.__stx_memo_prev = memoVals;
        } catch(e) {}
      }
    }
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
                  }
else {
                    // Use auto-unwrap proxy (Feature #1)
                    const unwrapScope = createAutoUnwrapProxy(capturedScope);
                    const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
                    span.textContent = fn(...Object.values(unwrapScope));
                  }
                }
catch (e) {
                  // Auto-unwrap can break explicit signal calls like errorData().message
                  // because it converts the signal to its value before the expression runs.
                  // Retry without auto-unwrap so signal functions remain callable.
                  try {
                    const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
                    span.textContent = fn(...Object.values(capturedScope));
                  }
catch (e2) {
                    if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expr, e2);
                    span.textContent = '';
                  }
                }
              });
            }
else if (part) {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          el.replaceWith(fragment);
        }
      }
      return;
    }

    if (el.nodeType !== Node.ELEMENT_NODE) return;

    // <stx-link> handling removed — StxLink builtin now produces <a> directly
    // with data-stx-link attribute. The router handles SPA click interception.

    // <Suspense> boundary — coordinate descendant suspense queries (#1742).
    if (el.hasAttribute('data-stx-suspense') && !el.__stx_suspense_bound) {
      bindSuspense(el, scope);
      // bindSuspense processes the content subtree itself; don't double-process.
      return;
    }

    // Handle @for / :for / x-for first (reactive list)
    if (el.hasAttribute('@for') || el.hasAttribute(':for') || el.hasAttribute('x-for')) {
      var forAttr = el.hasAttribute(':for') ? ':for' : el.hasAttribute('x-for') ? 'x-for' : '@for';
      bindFor(el, scope, forAttr);
      return;
    }

    // x-else / x-else-if are owned by their preceding x-if chain (#1734).
    // A detached chain member reached via the parent's snapshot child-
    // iteration must be skipped — bindIfChain manages its lifecycle and
    // only the active branch is (re)connected. Connected chain members
    // (the active branch) fall through; their if/else attr was already
    // removed by bindIfChain, and double-bind guards make any redundant
    // pass idempotent.
    if (el.__stx_chain_member && !el.isConnected) return;

    // An else/else-if with no preceding if is an orphan. Match Vue: warn,
    // strip the attribute, and render it as a plain element (fall through).
    if (!el.__stx_chain_member) {
      var orphanElse = getElseAttrInfo(el);
      if (orphanElse) {
        console.warn('[STX] ' + orphanElse.name + ' has no matching preceding x-if/:if/@if sibling; rendering as a plain element.');
        el.removeAttribute(orphanElse.name);
      }
    }

    // Handle @if / :if / x-if (conditional rendering)
    if (el.hasAttribute('@if') || el.hasAttribute(':if') || el.hasAttribute('x-if')) {
      var ifAttr = el.hasAttribute(':if') ? ':if' : el.hasAttribute('x-if') ? 'x-if' : '@if';

      // If else/else-if siblings follow, drive the whole chain with one
      // mutually-exclusive effect; otherwise the single-element fast path.
      var ifChain = findIfChain(el, ifAttr);
      console.log('[stx] :if dispatch on', el.tagName, ifAttr + '="' + el.getAttribute(ifAttr) + '"', 'chainLen:', ifChain.length, 'branches:', ifChain.map(function(c) { return c.attr; }).join(','));
      if (ifChain.length > 1) bindIfChain(ifChain, scope);
      else bindIf(el, scope, ifAttr);
      return;
    }

    // Handle @show / :show / x-show (visibility toggle - keeps element in DOM)
    if (el.hasAttribute('@show') || el.hasAttribute(':show') || el.hasAttribute('x-show')) {
      var showAttr = el.hasAttribute(':show') ? ':show' : el.hasAttribute('x-show') ? 'x-show' : '@show';
      bindShow(el, el.getAttribute(showAttr), scope, showAttr);
    }

    // Handle @model / :model / x-model (two-way binding)
    if (el.hasAttribute('@model') || el.hasAttribute(':model') || el.hasAttribute('x-model')) {
      var modelAttr = el.hasAttribute(':model') ? ':model' : el.hasAttribute('x-model') ? 'x-model' : '@model';
      bindModel(el, el.getAttribute(modelAttr), scope, modelAttr);
    }

    // Capture scope once for all attribute bindings on this element
    // Use the passed scope parameter to preserve context through nested processing
    const attrCapturedScope = { ...scope, ...(findElementScope(el) || {}), ...globalHelpers };

    // Post-eval unwrap: if the expression result is a signal function (e.g.
    // step was resolved via identifier lookup, not via the auto-unwrap
    // proxy — happens when a client script declares const step = state(...)
    // at script-realm scope, making it accessible to new Function but not
    // appearing in the Proxy Object.keys), call it to get the value.
    // Without this, :text="step" sets textContent to the stringified
    // signal function instead of the value.
    const maybeUnwrapSignal = (v) => {
      if (v && typeof v === 'function' && (v._isSignal || v._isDerived)) return v();
      return v;
    };
    const evalAttrExpr = (rawExpr) => {
      // Decode HTML entities that browsers may encode in attribute values
      // e.g. :text="a > b" may be stored as :text="a &gt; b" in HTML
      var expr = rawExpr.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/g,"'");
      try {
        if (/^__[A-Z_]+__$/.test(expr.trim())) return expr;

        // Check for pipe syntax (Feature #2)
        const pipeResult = parsePipeExpression(expr, attrCapturedScope);
        if (pipeResult) {
          const unwrapScope = createAutoUnwrapProxy(attrCapturedScope);
          return maybeUnwrapSignal(executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope));
        }

        // Use auto-unwrap proxy (Feature #1)
        const unwrapScope = createAutoUnwrapProxy(attrCapturedScope);
        const fn = new Function(...Object.keys(attrCapturedScope), 'return ' + expr);
        return maybeUnwrapSignal(fn(...Object.values(unwrapScope)));
      }
catch (e) {
        // Auto-unwrap can break explicit signal calls like errorData().message
        // Retry without auto-unwrap so signal functions remain callable
        try {
          const fn = new Function(...Object.keys(attrCapturedScope), 'return ' + expr);
          return maybeUnwrapSignal(fn(...Object.values(attrCapturedScope)));
        }
catch (e2) {
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Attribute expression error:', expr, e2);
          return '';
        }
      }
    };

    // Known directive names to exclude from generic :attr binding
    var DIRECTIVE_NAMES = {class:1, style:1, text:1, html:1, show:1, model:1, 'if':1, 'for':1, ref:1};
    var EVENT_RE = /^(click|dblclick|mousedown|mouseup|mousemove|mouseenter|mouseleave|keydown|keyup|keypress|input|change|submit|focus|blur|scroll|resize|touchstart|touchend|touchmove|contextmenu|wheel|pointerdown|pointerup|pointermove)/;
    var KEY_MAP = {enter:'Enter', tab:'Tab', escape:'Escape', space:' ', up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight', 'delete':'Delete', backspace:'Backspace'};

    // Handle attributes
    if (el.hasAttribute && (el.hasAttribute('x-class') || el.hasAttribute('@click'))) {
      console.log('[stx] attr loop entry:', el.tagName, 'attrs:', Array.from(el.attributes).map(a => a.name).join(', '));
    }
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name;
      const value = attr.value;

      if (el.hasAttribute && (el.hasAttribute('x-class') || el.hasAttribute('@click'))) {
        console.log('[stx] attr iter:', el.tagName, 'name:', name);
      }

      // Dynamic attribute binding: @bind:attr, x-bind:attr, :attr, OR x-attr
      // x-attr (e.g. x-class, x-style, x-href, x-src) is the canonical binding prefix.
      // :attr still works for backward compat but is reserved for structural directives.
      // x-text, x-html, x-model, x-show, x-if, x-for, x-cloak, x-ref, x-data are
      // handled by their own code paths below — exclude them here.
      var X_HANDLED = {'x-text':1,'x-html':1,'x-model':1,'x-show':1,'x-if':1,'x-for':1,'x-cloak':1,'x-ref':1,'x-data':1,'x-bind':1,'x-class':1,'x-style':1,'x-tooltip':1,'x-tooltip-position':1};
      if (name.startsWith('@bind:') || name.startsWith('x-bind:')
          || (name.startsWith(':') && !name.startsWith('::') && !DIRECTIVE_NAMES[name.slice(1).split('.')[0]] && !EVENT_RE.test(name.slice(1)))
          || (name.startsWith('x-') && !X_HANDLED[name.split('.')[0]] && !X_HANDLED[name])) {
        const attrName = name.startsWith('@bind:') ? name.slice(6) : name.startsWith('x-bind:') ? name.slice(7) : name.startsWith('x-') ? name.slice(2) : name.slice(1);
        effect(() => {
          const v = evalAttrExpr(value);
          if (v === false || v === null || v === undefined) {
            el.removeAttribute(attrName);
          }
else if (v === true) {
            el.setAttribute(attrName, '');
          }
else {
            el.setAttribute(attrName, v);
          }
        });
        el.removeAttribute(name);
      }
else if (name === '@class' || name === ':class' || name === 'x-class') {
        console.log('[stx] HIT x-class handler:', el.tagName);
        bindClass(el, value, scope);
        el.removeAttribute(name);
      }
else if (name === '@style' || name === ':style' || name === 'x-style') {
        bindStyle(el, value, scope);
        el.removeAttribute(name);
      }
else if (name === '@text' || name === ':text' || name === 'x-text') {
        effect(() => {
          el.textContent = evalAttrExpr(value);
        });
        el.removeAttribute(name);
      }
else if (name === '@html' || name === ':html' || name === 'x-html') {
        effect(() => {
          el.innerHTML = evalAttrExpr(value);
        });
        el.removeAttribute(name);
      }
else if (name === 'ref' || name === ':ref' || name === 'x-ref' || name === 'data-stx-ref') {
        // Store ref in scope.$refs and componentScope.$refs
        if (scope.$refs) scope.$refs[value] = el;
        if (componentScope.$refs) componentScope.$refs[value] = el;
      }
else if (name.startsWith('@') || name.startsWith(':')) {
        // Event handlers: @click, :click, @submit.prevent, :keydown.enter, etc.
        const parts = name.slice(1).split('.');
        const eventName = parts[0];
        const modifiers = parts.slice(1);

        // Skip special directives (already handled above or in processElement)
        if (['if', 'for', 'show', 'model', 'class', 'style', 'text', 'html', 'ref'].includes(eventName)) {
          return;
        }

        // Prevent duplicate event binding on the same element
        var eventKey = '__stx_evt_' + eventName + '_' + value.substring(0, 20);
        if (el[eventKey]) { el.removeAttribute(name); return; }
        el[eventKey] = true;

        // Capture scope at setup time so @for loop variables are available when event fires
        const eventCapturedScope = { ...scope, ...(findElementScope(el) || {}), ...globalHelpers };

        console.log('[stx] binding event:', eventName, 'on', el.tagName, 'expr:', value.substring(0, 40));
        el.addEventListener(eventName, (event) => {
          console.log('[stx] event fired:', eventName, 'on', el.tagName);
          // Skip clicks on elements that just became visible in this frame.
          // Prevents modal backdrop from catching the click that opened the modal.
          if (eventName === 'click') {
            var ancestor = el;
            while (ancestor) {
              if (ancestor.__stx_shown_at && (performance.now() - ancestor.__stx_shown_at) < 50) return;
              ancestor = ancestor.parentElement;
            }
          }
          // System key modifiers
          if (modifiers.includes('self') && event.target !== el) return;
          if (modifiers.includes('ctrl') && !event.ctrlKey) return;
          if (modifiers.includes('alt') && !event.altKey) return;
          if (modifiers.includes('shift') && !event.shiftKey) return;
          if (modifiers.includes('meta') && !event.metaKey) return;
          // Key modifiers
          for (var mi = 0; mi < modifiers.length; mi++) {
            if (KEY_MAP[modifiers[mi]] && event.key !== KEY_MAP[modifiers[mi]]) return;
          }
          if (modifiers.includes('prevent')) event.preventDefault();
          if (modifiers.includes('stop')) event.stopPropagation();
          // Execute with captured scope (includes @for loop variables)
          // For x-data scopes, expressions like "mobileOpen = !mobileOpen" need to
          // read the signal value AND write back through the signal's setter.
          try {
            if (!value || /^__[A-Z_]+__$/.test(value.trim())) return;
            var shorthandFn = parseEventShorthand(value, eventCapturedScope);
            if (shorthandFn) { shorthandFn(event); return; }
            // Check if any scope values are signals (x-data pattern)
            var hasSignals = Object.values(eventCapturedScope).some(function(v) {
              return v && typeof v === 'function' && v._isSignal;
            });
            // Only use signal read/write proxy for DIRECT assignment expressions
            // like "count = count + 1" or "open = !open". Function calls like
            // "openModal()" handle their own signal.set() internally — the writeback
            // would RESET signals to their pre-handler values.
            var isDirectAssignment = hasSignals && /^[a-zA-Z_$]\\w*\\s*=/.test(value.trim()) && !value.trim().startsWith('==');
            if (isDirectAssignment) {
              var getVars = Object.keys(eventCapturedScope).map(function(k) {
                return 'var ' + k + ' = __s["' + k + '"] && typeof __s["' + k + '"] === "function" && __s["' + k + '"]._isSignal ? __s["' + k + '"]() : __s["' + k + '"]';
              }).join(';');
              var setVars = Object.keys(eventCapturedScope).filter(function(k) {
                var v = eventCapturedScope[k];
                return v && typeof v === 'function' && v._isSignal;
              }).map(function(k) {
                return 'if(' + k + ' !== __s["' + k + '"]()) __s["' + k + '"].set(' + k + ')';
              }).join(';');
              var body = getVars + ';' + value + ';' + setVars;
              var fn2 = new Function('__s', '$event', body);
              fn2(eventCapturedScope, event);
            } else if (hasSignals) {
              // Function call with signals in scope — keep signals that have .set()
              // called on them as raw signal functions, unwrap the rest for reading
              var unwrapVars = Object.keys(eventCapturedScope).map(function(k) {
                var v = eventCapturedScope[k];
                // If this signal is used with .set() in the expression, keep it as-is
                if (v && typeof v === 'function' && v._isSignal && value.includes(k + '.set(')) {
                  return 'var ' + k + ' = __s["' + k + '"]';
                }
                return 'var ' + k + ' = __s["' + k + '"] && typeof __s["' + k + '"] === "function" && __s["' + k + '"]._isSignal ? __s["' + k + '"]() : __s["' + k + '"]';
              }).join(';');
              var fn3 = new Function('__s', '$event', unwrapVars + ';' + value);
              fn3(eventCapturedScope, event);
            } else {
              var fn = new Function(...Object.keys(eventCapturedScope), '$event', value);
              fn(...Object.values(eventCapturedScope), event);
            }
          }
catch (e) {
            // See #1694: dropping the TypeError/ReferenceError carve-out for inline
            // handlers — same reason as executeHandler above. Silencing these hid
            // the substring-detector bug (auto-unwrap missing .set( inside helper
            // calls) for ~30min of bisecting in the field.
            console.warn('[STX] Handler error:', value, e);
          }
        }, {
          capture: modifiers.includes('capture'),
          passive: modifiers.includes('passive'),
          once: modifiers.includes('once')
        });
        el.removeAttribute(name);
      }
    });

    // Process children (skip script/style elements — their text content is not template markup)
    // Skip elements that are roots of nested stx.mount() components — those have their own scope
    if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
      var children = Array.from(el.childNodes);
      children.forEach(function(child) {
        if (child.nodeType !== Node.ELEMENT_NODE) { processElement(child, scope); return; }
        // Skip script elements entirely
        if (child.tagName === 'SCRIPT') return;
        // Skip elements already processed by stx.mount() — they have their own scope and effects
        if (child.__stx_scope) { console.log('[processElement] skip __stx_scope:', child.tagName); return; }
        // Skip data-stx-scope elements — they are managed by the reactive (x-data) runtime
        if (child.hasAttribute && child.hasAttribute('data-stx-scope')) return;
        processElement(child, scope);
      });
    }
  }

  // <Suspense> boundary (#1742). Aggregates the loading/error state of every
  // descendant suspense query (useQuery/useFetch with { suspense: true }) for
  // which this is the nearest [data-stx-suspense] ancestor, and toggles three
  // regions accordingly: [data-stx-suspense-fallback] while any query is loading,
  // [data-stx-suspense-error] when one errors, [data-stx-suspense-content]
  // once all resolve. With no suspense queries inside, content shows immediately.
  function bindSuspense(el, scope) {
    if (el.__stx_suspense_bound) return;
    el.__stx_suspense_bound = true;

    var fallbackEl = el.querySelector('[data-stx-suspense-fallback]');
    var errorEl = el.querySelector('[data-stx-suspense-error]');
    var contentEl = el.querySelector('[data-stx-suspense-content]') || el;

    // Claim the descendant queries this boundary owns. closest() returns the
    // DEEPEST [data-stx-suspense] ancestor, so nested boundaries don't steal
    // each other's queries.
    var claimed = suspenseRegistry().filter(function(entry) {
      return entry.el && el.contains(entry.el) && entry.el.closest('[data-stx-suspense]') === el;
    });

    var anyLoading = derived(function() {
      for (var i = 0; i < claimed.length; i++) {
        if (claimed[i].loading && claimed[i].loading()) return true;
      }
      return false;
    });
    var firstError = derived(function() {
      for (var i = 0; i < claimed.length; i++) {
        var err = claimed[i].error ? claimed[i].error() : null;
        if (err) return err;
      }
      return null;
    });

    function setHidden(node, hidden) {
      if (!node || node === el) return;
      if (hidden) node.setAttribute('hidden', '');
      else node.removeAttribute('hidden');
    }

    effect(function() {
      var err = firstError();
      var loading = anyLoading();
      if (err && errorEl) {
        setHidden(errorEl, false); setHidden(fallbackEl, true); setHidden(contentEl, true);
      } else if (loading) {
        setHidden(fallbackEl, false); setHidden(contentEl, true); setHidden(errorEl, true);
      } else {
        setHidden(contentEl, false); setHidden(fallbackEl, true); setHidden(errorEl, true);
      }
    });

    // Bind the content subtree (inline :if / {{ }} / @click etc.). Nested
    // component scopes are still processed independently by the scope loop.
    var contentRoot = (contentEl === el) ? el : contentEl;
    Array.from(contentRoot.childNodes).forEach(function(child) { processElement(child, scope); });
  }

  function bindShow(el, expr, passedScope = componentScope, attrName = '@show') {
    if (el.__stx_show_bound) return;
    el.__stx_show_bound = true;

    const currentDisplay = el.style.display;
    const originalDisplay = (currentDisplay && currentDisplay !== 'none') ? currentDisplay : '';
    const capturedScope = { ...passedScope, ...(findElementScope(el) || {}), ...globalHelpers };

    // Check if the expression is a simple signal reference (most common case for :show)
    const directSignal = capturedScope[expr];
    if (directSignal && directSignal._isSignal) {
      // Fast path: directly subscribe to the signal — guaranteed reactive
      effect(() => {
        const value = directSignal();

        el.style.display = value ? originalDisplay : 'none';
      });
    } else {
      // Complex expression path — use createAutoUnwrapProxy with fallback,
      // matching the retry pattern in evalAttrExpr. This ensures call
      // expressions like !recording() work: the proxy auto-unwraps
      // signals on property access, so recording remains a callable
      // signal function (not unwrapped to its boolean value).
      effect(() => {
        var value;
        try {
          var unwrapScope = createAutoUnwrapProxy(capturedScope);
          var fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
          value = fn(...Object.values(unwrapScope));
        } catch (e1) {
          // Retry without unwrapping — handles edge cases where the proxy
          // interferes with certain expression patterns
          try {
            var fn2 = new Function(...Object.keys(capturedScope), 'return ' + expr);
            value = fn2(...Object.values(capturedScope));
          } catch (e2) {
            // Suppress ReferenceError/TypeError during async init — a signal
            // or object may not be ready yet on the first effect run, and
            // the next pass will re-evaluate once data arrives.
            if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Show expression error:', expr, e2);
            el.style.display = 'none';
            return;
          }
        }
        var wasHidden = el.style.display === 'none';
        el.style.display = value ? originalDisplay : 'none';
        // When transitioning from hidden to visible, stamp the element so
        // @click handlers can ignore clicks from the same frame (prevents
        // modal backdrop from catching the click that opened the modal)
        if (value && wasHidden) {
          el.__stx_shown_at = performance.now();
        }
      });
    }
    el.removeAttribute(attrName);
  }

  function bindModel(el, expr, passedScope = componentScope, attrName = '@model') {
    if (el.__stx_model_bound) return;
    el.__stx_model_bound = true;
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
        }
else {
          const fn = new Function(...Object.keys(scope), 'v', expr + ' = v');
          fn(...Object.values(scope), val);
        }
      }
catch (e) {
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] ' + attrName + ' set error:', expr, e);
      }
    };

    if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
      effect(() => { el.checked = getValue(); });
      el.addEventListener('change', () => setValue(el.checked));
    }
else if (tag === 'select') {
      effect(() => { el.value = getValue(); });
      el.addEventListener('change', () => setValue(el.value));
    }
else {
      effect(() => { el.value = getValue() ?? ''; });
      el.addEventListener('input', () => setValue(el.value));
    }

    el.removeAttribute(attrName);
  }

  function bindClass(el, expr, passedScope = componentScope) {
    const originalClasses = el.className;
    const capturedScope = { ...passedScope, ...(findElementScope(el) || {}), ...globalHelpers };
    const keys = Object.keys(capturedScope);

    // Pre-compile — filter out keys that aren't valid JS identifiers
    const safeKeys = keys.filter(k => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k));
    let fn;
    try {
      fn = new Function(...safeKeys, 'return ' + expr);
    } catch (e) {
      console.warn('[STX] bindClass compile error:', expr, e);
      return;
    }

    effect(() => {
      // Subscribe to signals by reading them, establishing reactive deps.
      // But pass RAW scope values to the fn so call-expressions like
      // activeTab() === 'overview' work — if we passed unwrapped values,
      // the fn would try to invoke a primitive and throw.
      for (let i = 0; i < safeKeys.length; i++) {
        const v = capturedScope[safeKeys[i]];
        if (v && typeof v === 'function' && (v._isSignal || v._isDerived)) {
          v();
        }
      }

      let value;
      try {
        // First pass: auto-unwrap proxy — handles expressions that read
        // signals as primitives (e.g. { 'active': count > 5 } where count
        // is a signal).
        const unwrapScope = createAutoUnwrapProxy(capturedScope);
        value = fn.apply(null, safeKeys.map(k => unwrapScope[k]));
      } catch (e1) {
        // Retry with raw scope — handles call-expressions like activeTab()
        // that need the signal function to remain callable.
        try {
          value = fn.apply(null, safeKeys.map(k => capturedScope[k]));
        } catch (e2) {
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Class expression error:', expr, e2);
          value = '';
        }
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Object form { "cls-a cls-b": cond } — keys may contain multiple
        // whitespace-separated classes; classList.add/remove can't accept
        // those as a single token (throws DOMException), so split each key.
        Object.keys(value).forEach(cls => {
          const tokens = cls.split(/\\s+/).filter(Boolean);
          if (value[cls]) tokens.forEach(t => el.classList.add(t));
          else tokens.forEach(t => el.classList.remove(t));
        });
      }
else if (Array.isArray(value)) {
        el.className = originalClasses + ' ' + value.filter(Boolean).join(' ');
      }
else {
        el.className = originalClasses + (value ? ' ' + value : '');
      }
    });
  }

  function bindStyle(el, expr, passedScope = componentScope) {
    // Capture scope at setup time - use passed scope to preserve context
    const capturedScope = { ...passedScope, ...(findElementScope(el) || {}), ...globalHelpers };

    const evalExpr = () => {
      // Mirror bindClass: first try the auto-unwrap proxy (so an expression
      // like { active: count > 5 } reads signals as primitives), then retry
      // with the raw scope so call-syntax expressions like
      // { color: theme() } still work — the proxy unwraps signals to
      // values, which would make theme() try to call a primitive and
      // throw TypeError.
      try {
        const unwrapScope = createAutoUnwrapProxy(capturedScope);
        const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
        return fn(...Object.values(unwrapScope));
      }
catch (e1) {
        try {
          const fn2 = new Function(...Object.keys(capturedScope), 'return ' + expr);
          return fn2(...Object.values(capturedScope));
        }
catch (e2) {
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Style expression error:', expr, e2);
          return {};
        }
      }
    };

    effect(() => {
      const value = evalExpr();
      if (typeof value === 'object' && value !== null) {
        Object.assign(el.style, value);
      }
else if (typeof value === 'string') {
        el.style.cssText = value;
      }
    });
  }

  // ── <TransitionGroup> support (#1742) ────────────────────────────────────
  // Class-driven enter/leave + FLIP move animations for keyed :for lists whose
  // parent is a [data-stx-transition-group]. All helpers are self-contained and
  // guarded (no-ops off the happy path), and every transition has a timeout
  // fallback so a missed transitionend (or a layout-less environment) can't hang
  // a leaving node in the DOM. bindFor calls these only when the parent is a
  // group AND the group has already done its initial render (no enter on mount).
  function tgDurationMs(el) {
    try {
      var cs = (typeof getComputedStyle === 'function') ? getComputedStyle(el) : null;
      if (cs) {
        var raw = (cs.transitionDuration || '').split(',')[0].trim();
        var ms = raw.indexOf('ms') >= 0 ? parseFloat(raw) : parseFloat(raw) * 1000;
        if (ms > 0) return ms;
      }
    } catch (e) {}
    return 300;
  }
  function tgOnEnd(el, cb) {
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      try { el.removeEventListener('transitionend', finish); } catch (e) {}
      cb();
    }
    try { el.addEventListener('transitionend', finish); } catch (e) {}
    // Fallback: transitionend may never fire (no real layout, display:none,
    // a dropped event). Always converge.
    setTimeout(finish, tgDurationMs(el) + 60);
  }
  function tgRaf2(fn) {
    var raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function(f) { return setTimeout(f, 16); };
    raf(function() { raf(fn); });
  }
  function tgEnter(el, name) {
    if (!el || el.nodeType !== 1 || !el.classList) return;
    el.classList.add(name + '-enter-from', name + '-enter-active');
    tgRaf2(function() {
      el.classList.remove(name + '-enter-from');
      el.classList.add(name + '-enter-to');
      tgOnEnd(el, function() { el.classList.remove(name + '-enter-active', name + '-enter-to'); });
    });
  }
  function tgLeave(el, name) {
    if (!el || el.nodeType !== 1 || !el.classList) return false;
    el.classList.add(name + '-leave-from', name + '-leave-active');
    tgRaf2(function() {
      el.classList.remove(name + '-leave-from');
      el.classList.add(name + '-leave-to');
      tgOnEnd(el, function() { if (el.parentNode) el.parentNode.removeChild(el); });
    });
    return true; // took over the DOM removal
  }
  function tgSnapshot(els) {
    var m = new Map();
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el && el.nodeType === 1 && el.getBoundingClientRect) {
        try { m.set(el, el.getBoundingClientRect()); } catch (e) {}
      }
    }
    return m;
  }
  function tgFlip(els, first, name) {
    var moved = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el || el.nodeType !== 1 || !first.has(el) || !el.getBoundingClientRect) continue;
      var last, f = first.get(el);
      try { last = el.getBoundingClientRect(); } catch (e) { continue; }
      var dx = f.left - last.left, dy = f.top - last.top;
      if (dx || dy) {
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        el.style.transitionDuration = '0s';
        moved.push(el);
      }
    }
    if (!moved.length) return;
    // Force reflow so the inverted transform is committed before we play it.
    if (els[0] && typeof els[0].offsetHeight === 'number') void els[0].offsetHeight;
    var raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function(f) { return setTimeout(f, 16); };
    raf(function() {
      moved.forEach(function(el) {
        el.classList.add(name + '-move');
        el.style.transform = '';
        el.style.transitionDuration = '';
        tgOnEnd(el, function() { el.classList.remove(name + '-move'); el.style.transform = ''; el.style.transitionDuration = ''; });
      });
    });
  }

  function bindFor(el, passedScope = componentScope, attrName = '@for') {
    if (el.__stx_for_bound) return;
    el.__stx_for_bound = true;
    const expr = el.getAttribute(attrName);
    // Support: "item in list", "item, index in list", "(item, index) in list"
    const match = expr.match(/^\\s*\\(?\\s*(\\w+)(?:\\s*,\\s*(\\w+))?\\s*\\)?\\s+(?:in|of)\\s+(.+)\\s*$/);

    if (!match) {
      console.warn('[STX] Invalid ' + attrName + ':', expr);
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

    // Check if element also has @if / :if - need to handle together
    const ifExpr = el.getAttribute('@if') || el.getAttribute(':if');

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

    // Capture :key expression BEFORE removing the attribute
    const keyExpr = el.getAttribute(':key') || el.getAttribute('x-bind:key');

    // For <template> elements, use the content; otherwise clone the element
    let templateContent;
    if (isTemplate) {
      templateContent = el.content;
    }
else {
      const wrapper = el.cloneNode(true);
      wrapper.removeAttribute('@for');
      wrapper.removeAttribute(':for');
      wrapper.removeAttribute('x-for');
      wrapper.removeAttribute('@loading');
      wrapper.removeAttribute('@empty');
      wrapper.removeAttribute(':key');
      wrapper.removeAttribute('x-bind:key');
      // Also remove @if / :if / x-if - we'll handle it inline
      if (ifExpr) { wrapper.removeAttribute('@if'); wrapper.removeAttribute(':if'); wrapper.removeAttribute('x-if'); }
      templateContent = wrapper;
    }

    let currentElements = [];
    let currentKeys = [];
    let loadingElement = null;
    let emptyElement = null;

    // Helper to evaluate with captured scope (auto-unwraps signals)
    // NOTE: This eagerly reads ALL signals in scope — use evalLazy inside effects
    // to avoid over-broad dependency tracking.
    const evalExpr = (expression, extraScope = {}) => {
      try {
        // Skip placeholder expressions like __TITLE__ (build-time placeholders)
        if (/^__[A-Z_]+__$/.test(expression.trim())) {
          return expression;
        }
        // Use passedScope instead of componentScope to preserve context through nested processing
        const scope = { ...passedScope, ...(capturedScope || {}), ...globalHelpers, ...extraScope };
        const unwrapScope = createAutoUnwrapProxy(scope);
        const fn = new Function(...Object.keys(scope), 'return ' + expression);
        return fn(...Object.values(unwrapScope));
      }
catch (e) {
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Expression error:', expression, e);
        return '';
      }
    };

    // Lazy eval: uses with() so only variables ACTUALLY ACCESSED by the expression
    // trigger signal reads. This prevents unrelated signals (like modalOpen) from
    // being tracked as dependencies when we only care about the list signal.
    const evalLazy = (expression, extraScope = {}) => {
      try {
        if (/^__[A-Z_]+__$/.test(expression.trim())) return expression;
        const scope = { ...passedScope, ...(capturedScope || {}), ...globalHelpers, ...extraScope };
        const unwrapScope = createAutoUnwrapProxy(scope);
        // new Function body is non-strict, so with() works — only accessed
        // properties trigger the proxy's get trap and register as dependencies
        const fn = new Function('__scope__', 'with(__scope__) { return ' + expression + ' }');
        return fn(unwrapScope);
      } catch (e) {
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Expression error:', expression, e);
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

    // Map of key → item signal. When a keyed item is reused and its data
    // changes, we update the signal — all bindings (:text, :if, :class)
    // that track it automatically re-evaluate.
    const itemSignalMap = new Map();

    // Helper: create DOM element(s) for a single list item.
    // The item is wrapped in a signal so bindings track it reactively.
    const createItemElements = (item, index, key) => {
      const itemSignal = state(item);
      const indexSignal = state(index);
      if (key) itemSignalMap.set(key, { item: itemSignal, index: indexSignal });

      const itemScope = { ...passedScope, ...(capturedScope || {}), ...globalHelpers };
      itemScope[itemName] = itemSignal;
      if (indexName) itemScope[indexName] = indexSignal;

      const elements = [];
      if (isTemplate) {
        Array.from(templateContent.childNodes).forEach(node => {
          const clone = node.cloneNode(true);
          if (clone.nodeType === 1) {
            processElement(clone, itemScope);
            clone.removeAttribute('x-cloak');
            clone.querySelectorAll('[x-cloak]').forEach(c => c.removeAttribute('x-cloak'));
          }
          elements.push(clone);
        });
      } else {
        const clone = templateContent.cloneNode(true);
        processElement(clone, itemScope);
        clone.removeAttribute('x-cloak');
        clone.querySelectorAll('[x-cloak]').forEach(c => c.removeAttribute('x-cloak'));
        elements.push(clone);
      }
      return elements;
    };

    // Helper: compute key for an item
    const getItemKey = (item, index) => {
      if (!keyExpr) return String(index);
      try {
        const scope = { [itemName]: item };
        if (indexName) scope[indexName] = index;
        const fn = new Function(itemName, indexName || '_idx', 'return ' + keyExpr);
        return String(fn(item, index));
      } catch (e) {
        return String(index);
      }
    };

    effect(() => {
      // Use evalLazy for the list expression — only tracks the list signal,
      // not every signal in the component scope. This prevents unrelated
      // signals (modalOpen, menuOpen, etc.) from triggering a full rebuild.
      // Check loading state if @loading attribute provided (Feature #3)
      if (loadingExpr) {
        const isLoading = evalLazy(loadingExpr);
        if (isLoading) {
          // Dispose scopes registered by items before they leave the DOM (#1727).
          currentElements.forEach(e => { disposeSubtreeScopes(e); e.remove(); });
          currentElements = [];
          currentKeys = [];
          showLoading();
          return;
        }
      }

      hideLoading();

      // Evaluate list with LAZY tracking — only the list signal is tracked
      let list = evalLazy(listExpr);

      // Tolerate parens-on-signal in the list expression.
      //   :for="x in store.signal"   --> works (bare-ref, auto-unwrapped)
      //   :for="x in store.signal()" --> silently iterated zero, because
      //                                  the proxy unwraps the signal to
      //                                  the array on access, then the
      //                                  trailing call throws TypeError
      //                                  which evalLazy's catch swallows.
      // Retry without the trailing parens so both forms succeed.
      //
      // This runtime is emitted as a TEMPLATE LITERAL, so every backslash here
      // must be DOUBLED to survive into the shipped string. A regex literal
      // crosses only that one layer (doubled escapes ship intact). A
      // new RegExp('...') string crosses a SECOND layer too — the browser's
      // string-literal parse strips the escapes again — collapsing the pattern
      // to a bare-letter match that never fires (stacksjs/stx#1748). So use a
      // regex literal, not new RegExp(string), for patterns with backslashes.
      var trailingParens = /\\(\\s*\\)\\s*$/;
      if (!Array.isArray(list) && trailingParens.test(listExpr)) {
        list = evalLazy(listExpr.replace(trailingParens, ''));
      }
      // Second-chance fallback: if the retry returned a signal /
      // derived function (the proxy failed to auto-unwrap, which
      // can happen when the resolved owning object lacks the
      // _isStxStore marker — e.g. ad-hoc objects, locally-imported
      // shapes), call it manually. Defensive: cheap when it would
      // already be an array, useful when the proxy missed.
      if (!Array.isArray(list) && typeof list === 'function' && (list._isSignal || list._isDerived)) {
        try { list = list(); } catch { /* swallow - the warning below surfaces it */ }
      }

      // If there's an @if condition, check it
      if (ifExpr) {
        const ifValue = evalLazy(ifExpr);
        if (!ifValue) {
          // Dispose scopes registered by items before they leave the DOM (#1727).
          currentElements.forEach(e => { disposeSubtreeScopes(e); e.remove(); });
          currentElements = [];
          currentKeys = [];
          hideEmpty();
          return;
        }
      }

      if (!Array.isArray(list)) {
        // Silent return here used to mask a class of real misuse:
        // most often a signal call that threw mid-expression, or a
        // :for over undefined from a typo. One warn line saves a lot
        // of "list rendered no rows despite the data being there"
        // debugging cycles.
        //
        // Diagnostic: dump the scope identifiers so the caller can see
        // whether the expression's root identifier was in scope at all
        // (and if so, what type it was and whether it carried the
        // _isStxStore marker). Only fires on the warn path, which is
        // rare, so the extra Object.keys / spread cost is negligible.
        var diagScope;
        try {
          var diagMerged = { ...passedScope, ...(capturedScope || {}), ...globalHelpers };
          var firstIdent = listExpr.match(/^[A-Za-z_$][\\w$]*/);
          var rootName = firstIdent ? firstIdent[0] : '?';
          var rootInScope = Object.prototype.hasOwnProperty.call(diagMerged, rootName);
          var rootVal = rootInScope ? diagMerged[rootName] : '<NOT-IN-SCOPE>';
          var rootKeys = (rootVal && typeof rootVal === 'object')
            ? Object.keys(rootVal).slice(0, 8).join(',')
            : '-';
          diagScope = '[root=' + rootName + ' inScope=' + rootInScope + ' type=' + (typeof rootVal) + ' isStxStore=' + !!(rootVal && rootVal._isStxStore) + ' keys=' + rootKeys + ']';
        }
        catch (_e) { diagScope = '[diag-error]'; }
        console.warn('[STX] :for expected an array; got ' + (list === '' ? 'empty/error' : typeof list) + ' for expression "' + listExpr + '". ' + diagScope + ' If this is a signal call, try the bare reference (signal instead of signal()).');
        return;
      }

      // Check empty state (Feature #3)
      if (list.length === 0) {
        // Dispose scopes registered by items before they leave the DOM (#1727).
        currentElements.forEach(e => { disposeSubtreeScopes(e); e.remove(); });
        currentElements = [];
        currentKeys = [];
        if (emptyExpr) {
          const emptyContent = evalLazy(emptyExpr);
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

      hideEmpty();

      // ── <TransitionGroup> detection (#1742) ───────────────────────
      // Active only when the list's parent is a [data-stx-transition-group]
      // AND it has already rendered once (no enter animation on first mount).
      // tgReady gates ALL animation work, so plain :for lists are untouched.
      var tgIsGroup = !!(parent && parent.hasAttribute && parent.hasAttribute('data-stx-transition-group'));
      var tgName = tgIsGroup ? (parent.getAttribute('data-stx-transition-group') || 'v') : null;
      var tgReady = tgIsGroup && !!parent.__stx_tg_init;
      var tgFirst = tgReady ? tgSnapshot(currentElements) : null;

      // ── Key-based diffing ─────────────────────────────────────────
      // Build new key list
      const newKeys = list.map((item, i) => getItemKey(item, i));

      // Build old key → element(s) map
      const oldKeyMap = new Map();
      for (let i = 0; i < currentKeys.length; i++) {
        const k = currentKeys[i];
        if (!oldKeyMap.has(k)) oldKeyMap.set(k, []);
        oldKeyMap.get(k).push(currentElements[i]);
      }

      // Build new element list, reusing existing DOM nodes by key
      const newElements = [];
      const usedKeys = new Set();

      for (let i = 0; i < list.length; i++) {
        const key = newKeys[i];
        const existing = oldKeyMap.get(key);

        if (existing && existing.length > 0 && !usedKeys.has(key)) {
          // Reuse existing element — move to correct position
          const el = existing.shift();
          parent.insertBefore(el, placeholder);
          newElements.push(el);
          usedKeys.add(key);
          // Update the item signal so bindings re-evaluate with new data.
          // This is the fix for #1669 — without this, reused elements show
          // stale data because the old bindings captured the old item via closure.
          const signals = itemSignalMap.get(key);
          if (signals) {
            signals.item.set(list[i]);
            signals.index.set(i);
          }
        } else {
          // New item — create DOM elements with a fresh item signal
          const elements = createItemElements(list[i], i, key);
          elements.forEach(el => { parent.insertBefore(el, placeholder); if (tgReady) tgEnter(el, tgName); });
          newElements.push(...elements);
        }
      }

      // Remove old elements whose keys are no longer in the list.
      // Dispose any scopes registered inside removed items before the
      // remove() call (#1727).
      for (const [key, elements] of oldKeyMap) {
        if (!usedKeys.has(key)) {
          // In a transition group, run the leave animation and let it remove the
          // node; otherwise remove immediately. Scopes are disposed up-front
          // either way (their destroy hooks shouldn't wait on a CSS transition).
          elements.forEach(el => { disposeSubtreeScopes(el); if (!(tgReady && tgLeave(el, tgName))) el.remove(); });
          itemSignalMap.delete(key);
        }
      }

      currentElements = newElements;
      currentKeys = newKeys;

      // ── <TransitionGroup> play (#1742) ────────────────────────────
      // FLIP the surviving elements from their snapshotted positions, then mark
      // the group rendered so the next update animates.
      if (tgReady && tgFirst) tgFlip(newElements, tgFirst, tgName);
      if (tgIsGroup) parent.__stx_tg_init = true;
    });
  }

  var __bindIfCounter = 0;
  // ── x-else / x-else-if chain support (stacksjs/stx#1734) ──────────────
  // Returns { name, terminal } for an else/else-if attribute present on el,
  // or null. terminal=true for the catch-all x-else (no further siblings
  // join the chain). Checks all three prefixes (:, x-, @).
  function getElseAttrInfo(el) {
    if (!el || !el.hasAttribute) return null;
    if (el.hasAttribute(':else-if')) return { name: ':else-if', terminal: false };
    if (el.hasAttribute('x-else-if')) return { name: 'x-else-if', terminal: false };
    if (el.hasAttribute('@else-if')) return { name: '@else-if', terminal: false };
    if (el.hasAttribute(':else')) return { name: ':else', terminal: true };
    if (el.hasAttribute('x-else')) return { name: 'x-else', terminal: true };
    if (el.hasAttribute('@else')) return { name: '@else', terminal: true };
    return null;
  }

  // Walk forward from an x-if/:if/@if head element collecting consecutive
  // else-if/else siblings (nextElementSibling skips text/comment nodes, so
  // whitespace between branches is tolerated — matches Vue). Returns a chain
  // array whose first entry is the if head; trailing x-else (if any) has
  // expr=null and terminal=true.
  function findIfChain(el, ifAttr) {
    var chain = [{ el: el, attr: ifAttr, expr: el.getAttribute(ifAttr), terminal: false }];
    var sib = el.nextElementSibling;
    while (sib) {
      var info = getElseAttrInfo(sib);
      if (!info) break;
      chain.push({
        el: sib,
        attr: info.name,
        expr: info.terminal ? null : sib.getAttribute(info.name),
        terminal: info.terminal,
      });
      if (info.terminal) break; // x-else is the chain terminator
      sib = sib.nextElementSibling;
    }
    return chain;
  }

  // Reactive if/else-if/else chain. A single effect drives mutual exclusion:
  // on each run it picks the first branch whose condition is truthy (the
  // trailing x-else always matches), inserts that branch, and removes
  // whichever branch was previously shown. One effect for the whole chain
  // means branches can't transiently both render or both vanish in a tick,
  // and a single source signal isn't subscribed N times. See #1734.
  function bindIfChain(chain, passedScope = componentScope) {
    var head = chain[0].el;
    if (head.__stx_if_bound) { console.log('[stx] bindIfChain SKIPPED (head already bound):', head.tagName, chain.map(function(c) { return c.attr; }).join(',')); return; }
    console.log('[stx] bindIfChain entry:', head.tagName, 'branches:', chain.map(function(c) { return c.attr; }).join(','));

    var parent = head.parentNode;
    if (!parent) { console.warn('[STX] bindIfChain: head element has no parent, skipping'); return; }

    var capturedComponentScope = { ...passedScope };

    // Detach every branch up-front, leaving a positional placeholder comment
    // so reinsertion preserves source order. Mark each as a chain member so
    // the parent's snapshot child-iteration skips the detached (non-active)
    // branches instead of bringing their content to life. The active branch
    // is re-inserted below and IS connected, so it processes normally.
    chain.forEach(function(b) {
      b.el.__stx_if_bound = true;
      b.el.__stx_chain_member = true;
      b.capturedElementScope = findElementScope(b.el);
      b.placeholder = document.createComment('stx-if-chain');
      parent.insertBefore(b.placeholder, b.el);
      b.el.removeAttribute(b.attr);
      b.el.remove();
      b.childrenProcessed = false;
    });

    // Per-branch evaluator. Evaluated inside the chain effect via with()
    // (like evalLazy) so ONLY the signals the expression actually references
    // register as dependencies — not every signal in scope. The old form
    // (new Function(...Object.keys(scope)) called with ...Object.values of
    // the unwrap proxy) read every scope value through the proxy to build the
    // positional args, subscribing the effect to ALL scope signals, so it
    // re-ran on every unrelated mutation (#1738). with() only triggers the
    // proxy's get-trap for identifiers the expression names.
    //
    // Two passes, same as bindIf (#1733): proxy pass first (so bare-ref
    // comparisons like count === 0 read the signal as a value), raw-scope
    // retry second (so call-syntax like count() === 0 works — the proxy
    // would have unwrapped count to a value, making count() throw).
    function evalBranch(b) {
      var expression = b.expr;
      if (/^__[A-Z_]+__$/.test(expression.trim())) return expression;
      var scope = { ...capturedComponentScope, ...(b.capturedElementScope || {}), ...globalHelpers };
      try {
        var unwrapScope = createAutoUnwrapProxy(scope);
        // new Function body is non-strict, so with() works.
        var fn = new Function('__scope__', 'with(__scope__) { return ' + expression + ' }');
        return fn(unwrapScope);
      }
catch (e1) {
        try {
          var fn2 = new Function('__scope__', 'with(__scope__) { return ' + expression + ' }');
          return fn2(scope);
        }
catch (e2) {
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expression, e2);
          return '';
        }
      }
    }

    var currentIdx = -1;

    effect(function() {
      // Evaluate EVERY branch's condition each run (not for-break) so the
      // reactive tracker registers dependencies on exactly the signals the
      // branch expressions reference — and on ALL of them, so a transition
      // from a later branch back to an earlier one still re-fires. Then pick
      // the first truthy branch (terminal x-else always matches).
      //
      // Pre-fix (#1738) this used a for-break picker, which only subscribed
      // to signals up to the first truthy branch; to stay correct it then
      // eagerly read EVERY signal in scope — a sledgehammer that re-ran this
      // effect on every unrelated signal mutation in the scope (50+ no-op
      // runs per page load on real apps). Evaluating all branches subscribes
      // narrowly to just the branch signals instead.
      var pickedIdx = -1;
      for (var i = 0; i < chain.length; i++) {
        var b = chain[i];
        var matched = b.terminal ? true : !!evalBranch(b);
        if (matched && pickedIdx === -1) pickedIdx = i;
      }

      console.log('[stx] bindIfChain pick:', pickedIdx, 'of', chain.length, '(', pickedIdx >= 0 ? chain[pickedIdx].attr : 'none', ') prev:', currentIdx);
      if (pickedIdx === currentIdx) return;

      // Remove the previously-shown branch. Do NOT disposeSubtreeScopes here:
      // a chain branch is a TOGGLE (re-shown when its condition matches again),
      // not a permanent unmount, and a nested data-stx-scope inside it can't be
      // recreated once deleted from window.stx._scopes (its setup IIFE ran
      // once at page load). Deleting it broke re-show of nested scoped
      // components under reactive conditionals (#1737). Permanent disposal is
      // still handled by bindFor (item removal) and cleanupContainer (SPA nav).
      if (currentIdx !== -1) {
        chain[currentIdx].el.remove();
      }

      // Insert + process the newly-picked branch.
      if (pickedIdx !== -1) {
        var pick = chain[pickedIdx];
        pick.placeholder.parentNode.insertBefore(pick.el, pick.placeholder.nextSibling);
        pick.el.__stx_shown_at = performance.now();
        if (!pick.childrenProcessed) {
          pick.childrenProcessed = true;
          // Defer child processing (same rationale as bindIf, CLAUDE.md
          // item 35): keep child effects from subscribing to THIS chain
          // effect's tracked signals.
          (function (branch) {
            setTimeout(function () {
              var childScope = { ...capturedComponentScope, ...(branch.capturedElementScope || {}), ...globalHelpers };
              processElement(branch.el, childScope);
              branch.el.removeAttribute('x-cloak');
              branch.el.querySelectorAll('[x-cloak]').forEach(function (c) { c.removeAttribute('x-cloak'); });
            }, 0);
          })(pick);
        }
      }

      currentIdx = pickedIdx;
    });
  }

  function bindIf(el, passedScope = componentScope, attrName = '@if') {
    // Guard: prevent double-binding on the same element
    if (el.__stx_if_bound) { console.log('[stx] bindIf SKIPPED (already bound):', el.getAttribute(attrName) || '(attr removed)', 'on', el.tagName); return; }
    el.__stx_if_bound = true;

    const expr = el.getAttribute(attrName);
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
    el.removeAttribute(attrName);

    if (isTemplate) {
      // For templates, we need to handle the content fragment
      const content = el.content;
      currentNodes = Array.from(content.childNodes).map(n => n.cloneNode(true));
      // Insert cloned content initially
      currentNodes.forEach(node => parent.insertBefore(node, placeholder.nextSibling));
      el.remove(); // Remove the template element itself
    }

    // Helper to evaluate with captured scope (auto-unwraps signals).
    // Mirrors bindStyle/bindShow/evalAttrExpr: first try the auto-unwrap
    // proxy (so a bare-reference comparison like count > 5 reads the signal
    // as a primitive), then retry with the raw scope so call-syntax
    // expressions like count() === 0 or !recording() still work. The proxy
    // unwraps signals to their values, which turns count() into 0() ->
    // TypeError; pre-fix (stacksjs/stx#1733) the single catch swallowed
    // that TypeError and returned '' (falsy), silently hiding the element
    // for EVERY comparison/boolean expression. bindIf was the only
    // directive missing this retry.
    const evalExpr = (expression) => {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expression.trim())) {
        return expression;
      }
      try {
        // Use captured componentScope (with @for vars) merged with element scope
        const scope = { ...capturedComponentScope, ...(capturedElementScope || {}), ...globalHelpers };
        const unwrapScope = createAutoUnwrapProxy(scope);
        const fn = new Function(...Object.keys(scope), 'return ' + expression);
        return fn(...Object.values(unwrapScope));
      }
catch (e1) {
        try {
          // Retry without the unwrap proxy so call-syntax (signal()) works.
          const scope2 = { ...capturedComponentScope, ...(capturedElementScope || {}), ...globalHelpers };
          const fn2 = new Function(...Object.keys(scope2), 'return ' + expression);
          return fn2(...Object.values(scope2));
        }
catch (e2) {
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expression, e2);
          return '';
        }
      }
    };

    // Track if children have been processed
    let childrenProcessed = false;

    // Helper to process children with captured scope
    const processChildrenWithScope = () => {
      // Build the combined scope for children - no need to modify global componentScope
      // Just pass the scope explicitly to processElement
      const childScope = { ...capturedComponentScope, ...(capturedElementScope || {}), ...globalHelpers };


      Array.from(el.childNodes).forEach(child => processElement(child, childScope));

      childrenProcessed = true;
    };

    // Evaluate the :if expression — use direct signal read for simple refs,
    // falling back to evalExpr for complex expressions
    const fullScope = { ...capturedComponentScope, ...(capturedElementScope || {}), ...globalHelpers };
    const directSignal = fullScope[expr];

    if (directSignal) {
      console.log('[stx] bindIf direct signal for :if=' + expr, 'signal identity:', directSignal === componentScope[expr] ? 'SAME' : 'DIFFERENT', 'signal():', directSignal());
    }
    effect(() => {
      var value;
      if (directSignal && (directSignal._isSignal || directSignal._isDerived)) {
        value = directSignal();
        console.log('[stx] bindIf effect (direct):', expr, '→', value, 'isInserted:', isInserted);
      } else {
        // Complex expression: read all signals first for tracking, then evaluate
        for (var sk in fullScope) {
          var sv = fullScope[sk];
          if (sv && typeof sv === 'function' && (sv._isSignal || sv._isDerived)) sv();
        }
        value = evalExpr(expr);
      }

      if (isTemplate) {
        if (value && !isInserted) {
          // Re-insert cloned content
          currentNodes = Array.from(el.content.childNodes).map(n => n.cloneNode(true));
          currentNodes.forEach(node => parent.insertBefore(node, placeholder.nextSibling));
          // Process the new nodes — use LIVE componentScope so all functions are available
          const childScope = { ...componentScope, ...(capturedElementScope || {}) };
          currentNodes.forEach(node => {
            if (node.nodeType === 1) {
              processElement(node, childScope);
              // Remove x-cloak from processed clones
              node.removeAttribute('x-cloak');
              node.querySelectorAll('[x-cloak]').forEach(c => c.removeAttribute('x-cloak'));
            }
          });
          // Stamp insertion time for click propagation guard
          currentNodes.forEach(function(n) { if (n.nodeType === 1) n.__stx_shown_at = performance.now(); });
          isInserted = true;
        }
else if (!value && isInserted) {
          // Remove all current nodes. Do NOT disposeSubtreeScopes — :if is a
          // toggle, not a permanent unmount; see the single-element branch
          // below and #1737.
          currentNodes.forEach(node => node.remove());
          currentNodes = [];
          isInserted = false;
        }
      }
else {
        if (value && !isInserted) {
          console.log('[stx] bindIf INSERTING element for :if=' + expr);
          parent.insertBefore(el, placeholder.nextSibling);
          el.__stx_shown_at = performance.now();
          isInserted = true;
        }
else if (!value && isInserted) {
          console.log('[stx] bindIf REMOVING element for :if=' + expr, 'el.isConnected:', el.isConnected, 'parent:', parent.tagName);
          // Do NOT disposeSubtreeScopes here. :if is a TOGGLE — the element is
          // re-shown when the condition flips back — not a permanent unmount.
          // A nested data-stx-scope inside this subtree is created once by its
          // setup IIFE at page load and stored in window.stx._scopes; deleting
          // it on hide left re-show unable to recreate it, so nested scoped
          // components under reactive conditionals rendered all branches at
          // once (#1737). Permanent disposal stays in bindFor (item removal)
          // and cleanupContainer (SPA navigation). The double-bind guards make
          // re-show idempotent, so toggling doesn't leak.
          el.remove();
          isInserted = false;
          console.log('[stx] bindIf REMOVED, el.isConnected:', el.isConnected);
        }
        // Process the entire subtree when element is visible and not yet processed.
        // Defer to next microtask so child effects do not subscribe to the parent
        // bindIf tracked signals. Use capturedComponentScope (not global
        // componentScope) so iteration variables from an enclosing for-loop
        // remain in scope. Process the element itself, not just children, so
        // sibling directives on the same element (e.g. text binding alongside
        // if) fire too. The if attribute was already removed, so no recursion.
        if (value && isInserted && !childrenProcessed) {
          childrenProcessed = true;
          setTimeout(function() {
            var childScope = { ...capturedComponentScope, ...(capturedElementScope || {}), ...globalHelpers };
            processElement(el, childScope);
            // Remove x-cloak from the inserted subtree — the initial
            // cloak removal (after processElement on the root) already
            // ran before this deferred processing, so newly-inserted
            // :if children still have x-cloak and stay hidden.
            el.removeAttribute('x-cloak');
            el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
          }, 0);
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

  // provide() — share values across components (like Vue's provide/inject)
  // Usage: provide('Modal', Modal) — makes Modal accessible in all components
  function provide(name, value) {
    window[name] = value;
  }

  // ==========================================================================
  // Timer & Utility Composables
  // ==========================================================================

  function useDebounce(fn, delay) {
    delay = delay || 250;
    var timer = null;
    var lastArgs = null;
    var debounced = function() {
      lastArgs = Array.prototype.slice.call(arguments);
      if (timer !== null) clearTimeout(timer);
      var args = lastArgs;
      timer = setTimeout(function() {
        timer = null;
        lastArgs = null;
        fn.apply(null, args);
      }, delay);
    };
    debounced.cancel = function() {
      if (timer !== null) { clearTimeout(timer); timer = null; lastArgs = null; }
    };
    debounced.flush = function() {
      if (timer !== null && lastArgs !== null) {
        clearTimeout(timer); timer = null;
        var args = lastArgs; lastArgs = null;
        fn.apply(null, args);
      }
    };
    debounced.pending = function() { return timer !== null; };
    onDestroy(debounced.cancel);
    return debounced;
  }

  function useDebouncedValue(getter, delay) {
    delay = delay || 250;
    var current = getter();
    var listeners = [];
    var timer = null;
    function schedule() {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(function() {
        timer = null;
        var next = getter();
        if (next !== current) {
          current = next;
          listeners.forEach(function(fn) { fn(current); });
        }
      }, delay);
    }
    schedule();
    onDestroy(function() { if (timer !== null) clearTimeout(timer); listeners = []; });
    return {
      get value() { return current; },
      subscribe: function(fn) {
        listeners.push(fn);
        return function() { listeners = listeners.filter(function(f) { return f !== fn; }); };
      }
    };
  }

  function useThrottle(fn, limit) {
    limit = limit || 250;
    var timer = null;
    var lastRan = 0;
    var throttled = function() {
      var args = Array.prototype.slice.call(arguments);
      var now = Date.now();
      var remaining = limit - (now - lastRan);
      if (remaining <= 0) {
        if (timer !== null) { clearTimeout(timer); timer = null; }
        lastRan = now;
        fn.apply(null, args);
      }
else if (timer === null) {
        timer = setTimeout(function() {
          lastRan = Date.now();
          timer = null;
          fn.apply(null, args);
        }, remaining);
      }
    };
    throttled.cancel = function() {
      if (timer !== null) { clearTimeout(timer); timer = null; }
    };
    onDestroy(throttled.cancel);
    return throttled;
  }

  function useInterval(interval, options) {
    interval = interval || 1000;
    options = options || {};
    var count = 0;
    var id = null;
    var running = false;
    var listeners = [];
    function tick() {
      count++;
      listeners.forEach(function(fn) { fn(count); });
    }
    function resume() {
      if (running) return;
      running = true;
      id = setInterval(tick, interval);
      if (options.immediate) tick();
    }
    function pause() {
      if (!running) return;
      running = false;
      if (id !== null) { clearInterval(id); id = null; }
    }
    function reset() {
      pause();
      count = 0;
      listeners.forEach(function(fn) { fn(count); });
      resume();
    }
    resume();
    onDestroy(function() { pause(); listeners = []; });
    return {
      get counter() { return count; },
      pause: pause,
      resume: resume,
      reset: reset,
      subscribe: function(fn) {
        listeners.push(fn);
        return function() { listeners = listeners.filter(function(f) { return f !== fn; }); };
      }
    };
  }

  function useTimeout(callback, delay) {
    delay = delay || 1000;
    var timer = null;
    var pending = false;
    var listeners = [];
    function setPending(v) {
      if (v !== pending) {
        pending = v;
        listeners.forEach(function(fn) { fn(pending); });
      }
    }
    function start() {
      stop();
      setPending(true);
      timer = setTimeout(function() {
        timer = null;
        setPending(false);
        callback();
      }, delay);
    }
    function stop() {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      setPending(false);
    }
    start();
    onDestroy(stop);
    return {
      get isPending() { return pending; },
      start: start,
      stop: stop,
      subscribe: function(fn) {
        listeners.push(fn);
        return function() { listeners = listeners.filter(function(f) { return f !== fn; }); };
      }
    };
  }

  function useToggle(initial) {
    var current = !!initial;
    var listeners = [];
    function notify() { listeners.forEach(function(fn) { fn(current); }); }
    function toggle() { current = !current; notify(); }
    function set(v) { v = !!v; if (v !== current) { current = v; notify(); } }
    var ref = {
      get value() { return current; },
      subscribe: function(fn) {
        listeners.push(fn);
        return function() { listeners = listeners.filter(function(f) { return f !== fn; }); };
      }
    };
    return [ref, toggle, set];
  }

  function useCounter(initial, options) {
    initial = initial || 0;
    options = options || {};
    var min = options.min != null ? options.min : -Infinity;
    var max = options.max != null ? options.max : Infinity;
    function clamp(v) { return Math.min(max, Math.max(min, v)); }
    var current = clamp(initial);
    var listeners = [];
    function notify() { listeners.forEach(function(fn) { fn(current); }); }
    return {
      get count() { return current; },
      inc: function(step) { current = clamp(current + (step || 1)); notify(); },
      dec: function(step) { current = clamp(current - (step || 1)); notify(); },
      set: function(v) { current = clamp(v); notify(); },
      reset: function() { current = clamp(initial); notify(); },
      subscribe: function(fn) {
        listeners.push(fn);
        return function() { listeners = listeners.filter(function(f) { return f !== fn; }); };
      }
    };
  }

  function useClickOutside(target, handler) {
    function listener(event) {
      var el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;
      if (el === event.target || el.contains(event.target)) return;
      handler(event);
    }
    document.addEventListener('pointerdown', listener, true);
    function remove() { document.removeEventListener('pointerdown', listener, true); }
    onDestroy(remove);
    return { remove: remove };
  }

  function useFocus(target) {
    var focused = false;
    var listeners = [];
    function resolve() {
      return typeof target === 'string' ? document.querySelector(target) : target;
    }
    function setFocused(v) {
      if (v !== focused) {
        focused = v;
        listeners.forEach(function(fn) { fn(focused); });
      }
    }
    var onFocusIn = function() { setFocused(true); };
    var onBlurOut = function() { setFocused(false); };
    var el = resolve();
    if (el) {
      el.addEventListener('focus', onFocusIn);
      el.addEventListener('blur', onBlurOut);
      focused = document.activeElement === el;
    }
    onDestroy(function() {
      var el = resolve();
      if (el) { el.removeEventListener('focus', onFocusIn); el.removeEventListener('blur', onBlurOut); }
      listeners = [];
    });
    return {
      get isFocused() { return focused; },
      focus: function() { var el = resolve(); if (el && el.focus) el.focus(); },
      blur: function() { var el = resolve(); if (el && el.blur) el.blur(); },
      subscribe: function(fn) {
        listeners.push(fn);
        return function() { listeners = listeners.filter(function(f) { return f !== fn; }); };
      }
    };
  }

  function useAsync(fn, options) {
    options = options || {};
    var asyncState = 'idle';
    var data = null;
    var error = null;
    var listeners = [];
    function notify() {
      var snap = { state: asyncState, data: data, error: error };
      listeners.forEach(function(fn) { fn(snap); });
    }
    function execute() {
      var args = Array.prototype.slice.call(arguments);
      asyncState = 'loading'; error = null; notify();
      return fn.apply(null, args).then(function(result) {
        data = result; asyncState = 'success'; notify(); return data;
      }).catch(function(e) {
        error = e instanceof Error ? e : new Error(String(e));
        asyncState = 'error'; notify(); return null;
      });
    }
    if (options.immediate) execute();
    return {
      get state() { return asyncState; },
      get isLoading() { return asyncState === 'loading'; },
      get error() { return error; },
      get data() { return data; },
      execute: execute,
      subscribe: function(fn) {
        listeners.push(fn);
        return function() { listeners = listeners.filter(function(f) { return f !== fn; }); };
      }
    };
  }

  function useColorMode(options) {
    options = options || {};
    var storageKey = options.storageKey || 'stx-color-mode';
    var initialMode = options.initialMode || 'auto';
    var darkClass = options.darkClass || 'dark';
    var attribute = options.attribute || null;
    var disableTransitions = options.disableTransitions !== false;
    var preference = initialMode;
    var resolved = 'light';
    var listeners = [];
    var cleanups = [];

    function getSystem() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function resolve(pref) { return pref === 'auto' ? getSystem() : pref; }
    function applyDOM(mode) {
      var el = document.documentElement;
      if (disableTransitions) el.style.setProperty('transition', 'none', 'important');
      if (attribute) { el.setAttribute(attribute, mode); }
      else { if (mode === 'dark') el.classList.add(darkClass); else el.classList.remove(darkClass); }
      if (disableTransitions) { el.offsetHeight; el.style.removeProperty('transition'); }
    }
    function persist(pref) { try { localStorage.setItem(storageKey, pref); }
catch (e) {} }
    function readPersisted() {
      try { var v = localStorage.getItem(storageKey); if (v === 'light' || v === 'dark' || v === 'auto') return v; }
catch (e) {}
      return null;
    }
    function update(pref) {
      preference = pref;
      resolved = resolve(pref);
      applyDOM(resolved);
      persist(pref);
      listeners.forEach(function(fn) { fn(resolved, preference); });
    }

    var persisted = readPersisted();
    update(persisted || initialMode);

    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    var onSystemChange = function() {
      if (preference === 'auto') {
        resolved = getSystem();
        applyDOM(resolved);
        listeners.forEach(function(fn) { fn(resolved, preference); });
      }
    };
    mql.addEventListener('change', onSystemChange);
    cleanups.push(function() { mql.removeEventListener('change', onSystemChange); });

    var onStorage = function(e) {
      if (e.key !== storageKey) return;
      var v = e.newValue;
      if (v === 'light' || v === 'dark' || v === 'auto') {
        preference = v; resolved = resolve(v); applyDOM(resolved);
        listeners.forEach(function(fn) { fn(resolved, preference); });
      }
    };
    window.addEventListener('storage', onStorage);
    cleanups.push(function() { window.removeEventListener('storage', onStorage); });

    onDestroy(function() { cleanups.forEach(function(fn) { fn(); }); listeners = []; });

    return {
      get mode() { return resolved; },
      get preference() { return preference; },
      get isDark() { return resolved === 'dark'; },
      set: function(mode) { update(mode); },
      toggle: function() { update(resolved === 'dark' ? 'light' : 'dark'); },
      subscribe: function(fn) {
        listeners.push(fn);
        return function() { listeners = listeners.filter(function(f) { return f !== fn; }); };
      }
    };
  }

  function useDark(options) {
    var cm = useColorMode(options);
    return {
      get isDark() { return cm.isDark; },
      toggle: function() { cm.toggle(); },
      set: function(dark) { cm.set(dark ? 'dark' : 'light'); },
      subscribe: function(fn) {
        return cm.subscribe(function(mode) { fn(mode === 'dark'); });
      }
    };
  }

  // Vue-compat aliases
  var ref = state;
  var reactive = state;
  var computed = derived;
  var watch = $watch;
  var watchEffect = function(fn) { return effect(fn); };

  function useLocalStorage(key, defaultValue) {
    var stored = localStorage.getItem(key);
    var initial = stored !== null ? JSON.parse(stored) : defaultValue;
    var s = state(initial);
    effect(function() {
      localStorage.setItem(key, JSON.stringify(s()));
    });
    var handler = function(e) {
      if (e.key === key) s.set(e.newValue !== null ? JSON.parse(e.newValue) : defaultValue);
    };
    window.addEventListener('storage', handler);
    onDestroy(function() { window.removeEventListener('storage', handler); });
    return s;
  }

  // Mirror of useLocalStorage against sessionStorage. Strict-mode lint
  // already suggests this function name as the replacement for raw
  // window.sessionStorage access; this is the implementation that backs
  // that hint. Same JSON serialization, cross-tab sync via the 'storage'
  // event (filtered to sessionStorage's storageArea — localStorage events
  // share the same listener but fire from a different area).
  function useSessionStorage(key, defaultValue) {
    var stored = sessionStorage.getItem(key);
    var initial = stored !== null ? JSON.parse(stored) : defaultValue;
    var s = state(initial);
    effect(function() {
      sessionStorage.setItem(key, JSON.stringify(s()));
    });
    var handler = function(e) {
      if (e.key === key && e.storageArea === sessionStorage)
        s.set(e.newValue !== null ? JSON.parse(e.newValue) : defaultValue);
    };
    window.addEventListener('storage', handler);
    onDestroy(function() { window.removeEventListener('storage', handler); });
    return s;
  }

  // Reactive cookie binding. Mirrors useLocalStorage's shape: returns a string-
  // valued signal, writes on .set(), and respects cookie attributes via opts.
  // Setting the signal to '' deletes the cookie (max-age=0). Cookies don't fire
  // a 'storage' event, so cross-tab updates aren't auto-reflected; consumers
  // that need that can poll on 'visibilitychange' themselves. See issue #1701.
  function useCookie(name, opts) {
    opts = opts || {};
    var encode = opts.encode || encodeURIComponent;
    var decode = opts.decode || decodeURIComponent;
    // Escape cookie name so dots/brackets/etc. read safely through the matcher.
    var escapedName = name.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
    var nameRe = new RegExp('(?:^|; )' + escapedName + '=([^;]*)');
    function read() {
      if (typeof document === 'undefined') return opts.defaultValue || '';
      var m = document.cookie.match(nameRe);
      return m ? decode(m[1]) : (opts.defaultValue || '');
    }
    var s = state(read());
    function serialise(value) {
      var parts = [name + '=' + (value ? encode(value) : '')];
      parts.push('path=' + (opts.path || '/'));
      if (opts.domain) parts.push('domain=' + opts.domain);
      if (value === '') parts.push('max-age=0');
      else if (typeof opts.maxAge === 'number') parts.push('max-age=' + opts.maxAge);
      else if (opts.expires) parts.push('expires=' + opts.expires.toUTCString());
      parts.push('SameSite=' + (opts.sameSite || 'Lax'));
      var secure = opts.secure;
      if (secure === undefined) secure = typeof location !== 'undefined' && location.protocol === 'https:';
      if (secure) parts.push('Secure');
      return parts.join('; ');
    }
    effect(function() {
      if (typeof document === 'undefined') return;
      document.cookie = serialise(s());
    });
    return s;
  }

  // Reactive prop binding. Bridges the gap between a parent's clientReactive
  // attribute (e.g. :open="modalOpen()" on a component) and the component's
  // internal state. Returns a signal whose value tracks the named attribute
  // on the component's root element — when the parent's expression changes
  // and bindAttr updates the attribute, a MutationObserver on the root
  // forwards the change into this signal. See stacksjs/stx#1704.
  //
  // Parse heuristic (override via opts.parse for typed props):
  //   - empty string or "true" → true
  //   - "false" → false
  //   - numeric-looking → Number
  //   - otherwise → original string
  //
  // The signal is one-way (parent → child). For two-way binding, components
  // still emit events (@input / @change / @close) and the parent
  // updates its source signal. The signal's own .set() won't propagate back
  // through the attribute by design; that prevents observer feedback loops.
  function useReactiveProp(name, defaultValue, opts) {
    opts = opts || {};
    var parse = opts.parse || function(v) {
      if (v === '' || v === 'true') return true;
      if (v === 'false') return false;
      if (v != null && v !== '' && !isNaN(Number(v))) return Number(v);
      return v;
    };
    var root = window.__STX_CURRENT_ELEMENT__;
    var initial;
    if (root && root.hasAttribute && root.hasAttribute(name)) {
      initial = parse(root.getAttribute(name));
    } else {
      initial = defaultValue;
    }
    var s = state(initial);
    if (!root) return s;
    var observer = new MutationObserver(function() {
      var hasAttr = root.hasAttribute(name);
      var next = hasAttr ? parse(root.getAttribute(name)) : defaultValue;
      if (next !== s()) s.set(next);
    });
    observer.observe(root, { attributes: true, attributeFilter: [name] });
    onDestroy(function() { observer.disconnect(); });
    return s;
  }

  function useEventListener(event, handler, options) {
    var target = (options && options.target) || window;
    if (typeof target === 'string') target = document.querySelector(target);
    if (!target) return;
    var opts = { capture: options && options.capture, passive: options && options.passive, once: options && options.once };
    target.addEventListener(event, handler, opts);
    onDestroy(function() { target.removeEventListener(event, handler, opts); });
  }

  // ==========================================================================
  // Client-side useHead / useSeoMeta
  // ==========================================================================

  function useHead(config) {
    function apply() {
      if (config.title) document.title = config.title;
      // Process meta tags
      var metas = config.meta || [];
      for (var i = 0; i < metas.length; i++) {
        var m = metas[i];
        if (!m.name && !m.property) continue;
        var selector = m.name ? 'meta[name="' + m.name + '"]' : 'meta[property="' + m.property + '"]';
        var el = document.querySelector(selector);
        if (el) {
          el.setAttribute('content', m.content || '');
        } else {
          el = document.createElement('meta');
          if (m.name) el.setAttribute('name', m.name);
          if (m.property) el.setAttribute('property', m.property);
          el.setAttribute('content', m.content || '');
          document.head.appendChild(el);
        }
      }
      // Process link tags
      var links = config.link || config.links || [];
      for (var j = 0; j < links.length; j++) {
        var l = links[j];
        if (!l.rel || !l.href) continue;
        var linkSel = 'link[rel="' + l.rel + '"][href="' + l.href + '"]';
        if (!document.querySelector(linkSel)) {
          var le = document.createElement('link');
          for (var k in l) { if (l.hasOwnProperty(k)) le.setAttribute(k, l[k]); }
          document.head.appendChild(le);
        }
      }
      // Script tags
      var scripts = config.script || config.scripts || [];
      for (var si = 0; si < scripts.length; si++) {
        var s = scripts[si];
        var se = document.createElement('script');
        if (s.src) se.src = s.src;
        if (s.innerHTML) se.innerHTML = s.innerHTML;
        if (s.async) se.async = true;
        if (s.defer) se.defer = true;
        document.head.appendChild(se);
      }
      // Body class
      if (config.bodyAttrs && config.bodyAttrs.class) {
        config.bodyAttrs.class.split(' ').forEach(function(cls) { if (cls) document.body.classList.add(cls); });
      }
      // Html lang
      if (config.htmlAttrs && config.htmlAttrs.lang) {
        document.documentElement.setAttribute('lang', config.htmlAttrs.lang);
      }
    }
    // Apply immediately if DOM is ready, otherwise on mount
    if (document.readyState !== 'loading') { apply(); }
    else { onMount(apply); }
  }

  function useSeoMeta(config) {
    var meta = [];
    if (config.title) meta.push({ name: 'title', content: config.title });
    if (config.description) meta.push({ name: 'description', content: config.description });
    if (config.ogTitle) meta.push({ property: 'og:title', content: config.ogTitle });
    if (config.ogDescription) meta.push({ property: 'og:description', content: config.ogDescription });
    if (config.ogImage) meta.push({ property: 'og:image', content: config.ogImage });
    if (config.ogType) meta.push({ property: 'og:type', content: config.ogType });
    if (config.ogUrl) meta.push({ property: 'og:url', content: config.ogUrl });
    if (config.twitterCard) meta.push({ name: 'twitter:card', content: config.twitterCard });
    if (config.twitterTitle) meta.push({ name: 'twitter:title', content: config.twitterTitle });
    if (config.twitterDescription) meta.push({ name: 'twitter:description', content: config.twitterDescription });
    if (config.twitterImage) meta.push({ name: 'twitter:image', content: config.twitterImage });
    if (config.robots) meta.push({ name: 'robots', content: config.robots });
    if (config.canonical) meta.push({ property: 'og:url', content: config.canonical });
    useHead({ title: config.title || config.ogTitle, meta: meta });
  }

  // ==========================================================================
  // Toast notification system
  // ==========================================================================

  var _toastId = 0;
  var _toastIcons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  var _toastColors = {
    success: '#16a34a',
    error: '#dc2626',
    info: '#2563eb',
    warning: '#d97706'
  };

  function _getToastContainer() {
    return document.getElementById('stx-toast-container');
  }

  function _getToastAnimClass(container) {
    if (!container) return { inAnim: 'stx-toast-in', outAnim: 'stx-toast-out' };
    var pos = container.getAttribute('data-stx-toast-position') || 'top-right';
    if (pos.indexOf('left') !== -1) return { inAnim: 'stx-toast-in-left', outAnim: 'stx-toast-out-left' };
    if (pos.indexOf('center') !== -1) return { inAnim: 'stx-toast-in-center', outAnim: 'stx-toast-out-center' };
    return { inAnim: 'stx-toast-in', outAnim: 'stx-toast-out' };
  }

  function removeToast(id) {
    var el = document.getElementById('stx-toast-' + id);
    if (!el) return;
    var container = _getToastContainer();
    var anims = _getToastAnimClass(container);
    el.style.animation = anims.outAnim + ' 0.3s ease forwards';
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }

  function addToast(type, message, options) {
    var container = _getToastContainer();
    if (!container) {
      console.warn('[stx:toast] No <StxToast /> container found. Add <StxToast /> to your layout.');
      return -1;
    }
    var opts = options || {};
    var duration = opts.duration !== undefined ? opts.duration : 3000;
    var id = ++_toastId;
    var maxToasts = parseInt(container.getAttribute('data-stx-toast-max') || '5', 10);

    // Enforce max toasts — remove oldest
    var existing = container.querySelectorAll('[data-stx-toast]');
    while (existing.length >= maxToasts && existing.length > 0) {
      var oldId = existing[0].getAttribute('data-stx-toast');
      removeToast(oldId);
      existing = container.querySelectorAll('[data-stx-toast]');
    }

    var anims = _getToastAnimClass(container);
    var borderColor = _toastColors[type] || _toastColors.info;
    var icon = _toastIcons[type] || _toastIcons.info;
    var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var bg = isDark ? '#1f2937' : '#ffffff';
    var textColor = isDark ? '#f3f4f6' : '#1f2937';
    var shadow = isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)';

    var el = document.createElement('div');
    el.id = 'stx-toast-' + id;
    el.setAttribute('data-stx-toast', String(id));
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.style.cssText = 'pointer-events:auto;display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem 1rem;border-radius:0.5rem;border-left:4px solid ' + borderColor + ';background:' + bg + ';color:' + textColor + ';box-shadow:' + shadow + ';animation:' + anims.inAnim + ' 0.3s ease;font-family:system-ui,-apple-system,sans-serif;font-size:0.875rem;line-height:1.4;max-width:100%';

    var iconSpan = document.createElement('span');
    iconSpan.style.cssText = 'flex-shrink:0;display:flex;align-items:center;margin-top:1px';
    iconSpan.innerHTML = icon;

    var msgSpan = document.createElement('span');
    msgSpan.style.cssText = 'flex:1;word-wrap:break-word';
    msgSpan.textContent = message;

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.style.cssText = 'flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;color:' + (isDark ? '#9ca3af' : '#6b7280') + ';font-size:1.125rem;line-height:1;display:flex;align-items:center';
    closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>';
    closeBtn.onclick = function() { removeToast(id); };

    el.appendChild(iconSpan);
    el.appendChild(msgSpan);
    el.appendChild(closeBtn);
    container.appendChild(el);

    if (duration > 0) {
      setTimeout(function() { removeToast(id); }, duration);
    }

    return id;
  }

  var toast = {
    success: function(message, options) { return addToast('success', message, options); },
    error: function(message, options) { return addToast('error', message, options); },
    info: function(message, options) { return addToast('info', message, options); },
    warning: function(message, options) { return addToast('warning', message, options); },
    dismiss: function(id) {
      if (id !== undefined) { removeToast(id); return; }
      var container = _getToastContainer();
      if (!container) return;
      var all = container.querySelectorAll('[data-stx-toast]');
      for (var i = 0; i < all.length; i++) {
        var tid = all[i].getAttribute('data-stx-toast');
        removeToast(tid);
      }
    }
  };

  // ── Modal system ──────────────────────────────────────────────────
  var modal = {
    open: function(id) {
      var el = document.querySelector('[data-stx-modal="' + id + '"]');
      if (!el) { console.warn('[stx:modal] Modal "' + id + '" not found'); return; }
      el.style.display = 'flex';
      // Force reflow then animate
      void el.offsetHeight;
      el.setAttribute('data-stx-modal-open', '');
      document.body.style.overflow = 'hidden';
      // Escape key handler
      if (el.getAttribute('data-close-escape') !== 'false') {
        var escHandler = function(e) {
          if (e.key === 'Escape') { modal.close(id); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
        el._stxEscHandler = escHandler;
      }
      // Backdrop click
      if (el.getAttribute('data-close-backdrop') !== 'false') {
        el.onclick = function(e) { if (e.target === el) modal.close(id); };
      }
    },
    close: function(id) {
      var el = document.querySelector('[data-stx-modal="' + id + '"]');
      if (!el) return;
      el.removeAttribute('data-stx-modal-open');
      if (el._stxEscHandler) { document.removeEventListener('keydown', el._stxEscHandler); el._stxEscHandler = null; }
      el.onclick = null;
      setTimeout(function() {
        el.style.display = 'none';
        // Restore scroll if no other modals are open
        if (!document.querySelector('[data-stx-modal-open]')) document.body.style.overflow = '';
      }, 200);
    },
    toggle: function(id) {
      var el = document.querySelector('[data-stx-modal="' + id + '"]');
      if (el && el.hasAttribute('data-stx-modal-open')) modal.close(id);
      else modal.open(id);
    }
  };

  // ── Alert & Confirm dialogs ─────────────────────────────────────
  // Styled replacements for window.alert() and window.confirm().
  // Both return Promises and render into a temporary modal overlay.

  var _dialogId = 0;
  var _dialogIcons = {
    info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    question: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  function _createDialog(message, options, isConfirm) {
    var opts = options || {};
    var type = opts.type || (isConfirm ? 'question' : 'info');
    var title = opts.title || '';
    var confirmText = opts.confirmText || 'OK';
    var cancelText = opts.cancelText || 'Cancel';
    var id = 'stx-dialog-' + (++_dialogId);
    var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var bg = isDark ? '#1f2937' : '#ffffff';
    var textColor = isDark ? '#f3f4f6' : '#1f2937';
    var subColor = isDark ? '#9ca3af' : '#6b7280';
    var icon = _dialogIcons[type] || _dialogIcons.info;

    return new Promise(function(resolve) {
      var backdrop = document.createElement('div');
      backdrop.id = id;
      backdrop.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px);opacity:0;transition:opacity 0.2s ease;font-family:system-ui,-apple-system,sans-serif';
      backdrop.setAttribute('role', 'alertdialog');
      backdrop.setAttribute('aria-modal', 'true');

      var panel = document.createElement('div');
      panel.style.cssText = 'max-width:24rem;width:calc(100% - 2rem);border-radius:0.75rem;padding:1.5rem;background:' + bg + ';color:' + textColor + ';box-shadow:0 20px 60px rgba(0,0,0,0.3);transform:scale(0.95);transition:transform 0.2s ease;text-align:center';

      var iconDiv = document.createElement('div');
      iconDiv.style.cssText = 'display:flex;justify-content:center;margin-bottom:1rem';
      iconDiv.innerHTML = icon;
      panel.appendChild(iconDiv);

      if (title) {
        var titleEl = document.createElement('h3');
        titleEl.style.cssText = 'margin:0 0 0.5rem;font-size:1.125rem;font-weight:600';
        titleEl.textContent = title;
        panel.appendChild(titleEl);
      }

      var msgEl = document.createElement('p');
      msgEl.style.cssText = 'margin:0 0 1.25rem;font-size:0.875rem;line-height:1.5;color:' + subColor;
      msgEl.textContent = message;
      panel.appendChild(msgEl);

      var btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:0.75rem;justify-content:center';

      function cleanup(result) {
        backdrop.style.opacity = '0';
        panel.style.transform = 'scale(0.95)';
        setTimeout(function() { backdrop.remove(); }, 200);
        resolve(result);
      }

      if (isConfirm) {
        var cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.style.cssText = 'padding:0.5rem 1.25rem;border-radius:0.5rem;font-size:0.875rem;font-weight:500;cursor:pointer;border:1px solid ' + (isDark ? '#374151' : '#d1d5db') + ';background:transparent;color:' + textColor + ';transition:background 0.15s';
        cancelBtn.onmouseover = function() { this.style.background = isDark ? '#374151' : '#f3f4f6'; };
        cancelBtn.onmouseout = function() { this.style.background = 'transparent'; };
        cancelBtn.onclick = function() { cleanup(false); };
        btnRow.appendChild(cancelBtn);
      }

      var okBtn = document.createElement('button');
      okBtn.textContent = confirmText;
      var btnColor = type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#5672cd';
      okBtn.style.cssText = 'padding:0.5rem 1.25rem;border-radius:0.5rem;font-size:0.875rem;font-weight:500;cursor:pointer;border:none;background:' + btnColor + ';color:#fff;transition:opacity 0.15s';
      okBtn.onmouseover = function() { this.style.opacity = '0.9'; };
      okBtn.onmouseout = function() { this.style.opacity = '1'; };
      okBtn.onclick = function() { cleanup(isConfirm ? true : undefined); };
      btnRow.appendChild(okBtn);

      panel.appendChild(btnRow);
      backdrop.appendChild(panel);
      document.body.appendChild(backdrop);

      // Animate in
      void backdrop.offsetHeight;
      backdrop.style.opacity = '1';
      panel.style.transform = 'scale(1)';

      // Escape key
      var escHandler = function(e) {
        if (e.key === 'Escape') { cleanup(isConfirm ? false : undefined); document.removeEventListener('keydown', escHandler); }
      };
      document.addEventListener('keydown', escHandler);

      // Focus the primary button
      okBtn.focus();
    });
  }

  function stxAlert(message, options) {
    return _createDialog(message, options, false);
  }

  function stxConfirm(message, options) {
    return _createDialog(message, options, true);
  }

  // ── Drawer system ───────────────────────────────────────────────
  // Same pattern as modal but slides from a side
  var drawer = {
    open: function(id) {
      var el = document.querySelector('[data-stx-drawer="' + id + '"]');
      if (!el) { console.warn('[stx:drawer] Drawer "' + id + '" not found'); return; }
      el.style.display = 'flex';
      void el.offsetHeight;
      el.setAttribute('data-stx-drawer-open', '');
      document.body.style.overflow = 'hidden';
      if (el.getAttribute('data-close-escape') !== 'false') {
        var escHandler = function(e) {
          if (e.key === 'Escape') { drawer.close(id); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
        el._stxEscHandler = escHandler;
      }
      if (el.getAttribute('data-close-backdrop') !== 'false') {
        el.onclick = function(e) { if (e.target === el) drawer.close(id); };
      }
    },
    close: function(id) {
      var el = document.querySelector('[data-stx-drawer="' + id + '"]');
      if (!el) return;
      el.removeAttribute('data-stx-drawer-open');
      if (el._stxEscHandler) { document.removeEventListener('keydown', el._stxEscHandler); el._stxEscHandler = null; }
      el.onclick = null;
      setTimeout(function() {
        el.style.display = 'none';
        if (!document.querySelector('[data-stx-drawer-open]') && !document.querySelector('[data-stx-modal-open]')) document.body.style.overflow = '';
      }, 300);
    },
    toggle: function(id) {
      var el = document.querySelector('[data-stx-drawer="' + id + '"]');
      if (el && el.hasAttribute('data-stx-drawer-open')) drawer.close(id);
      else drawer.open(id);
    }
  };

  // ── Tooltip runtime ─────────────────────────────────────────────
  (function() {
    var tip = null;
    function createTip() {
      tip = document.createElement('div');
      tip.id = 'stx-tooltip';
      tip.style.cssText = 'position:absolute;z-index:999999;pointer-events:none;background:#1f2937;color:#fff;font-size:12px;line-height:1.4;padding:6px 10px;border-radius:6px;max-width:250px;word-wrap:break-word;opacity:0;transition:opacity 0.15s ease;white-space:pre-wrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)';
      document.body.appendChild(tip);
    }
    function show(el) {
      if (!tip) createTip();
      var text = el.getAttribute('x-tooltip');
      if (!text) return;
      tip.textContent = text;
      tip.style.display = 'block';
      tip.style.opacity = '0';
      var pos = el.getAttribute('x-tooltip-position') || 'top';
      var rect = el.getBoundingClientRect();
      var tw = tip.offsetWidth;
      var th = tip.offsetHeight;
      var sx = window.scrollX;
      var sy = window.scrollY;
      var left, top;
      if (pos === 'bottom') { left = rect.left + rect.width / 2 - tw / 2; top = rect.bottom + 8; }
      else if (pos === 'left') { left = rect.left - tw - 8; top = rect.top + rect.height / 2 - th / 2; }
      else if (pos === 'right') { left = rect.right + 8; top = rect.top + rect.height / 2 - th / 2; }
      else { left = rect.left + rect.width / 2 - tw / 2; top = rect.top - th - 8; if (top < 0) { top = rect.bottom + 8; } }
      if (left < 4) left = 4;
      if (left + tw > window.innerWidth - 4) left = window.innerWidth - tw - 4;
      tip.style.left = (left + sx) + 'px';
      tip.style.top = (top + sy) + 'px';
      tip.style.opacity = '1';
    }
    function hide() { if (tip) { tip.style.opacity = '0'; setTimeout(function() { if (tip) tip.style.display = 'none'; }, 150); } }
    document.addEventListener('mouseover', function(e) { var el = e.target.closest('[x-tooltip]'); if (el) show(el); });
    document.addEventListener('mouseout', function(e) { var el = e.target.closest('[x-tooltip]'); if (el) hide(); });
    document.addEventListener('focusin', function(e) { var el = e.target.closest('[x-tooltip]'); if (el) show(el); });
    document.addEventListener('focusout', function(e) { var el = e.target.closest('[x-tooltip]'); if (el) hide(); });
  })();

  // Component mount system
  var mountQueue = [];

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
    useRef,
    navigate,
    goBack,
    goForward,
    useRoute,
    setRouteParams,
    useSearchParams,
    useQuery,
    useMutation,
    useOptimistic,
    provide,
    $computed,
    $watch,
    ref,
    reactive,
    computed,
    watch,
    watchEffect,
    useDebounce,
    useDebouncedValue,
    useThrottle,
    useInterval,
    useTimeout,
    useToggle,
    useCounter,
    useClickOutside,
    useFocus,
    useAsync,
    useLocalStorage,
    useSessionStorage,
    useCookie,
    useReactiveProp,
    useEventListener,
    useWebSocket,
    useColorMode,
    useDark,
    useHead,
    useSeoMeta,
    // Client-side no-op for definePageMeta — the real implementation registers
    // page metadata (middleware / validate / etc.) at SSR/SSG time. Pages that
    // call it inside a bare <script> or <script client> would otherwise hit
    // ReferenceError on hydration; this shim lets shared client/server code
    // call it safely.
    definePageMeta: function() {},
    toast,
    modal,
    drawer,
    alert: stxAlert,
    confirm: stxConfirm,
    helpers: globalHelpers,

    // Component composition API (Phase 4)
    defineProps: function(definitions) {
      var props = window.__STX_CURRENT_PROPS__ || {};
      if (!definitions) return props;
      var result = Object.assign({}, props);
      for (var key in definitions) {
        if (!definitions.hasOwnProperty(key)) continue;
        var def = definitions[key];
        var opts = (typeof def === 'function' || Array.isArray(def)) ? { type: def } : (def || {});
        if (result[key] === undefined && opts['default'] !== undefined) {
          result[key] = typeof opts['default'] === 'function' ? opts['default']() : opts['default'];
        }
      }
      return result;
    },
    withDefaults: function(props, defaults) {
      var result = Object.assign({}, props);
      for (var key in defaults) {
        if (!defaults.hasOwnProperty(key)) continue;
        if (result[key] === undefined) {
          result[key] = typeof defaults[key] === 'function' ? defaults[key]() : defaults[key];
        }
      }
      return result;
    },
    defineEmits: function() {
      var el = window.__STX_CURRENT_ELEMENT__ || null;
      return function(event, payload) {
        var target = el || document.body;
        target.dispatchEvent(new CustomEvent(event, { detail: payload, bubbles: true, cancelable: true }));
      };
    },
    defineExpose: function(exposed) {
      var el = window.__STX_CURRENT_ELEMENT__;
      if (el) el.__stx_exposed = exposed;
    },
    defineSlots: function() {
      return window.__STX_CURRENT_SLOTS__ || {};
    },

    _mountCallbacks: mountCallbacks,
    _destroyCallbacks: destroyCallbacks,
    _cleanupContainer: cleanupContainer,
    _registerSuspense: registerSuspense,  // <Suspense> query registration (#1742)
    _tg: { enter: tgEnter, leave: tgLeave, flip: tgFlip, snapshot: tgSnapshot },  // <TransitionGroup> helpers (#1742)
    _scopes: {},  // Component-level scopes
    _scopeCounter: 0,  // Counter for generating unique scope IDs during SPA navigation
    _latestSetup: null,  // Latest SFC setup function (for SPA re-initialization)
    _stores: new Map(),  // Global store registry — survives SPA navigation

    // ── Store System ──
    // Pinia-inspired, signals-based. Stores survive SPA navigation.

    defineStore: function(id, setupOrOptions, storeOptions) {
      console.log('[stx:store] defineStore called:', id, 'type:', typeof setupOrOptions === 'function' ? 'setup' : 'options', 'persist:', !!(storeOptions && storeOptions.persist));
      // Return existing store if already defined
      if (window.stx._stores.has(id)) {
        console.log('[stx:store] returning existing store:', id);
        return window.stx._stores.get(id);
      }

      // Determine setup function
      var setupFn;
      if (typeof setupOrOptions === 'function') {
        // Setup style: defineStore('id', () => { ... })
        setupFn = setupOrOptions;
      } else {
        // Options style: defineStore('id', { state, getters, actions })
        var opts = setupOrOptions;
        setupFn = function() {
          var result = {};
          // Convert state to signals
          var initialState = typeof opts.state === 'function' ? opts.state() : (opts.state || {});
          var stateSignals = {};
          for (var key in initialState) {
            stateSignals[key] = state(initialState[key]);
            result[key] = stateSignals[key];
          }
          // Convert getters to derived signals
          if (opts.getters) {
            for (var gKey in opts.getters) {
              (function(getterKey, getterFn) {
                result[getterKey] = derived(function() {
                  // Build state snapshot for getter
                  var snapshot = {};
                  for (var sk in stateSignals) { snapshot[sk] = stateSignals[sk](); }
                  return getterFn(snapshot);
                });
              })(gKey, opts.getters[gKey]);
            }
          }
          // Bind actions with proxy for this.propName access
          if (opts.actions) {
            for (var aKey in opts.actions) {
              (function(actionKey, actionFn) {
                result[actionKey] = function() {
                  var proxy = new Proxy({}, {
                    get: function(_, p) {
                      if (result[p] && result[p]._isSignal) return result[p]();
                      if (result[p]) return result[p];
                      return undefined;
                    },
                    set: function(_, p, v) {
                      if (result[p] && result[p]._isSignal) { result[p].set(v); return true; }
                      return false;
                    }
                  });
                  return actionFn.apply(proxy, arguments);
                };
              })(aKey, opts.actions[aKey]);
            }
          }
          return result;
        };
      }

      // Run setup with store-safe effect tracking (effects are global, not element-scoped)
      var prevDisposers = activeDisposers;
      activeDisposers = null;

      var result;
      try {
        result = setupFn();
      } finally {
        activeDisposers = prevDisposers;
      }

      // Log what the setup returned
      var signalKeys = [];
      var actionKeys = [];
      for (var dk in result) {
        if (result[dk] && result[dk]._isSignal) signalKeys.push(dk);
        else if (typeof result[dk] === 'function') actionKeys.push(dk);
      }
      console.log('[stx:store] setup complete:', id, 'signals:', signalKeys, 'actions:', actionKeys);

      // Capture initial values for $reset
      var _initialValues = {};
      for (var k in result) {
        if (result[k] && result[k]._isSignal) {
          _initialValues[k] = result[k]();
        }
      }

      // Store metadata
      result.$id = id;
      result.$reset = function() {
        batch(function() {
          for (var rk in _initialValues) {
            if (result[rk] && result[rk]._isSignal) result[rk].set(_initialValues[rk]);
          }
        });
      };
      result.$patch = function(partial) {
        batch(function() {
          for (var pk in partial) {
            if (result[pk] && result[pk]._isSignal) result[pk].set(partial[pk]);
          }
        });
      };
      result.$subscribe = function(cb) {
        var unsubs = [];
        for (var sk in result) {
          if (result[sk] && result[sk]._isSignal && result[sk].subscribe) {
            unsubs.push(result[sk].subscribe(function() {
              var snapshot = {};
              for (var ssk in result) {
                if (result[ssk] && result[ssk]._isSignal) snapshot[ssk] = result[ssk]();
              }
              cb(snapshot);
            }));
          }
        }
        return function() { unsubs.forEach(function(u) { u(); }); };
      };
      result.$dispose = function() {
        window.stx._stores.delete(id);
        if (window.__STX_STORES__) delete window.__STX_STORES__[id];
      };

      // Hydration: restore state from SSR
      var hydrationData = window.__STX_STORE_STATE__ && window.__STX_STORE_STATE__[id];
      if (hydrationData) {
        console.log('[stx:store] hydrating from SSR:', id, Object.keys(hydrationData));
        batch(function() {
          for (var hk in hydrationData) {
            if (result[hk] && result[hk]._isSignal) result[hk].set(hydrationData[hk]);
          }
        });
      }

      // Persistence
      var persistCfg = storeOptions && storeOptions.persist;
      if (persistCfg) {
        var pOpts = persistCfg === true ? {} : persistCfg;
        var storageKey = pOpts.key || ('stx-store-' + id);
        var storageType = pOpts.storage === 'sessionStorage' ? sessionStorage : localStorage;
        var pick = pOpts.pick || null;

        // Read persisted state (overrides hydration)
        try {
          var saved = storageType.getItem(storageKey);
          if (saved) {
            var parsed = JSON.parse(saved);
            console.log('[stx:store] restoring persisted state:', id, 'key:', storageKey, Object.keys(parsed));
            batch(function() {
              for (var pk in parsed) {
                if (result[pk] && result[pk]._isSignal && (!pick || pick.indexOf(pk) !== -1)) {
                  result[pk].set(parsed[pk]);
                }
              }
            });
          } else {
            console.log('[stx:store] no persisted state found:', id, 'key:', storageKey);
          }
        } catch(e) { console.warn('[stx:store] persistence read error:', id, e); }

        // Write on change (debounced)
        var writeTimer = null;
        var prevPersistDisposers = activeDisposers;
        activeDisposers = null;
        effect(function() {
          var snapshot = {};
          for (var wk in result) {
            if (result[wk] && result[wk]._isSignal && (!pick || pick.indexOf(wk) !== -1)) {
              snapshot[wk] = result[wk]();
            }
          }
          if (writeTimer) clearTimeout(writeTimer);
          writeTimer = setTimeout(function() {
            console.log('[stx:store] persisting:', id, 'key:', storageKey, Object.keys(snapshot));
            try { storageType.setItem(storageKey, JSON.stringify(snapshot)); } catch(e) { console.warn('[stx:store] persist write error:', id, e); }
          }, 100);
        });
        activeDisposers = prevPersistDisposers;
      }

      // Marker so the template-scope auto-unwrap proxy knows to recursively
      // unwrap signal-valued properties on this object. Script-level callers
      // still see the bare store (so existing patterns like store.someSignal()
      // keep working); only template expression evaluation auto-unwraps.
      result._isStxStore = true;

      // Register globally
      window.stx._stores.set(id, result);
      window.__STX_STORES__ = window.__STX_STORES__ || {};
      window.__STX_STORES__[id] = result;

      console.log('[stx:store] registered:', id, 'total stores:', window.stx._stores.size);
      return result;
    },

    useStore: function(id) {
      var store = window.stx._stores.get(id);
      if (!store && window.__STX_STORES__) {
        store = window.__STX_STORES__[id];
      }
      if (!store) {
        console.error('[stx:store] Store not found:', id, 'available:', Array.from(window.stx._stores.keys()));
        throw new Error('[stx] Store "' + id + '" not found. Define it with defineStore() first.');
      }
      console.log('[stx:store] useStore:', id);
      return store;
    },

    mountEl: function(selector, setupFn) {
      function doMount() {
        var root = document.querySelector(selector);
        if (!root) { console.warn('[stx] mountEl: element not found:', selector); return; }

        // Set component context for defineProps/defineEmits (Phase 4)
        var prevProps = window.__STX_CURRENT_PROPS__;
        var prevEl = window.__STX_CURRENT_ELEMENT__;
        var propsAttr = root.getAttribute && root.getAttribute('data-stx-props');
        window.__STX_CURRENT_PROPS__ = root.__stx_props || (propsAttr ? JSON.parse(propsAttr) : {});
        window.__STX_CURRENT_ELEMENT__ = root;

        var mountStart = mountCallbacks.length;
        var destroyStart = destroyCallbacks.length;

        var scope = setupFn();

        // Restore previous context (supports nested components)
        window.__STX_CURRENT_PROPS__ = prevProps;
        window.__STX_CURRENT_ELEMENT__ = prevEl;

        var localMountHooks = mountCallbacks.splice(mountStart);
        var localDestroyHooks = destroyCallbacks.splice(destroyStart);

        if (typeof scope === 'object' && scope !== null) {
          scope.$el = root;
          scope.$refs = scope.$refs || {};
          root.__stx_scope = scope;
        }

        var disposeEffects = trackEffects(function() {
          processElement(root, scope || componentScope);
        });
        root.__stx_disposers = disposeEffects;

        root.removeAttribute('x-cloak');
        root.querySelectorAll('[x-cloak]').forEach(function(el) { el.removeAttribute('x-cloak'); });

        localMountHooks.forEach(function(fn) {
          try {
            var cleanup = fn();
            if (typeof cleanup === 'function') localDestroyHooks.push(cleanup);
          }
catch (e) { console.error('[stx] onMount error:', e); }
        });

        root.__stx_destroy = localDestroyHooks;
      }

      if (document.readyState === 'loading') {
        mountQueue.push(doMount);
      }
else {
        doMount();
      }
    },
    mount: function(setupFn) {
      console.log('[mount] called');
      // Capture script reference synchronously (only valid during execution)
      var scriptEl = document.currentScript;

      function doMount() {
        // Find component root: next sibling element after the script tag
        var root = scriptEl ? scriptEl.nextElementSibling : null;
        if (!root && scriptEl) root = scriptEl.previousElementSibling || scriptEl.parentElement;

        // SPA fallback: during router navigation, script is appended to <body>
        // (not inside the content container), so nextElementSibling won't find the page content.
        // Only use fallback when we genuinely couldn't find a suitable root element.
        // Do NOT fallback just because the script is in <body> — layout scripts in <body>
        // with valid siblings (e.g. sidebar <aside>) should use those siblings as root.
        var needsFallback = !root || root === document.body
          || (root && root.tagName === 'SCRIPT');
        if (needsFallback) {
          var routerOpts = window.STX_ROUTER_OPTIONS || window.__stxRouterConfig || {};
          var container = document.querySelector('[data-stx-content]')
            || document.querySelector('[data-stx-router-container]')
            || (routerOpts.container ? document.querySelector(routerOpts.container) : null)
            || document.querySelector('main')
            || document.querySelector('#content');
          if (container) {
            // Use the container itself as root — process ALL content inside it
            root = container;
            // But if a specific child is already mounted, find first unmounted one instead
            var hasMount = false;
            var children = container.children;
            for (var ci = 0; ci < children.length; ci++) {
              if (children[ci].__stx_scope) { hasMount = true; break; }
            }
            if (hasMount) for (var ci = 0; ci < children.length; ci++) {
              if (!children[ci].__stx_scope && children[ci].tagName !== 'SCRIPT') {
                root = children[ci];
                break;
              }
            }
          }
        }

        if (!root) { console.warn('[stx] mount: no root element found'); return; }

        // Set component context for defineProps/defineEmits (Phase 4)
        var prevProps = window.__STX_CURRENT_PROPS__;
        var prevEl = window.__STX_CURRENT_ELEMENT__;
        var propsAttr = root.getAttribute && root.getAttribute('data-stx-props');
        window.__STX_CURRENT_PROPS__ = root.__stx_props || (propsAttr ? JSON.parse(propsAttr) : {});
        window.__STX_CURRENT_ELEMENT__ = root;

        // Track lifecycle hooks registered during setup
        var mountStart = mountCallbacks.length;
        var destroyStart = destroyCallbacks.length;

        // Run setup function — returns scope object with declarations
        var scope = setupFn();
        console.log('[mount] root:', root.tagName, 'scope keys:', scope ? Object.keys(scope).slice(0, 10) : 'null');

        // Restore previous context (supports nested components)
        window.__STX_CURRENT_PROPS__ = prevProps;
        window.__STX_CURRENT_ELEMENT__ = prevEl;

        // Capture mount/destroy hooks added during setup
        var localMountHooks = mountCallbacks.splice(mountStart);
        var localDestroyHooks = destroyCallbacks.splice(destroyStart);

        // Register scope
        if (typeof scope === 'object' && scope !== null) {
          scope.$el = root;
          scope.$refs = scope.$refs || {};
          root.__stx_scope = scope;  // Store isolated scope on element
          Object.assign(componentScope, scope);  // Keep for backwards compat
        }

        // Walk DOM and bind directives, tracking effects for cleanup
        var disposeEffects = trackEffects(function() {
          processElement(root, scope || componentScope);
        });
        root.__stx_disposers = disposeEffects;

        // Remove x-cloak after bindings are applied (prevents FOUC)
        root.removeAttribute('x-cloak');
        root.querySelectorAll('[x-cloak]').forEach(function(el) { el.removeAttribute('x-cloak'); });

        // Fire mount hooks
        localMountHooks.forEach(function(fn) {
          try {
            var cleanup = fn();
            if (typeof cleanup === 'function') localDestroyHooks.push(cleanup);
          }
catch (e) { console.error('[stx] onMount error:', e); }
        });

        // Store cleanup on element for auto-destroy
        root.__stx_destroy = localDestroyHooks;
      }

      if (document.readyState === 'loading') {
        mountQueue.push(doMount);
      }
else {
        doMount();
      }
    }
  };

  // Also expose globally for convenience
  window.state = state;
  window.derived = derived;
  window.effect = effect;
  window.batch = batch;
  window.onMount = onMount;
  window.onDestroy = onDestroy;
  window.useFetch = useFetch;
  window.useRef = useRef;
  window.navigate = navigate;
  window.goBack = goBack;
  window.goForward = goForward;
  window.useRoute = useRoute;
  window.useSearchParams = useSearchParams;
  window.useQuery = useQuery;
  window.useMutation = useMutation;
  window.provide = provide;
  window.$computed = $computed;
  window.$watch = $watch;
  window.useDebounce = useDebounce;
  window.useDebouncedValue = useDebouncedValue;
  window.useThrottle = useThrottle;
  window.useInterval = useInterval;
  window.useTimeout = useTimeout;
  window.useToggle = useToggle;
  window.useCounter = useCounter;
  window.useClickOutside = useClickOutside;
  window.useFocus = useFocus;
  window.useAsync = useAsync;
  window.useLocalStorage = useLocalStorage;
  window.useEventListener = useEventListener;
  window.useWebSocket = useWebSocket;
  window.useColorMode = useColorMode;
  window.useDark = useDark;
  window.useHead = useHead;
  window.useSeoMeta = useSeoMeta;
  window.toast = toast;
  window.modal = modal;
  window.drawer = drawer;
  window.stxAlert = stxAlert;
  window.stxConfirm = stxConfirm;
  window.defineStore = window.stx.defineStore;
  window.useStore = window.stx.useStore;
  window.ref = state;
  window.reactive = state;
  window.computed = derived;
  window.watch = $watch;
  window.watchEffect = function(fn) { return effect(fn); };

  // Note: SPA Router and View Transitions CSS are provided by the canonical
  // router script (packages/router/src/client.ts) which is injected alongside
  // the signals runtime or via the @stxRouter directive.

  // ==========================================================================
  // DevTools introspection (stacksjs/stx#1747, Phase 1)
  // ==========================================================================
  // A read-only, console-usable inspector wired to the live runtime — no manual
  // registration. Reads signal values via peek() so inspecting never subscribes
  // the active effect (i.e. it can't pollute the reactive graph).
  function __stxDevtoolsClassify(sv) {
    var out = { signals: {}, derived: {}, stores: {}, values: {}, methods: [] };
    if (!sv || typeof sv !== 'object') return out;
    Object.keys(sv).forEach(function(k) {
      if (k.indexOf('__') === 0 || k === '$el' || k === '$refs' || k === '$props') return;
      var v = sv[k];
      try {
        if (typeof v === 'function' && v._isSignal) out.signals[k] = peek(function() { return v(); });
        else if (typeof v === 'function' && v._isDerived) out.derived[k] = peek(function() { return v(); });
        else if (v && v._isStxStore) out.stores[k] = '[store]';
        else if (typeof v === 'function') out.methods.push(k);
        else out.values[k] = v;
      }
      catch (e) { out.values[k] = '[unreadable]'; }
    });
    return out;
  }
  window.__stxDevtools = {
    version: 1,
    // Component tree from [data-stx-scope] elements, nested by DOM ancestry.
    tree: function() {
      var byEl = new Map();
      var roots = [];
      var nodes = document.querySelectorAll('[data-stx-scope]');
      Array.prototype.forEach.call(nodes, function(el) {
        byEl.set(el, { scopeId: el.getAttribute('data-stx-scope'), tag: (el.tagName || '').toLowerCase(), children: [], el: el });
      });
      Array.prototype.forEach.call(nodes, function(el) {
        var node = byEl.get(el);
        var p = el.parentElement;
        while (p && !byEl.has(p)) p = p.parentElement;
        if (p) byEl.get(p).children.push(node); else roots.push(node);
      });
      function clean(n) { return { scopeId: n.scopeId, tag: n.tag, children: n.children.map(clean) }; }
      return roots.map(clean);
    },
    // Signals / derived / stores / methods / plain values for a scope id.
    scope: function(scopeId) {
      var sv = (window.stx && window.stx._scopes) ? window.stx._scopes[scopeId] : null;
      return sv ? __stxDevtoolsClassify(sv) : null;
    },
    // The nearest enclosing scope's inspection for a DOM element.
    inspect: function(el) {
      var s = el;
      while (s && !(s.getAttribute && s.getAttribute('data-stx-scope'))) s = s.parentElement;
      return s ? this.scope(s.getAttribute('data-stx-scope')) : null;
    },
    // All registered stores by id.
    stores: function() {
      var out = {};
      var reg = window.stx && window.stx._stores;
      if (reg && typeof reg.forEach === 'function') reg.forEach(function(v, k) { out[k] = true; });
      return out;
    },
  };

  // ==========================================================================
  // Auto-initialization
  // ==========================================================================

  console.log('[stx] registering DOMContentLoaded handler');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[stx] DOMContentLoaded fired — processing scopes');
    // Process mount queue (from stx.mount() calls during loading)
    mountQueue.forEach(function(fn) { fn(); });
    mountQueue = [];

    // Track which scoped elements have been processed
    const processedScopes = new Set();

    // Initialize components with data-stx attribute
    document.querySelectorAll('[data-stx]').forEach(el => {
      const setupName = el.getAttribute('data-stx');
      console.log('[DOMContentLoaded] data-stx:', setupName, 'el:', el.tagName, 'fn exists:', !!(setupName && window[setupName]));
      if (setupName && window[setupName]) {
        const result = window[setupName]();
        console.log('[DOMContentLoaded] setup returned:', result ? Object.keys(result).slice(0, 10) : 'null');
        if (typeof result === 'object') {
          Object.assign(componentScope, result);
        }
      }
      console.log('[DOMContentLoaded] processElement on:', el.tagName, 'scope keys:', Object.keys(componentScope).slice(0, 10));
      var disposeEffects = trackEffects(function() { processElement(el); });
      el.__stx_disposers = disposeEffects;

      // Remove x-cloak after bindings are applied (prevents FOUC)
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });

      mountCallbacks.forEach(fn => fn());
    });

    // Process scoped components FIRST (their scripts have already registered scope variables)
    var allScopes = document.querySelectorAll('[data-stx-scope]');
    console.log('[stx] found', allScopes.length, 'data-stx-scope elements');
    allScopes.forEach(el => {
      const scopeId = el.getAttribute('data-stx-scope');
      console.log('[stx] scope:', scopeId, 'registered:', !!(window.stx._scopes && window.stx._scopes[scopeId]), 'el:', el.tagName);
      processedScopes.add(el);

      const scopeVars = window.stx._scopes && window.stx._scopes[scopeId];

      // Deferred island (#1746): its setup script (type="stx/island") hasn't run
      // yet, so the scope isn't registered. Arm the hydration trigger anyway —
      // processElement sees stx-hydrate and defers; deferHydration's run()
      // executes the script (registering the scope + running side-effectful
      // setup like fetches) and binds on the trigger. Reveal the HTML now.
      var isDeferredIsland = !scopeVars && el.hasAttribute && el.hasAttribute('stx-hydrate')
        && !!document.querySelector('script[data-stx-island="' + scopeId + '"]');
      if (isDeferredIsland) {
        processElement(el);
        el.removeAttribute('x-cloak');
        el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
        return;
      }

      if (!scopeVars) return;

      // Merge component scope vars into componentScope (don't restore - keep for head elements)
      // This ensures expressions can access component variables even for elements
      // where findElementScope might not work (e.g., cloned elements not yet in DOM)
      if (scopeVars) {
        componentScope = { ...componentScope, ...scopeVars };
      }

      console.log('[stx] calling processElement on scope:', scopeId, 'componentScope total keys:', Object.keys(componentScope).length, 'has openEventModal:', 'openEventModal' in componentScope, 'scopeVars keys:', Object.keys(scopeVars).length);
      var disposeEffects = trackEffects(function() { processElement(el); });
      el.__stx_disposers = disposeEffects;
      console.log('[stx] scope processed OK:', scopeId);

      // Remove x-cloak after bindings are applied
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });

      // Run scope-specific mount callbacks (mark mounted so _handleStxLoad
      // doesn't re-fire onMount on persistent layout scopes — see #1697).
      // EXCEPT when this scope's hydration is deferred (stx-hydrate, e.g. a
      // client=visible|idle island, #1746): processElement above only SCHEDULED
      // the work, so onMount must fire when the trigger actually hydrates the
      // scope, not now. deferHydration's run() flushes it then.
      var scopeDeferred = el.hasAttribute && el.hasAttribute('stx-hydrate') && !el.__stx_hydrated;
      if (scopeVars && scopeVars.__mountCallbacks && !scopeVars.__mounted && !scopeDeferred) {
        scopeVars.__mounted = true;
        scopeVars.__mountCallbacks.forEach(fn => fn());
      }
    });

    // Run global mount callbacks (from partial <script client> blocks that call onMount)
    // These are pushed during script execution, before DOMContentLoaded
    console.log('[stx] running global mountCallbacks:', mountCallbacks.length);
    mountCallbacks.forEach(function(fn) {
      try { fn(); } catch(e) { console.error('[stx] onMount error:', e); }
    });
    mountCallbacks.length = 0;

    // Auto-process elements with data-stx-auto (skip already processed scoped elements)
    document.querySelectorAll('[data-stx-auto]').forEach(el => {
      // Process element but skip children that are in scoped containers
      processElementSkipScopes(el, processedScopes);

      // Remove x-cloak after bindings are applied
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
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
              const matches = text.match(/\\{\\{\\s*(.+?)\\s*\\}\\}/g);
              if (matches) {
                matches.forEach(match => {
                  const expr = match.replace(/^\\{\\{\\s*|\\s*\\}\\}$/g, '');
                  const fn = new Function(...Object.keys(componentScope), 'return ' + expr);
                  const value = fn(...Object.values(componentScope));
                  result = result.replace(match, value != null ? value : '');
                });
              }
              el.textContent = result;
            }
catch (e) {
              if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Title expression error:', e);
            }
          });
        }
      }
else if (el.tagName === 'META') {
        const content = el.getAttribute('content');
        if (content && content.includes('{{')) {
          // Skip build-time placeholders like {{__TITLE__}}
          const hasOnlyPlaceholders = !content.replace(/\\{\\{\\s*__[A-Z_]+__\\s*\\}\\}/g, '').includes('{{');
          if (hasOnlyPlaceholders) return;
          effect(() => {
            try {
              let result = content;
              const matches = content.match(/\\{\\{\\s*(.+?)\\s*\\}\\}/g);
              if (matches) {
                matches.forEach(match => {
                  const expr = match.replace(/^\\{\\{\\s*|\\s*\\}\\}$/g, '');
                  if (/^__[A-Z_]+__$/.test(expr.trim())) return;
                  const fn = new Function(...Object.keys(componentScope), 'return ' + expr);
                  const value = fn(...Object.values(componentScope));
                  result = result.replace(match, value != null ? value : '');
                });
              }
              el.setAttribute('content', result);
            }
catch (e) {
              if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Meta expression error:', e);
            }
          });
        }
      }
    });
  });

  // ==========================================================================
  // Scope Disposal
  // ==========================================================================

  // Walk a subtree (root + descendants) and fire each [data-stx-scope]'s
  // destroy callbacks + remove the entry from window.stx._scopes. Pre-fix
  // (stacksjs/stx#1727) only cleanupContainer (called during SPA navigation)
  // ran this walk, so dynamic unmounts driven by :if/:for leaked scopes
  // indefinitely. Now bindIf, bindFor, and cleanupContainer all funnel
  // through this helper so the cleanup is symmetric regardless of who
  // initiated the removal.
  function disposeSubtreeScopes(root) {
    if (!root || !window.stx || !window.stx._scopes) return;
    // Build the list of nodes to inspect: root + descendants with the
    // [data-stx-scope] attribute. Avoid Array.from on a generator since
    // we want browser-broad compatibility from the minified runtime.
    var nodes = [];
    if (root.getAttribute && root.getAttribute('data-stx-scope')) nodes.push(root);
    if (root.querySelectorAll) {
      var matches = root.querySelectorAll('[data-stx-scope]');
      for (var i = 0; i < matches.length; i++) nodes.push(matches[i]);
    }
    for (var n = 0; n < nodes.length; n++) {
      var el = nodes[n];
      var scopeId = el.getAttribute('data-stx-scope');
      if (!scopeId) continue;
      var scopeVars = window.stx._scopes[scopeId];
      if (!scopeVars) continue;
      if (scopeVars.__destroyCallbacks && Array.isArray(scopeVars.__destroyCallbacks)) {
        for (var j = 0; j < scopeVars.__destroyCallbacks.length; j++) {
          try { scopeVars.__destroyCallbacks[j](); }
          catch (e) { console.warn('[stx] scope destroy error:', e); }
        }
      }
      delete window.stx._scopes[scopeId];
    }
  }

  // ==========================================================================
  // Container Cleanup (for SPA navigation)
  // ==========================================================================

  function cleanupContainer(container) {
    if (!container) return;

    // Clear pending mount callbacks from the departing page
    mountCallbacks.length = 0;

    // Reset componentScope — clear old page variables to prevent scope leaking
    // between SPA navigations. Preserve $refs and re-apply shell-level scope
    // from persistent elements (sidebar, nav) that live outside the container.
    var preservedRefs = componentScope.$refs || {};
    componentScope = { $refs: preservedRefs };
    // Re-apply scope from shell elements (outside the swap container)
    var shellElements = document.querySelectorAll('[data-stx-content] ~ *');
    document.querySelectorAll('body > *').forEach(function(el) {
      if (el === container) return;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (el.__stx_scope) Object.assign(componentScope, el.__stx_scope);
    });

    // 1. Walk all child elements — fire destroy hooks and dispose effects
    container.querySelectorAll('*').forEach(function(el) {
      // Cancel a still-pending island hydration trigger (#1746) so its
      // observer/timer/listener doesn't fire on this detached element.
      if (typeof el.__stx_hydration_cancel === 'function') {
        try { el.__stx_hydration_cancel(); } catch (e) { /* noop */ }
        el.__stx_hydration_cancel = null;
      }
      if (el.__stx_destroy && Array.isArray(el.__stx_destroy)) {
        el.__stx_destroy.forEach(function(fn) {
          try { fn(); }
catch (e) { console.warn('[stx] destroy hook error:', e); }
        });
        el.__stx_destroy = null;
      }
      if (el.__stx_disposers && typeof el.__stx_disposers === 'function') {
        el.__stx_disposers();
        el.__stx_disposers = null;
      }
    });

    // 2. Check container itself
    if (typeof container.__stx_hydration_cancel === 'function') {
      try { container.__stx_hydration_cancel(); } catch (e) { /* noop */ }
      container.__stx_hydration_cancel = null;
    }
    if (container.__stx_destroy) {
      container.__stx_destroy.forEach(function(fn) {
        try { fn(); }
catch (e) { console.warn('[stx] destroy hook error:', e); }
      });
      container.__stx_destroy = null;
    }
    if (container.__stx_disposers) {
      container.__stx_disposers();
      container.__stx_disposers = null;
    }
    // Clear __stx_scope so _handleStxLoad's processElement guard doesn't skip it
    container.__stx_scope = null;

    // 3. Clean up scopes registered on departing components. Routed
    // through disposeSubtreeScopes so the same walk runs for SPA
    // navigation and for :if/:for-driven unmount (see #1727).
    disposeSubtreeScopes(container);
  }

  // Re-initialize components after SPA content swap.
  // Debounce to handle rapid re-fires (HMR triggers navigate which triggers stx:load again).
  var _stxLoadTimer = null;
  window.addEventListener('stx:load', function() {
    if (_stxLoadTimer) { clearTimeout(_stxLoadTimer); }
    _stxLoadTimer = setTimeout(_handleStxLoad, 5);
  });
  function _handleStxLoad() {
    _stxLoadTimer = null;
    console.log('[stx:load] START. mountQueue:', mountQueue.length, '_latestSetup:', !!window.stx._latestSetup);

    // Run any pending destroy callbacks before re-initializing
    destroyCallbacks.forEach(function(fn) {
      try { fn(); }
catch (e) { console.warn('[stx] destroy callback error:', e); }
    });
    destroyCallbacks.length = 0;

    // Process mount queue (scripts in swapped content may have called stx.mount())
    mountQueue.forEach(function(fn) { fn(); });
    mountQueue = [];

    // Re-process scoped components in new content
    var routerOpts = window.STX_ROUTER_OPTIONS || window.__stxRouterConfig || {};
    var container = document.querySelector('[data-stx-content]')
      || (routerOpts.container ? document.querySelector(routerOpts.container) : null)
      || document.querySelector('main')
      || document.querySelector('#main-content')
      || document.body;

    // Apply new page's SFC setup function. During SPA navigation, re-executed page
    // scripts set window.stx._latestSetup to the new setup function. This takes priority
    // over the stale data-stx attribute on <body> (which has the PREVIOUS page's function name).
    var usedLatestSetup = false;
    if (window.stx._latestSetup && typeof window.stx._latestSetup === 'function') {
      try {
        var setupResult = window.stx._latestSetup();
        // Keep _latestSetup for re-fires (HMR, auto-refresh re-navigation)
        // It will be overwritten when a NEW page's script sets it
        usedLatestSetup = true;
        if (typeof setupResult === 'object' && setupResult !== null) {
          console.log('[stx:load] _latestSetup keys:', Object.keys(setupResult).slice(0, 10));
          Object.assign(componentScope, setupResult);
        }
      } catch (e) {
        console.error('[stx:load] _latestSetup error:', e);
        usedLatestSetup = true; // Don't fall back to stale data-stx
      }
    }
    console.log('[stx:load] usedLatestSetup:', usedLatestSetup, 'scope keys:', Object.keys(componentScope).slice(0, 10));

    // Only fall back to [data-stx] attribute lookup if _latestSetup wasn't available.
    // This handles the initial DOMContentLoaded-like case and pages that don't use _latestSetup.
    if (!usedLatestSetup) {
      document.querySelectorAll('[data-stx]').forEach(function(el) {
        var setupName = el.getAttribute('data-stx');
        if (setupName && window[setupName]) {
          var result = window[setupName]();
          if (typeof result === 'object') Object.assign(componentScope, result);
        }
      });
    }

    // Initialize x-data scopes after SPA fragment swap.
    // On full page load, the reactive bridge <script> calls initScope(). But after SPA
    // navigation, only the HTML fragment is swapped — the bridge script isn't re-executed.
    // The server renames x-data → data-stx-xdata so we can read the state expression here.
    if (window.__stx_reactive && window.__stx_reactive.initScope) {
      container.querySelectorAll('[data-stx-xdata]').forEach(function(el) {
        var scopeId = el.getAttribute('data-stx-scope');
        // Skip if scope already registered (e.g. nav scope that persists across navigations)
        if (scopeId && window.stx._scopes && window.stx._scopes[scopeId]) return;
        var xdata = el.getAttribute('data-stx-xdata');
        if (!xdata) return;
        // Assign a scope ID if not already present
        if (!scopeId) {
          scopeId = '__stx_scope_spa_' + (++window.stx._scopeCounter);
          el.setAttribute('data-stx-scope', scopeId);
        }
        console.log('[stx:load] initializing x-data scope:', scopeId, xdata.substring(0, 40));
        window.__stx_reactive.initScope(el, xdata, [], {}, null);
      });
    }

    // Apply scope from [data-stx-scope] elements and process them.
    // Walk document.body (not just container) so layout-level scopes dropped
    // by a full-body-swap SPA nav (e.g. nav/header/footer when the layout
    // group changes) get bound. The __stx_disposers guard makes the walk
    // idempotent — persistent layout scopes across same-layout navs are
    // skipped instead of double-disposed. See stacksjs/stx#1697.
    document.body.querySelectorAll('[data-stx-scope]').forEach(function(el) {
      var scopeId = el.getAttribute('data-stx-scope');
      var scopeVars = window.stx._scopes && window.stx._scopes[scopeId];
      // Deferred island reached via SPA navigation (#1746): its setup script is
      // inert (type="stx/island"), so the scope isn't registered yet. Arm the
      // hydration trigger (deferHydration) instead of skipping it — mirrors the
      // initial-load DOMContentLoaded path, which has the same guard. Without
      // this, a client="visible|idle|…" island on a page reached by SPA nav
      // (inline OR chunked) never hydrates.
      if (!scopeVars && el.hasAttribute && el.hasAttribute('stx-hydrate')
        && !el.__stx_hydration_scheduled
        && document.querySelector('script[data-stx-island="' + scopeId + '"]')) {
        processElement(el, componentScope);
        el.removeAttribute('x-cloak');
        el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
        return;
      }
      if (!scopeVars) return;
      Object.assign(componentScope, scopeVars);
      if (el.__stx_disposers) return;
      var disposeEffects = trackEffects(function() { processElement(el, componentScope); });
      el.__stx_disposers = disposeEffects;
    });

    // Process the container content — bind {{ }}, :attr, @event directives.
    // Run synchronously (not in setTimeout) so componentScope is captured correctly.
    // The DOMContentLoaded path processes <body> synchronously — the SPA path must match.
    console.log('[stx:load] container:', container.tagName, '__stx_scope:', !!container.__stx_scope, 'scope keys:', Object.keys(componentScope).slice(0, 10));
    if (!container.__stx_scope) {
      // Dispose previous effects on the container (from prior navigation)
      if (container.__stx_disposers && typeof container.__stx_disposers === 'function') {
        container.__stx_disposers();
      }
      console.log('[stx:load] processElement on container');
      var disposeEffects = trackEffects(function() { processElement(container, componentScope); });
      container.__stx_disposers = disposeEffects;
    } else {
      console.log('[stx:load] SKIPPED processElement — container has __stx_scope');
    }

    // Remove x-cloak
    container.removeAttribute('x-cloak');
    container.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });

    // Fire mount callbacks from scoped components. Walk document.body so
    // layout-level scopes added by a full-body swap mount; __mounted guard
    // prevents persistent layout scopes from re-firing their onMount on
    // every same-layout SPA nav. See stacksjs/stx#1697.
    document.body.querySelectorAll('[data-stx-scope]').forEach(function(el) {
      var scopeId = el.getAttribute('data-stx-scope');
      var scopeVars = window.stx._scopes && window.stx._scopes[scopeId];
      if (scopeVars && scopeVars.__mountCallbacks && !scopeVars.__mounted) {
        scopeVars.__mounted = true;
        scopeVars.__mountCallbacks.forEach(function(fn) { fn(); });
      }
    });

    // Flush global mountCallbacks (from scripts re-executed after SPA content swap)
    mountCallbacks.forEach(function(fn) {
      try { fn(); }
catch (e) { console.warn('[stx] mount callback error:', e); }
    });
    mountCallbacks.length = 0;
  }

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
    // Detached chain members are owned by bindIfChain — skip (#1734).
    if (el.__stx_chain_member && !el.isConnected) return;
    // Process this element's directives without recursing into children
    // (we'll handle children manually to skip scoped ones)
    const hasFor = el.hasAttribute && (el.hasAttribute('@for') || el.hasAttribute(':for') || el.hasAttribute('x-for'));
    const hasIf = el.hasAttribute && (el.hasAttribute('@if') || el.hasAttribute(':if') || el.hasAttribute('x-if'));
    if (hasFor) { var fa = el.hasAttribute(':for') ? ':for' : el.hasAttribute('x-for') ? 'x-for' : '@for'; bindFor(el, componentScope, fa); return; }
    if (hasIf) {
      var ia = el.hasAttribute(':if') ? ':if' : el.hasAttribute('x-if') ? 'x-if' : '@if';
      var ic = findIfChain(el, ia);
      if (ic.length > 1) bindIfChain(ic, componentScope);
      else bindIf(el, componentScope, ia);
      return;
    }
    // Process other attributes...
    if (el.hasAttribute && (el.hasAttribute('@show') || el.hasAttribute(':show') || el.hasAttribute('x-show'))) {
      var sa = el.hasAttribute(':show') ? ':show' : el.hasAttribute('x-show') ? 'x-show' : '@show';
      bindShow(el, el.getAttribute(sa), componentScope, sa);
    }
    if (el.hasAttribute && (el.hasAttribute('@model') || el.hasAttribute(':model') || el.hasAttribute('x-model'))) {
      var ma = el.hasAttribute(':model') ? ':model' : el.hasAttribute('x-model') ? 'x-model' : '@model';
      bindModel(el, el.getAttribute(ma), componentScope, ma);
    }
    // Process children, skipping scoped containers and script/style elements
    if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
      Array.from(el.childNodes).forEach(child => processElementSkipScopes(child, processedScopes));
    }
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
