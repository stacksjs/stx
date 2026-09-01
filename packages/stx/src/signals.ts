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
import { runtimeHandledXAttrsLiteral } from './runtime-globals'

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
  // Strip `console.log(...)` calls before minification. They're useful in dev
  // (and the dev build keeps them via generateSignalsRuntimeDev), but in prod
  // they're noise — every nav fires ~15 log lines and they show up in
  // consumer DevTools. `console.warn` / `console.error` are preserved so
  // real problems still surface. See stacksjs/stx#1668 bug 8.
  //
  // Stripping happens OUTSIDE the try on purpose. It used to sit inside, with a
  // catch that returned generateSignalsRuntimeDev() — the raw, *unstripped*
  // source. So any failure in Bun.Transpiler silently shipped all ~40 log sites
  // to production, and the only symptom was a console full of `[stx] signal.set:`
  // in a consumer's DevTools with nothing to explain it. Minification is the
  // optional part; removing the logs is not. See #1873.
  const stripped = stripConsoleLog(generateSignalsRuntimeDev())

  // Use Bun.Transpiler for minification, then fix ASI edge cases. Bun.Transpiler
  // strips newlines but doesn't always insert semicolons at statement boundaries
  // like `}var` or `}let`. While Bun's parser handles these, browsers in strict
  // mode may reject them.
  try {
    const transpiler = new Bun.Transpiler({ loader: 'js', minifyWhitespace: true })
    let minified = transpiler.transformSync(stripped)
    // Insert semicolons at `}keyword` boundaries where ASI would have applied
    // with a newline but doesn't on a single line
    minified = minified.replace(/\}(var |let |const |function )/g, '};$1')
    return minified
  }
  catch {
    // Fallback: unminified but still stripped — larger, correct, and quiet.
    return stripped
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
  var cloakStyle = document.getElementById ? document.getElementById('stx-cloak-style') : null;
  if (!cloakStyle) {
    cloakStyle = document.createElement('style');
    cloakStyle.id = 'stx-cloak-style';
    cloakStyle.textContent = '[x-cloak] { display: none !important; }';
    document.head.appendChild(cloakStyle);
  }

  // ==========================================================================
  // Reactive Core
  // ==========================================================================

  let activeEffect = null;
  const effectStack = [];
  const pendingEffects = new Set();
  let isBatching = false;

  // DevTools Phase 2 (#1747): dev-mode reactivity instrumentation. OFF by
  // default — even in the dev runtime — so set()/effect-run stay zero-overhead
  // until window.__stxDevtools.enable() turns counting on. The reactive graph
  // (each signal's subscriber set) is always available via the _effects handle.
  var __stxDevtoolsTracking = false;
  var __stxDevtoolsStats = { signalSets: 0, effectRuns: 0 };
  var __stxEffectId = 0;
  // Phase 3 (#1747): bounded trace buffers, recorded only while tracking.
  var __stxDevtoolsIfTrace = [];
  var __stxDevtoolsQueries = [];
  var __stxDevtoolsMutations = []; // state-change log (signal id + prev/next)
  var __stxSignalId = 0;
  function __stxDevtoolsNow() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function __stxDevtoolsRecordIf(rec) { if (!__stxDevtoolsTracking) return; __stxDevtoolsIfTrace.push(rec); if (__stxDevtoolsIfTrace.length > 100) __stxDevtoolsIfTrace.shift(); }
  function __stxDevtoolsRecordQuery(rec) { if (!__stxDevtoolsTracking) return; __stxDevtoolsQueries.push(rec); if (__stxDevtoolsQueries.length > 100) __stxDevtoolsQueries.shift(); }
  // Short, ref-free repr of a value for the mutation log (so the buffer holds no
  // live references and big objects don't bloat it).
  function __stxShort(v) {
    try {
      if (typeof v === 'string') return v.length > 40 ? (v.slice(0, 40) + '…') : v;
      if (v === null || typeof v !== 'object') return v;
      var s = JSON.stringify(v);
      return s.length > 60 ? (s.slice(0, 60) + '…') : s;
    } catch (e) { return '[unserializable]'; }
  }
  // Wraps fetch with timing + a timeline record (the data layer's queries).
  // Turn a non-ok Response into an Error, reading the body FIRST.
  //
  // Every data primitive threw a synthesized 'HTTP nnn: statusText' before
  // touching the body, so whatever the server actually said — a validation
  // map, a rate-limit reason, an auth message — was unreachable from any stx
  // primitive, with no escape hatch (stacksjs/stx#1848). That is the single
  // most cited reason an app keeps writing raw fetch() calls.
  //
  // The body is attached rather than only interpolated: err.data is what a
  // caller needs to render field errors, and err.status is what it needs to
  // tell 401 from 500 without parsing the message.
  async function __stxHttpError(response) {
    var body = null;
    var text = '';
    try { text = await response.text(); } catch (e) { text = ''; }
    if (text) {
      try { body = JSON.parse(text); } catch (e) { body = text; }
    }
    var detail = '';
    if (body && typeof body === 'object') detail = body.message || body.error || '';
    else if (typeof body === 'string') detail = body.slice(0, 200);
    var message = 'HTTP ' + response.status;
    if (response.statusText) message += ': ' + response.statusText;
    if (detail) message += ' - ' + detail;
    var err = new Error(message);
    err.status = response.status;
    err.statusText = response.statusText;
    err.data = body;
    err.response = response;
    return err;
  }

  // One place an app can reach the data layer. Every stx data primitive goes
  // through __stxFetch, the only fetch call in this runtime, so a single pair
  // of hooks covers useFetch, useQuery and useMutation (#1855).
  //
  // Without it there is no way to attach an Authorization header or notice a
  // 401 in one place, which is the reason an app keeps hand-written fetch
  // calls sitting next to the primitives that were meant to replace them.
  //
  // Hooks mutate the context they are handed and their return value is
  // ignored — the ofetch shape most people will already know. Throwing from a
  // hook fails the request, which is what a token-refresh flow wants.
  var __stxFetchHooks = { onRequest: null, onResponse: null, onResponseError: null };

  function configureFetch(cfg) {
    cfg = cfg || {};
    // Replace rather than stack: a module re-evaluated by hot reload or by a
    // SPA script re-run must not end up with the same interceptor installed
    // twice, sending two Authorization headers or counting a 401 twice.
    __stxFetchHooks.onRequest = typeof cfg.onRequest === 'function' ? cfg.onRequest : null;
    __stxFetchHooks.onResponse = typeof cfg.onResponse === 'function' ? cfg.onResponse : null;
    // Fires for a non-ok response and for a thrown fetch (network error). If it
    // returns a Response, that Response replaces the original — this is how a
    // 401 -> refresh -> retry is expressed once instead of per call site. The
    // retry itself belongs to the hook: it should refresh the token and re-issue
    // the request with a plain fetch() (not this data layer) so it does not
    // re-enter the hook and loop. Returning nothing lets the error stand.
    __stxFetchHooks.onResponseError = typeof cfg.onResponseError === 'function' ? cfg.onResponseError : null;
  }

  // headers may be a function, so it can be evaluated per request rather than
  // captured once — a token that changes between calls. Object spread over a
  // function copies no own enumerable properties, so passing one used to
  // contribute nothing at all, in silence.
  function __stxHeaders(h) {
    return (typeof h === 'function' ? h() : h) || {};
  }

  async function __stxFetch(source, url, opts) {
    var t0 = __stxDevtoolsNow();
    opts = opts || {};
    if (__stxFetchHooks.onRequest) {
      // Normalised first so a hook can write ctx.options.headers.Authorization
      // without having to create the bag itself.
      opts.headers = __stxHeaders(opts.headers);
      var reqCtx = { source: source, url: String(url), options: opts };
      await __stxFetchHooks.onRequest(reqCtx);
      // Reassignable, so a hook can prefix a baseURL or swap the options
      // wholesale instead of only mutating them.
      if (reqCtx.url) url = reqCtx.url;
      opts = reqCtx.options || opts;
    }
    var method = (opts && opts.method) || 'GET';
    // A hook may hand back a Response to use in place of the original. Anything
    // else (a truthy non-Response, undefined) leaves the outcome unchanged.
    function __stxIsResponse(v) { return !!v && typeof v.ok === 'boolean'; }
    try {
      var r = await fetch(url, opts);
      __stxDevtoolsRecordQuery({ source: source, url: String(url), method: method, status: r.status, ok: r.ok, ms: __stxDevtoolsNow() - t0 });
      if (__stxFetchHooks.onResponse) {
        await __stxFetchHooks.onResponse({ source: source, url: String(url), options: opts, response: r });
      }
      if (!r.ok && __stxFetchHooks.onResponseError) {
        var recovered = await __stxFetchHooks.onResponseError({ source: source, url: String(url), options: opts, response: r, error: null });
        if (__stxIsResponse(recovered)) {
          __stxDevtoolsRecordQuery({ source: source, url: String(url), method: method, status: recovered.status, ok: recovered.ok, retried: true, ms: __stxDevtoolsNow() - t0 });
          return recovered;
        }
      }
      return r;
    } catch (e) {
      __stxDevtoolsRecordQuery({ source: source, url: String(url), method: method, status: 0, ok: false, error: String((e && e.message) || e), ms: __stxDevtoolsNow() - t0 });
      // A network-level failure (no Response) also reaches the hook, so a retry
      // can cover a dropped connection, not only an auth status.
      if (__stxFetchHooks.onResponseError) {
        var recoveredErr = await __stxFetchHooks.onResponseError({ source: source, url: String(url), options: opts, response: null, error: e });
        if (__stxIsResponse(recoveredErr)) {
          __stxDevtoolsRecordQuery({ source: source, url: String(url), method: method, status: recoveredErr.status, ok: recoveredErr.ok, retried: true, ms: __stxDevtoolsNow() - t0 });
          return recoveredErr;
        }
      }
      throw e;
    }
  }
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
  function createAutoUnwrapProxy(scope, preserveSignal) {
    return new Proxy(scope, {
      get(target, prop) {
        const val = target[prop];
        // If it's a signal or derived, call it to get the value
        if (val && typeof val === 'function' && (val._isSignal || val._isDerived)) {
          // Loop variables are implementation-detail signals so keyed rows can
          // update reactively. In template expressions they must behave like
          // their item value, including for objects with fields named value,
          // set, or subscribe. Otherwise item.value is mistaken for the
          // signal compatibility API and resolves to the whole item object.
          if (val._isStxLoopItem) return val();
          if (preserveSignal && preserveSignal(prop, val)) return val;
          return val();
        }
        // If it's an stx store, return a recursively-unwrapping wrapper so
        // store.signalProp resolves to the value in template expressions
        if (val && typeof val === 'object' && val._isStxStore) {
          return createAutoUnwrapProxy(val, preserveSignal);
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

  // A proxy for the WRITE side of x-model, kept separate from the read proxy
  // on purpose.
  //
  // The read proxy returns a plain object as-is, which is right for reading —
  // ordinary data should stay ordinary. But it means an assignment lands on the
  // raw object, so a signal held there gets REPLACED by the typed value rather
  // than set (#1883). Descending through a write proxy instead keeps set-trap
  // semantics all the way down, so the signal at the end of any path is set.
  function createModelWriteProxy(target) {
    return new Proxy(target, {
      get(t, prop) {
        var val = t[prop];
        if (val && typeof val === 'function' && (val._isSignal || val._isDerived)) {
          // Descend INTO the signal's value: x-model="form.email" over
          // state({email}) must reach the object, not stamp a property onto
          // the signal function itself.
          var inner = val();
          return (inner && typeof inner === 'object') ? createModelWriteProxy(inner) : inner;
        }
        if (val && typeof val === 'object') return createModelWriteProxy(val);
        return val;
      },
      set(t, prop, value) {
        var cur = t[prop];
        if (cur && typeof cur === 'function' && cur._isSignal && typeof cur.set === 'function') {
          cur.set(value);
          return true;
        }
        t[prop] = value;
        return true;
      },
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
        if (__stxDevtoolsTracking) {
          signal._setCount++;
          __stxDevtoolsStats.signalSets++;
          __stxDevtoolsMutations.push({ sid: signal._stxSignalId, prev: __stxShort(value), next: __stxShort(newValue) });
          if (__stxDevtoolsMutations.length > 100) __stxDevtoolsMutations.shift();
        }
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
    signal._effects = effects; // DevTools: the subscriber set (reactive graph)
    signal._setCount = 0; // DevTools: times set() changed the value (when tracking)
    signal._stxSignalId = ++__stxSignalId; // DevTools: stable id for the mutation log

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
    signal._effects = effects; // DevTools: the subscriber set (reactive graph)

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
      if (__stxDevtoolsTracking) { runEffect._runCount++; __stxDevtoolsStats.effectRuns++; }
      if (cleanup) {
        cleanup();
        cleanup = undefined;
      }
      const prev = activeEffect;
      activeEffect = runEffect;
      effectStack.push(runEffect);
      try {
        // Only a FUNCTION is a cleanup. An effect body is an expression as
        // often as it is a block, and an expression has a value: an effect
        // written as an arrow assigning to textContent returns the assigned
        // string. Storing that and calling it on the next run threw
        // "cleanup is not a function" from the line above — outside this try,
        // so it escaped runEffect entirely and propagated out of whatever
        // .set() triggered the notification, taking unrelated subscribers with
        // it. Only ever on the second run, which is why it read as correct.
        var __result = fn();
        cleanup = typeof __result === 'function' ? __result : undefined;
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

    runEffect._isStxEffect = true; // DevTools
    runEffect._stxId = ++__stxEffectId; // DevTools: stable effect id
    runEffect._runCount = 0; // DevTools: times this effect re-ran (when tracking)

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

  // The derived brand is set at creation; this predicate was declared and
  // auto-imported for years without ever existing here (#1804).
  function isDerived(v) {
    return typeof v === 'function' && v._isDerived === true;
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

  function currentLifecycleScope() {
    var el = window.__STX_CURRENT_ELEMENT__;
    if (!el || !el.getAttribute || !window.stx || !window.stx._scopes) return null;
    var scopeId = el.getAttribute('data-stx-scope');
    return scopeId ? window.stx._scopes[scopeId] || null : null;
  }

  function onMount(fn) {
    var scope = currentLifecycleScope();
    if (scope) {
      scope.__mountCallbacks = scope.__mountCallbacks || [];
      scope.__mountCallbacks.push(fn);
      return;
    }
    mountCallbacks.push(fn);
  }

  function onDestroy(fn) {
    var scope = currentLifecycleScope();
    if (scope) {
      scope.__destroyCallbacks = scope.__destroyCallbacks || [];
      scope.__destroyCallbacks.push(fn);
      return;
    }
    destroyCallbacks.push(fn);
  }

  // Run mount callbacks and keep whatever teardown they hand back.
  //
  // A mount callback may return its own cleanup — the shape LifecycleCallback
  // has always declared, and the shape every peer framework uses. Only the two
  // component-factory paths honoured it; the other flush sites called fn() and
  // dropped the result on the floor, so the teardown never ran and nothing said
  // so. A listener or timer registered that way outlived its element and leaked
  // once per re-render (#1857).
  //
  // The sink argument is where a returned cleanup is parked: a scoped flush
  // passes that scope's __destroyCallbacks, a global flush passes the module
  // queue. (No backticks in this comment — it lives inside a template literal.)
  function runMountCallbacks(list, sink) {
    if (!list || !list.length) return;
    var target = sink || destroyCallbacks;
    // Drain before running. A mount callback fires once, and leaving the queue
    // in place made that untrue: the DOM-ready handler reaches this with the
    // same shared mountCallbacks array twice — once inside the per-root
    // hydration loop, then again for the global pass — and only emptied it
    // after the second call. So every onMount on a page with a data-stx root
    // ran twice, and a page with N roots ran them N+1 times. Every request the
    // hook made was duplicated with it.
    // Taking the batch out first also keeps a callback that registers another
    // onMount honest: the new one queues for the next flush instead of being
    // swallowed by the clear or replayed by the next caller.
    var batch = list.splice(0, list.length);
    for (var i = 0; i < batch.length; i++) {
      try {
        var cleanup = batch[i]();
        if (typeof cleanup === 'function') target.push(cleanup);
      }
      catch (e) { console.error('[stx] onMount error:', e); }
    }
  }

  // The scope's own teardown queue, created on demand so a scope that never
  // returns a cleanup does not carry an empty array around.
  function scopeDestroySink(scopeVars) {
    if (!scopeVars) return destroyCallbacks;
    scopeVars.__destroyCallbacks = scopeVars.__destroyCallbacks || [];
    return scopeVars.__destroyCallbacks;
  }

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
    // Starts false when nothing will be requested. It used to start true
    // unconditionally while the only thing clearing it was the fetch that
    // immediate:false suppresses — so the documented way to declare a deferred
    // request produced a composable stuck loading forever, which is exactly the
    // case where a template is most likely driving a spinner off it (#1818).
    const immediate = options.immediate !== false;
    const loading = state(immediate);
    // Any request in flight, background ones included. loading answers "is
    // there nothing to show yet"; isFetching answers "is a request open" — and
    // a background refresh is the case where those two stop agreeing (#1929).
    const isFetching = state(immediate);
    const error = state(null);
    if (options.suspense) registerSuspense(loading, error);

    // A superseded or unmounted request must not resolve into a torn-down
    // scope. Each run gets its own AbortController; a newer run (refetch or a
    // reactive URL change) aborts the one before it, and onDestroy aborts the
    // last in-flight one. State writes are guarded on signal.aborted (#1871).
    let __stxAbort = null;

    // runOptions: { background: true } refreshes data WITHOUT touching loading
    // or clearing the current error, so a poll cannot flash a spinner or blank
    // an error message that is still true. Everything already on screen stays
    // there until the new response actually lands (#1929).
    const fetchData = async (runOptions) => {
      const background = !!(runOptions && runOptions.background);
      if (__stxAbort) __stxAbort.abort();
      __stxAbort = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const __signal = __stxAbort ? __stxAbort.signal : undefined;
      if (!background) loading.set(true);
      isFetching.set(true);
      if (!background) error.set(null);

      try {
        const url = typeof urlOrFn === 'function' ? urlOrFn() : urlOrFn;
        if (!url) {
          if (!background) loading.set(false);
          isFetching.set(false);
          return;
        }

        const fetchOptions = {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...__stxHeaders(options.headers)
          },
          signal: __signal
        };

        if (options.body) {
          fetchOptions.body = typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body);
        }

        const response = await __stxFetch('useFetch', url, fetchOptions);
        if (__signal && __signal.aborted) return;

        if (!response.ok) throw await __stxHttpError(response);

        const result = await response.json();
        if (__signal && __signal.aborted) return;

        // Apply transform if provided
        const transformed = options.transform ? options.transform(result) : result;
        data.set(transformed);
        // A background run did not clear the error up front, so a recovery has
        // to clear it here — otherwise the first failed poll would leave the
        // message on screen for the life of the page.
        if (background) error.set(null);
      }
catch (e) {
        // A superseded/unmounted request rejects with AbortError — expected,
        // not a failure to surface. The run that superseded it owns the state.
        if (e && e.name === 'AbortError') return;
        console.error('[STX] useFetch error:', e);
        // Store Error objects (not just messages) so consumers can use
        // .message, .stack, instanceof Error. Matches the composable's
        // shape; pinned by use-fetch-parity.test.ts (#1726).
        error.set(e instanceof Error ? e : new Error(String(e)));
        if (options.onError) options.onError(e);
      }
finally {
        // If a newer run (or onDestroy) aborted this one, that run owns loading.
        if (!__signal || !__signal.aborted) {
          if (!background) loading.set(false);
          isFetching.set(false);
        }
      }
    };

    // A reactive URL drives its own fetching: effect() runs eagerly on creation,
    // so the first run IS the mount fetch. Registering onMount as well issued
    // two requests for every function URL (#1818).
    if (typeof urlOrFn === 'function') {
      var firstUrlRun = true;
      effect(() => {
        const url = urlOrFn();
        if (!url) return;
        // Honour immediate:false for the FIRST evaluation only. A later change
        // to the URL is a new request the caller asked for by changing it, not
        // the initial one they deferred.
        if (firstUrlRun) {
          firstUrlRun = false;
          if (!immediate) return;
        }
        fetchData();
      });
    }
else if (immediate) {
      onMount(fetchData);
    }

    // Abort an in-flight request when the owning scope is destroyed, so its
    // resolution can't write into a torn-down component (#1871).
    if (typeof onDestroy === 'function') onDestroy(function() { if (__stxAbort) __stxAbort.abort(); });

    return {
      data,
      loading,
      isFetching,
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
    // A ref belongs to the component scope that created it. Capturing that
    // owner now is essential: componentScope is a mutable compatibility
    // fallback and changes while the rest of the page hydrates. Reading it
    // from the getter made an early component resolve refs from whichever
    // component happened to hydrate last.
    var ownerScope = currentLifecycleScope() || componentScope;

    // Callable, as well as .current / .value.
    //
    // Every other accessor a script destructures alongside this one is
    // call-style — state(), derived(), useReactiveProp() — so myRef() is what
    // a reader reaches for, and it used to throw "myRef is not a function".
    // Inside effect()'s first run that throw escaped the effect, escaped the
    // generated setup function, and left the WHOLE page unhydrated: every
    // @click inert, every interpolation unbound, the markup otherwise
    // perfect. Either API alone looked fine, which is what made it hard to
    // see. Same reasoning as useCookie becoming a Signal in #1710.
    //
    // No backticks in here: this whole runtime is a template literal.
    var read = function () {
      return (ownerScope.$refs && ownerScope.$refs[name]) || null;
    };
    Object.defineProperty(read, 'current', { get: read, enumerable: true });
    Object.defineProperty(read, 'value', { get: read, enumerable: true });
    return read;
  }

  // ==========================================================================
  // Navigation API
  // ==========================================================================

  // Second argument is an options object: { replace, reload }.
  //
  // It used to be a bare forceReload boolean while the shipped declaration
  // promised { replace?: boolean } — so the one call the type system invited,
  // navigate(url, { replace: true }), took the truthy branch and did a full
  // document load that PUSHED a history entry: the opposite of replace, at the
  // cost of the SPA router, with no error (#1807).
  //
  // A bare boolean is still accepted and still means "full reload", because
  // that was the real shipped behaviour and docs and examples contain it.
  function navigate(url, options) {
    var opts = (options && typeof options === 'object') ? options : { reload: !!options };
    var replace = !!opts.replace;
    var reload = !!(opts.reload || opts.forceReload);
    if (!reload && window.stxRouter && typeof window.stxRouter.navigate === 'function') {
      window.stxRouter.navigate(url, { replace: replace });
      return;
    }
    if (replace) window.location.replace(url);
    else window.location.href = url;
  }

  // Re-run the CURRENT route against the server and swap the result, keeping
  // every client signal on the page alive.
  //
  // The router grew refresh()/invalidate() for this, but they lived only on
  // window.stxRouter — nothing in the authoring surface reached them, so a
  // <script client> block still had no way to say "the mutation changed what
  // the server rendered". Apps kept calling location.reload() and threw away
  // the state the SPA exists to preserve. See #1850.
  //
  // Degrades to a real reload when the router is absent (a page that never
  // booted it, or a mid-boot call), mirroring how navigate() falls through to
  // window.location.
  function refresh() {
    if (window.stxRouter && typeof window.stxRouter.refresh === 'function')
      return window.stxRouter.refresh();
    window.location.reload();
    return Promise.resolve(false);
  }

  // Expire a cached route so the NEXT visit re-fetches it, without navigating
  // now. Pairs with refresh(): refresh the page you are on, invalidate the ones
  // your mutation also changed.
  function invalidateRoute(url) {
    if (window.stxRouter && typeof window.stxRouter.invalidate === 'function')
      window.stxRouter.invalidate(url);
  }

  function goBack() { window.history.back(); }
  function goForward() { window.history.forward(); }

  // Route params — set by server injection or parsed from URL on client navigation
  var _routeParams = state({});

  // setRouteParams: called by the server-injected script to set initial params
  function setRouteParams(params) {
    var nextParams = params || {};
    _routeParams.set(nextParams);
    window.__stx_rp = nextParams;
    if (window.stx) window.stx._rp = nextParams;
  }

  // Listen for SPA navigation to update params
  window.addEventListener('stx:navigate', function(e) {
    // The destination fragment's data-stx-route-params script runs after this
    // event and before stx:load. Reset first so a static route can never inherit
    // params from the dynamic route that preceded it.
    var nextParams = e.detail
      && Object.prototype.hasOwnProperty.call(e.detail, 'params')
      ? e.detail.params
      : {};
    setRouteParams(nextParams);
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

  // Exported from src/runtime.ts, whose whole stated purpose is client-facing
  // APIs that hide window internals — but never published on window.stx, so a
  // client script importing them destructured undefined and threw on use. The
  // capability was always here behind useRoute().params; only the documented
  // names were unreachable (stacksjs/stx#1843).
  function useRouteParams() {
    return _routeParams();
  }

  function useRouteParam(name, fallback) {
    var value = _routeParams()[name];
    return value === undefined ? fallback : value;
  }

  function useSearchParams() {
    var params = state(Object.fromEntries(new URLSearchParams(window.location.search)));
    var syncFromUrl = function() {
      params.set(Object.fromEntries(new URLSearchParams(window.location.search)));
    };
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('stx:navigate', syncFromUrl);
    // Own-property reads only. The backing object comes from Object.fromEntries,
    // so it inherits Object.prototype — an unguarded params()[key] returned a
    // FUNCTION for 'toString', 'constructor', 'valueOf' and friends, which is
    // neither a string nor undefined and matches no declared return type.
    var own = function(key) {
      var current = params();
      return Object.prototype.hasOwnProperty.call(current, key);
    };
    // pushState by default; replaceState when the caller asks for it (#1825).
    //
    // The canonical reason to delete a param is to CONSUME a one-shot value —
    // an OAuth callback result, ?checkout=success, a flash token — and the
    // point of consuming it is that it must not survive a Back press. Under
    // pushState the pre-delete URL, the one still carrying the param, becomes
    // the previous entry, so Back replays the callback and whatever consuming
    // it triggered runs again.
    //
    // Default stays pushState so nothing that works today changes, and the
    // option is spelled { replace } to match navigate(), which already takes it.
    var commit = function(url, options) {
      // A plain truthy read of the replace property looks equivalent and is
      // not: it asks whether the value HAS a replace property, and every string
      // has String.prototype.replace — so delete(key, 'push') would have
      // replaced, the exact opposite of what it reads as. Requiring an object
      // also keeps this identical to the module implementation in
      // composables/use-router.ts; with optional chaining alone the two
      // disagreed on the empty string, which short-circuits in one and hits
      // String.prototype.replace in the other.
      //
      // NB: no backticks anywhere in this block. This runtime is assembled as a
      // template literal, so a backtick in a COMMENT ends the string and the
      // rest of the runtime is parsed as code.
      var replace = !!(options && typeof options === 'object' && options.replace);
      if (replace)
        window.history.replaceState({}, '', url);
      else
        window.history.pushState({}, '', url);
      syncFromUrl();
    };
    return {
      data: params,
      get: function(key) { return own(key) ? params()[key] : undefined; },
      has: own,
      set: function(key, value, options) {
        var url = new URL(window.location.href);
        url.searchParams.set(key, value);
        commit(url, options);
      },
      // delete and has were DECLARED but absent, so the compiler endorsed calls
      // that threw in the browser; setAll and data were present but undeclared
      // (#1806). Deleting writes history the same way set does, for consistency.
      'delete': function(key, options) {
        var url = new URL(window.location.href);
        url.searchParams['delete'](key);
        commit(url, options);
      },
      setAll: function(obj, options) {
        var url = new URL(window.location.href);
        Object.keys(obj).forEach(function(k) { url.searchParams.set(k, obj[k]); });
        commit(url, options);
      }
    };
  }

  // ==========================================================================
  // Advanced Data Fetching (useQuery / useMutation)
  // ==========================================================================

  var _queryCache = {};
  // Requests currently in flight, keyed exactly like _queryCache. _queryCache
  // is written only after the body parses, so the whole in-flight window was a
  // cache miss and N components mounting together issued N identical requests
  // (#1869). Refcounted: a caller that loses interest must not cancel a
  // response another caller is still waiting on.
  var _queryInflight = {};
  var __stxQueryInstance = 0;

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
    // See useFetch: loading means "nothing to show yet", isFetching means "a
    // request is open" — including a background refresh, which is the case that
    // makes the distinction necessary (#1929).
    var isFetching = state(true);
    var error = state(null);
    var isStale = state(false);
    if (options.suspense) registerSuspense(loading, error);

    // Per-run AbortController: a newer run aborts the previous in-flight one and
    // onDestroy aborts the last, so a resolved request can't write into a
    // torn-down scope (#1871).
    var __stxAbort = null;
    // Identity, so dedup can tell "another component wants this key" from
    // "this component asked again". They must behave differently: joining is
    // right for the first, and wrong for the second — refetch() after a
    // mutation has to hit the network, not adopt the pre-mutation request that
    // happens to still be open (#1869).
    var __instanceId = ++__stxQueryInstance;
    // The shared entry this instance is currently attached to, so superseding
    // can release its claim without cancelling a request someone else joined.
    var __joined = null;

    // runOptions: { background: true } refreshes without touching loading or
    // clearing the current error. A poll must not flash a spinner over data
    // that is already on screen (#1929).
    var fetchData = async function(runOptions) {
      var background = !!(runOptions && runOptions.background);
      var resolvedUrl = typeof url === 'function' ? url() : url;
      if (!resolvedUrl) { if (!background) loading.set(false); isFetching.set(false); return; }
      var key = cacheKey || resolvedUrl;

      // Check cache
      var cached = _queryCache[key];
      if (cached && (Date.now() - cached.timestamp < staleTime)) {
        data.set(cached.data);
        if (!background) loading.set(false);
        isFetching.set(false);
        isStale.set(false);
        if (options.onSuccess) options.onSuccess(cached.data);
        return;
      }

      // Stale-while-revalidate
      if (cached) {
        data.set(cached.data);
        isStale.set(true);
      }

      // Join a request ANOTHER instance already has open for this key. Not one
      // of our own: this instance calling refetch() means "I want fresh data",
      // and adopting its own pre-mutation request would silently return stale
      // data — so an own-instance run still supersedes, exactly as #1871 says.
      var shared = _queryInflight[key];
      if (shared && shared.owner !== __instanceId) {
        shared.refs++;
        __joined = shared;
        if (!background) loading.set(true);
        isFetching.set(true);
        if (!background) error.set(null);
        try {
          var joinedResult = await shared.promise;
          var joinedTransformed = options.transform ? options.transform(joinedResult) : joinedResult;
          data.set(joinedTransformed);
          if (background) error.set(null);
          isStale.set(false);
          if (options.onSuccess) options.onSuccess(joinedTransformed);
        }
        catch (e) {
          if (e && e.name === 'AbortError') return;
          error.set(e.message || 'Query failed');
          if (options.onError) options.onError(e);
        }
        finally {
          shared.refs--;
          if (__joined === shared) __joined = null;
          if (!background) loading.set(false);
          isFetching.set(false);
        }
        return;
      }

      // Superseding this instance's own run. Abort ONLY if nobody joined it —
      // cancelling a request another component is waiting on would leave it
      // loading forever, which would turn #1871's fix into a worse bug.
      if (__stxAbort) {
        if (__joined && __joined.refs > 1) __joined.refs--;
        else __stxAbort.abort();
      }
      __joined = null;
      __stxAbort = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var __signal = __stxAbort ? __stxAbort.signal : undefined;
      if (!background) loading.set(true);
      isFetching.set(true);
      if (!background) error.set(null);
      try {
        var fetchOpts = { method: 'GET', headers: { 'Content-Type': 'application/json', ...__stxHeaders(options.headers) }, signal: __signal };
        // Published BEFORE it is awaited, so a caller starting in the same tick
        // finds it. The network part only — transform, cache write and
        // onSuccess stay per-caller, since each may transform differently.
        var netPromise = (async function() {
          var response = await __stxFetch('useQuery', resolvedUrl, fetchOpts);
          if (!response.ok) throw await __stxHttpError(response);
          return await response.json();
        })();
        var entry = { owner: __instanceId, refs: 1, controller: __stxAbort, promise: netPromise };
        _queryInflight[key] = entry;
        __joined = entry;
        // Cleared on settle, both ways. A settled entry left behind would turn
        // dedup into a permanent cache and no request for this key would ever
        // be issued again.
        var releaseEntry = function() { if (_queryInflight[key] === entry) delete _queryInflight[key]; };
        netPromise.then(releaseEntry, releaseEntry);

        var result = await netPromise;
        if (__signal && __signal.aborted) return;
        var transformed = options.transform ? options.transform(result) : result;
        data.set(transformed);
        if (background) error.set(null);
        isStale.set(false);
        _queryCache[key] = { data: transformed, timestamp: Date.now() };
        if (options.onSuccess) options.onSuccess(transformed);
        // Schedule cache eviction
        setTimeout(function() { delete _queryCache[key]; }, cacheTime);
      }
catch (e) {
        // A superseded/unmounted request rejects with AbortError — expected;
        // the run that superseded it owns the state (#1871).
        if (e && e.name === 'AbortError') return;
        error.set(e.message || 'Query failed');
        if (options.onError) options.onError(e);
      }
finally {
        if (!__signal || !__signal.aborted) {
          if (!background) loading.set(false);
          isFetching.set(false);
        }
      }
    };

    if (options.immediate !== false) {
      onMount(fetchData);
    }

    // A refetch nobody asked for does not set loading. Both of these refresh
    // data that is ALREADY on screen, so driving the first-load state from them
    // put a spinner over a populated view once a minute, forever — the reason a
    // polling view could not use this composable at all (#1929). Bind
    // isFetching for a subtle in-flight indicator.
    var backgroundRun = { background: true };

    // refetchOnFocus — removed on destroy, like refetchInterval right below.
    // It used to add a listener and never remove it, so every instance leaked
    // one for the life of the page and each SPA navigation added more; every
    // stale listener still fired, refetching for components long gone (#1818).
    if (options.refetchOnFocus) {
      var onVisibility = function() {
        if (!document.hidden) fetchData(backgroundRun);
      };
      document.addEventListener('visibilitychange', onVisibility);
      onDestroy(function() { document.removeEventListener('visibilitychange', onVisibility); });
    }

    // refetchInterval: poll only while the tab is visible and (if given)
    // enabled holds; optionally stop after an error so a broken endpoint is
    // not hammered every interval in a backgrounded tab (#1870).
    if (options.refetchInterval) {
      var intervalId = setInterval(function() {
        if (typeof document !== 'undefined' && document.hidden) return;
        var en = options.enabled;
        if (typeof en === 'function' ? !en() : en === false) return;
        var p = fetchData(backgroundRun);
        if (options.stopOnError && p && typeof p.then === 'function') {
          p.then(function() { if (error()) clearInterval(intervalId); });
        }
      }, options.refetchInterval);
      onDestroy(function() { clearInterval(intervalId); });
    }

    // Abort an in-flight request when the owning scope is destroyed (#1871).
    onDestroy(function() { if (__stxAbort) __stxAbort.abort(); });

    return {
      data: data,
      loading: loading,
      isFetching: isFetching,
      error: error,
      isStale: isStale,
      refetch: fetchData,
      invalidate: function(runOptions) {
        var key = cacheKey || (typeof url === 'function' ? url() : url);
        delete _queryCache[key];
        return fetchData(runOptions);
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
          headers: { 'Content-Type': 'application/json', ...__stxHeaders(options.headers) },
          body: typeof body === 'string' ? body : JSON.stringify(body)
        };
        var response = await __stxFetch('useMutation', resolvedUrl, fetchOpts);
        if (!response.ok) throw await __stxHttpError(response);
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

  function toValue(expr, el, enableAutoUnwrap = true, extraScope = {}) {
    try {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expr.trim())) {
        return expr;
      }
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      const baseScope = { ...globalHelpers, ...componentScope, ...(elementScope || {}), ...extraScope };

      // Check for pipe syntax (Feature #2)
      const pipeResult = parsePipeExpression(expr, baseScope);
      if (pipeResult) {
        // Use auto-unwrap proxy for pipe expressions
        const unwrapScope = enableAutoUnwrap
          ? createAutoUnwrapProxy(baseScope, function(prop) {
              if (typeof prop !== 'string') return false;
              return expressionCallsSignal(expr, prop)
                || expressionUsesSignalApi(expr, prop);
            })
          : baseScope;
        const piped = executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope);
        return (piped && typeof piped === 'function' && (piped._isSignal || piped._isDerived)) ? piped() : piped;
      }

      // Use auto-unwrap proxy if enabled (Feature #1)
      const scope = enableAutoUnwrap
        ? createAutoUnwrapProxy(baseScope, function(prop) {
            if (typeof prop !== 'string') return false;
            return expressionCallsSignal(expr, prop)
              || expressionUsesSignalApi(expr, prop);
          })
        : baseScope;
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
        return ($event) => {
          const addValue = toValue(valueExpr, null, true, { ...scope, $event: $event });
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
        return ($event) => {
          const newValue = toValue(valueExpr, null, true, { ...scope, $event: $event });
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

  function expressionUsesSignalApi(expression, name) {
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return expressionUsesSignalMethod(expression, name)
      || expressionUsesSignalValue(expression, name);
  }

  function expressionUsesSignalMethod(expression, name) {
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return new RegExp('(?:^|[^\\\\w$])' + escapedName + '\\\\s*\\\\.\\\\s*(?:set|update|subscribe)\\\\s*\\\\(').test(expression);
  }

  function expressionUsesSignalValue(expression, name) {
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return new RegExp('(?:^|[^\\\\w$])' + escapedName + '\\\\s*\\\\.\\\\s*value\\\\b').test(expression);
  }

  function expressionCallsSignal(expression, name) {
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return new RegExp('(?:^|[^\\\\w$])' + escapedName + '\\\\s*\\\\(').test(expression);
  }

  function createExpressionAutoUnwrapProxy(scope, expression) {
    return createAutoUnwrapProxy(scope, function(prop, signal) {
      if (typeof prop !== 'string') return false;
      if (expressionCallsSignal(expression, prop) || expressionUsesSignalMethod(expression, prop))
        return true;
      if (!expressionUsesSignalValue(expression, prop))
        return false;

      // A :for item is itself represented by a signal. If that item's value
      // is an object with a real value field, item.value means the field,
      // not the signal wrapper API. Primitive signals still support
      // count.value, matching the explicit ref syntax.
      try {
        var currentValue = signal();
        return !(currentValue && typeof currentValue === 'object'
          && Object.prototype.hasOwnProperty.call(currentValue, 'value'));
      }
      catch (e) {
        return true;
      }
    });
  }

  function executeHandler(expr, event, el) {
    try {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expr.trim())) {
        return;
      }
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      const scope = { ...globalHelpers, ...componentScope, ...(elementScope || {}) };

      // Check for shorthand syntax (Feature #8)
      const shorthandFn = parseEventShorthand(expr, scope);
      if (shorthandFn) {
        shorthandFn(event);
        return;
      }

      // Loop items arrive as signals (see createItemElements). Unwrap them for
      // the same reason the inline @event path does: \`item.value\` in a handler
      // means the item's field, not the signal API.
      const handlerScope = {};
      Object.keys(scope).forEach(function(k) {
        const v = scope[k];
        handlerScope[k] = (v && typeof v === 'function' && v._isStxLoopItem) ? v() : v;
      });
      const fn = new Function(...Object.keys(handlerScope), '$event', expr);
      fn(...Object.values(handlerScope), event);
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
          runMountCallbacks(sv.__mountCallbacks, scopeDestroySink(sv));
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
          s.onerror = function() {
            // Network error / 404: the island can't become interactive. Log,
            // emit an observable event (analytics/monitoring can react), then
            // best-effort finish. The server-rendered HTML stays visible
            // (x-cloak was already removed on arming) — it just won't wire up.
            console.error('[stx] island chunk load failed:', sid, chunkSrc);
            window.dispatchEvent(new CustomEvent('stx:island-error', { detail: { el: el, scopeId: sid, src: chunkSrc } }));
            finishHydrate();
          };
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

  function isForDirectiveExpression(expr) {
    return typeof expr === 'string'
      && /^\\s*\\(?\\s*\\w+(?:\\s*,\\s*\\w+)?\\s*\\)?\\s+(?:in|of)\\s+.+\\s*$/.test(expr);
  }

  function getElementAttributes(el) {
    if (!el || !el.attributes) return [];
    return Array.from(el.attributes).map(function(attr) {
      // Browser DOM exposes Attr records through NamedNodeMap. HappyDOM and
      // other standards-oriented DOM implementations may expose Map entries
      // for cloned nodes instead. Normalize both shapes so reactive nodes
      // created by :for hydrate exactly like their browser counterparts.
      if (Array.isArray(attr)) return { name: attr[0], value: attr[1] };
      return attr;
    });
  }

  function getModelBinding(el) {
    if (!el || !el.attributes) return null;
    var prefixes = ['x-model', ':model', '@model'];
    var attrs = getElementAttributes(el);
    for (var i = 0; i < attrs.length; i++) {
      var name = attrs[i] && attrs[i].name;
      if (!name) continue;
      for (var j = 0; j < prefixes.length; j++) {
        if (name === prefixes[j] || name.indexOf(prefixes[j] + '.') === 0)
          return { name: name, expression: attrs[i].value };
      }
    }
    return null;
  }

  function readDeferredParentComponentProps(el) {
    var serialized = el.getAttribute('data-stx-deferred-parent-bindings');
    if (!serialized) return {};
    try {
      var parsed = JSON.parse(serialized);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch (e) {
      return {};
    }
  }

  function preserveDeferredParentComponentProps(el) {
    var names = (el.getAttribute('data-stx-parent-bindings') || '').split(/\\s+/).filter(Boolean);
    if (!names.length) return;
    var deferred = readDeferredParentComponentProps(el);
    names.forEach(function(name) {
      var sourceName = ':' + name;
      if (el.hasAttribute(sourceName))
        deferred[name] = el.getAttribute(sourceName);
    });
    if (Object.keys(deferred).length)
      el.setAttribute('data-stx-deferred-parent-bindings', JSON.stringify(deferred));
  }

  function hasPendingLoopBoundary(el) {
    var loopBoundary = el;
    while (loopBoundary && loopBoundary !== document) {
      var loopExpression = loopBoundary.getAttribute && (
        loopBoundary.getAttribute('@for')
        || loopBoundary.getAttribute(':for')
        || loopBoundary.getAttribute('x-for')
      );
      if (loopExpression && isForDirectiveExpression(loopExpression))
        return true;
      loopBoundary = loopBoundary.parentElement || loopBoundary.parentNode;
    }
    return false;
  }

  function hasPendingAncestorLoopBoundary(el) {
    var loopBoundary = el && (el.parentElement || el.parentNode);
    while (loopBoundary && loopBoundary !== document) {
      var loopExpression = loopBoundary.getAttribute && (
        loopBoundary.getAttribute('@for')
        || loopBoundary.getAttribute(':for')
        || loopBoundary.getAttribute('x-for')
      );
      if (loopExpression && isForDirectiveExpression(loopExpression))
        return true;
      loopBoundary = loopBoundary.parentElement || loopBoundary.parentNode;
    }
    return false;
  }

  function syncComponentPropSignal(el, name, value) {
    if (!el || !el.getAttribute || value === undefined) return;
    var scopeId = el.getAttribute('data-stx-scope');
    var scopeVars = scopeId && window.stx._scopes && window.stx._scopes[scopeId];
    var camelName = name.replace(/-([a-z0-9])/g, function(_, character) {
      return character.toUpperCase();
    });
    // useReactiveProp signals are often intentionally aliased inside the
    // child, for example liveClosable = useReactiveProp('closable', true).
    // The public prop name therefore cannot be inferred from the variable
    // name exported by the component scope. Keep an element-owned registry as
    // the canonical bridge, with the scope lookup retained for older output.
    var propSignals = el.__stx_reactive_prop_signals;
    var propSignal = propSignals && (propSignals[name] || propSignals[camelName]);
    if (!propSignal && scopeVars)
      propSignal = scopeVars[name] || scopeVars[camelName];
    if (!propSignal || !propSignal._isSignal || typeof propSignal.set !== 'function') return;
    var directValues = el.__stx_direct_prop_values || (el.__stx_direct_prop_values = {});
    var directValue = {
      raw: el.hasAttribute(name) ? el.getAttribute(name) : null,
      value: value,
    };
    directValues[name] = directValue;
    directValues[camelName] = directValue;
    // This runs inside the parent binding effect. Reading the child prop
    // signal normally would subscribe that effect to its own output. Parent
    // expressions that return a fresh array or object would then recurse:
    // syncing the child retriggers the parent, which creates another value.
    // Compare without dependency tracking so the effect only follows the
    // caller-owned signals used by the binding expression.
    if (!Object.is(peek(function() { return propSignal(); }), value))
      propSignal.set(value);
  }

  function bindParentComponentProps(el, callerScope) {
    if (!el || !el.getAttribute || el.__stx_parent_props_bound) return;
    var names = (el.getAttribute('data-stx-parent-bindings') || '').split(/\\s+/).filter(Boolean);
    if (!names.length) return;
    if (hasPendingLoopBoundary(el)) {
      preserveDeferredParentComponentProps(el);
      return;
    }
    var deferred = readDeferredParentComponentProps(el);
    var bindings = names.map(function(name) {
      var sourceName = ':' + name;
      var expression = el.hasAttribute(sourceName) ? el.getAttribute(sourceName) : deferred[name];
      return typeof expression === 'string'
        ? { name: name, sourceName: sourceName, expression: expression }
        : null;
    }).filter(Boolean);
    if (!bindings.length) return;
    el.__stx_parent_props_bound = true;
    var scope = { ...globalHelpers, ...callerScope };

    bindings.forEach(function(binding) {
      var name = binding.name;
      var sourceName = binding.sourceName;
      var expression = binding.expression;
      effect(function() {
        var value;
        try {
          // Support both signal styles in forwarded props:
          //   :open="open" and :open="open()".
          // Auto-unwrap bare signals, but preserve a signal function when this
          // expression explicitly calls it or accesses its object API.
          var unwrapScope = createAutoUnwrapProxy(scope, function(prop) {
            if (typeof prop !== 'string') return false;
            return expressionCallsSignal(expression, prop)
              || expressionUsesSignalApi(expression, prop);
          });
          var fn = new Function('__scope__', 'with(__scope__) { return (' + expression + ') }');
          value = fn(unwrapScope);
          if (value && typeof value === 'function' && (value._isSignal || value._isDerived)) value = value();
        }
        catch (e) {
          if (!(e instanceof ReferenceError) && !(e instanceof TypeError))
            console.warn('[STX] Parent component prop error:', expression, e);
          value = undefined;
        }

        if (value === false || value === null || value === undefined) {
          el.removeAttribute(name);
        }
        else if (value === true) {
          el.setAttribute(name, '');
        }
        else {
          var serialized = value;
          if (typeof value === 'object') {
            try { serialized = JSON.stringify(value); }
            catch (e) { serialized = String(value); }
          }
          el.setAttribute(name, serialized);
        }
        // The component setup scope is already registered for normal and
        // cloned signal components. Update its prop signal directly so object
        // identity and synchronous Vue-like prop delivery do not depend on a
        // MutationObserver round trip through a serialized DOM attribute.
        // The attribute remains the public DOM reflection and observer fallback
        // for scopes that register after this binding pass.
        syncComponentPropSignal(el, name, value);
      });
      el.removeAttribute(sourceName);
      delete deferred[name];
    });
    if (Object.keys(deferred).length)
      el.setAttribute('data-stx-deferred-parent-bindings', JSON.stringify(deferred));
    else
      el.removeAttribute('data-stx-deferred-parent-bindings');
  }

  function resolveComponentCallerScope(el, pageScope) {
    var resolved = { ...pageScope };
    var ancestors = [];
    var current = el && (el.parentElement || el.parentNode);
    while (current && current !== document) {
      if (current.getAttribute && current.hasAttribute('data-stx-scope'))
        ancestors.push(current.getAttribute('data-stx-scope'));
      current = current.parentElement || current.parentNode;
    }
    ancestors.reverse().forEach(function(scopeId) {
      var ancestorScope = window.stx._scopes && window.stx._scopes[scopeId];
      if (ancestorScope) Object.assign(resolved, ancestorScope);
    });
    return resolved;
  }

  // A false :if detaches its subtree before the DOMContentLoaded scope walk
  // reaches nested components. Capture and bind their caller-owned props while
  // the ancestor chain is still connected, otherwise resolveComponentCallerScope
  // can no longer see the component that declared expressions such as
  // :options="environmentOptions".
  function preserveConditionalComponentScopes(root, callerScope) {
    if (!root || !root.querySelectorAll) return;
    var scopeEls = [];
    if (root.matches && root.matches('[data-stx-scope]')) scopeEls.push(root);
    root.querySelectorAll('[data-stx-scope]').forEach(function(scopeEl) { scopeEls.push(scopeEl); });
    scopeEls.forEach(function(scopeEl) {
      if (scopeEl.__stx_parent_props_bound) return;
      // A component inside a descendant loop cannot resolve its caller props
      // until bindFor creates the iteration scope. Binding it while the outer
      // conditional is being detached would consume expressions such as
      // :status="deployment.status" before the deployment item exists, leaving every
      // later clone with the child's default prop. bindFor hydrates these
      // component scopes after insertion with the correct per-item scope.
      var current = scopeEl;
      while (current && current !== root) {
        if (current.hasAttribute
          && (current.hasAttribute('@for') || current.hasAttribute(':for') || current.hasAttribute('x-for'))) {
          preserveDeferredParentComponentProps(scopeEl);
          return;
        }
        current = current.parentElement || current.parentNode;
      }
      scopeEl.__stx_parent_scope = resolveComponentCallerScope(scopeEl, callerScope);
      bindParentComponentProps(scopeEl, scopeEl.__stx_parent_scope);
    });
  }

  // Component setup scripts are emitted immediately after their scoped root.
  // When that root itself carries :if, detaching only the element leaves the
  // sibling setup script outside the conditional node group. Scripts inserted
  // through innerHTML are inert, so the later hydration pass has no script to
  // execute and the component keeps raw directives and interpolations.
  function findConditionalComponentSetupSiblings(root) {
    if (!root || !root.hasAttribute || !root.hasAttribute('data-stx-scope')) return [];
    var scopeId = root.getAttribute('data-stx-scope');
    var templateScopeId = root.getAttribute('data-stx-template-scope') || scopeId;
    if (!scopeId) return [];

    var scripts = [];
    var sibling = root.nextSibling;
    while (sibling) {
      var next = sibling.nextSibling;
      if (sibling.nodeType === Node.TEXT_NODE && !(sibling.textContent || '').trim()) {
        sibling = next;
        continue;
      }
      if (sibling.nodeType === Node.COMMENT_NODE) {
        sibling = next;
        continue;
      }
      if (sibling.nodeType === Node.ELEMENT_NODE
        && sibling.tagName === 'STYLE'
        && sibling.hasAttribute('data-stx-vendor')) {
        sibling = next;
        continue;
      }
      if (sibling.nodeType === Node.ELEMENT_NODE
        && sibling.tagName === 'SCRIPT'
        && sibling.hasAttribute('data-stx-scoped')
        && ((sibling.textContent || '').indexOf(scopeId) !== -1
          || (templateScopeId && (sibling.textContent || '').indexOf(templateScopeId) !== -1))) {
        scripts.push(sibling);
        sibling = next;
        continue;
      }
      break;
    }
    return scripts;
  }

  function processElement(el, scope = componentScope) {
    // Lazy hydration: if this element has stx-hydrate and hasn't been hydrated
    // yet, defer its subtree processing until the trigger fires.
    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute && el.hasAttribute('stx-hydrate') && !el.__stx_hydrated) {
      var trigger = el.getAttribute('stx-hydrate') || 'idle';
      deferHydration(el, trigger, scope);
      return;
    }
    if (el.nodeType === Node.ELEMENT_NODE
      && el.hasAttribute
      && el.hasAttribute('data-stx-scope')
      && hasPendingAncestorLoopBoundary(el)) {
      preserveDeferredParentComponentProps(el);
      // Even when the component is itself a loop root, an ancestor loop must
      // create its caller item scope first. The ancestor's bindFor pass will
      // clone and hydrate this component with that scope, then its own loop can
      // evaluate expressions such as group.resources.
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
          var memoScope = { ...globalHelpers, ...scope, ...(findElementScope(el) || {}) };
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
      // DOM textContent is specified as a string, but lightweight DOM
      // implementations and user-created nodes can retain a numeric value
      // assigned by a binding. Normalize before interpolation detection.
      const text = el.textContent == null ? '' : String(el.textContent);
      if (text && text.includes('{{')) {
        const parts = text.split(/(\\{\\{[\\s\\S]+?\\}\\})/g);
        if (parts.length > 1) {
          const fragment = document.createDocumentFragment();
          const parentEl = el.parentNode;
          // Capture scope NOW before effects run asynchronously
          // Use the passed scope parameter (not global componentScope) to preserve context
          // through nested @if/@for processing where componentScope may be restored
          const capturedScope = { ...globalHelpers, ...scope, ...(findElementScope(parentEl) || {}) };
          parts.forEach(part => {
            const match = part.match(/^\\{\\{\\s*([\\s\\S]+?)\\s*\\}\\}$/);
            if (match) {
              const expr = match[1];
              // Skip placeholder expressions like __TITLE__ (build-time placeholders)
              if (/^__[A-Z_]+__$/.test(expr.trim())) {
                fragment.appendChild(document.createTextNode(part));
                return;
              }
              // Native text-only elements cannot contain the span wrapper used
              // for general interpolation. Bind a text node there so options,
              // titles, and textareas retain valid DOM and accessible labels.
              const isTextOnlyParent = parentEl
                && (parentEl.tagName === 'OPTION' || parentEl.tagName === 'TITLE' || parentEl.tagName === 'TEXTAREA');
              const bindingNode = isTextOnlyParent
                ? document.createTextNode('')
                : document.createElement('span');
              fragment.appendChild(bindingNode);
              // Use captured scope, not dynamic lookup
              effect(() => {
                try {
                  // Check for pipe syntax (Feature #2)
                  const pipeResult = parsePipeExpression(expr, capturedScope);
                  if (pipeResult) {
                    const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
                    bindingNode.textContent = executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope);
                  }
else {
                    // Use auto-unwrap proxy (Feature #1)
                    const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
                    const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
                    bindingNode.textContent = fn(...Object.values(unwrapScope));
                  }
                }
catch (e) {
                  // Auto-unwrap can break explicit signal calls like errorData().message
                  // because it converts the signal to its value before the expression runs.
                  // Retry without auto-unwrap so signal functions remain callable.
                  try {
                    const fn = new Function(...Object.keys(capturedScope), 'return ' + expr);
                    bindingNode.textContent = fn(...Object.values(capturedScope));
                  }
catch (e2) {
                    if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expr, e2);
                    bindingNode.textContent = '';
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
    var hasColonForLoop = el.hasAttribute(':for') && isForDirectiveExpression(el.getAttribute(':for'));
    if (el.hasAttribute('@for') || hasColonForLoop || el.hasAttribute('x-for')) {
      var forAttr = hasColonForLoop ? ':for' : el.hasAttribute('x-for') ? 'x-for' : '@for';
      bindFor(el, scope, forAttr);
      return;
    }

    // x-else / x-else-if are owned by their preceding x-if chain (#1734).
    // An inactive chain member reached via the parent's snapshot child-
    // iteration must be skipped. Connectivity cannot identify inactivity:
    // an active inner branch is also disconnected while an outer conditional
    // temporarily detaches its parent. bindIfChain owns explicit branch state
    // so nested structural effects can still hydrate active detached subtrees.
    if (el.__stx_chain_member && !el.__stx_chain_active) return;

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
    var modelBinding = getModelBinding(el);
    if (modelBinding) {
      bindModel(el, modelBinding.expression, scope, modelBinding.name);
    }

    // Capture scope once for all attribute bindings on this element
    // Use the passed scope parameter to preserve context through nested processing
    const attrCapturedScope = { ...globalHelpers, ...scope, ...(findElementScope(el) || {}) };

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
    const evalAttrExpr = (rawExpr, evaluationScope) => {
      const activeScope = evaluationScope || attrCapturedScope;
      // Decode HTML entities that browsers may encode in attribute values
      // e.g. :text="a > b" may be stored as :text="a &gt; b" in HTML
      var expr = rawExpr.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/g,"'");
      try {
        if (/^__[A-Z_]+__$/.test(expr.trim())) return expr;

        // Check for pipe syntax (Feature #2)
        const pipeResult = parsePipeExpression(expr, activeScope);
        if (pipeResult) {
          const unwrapScope = createExpressionAutoUnwrapProxy(activeScope, expr);
          var piped = maybeUnwrapSignal(executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope));
          noteExprSuccess(expr);
          return piped;
        }

        // Use auto-unwrap proxy (Feature #1)
        const unwrapScope = createExpressionAutoUnwrapProxy(activeScope, expr);
        const fn = new Function('__scope__', 'with(__scope__) { return (' + expr + ') }');
        var value = maybeUnwrapSignal(fn(unwrapScope));
        noteExprSuccess(expr);
        return value;
      }
catch (e) {
        // Auto-unwrap can break explicit signal calls like errorData().message
        // Retry without auto-unwrap so signal functions remain callable
        try {
          const fn = new Function('__scope__', 'with(__scope__) { return (' + expr + ') }');
          var retried = maybeUnwrapSignal(fn(activeScope));
          noteExprSuccess(expr);
          return retried;
        }
catch (e2) {
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Attribute expression error:', expr, e2);
          // ReferenceError/TypeError stay unlogged HERE on purpose: a signal
          // may not exist yet on an effect's first pass, and warning on every
          // one of those trains people to ignore the console. Instead the
          // failure is recorded and cleared the moment the same expression
          // evaluates successfully, so only expressions that are STILL broken
          // when hydration finishes get reported — by the audit (#1773).
          else noteExprFailure(expr, e2);
          return '';
        }
      }
    };

    // Known directive names to exclude from generic :attr binding
    var DIRECTIVE_NAMES = {class:1, style:1, text:1, html:1, show:1, model:1, 'if':1, ref:1};
    // SVG attributes are case-sensitive, but the HTML parser lowercases
    // prefixed attribute names — ':viewBox' arrives as ':viewbox' because
    // the spec's "adjust SVG attributes" step only covers unprefixed names.
    // Without restoring the canonical casing, setAttribute('viewbox') creates
    // a dead duplicate attribute and the real viewBox never updates.
    var SVG_ATTR_CASE = {attributename:'attributeName', attributetype:'attributeType', basefrequency:'baseFrequency', baseprofile:'baseProfile', calcmode:'calcMode', clippathunits:'clipPathUnits', diffuseconstant:'diffuseConstant', edgemode:'edgeMode', filterunits:'filterUnits', glyphref:'glyphRef', gradienttransform:'gradientTransform', gradientunits:'gradientUnits', kernelmatrix:'kernelMatrix', kernelunitlength:'kernelUnitLength', keypoints:'keyPoints', keysplines:'keySplines', keytimes:'keyTimes', lengthadjust:'lengthAdjust', limitingconeangle:'limitingConeAngle', markerheight:'markerHeight', markerunits:'markerUnits', markerwidth:'markerWidth', maskcontentunits:'maskContentUnits', maskunits:'maskUnits', numoctaves:'numOctaves', pathlength:'pathLength', patterncontentunits:'patternContentUnits', patterntransform:'patternTransform', patternunits:'patternUnits', pointsatx:'pointsAtX', pointsaty:'pointsAtY', pointsatz:'pointsAtZ', preservealpha:'preserveAlpha', preserveaspectratio:'preserveAspectRatio', primitiveunits:'primitiveUnits', refx:'refX', refy:'refY', repeatcount:'repeatCount', repeatdur:'repeatDur', requiredextensions:'requiredExtensions', requiredfeatures:'requiredFeatures', specularconstant:'specularConstant', specularexponent:'specularExponent', spreadmethod:'spreadMethod', startoffset:'startOffset', stddeviation:'stdDeviation', stitchtiles:'stitchTiles', surfacescale:'surfaceScale', systemlanguage:'systemLanguage', tablevalues:'tableValues', targetx:'targetX', targety:'targetY', textlength:'textLength', viewbox:'viewBox', viewtarget:'viewTarget', xchannelselector:'xChannelSelector', ychannelselector:'yChannelSelector', zoomandpan:'zoomAndPan'};
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var EVENT_RE = /^(click|dblclick|mousedown|mouseup|mousemove|mouseenter|mouseleave|keydown|keyup|keypress|input|change|submit|focus|blur|scroll|resize|touchstart|touchend|touchmove|contextmenu|wheel|pointerdown|pointerup|pointermove)/;
    var KEY_MAP = {enter:'Enter', tab:'Tab', escape:'Escape', space:' ', up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight', 'delete':'Delete', backspace:'Backspace'};

    // Handle attributes
    getElementAttributes(el).forEach(attr => {
      const name = attr.name;
      const value = attr.value;
      if (!name) return;

      // Dynamic attribute binding: @bind:attr, x-bind:attr, :attr, OR x-attr
      // x-attr (e.g. x-class, x-style, x-href, x-src) is the canonical binding prefix.
      // :attr still works for backward compat but is reserved for structural directives.
      // x-text, x-html, x-model, x-show, x-if, x-for, x-cloak, x-ref, x-data are
      // handled by their own code paths below — exclude them here.
      var X_HANDLED = ${runtimeHandledXAttrsLiteral()};
      if (name.startsWith('@bind:') || name.startsWith('x-bind:')
          || (name.startsWith(':') && !name.startsWith('::') && !DIRECTIVE_NAMES[name.slice(1).split('.')[0]] && !EVENT_RE.test(name.slice(1)))
          || (name.startsWith('x-') && !X_HANDLED[name.split('.')[0]] && !X_HANDLED[name])) {
        let attrName = name.startsWith('@bind:') ? name.slice(6) : name.startsWith('x-bind:') ? name.slice(7) : name.startsWith('x-') ? name.slice(2) : name.slice(1);
        if (el.namespaceURI === SVG_NS && SVG_ATTR_CASE[attrName]) attrName = SVG_ATTR_CASE[attrName];
        var parentBindingNames = (el.getAttribute && el.getAttribute('data-stx-parent-bindings') || '').split(/\\s+/);
        var bindingScope = el.__stx_parent_scope && parentBindingNames.includes(attrName)
          ? el.__stx_parent_scope
          : attrCapturedScope;
        effect(() => {
          const v = evalAttrExpr(value, bindingScope);
          // Form control values are live DOM properties. Setting only the HTML
          // attribute does not update a <select>'s chosen option and can leave
          // inputs displaying stale text after a reactive update.
          if (attrName === 'value' && 'value' in el) {
            var controlValue = v;
            if (typeof v === 'object' && v !== null) {
              try { controlValue = JSON.stringify(v); }
              catch (e) { controlValue = String(v); }
            }
            controlValue = v === false || v === null || v === undefined ? '' : String(controlValue);
            el.__stx_bound_value = controlValue;
            var applyControlValue = function() {
              var desiredValue = el.__stx_bound_value == null ? '' : String(el.__stx_bound_value);
              el.value = desiredValue;
              if (desiredValue === '' && el.tagName !== 'OPTION') el.removeAttribute(attrName);
              else if (el.getAttribute(attrName) !== desiredValue) el.setAttribute(attrName, desiredValue);
              if (typeof el.__stx_model_sync === 'function') el.__stx_model_sync();
            };
            applyControlValue();

            // A select's value binding is processed before its child
            // directives. When a nested :for creates the matching options
            // afterward, the browser otherwise leaves the first option
            // selected. Keep the desired value and reapply it whenever the
            // option tree changes, including later reactive list updates.
            if (el.tagName === 'SELECT' && !el.__stx_value_observer && typeof window.MutationObserver !== 'undefined') {
              el.__stx_value_observer = new window.MutationObserver(applyControlValue);
              el.__stx_value_observer.observe(el, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['value'],
              });
              el.__stx_destroy = el.__stx_destroy || [];
              el.__stx_destroy.push(function() {
                if (el.__stx_value_observer) el.__stx_value_observer.disconnect();
                el.__stx_value_observer = null;
              });
            }
            return;
          }
          // Checked, selected, and indeterminate are live DOM properties, just like value.
          // Updating only the HTML attribute leaves a user-touched checkbox or
          // radio in its previous state because the property becomes dirty.
          // Indeterminate has no corresponding effective HTML attribute at all.
          if ((attrName === 'checked' || attrName === 'selected' || attrName === 'indeterminate') && attrName in el) {
            var selectedState = Boolean(v);
            el[attrName] = selectedState;
            if (attrName === 'indeterminate') {
              el.removeAttribute(attrName);
            }
            else if (selectedState) {
              el.setAttribute(attrName, '');
            }
            else {
              el.removeAttribute(attrName);
            }
            return;
          }
          if (v === false || v === null || v === undefined) {
            el.removeAttribute(attrName);
          }
else if (v === true) {
            el.setAttribute(attrName, '');
          }
else {
            var attrValue = v;
            if (typeof v === 'object') {
              try { attrValue = JSON.stringify(v); }
              catch (e) { attrValue = String(v); }
            }
            el.setAttribute(attrName, attrValue);
          }
        });
        el.removeAttribute(name);
      }
else if (name === '@class' || name === ':class' || name === 'x-class') {
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
          // Coerce null/undefined to '' so a missing/unresolved binding renders
          // nothing rather than the literal string "undefined" (#1767).
          el.innerHTML = evalAttrExpr(value) ?? '';
        });
        el.removeAttribute(name);
      }
else if (name === 'ref' || name === ':ref' || name === 'x-ref' || name === 'data-stx-ref') {
        // Store ref in scope.$refs and componentScope.$refs
        if (scope.$refs) scope.$refs[value] = el;
        if (componentScope.$refs) componentScope.$refs[value] = el;
        // Also fill a same-named signal declared in the script block, so the
        // documented ref() + x-ref pair works and reading the signal returns
        // the element. Without this the signal stayed empty and every read of
        // it silently returned undefined.
        var refTarget = (scope && scope[value]) || componentScope[value];
        if (refTarget && typeof refTarget === 'function' && refTarget._isSignal && typeof refTarget.set === 'function') {
          refTarget.set(el);
        }
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
        const parentEventNames = (el.getAttribute && el.getAttribute('data-stx-parent-events') || '').split(/\\s+/);
        const isForwardedComponentEvent = !!(el.__stx_parent_scope && parentEventNames.includes(eventName));
        const eventCapturedScope = isForwardedComponentEvent
          ? { ...globalHelpers, ...el.__stx_parent_scope }
          : { ...globalHelpers, ...scope, ...(findElementScope(el) || {}) };

        el.addEventListener(eventName, (event) => {
          // Vue-style component listeners fall through to the rendered native
          // root unless the child emits the same event. Signal components use
          // a scope wrapper, so native events arrive here from a descendant.
          // Ignore that native event only after defineEmits() has declared or
          // emitted the same name, preventing submit/click handlers from
          // firing once for the native event and again for the CustomEvent.
          var componentEmits = el.__stx_component_emits;
          if (isForwardedComponentEvent && event.target !== el
            && componentEmits && componentEmits[eventName]) return;

          // Vue-style component handlers receive the emitted payload directly.
          // Native root events still receive the Event object so server-only
          // components can forward clicks and other browser events.
          var handlerEvent = isForwardedComponentEvent && event instanceof CustomEvent
            ? event.detail
            : event;

          // Skip an opener click that reaches UI which just became visible in
          // this frame. A click whose target is inside the revealed subtree is
          // a real interaction and must not be discarded, especially for
          // async lists whose controls are usable as soon as they render.
          if (eventName === 'click') {
            var ancestor = el;
            while (ancestor) {
              if (ancestor.__stx_shown_at
                && (performance.now() - ancestor.__stx_shown_at) < 50
                && !(ancestor.contains && ancestor.contains(event.target))) return;
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
            if (shorthandFn) { shorthandFn(handlerEvent); return; }
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
              fn2(eventCapturedScope, handlerEvent);
            } else if (hasSignals) {
              // Function calls with signals in scope keep any signal used through
              // its object API as a raw signal function, and unwrap the rest for
              // primitive reads.
              var unwrapVars = Object.keys(eventCapturedScope).map(function(k) {
                var v = eventCapturedScope[k];
                // A :for item is a signal only as an implementation detail, so
                // that keyed rows can update in place. Its \`.value\` is a field
                // on the item, never the signal compatibility API — the same
                // rule createAutoUnwrapProxy states for binding expressions.
                // Without the carve-out, expressionUsesSignalApi sees
                // \`option.value\` and hands the handler the raw signal, so a
                // handler like \`pick(option.value)\` receives the whole item.
                // It is not an error, so it lands silently: the wrong value is
                // stored and only surfaces much later.
                if (v && typeof v === 'function' && v._isSignal && !v._isStxLoopItem
                  && (expressionCallsSignal(value, k) || expressionUsesSignalApi(value, k))) {
                  return 'var ' + k + ' = __s["' + k + '"]';
                }
                return 'var ' + k + ' = __s["' + k + '"] && typeof __s["' + k + '"] === "function" && __s["' + k + '"]._isSignal ? __s["' + k + '"]() : __s["' + k + '"]';
              }).join(';');
              var fn3 = new Function('__s', '$event', unwrapVars + ';' + value);
              fn3(eventCapturedScope, handlerEvent);
            } else {
              var fn = new Function(...Object.keys(eventCapturedScope), '$event', value);
              fn(...Object.values(eventCapturedScope), handlerEvent);
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
        if (child.__stx_scope) return;
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
    const capturedScope = { ...globalHelpers, ...passedScope, ...(findElementScope(el) || {}) };

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
          var unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
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
    const modifiers = attrName.split('.').slice(1);
    const capturedScope = { ...globalHelpers, ...passedScope, ...(findElementScope(el) || {}) };
    const coerceValue = (value) => {
      var next = value;
      if (modifiers.includes('trim') && typeof next === 'string') next = next.trim();
      if (modifiers.includes('number') && next !== '') {
        var numeric = Number(next);
        if (!Number.isNaN(numeric)) next = numeric;
      }
      return next;
    };

    const getValue = () => {
      var direct = capturedScope[expr];
      if (direct && typeof direct === 'function' && (direct._isSignal || direct._isDerived))
        return direct();
      try {
        var unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
        var fn = new Function('__scope__', 'with(__scope__) { return (' + expr + ') }');
        return fn(unwrapScope);
      }
      catch (e) {
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] ' + attrName + ' get error:', expr, e);
        return '';
      }
    };
    const setValue = (val) => {
      try {
        if (capturedScope[expr] && capturedScope[expr]._isSignal) {
          capturedScope[expr].set(val);
        }
else {
          // Write through the SAME auto-unwrap proxy the read path uses.
          //
          // This used to destructure the scope into plain parameters, so an
          // lvalue like store.title assigned onto the raw object and REPLACED
          // the signal with a raw string. Everything else bound to that signal
          // stopped updating, its .set was gone so the next write threw
          // TypeError, and nothing warned — the field the user typed into was
          // the only thing on the page that still looked right (#1883).
          //
          // The proxy's set trap already did the correct thing (call .set on a
          // signal-valued property) and was simply never reached from here.
          // Routing through it also drops the old requirement that every scope
          // key be a valid identifier, since nothing is destructured now.
          var writeScope = createModelWriteProxy(capturedScope);
          var writeFn = new Function('__scope__', '__v__', 'with(__scope__) { ' + expr + ' = __v__ }');
          writeFn(writeScope, val);
        }
      }
catch (e) {
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] ' + attrName + ' set error:', expr, e);
      }
    };

    if (tag === 'input' && type === 'checkbox') {
      var syncCheckbox = () => {
        var current = getValue();
        el.checked = Array.isArray(current)
          ? current.some(function(item) { return String(item) === String(el.value); })
          : Boolean(current);
      };
      el.__stx_model_sync = syncCheckbox;
      effect(syncCheckbox);
      el.addEventListener('change', () => {
        var current = getValue();
        if (!Array.isArray(current)) {
          setValue(el.checked);
          return;
        }

        var checkboxValue = coerceValue(el.value);
        var next = current.filter(function(item) { return String(item) !== String(checkboxValue); });
        if (el.checked) next.push(checkboxValue);
        setValue(next);
      });
    }
    else if (tag === 'input' && type === 'radio') {
      var syncRadio = () => { el.checked = String(getValue()) === String(el.value); };
      el.__stx_model_sync = syncRadio;
      effect(syncRadio);
      el.addEventListener('change', () => {
        if (el.checked) setValue(coerceValue(el.value));
      });
    }
    else if (tag === 'select') {
      // Same equality guard as the text branch. Harmless here — a select has
      // no caret — but an unconditional write is still a needless DOM mutation
      // on every signal change, and the inconsistency invites the text-branch
      // bug being reintroduced by copying this one (#1799).
      var syncSelect = () => { var next = getValue() ?? ''; if (el.value !== next) el.value = next; };
      el.__stx_model_sync = syncSelect;
      effect(syncSelect);
      if (!el.__stx_model_observer && typeof window.MutationObserver !== 'undefined') {
        el.__stx_model_observer = new window.MutationObserver(syncSelect);
        el.__stx_model_observer.observe(el, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['value'],
        });
        el.__stx_destroy = el.__stx_destroy || [];
        el.__stx_destroy.push(function() {
          if (el.__stx_model_observer) el.__stx_model_observer.disconnect();
          el.__stx_model_observer = null;
        });
      }
      el.addEventListener('change', () => setValue(coerceValue(el.value)));
    }
else {
      // Writing el.value moves the text cursor to the END of the control, and
      // typing forms a loop: input -> setValue -> the signal changes -> this
      // effect re-runs -> the write. So every keystroke reset the caret
      // (stacksjs/stx#1799).
      //
      // Invisible while appending at the end of a field, which is why a login
      // form with x-model felt fine and a textarea people actually edit did
      // not. Worse inside :for, where key-based reuse updates the item signal
      // on reuse (#1669) and re-evaluates the reused row's bindings on every
      // character.
      //
      // The equality guard alone fixes typing, because the value this effect
      // computes IS the value just typed. The offset is preserved as well for
      // the case the guard cannot cover: a value that legitimately changed
      // from elsewhere while the field is focused — a formatter rewriting
      // input, a remote sync.
      effect(() => {
        var next = getValue() ?? '';
        if (el.value === next) return;
        var active = typeof document !== 'undefined' && document.activeElement === el;
        var start = null;
        var end = null;
        if (active) {
          // selectionStart throws on input types that do not support
          // selection (number, email, date), so it cannot be assumed present.
          try { start = el.selectionStart; end = el.selectionEnd; }
          catch (e) { start = null; end = null; }
        }
        el.value = next;
        if (active && start !== null && typeof el.setSelectionRange === 'function') {
          // Clamp: the incoming value may be shorter than the old offset.
          try { el.setSelectionRange(Math.min(start, next.length), Math.min(end == null ? start : end, next.length)); }
          catch (e) { /* type does not support selection */ }
        }
      });
      el.addEventListener(modifiers.includes('lazy') ? 'change' : 'input', () => setValue(coerceValue(el.value)));
    }

    el.removeAttribute(attrName);
  }

  function bindClass(el, expr, passedScope = componentScope) {
    const originalClasses = el.className;
    const capturedScope = { ...globalHelpers, ...passedScope, ...(findElementScope(el) || {}) };
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
        const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
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
        var _clsArr = [originalClasses, value.filter(Boolean).join(' ')].filter(Boolean).join(' ');
        if (typeof el.className === 'string') el.className = _clsArr; else el.setAttribute('class', _clsArr);
      }
else {
        var _clsStr = [originalClasses, value || ''].filter(Boolean).join(' ');
        if (typeof el.className === 'string') el.className = _clsStr; else el.setAttribute('class', _clsStr);
      }
    });
  }

  function bindStyle(el, expr, passedScope = componentScope) {
    // Capture scope at setup time - use passed scope to preserve context
    const capturedScope = { ...globalHelpers, ...passedScope, ...(findElementScope(el) || {}) };

    const evalExpr = () => {
      // Mirror bindClass: first try the auto-unwrap proxy (so an expression
      // like { active: count > 5 } reads signals as primitives), then retry
      // with the raw scope so call-syntax expressions like
      // { color: theme() } still work — the proxy unwraps signals to
      // values, which would make theme() try to call a primitive and
      // throw TypeError.
      try {
        const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
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

  var __forComponentScopeCounter = 0;
  var __forComponentSetupFactories = new Map();

  function forEachGroupElement(nodes, callback) {
    function visit(node, insideTemplateContent) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
      callback(node, insideTemplateContent);

      // HTMLTemplateElement children live in template.content, outside the
      // element's ordinary descendant tree. Component roots and setup scripts
      // wrapped by caller-owned :if/:for directives must still be discoverable
      // for scope remapping before those templates are cloned.
      var entersTemplateContent = node.tagName === 'TEMPLATE' && node.content;
      var childRoot = entersTemplateContent
        ? node.content
        : node;
      Array.from(childRoot.childNodes || []).forEach(function(child) {
        visit(child, insideTemplateContent || entersTemplateContent);
      });
    }

    nodes.forEach(function(node) { visit(node, false); });
  }

  // A signal component expanded inside <template :for> carries a compiled
  // data-stx-scope id and setup script. cloneNode() used to duplicate that id
  // for every row, so all instances shared the first child's props and state.
  // Give each cloned component tree its own ids before insertion, and rewrite
  // the setup scripts that target those ids.
  function remapForComponentScopes(nodes) {
    var scopeMap = {};
    forEachGroupElement(nodes, function(node) {
      if (!node.hasAttribute || !node.hasAttribute('data-stx-scope')) return;
      var oldId = node.getAttribute('data-stx-scope');
      if (!oldId) return;
      if (!scopeMap[oldId])
        scopeMap[oldId] = oldId + '_for_' + (++__forComponentScopeCounter);
      // Keep the compiler's original id through any additional structural
      // clones. DOM cloneNode() preserves attributes but not expando fields.
      if (!node.hasAttribute('data-stx-template-scope'))
        node.setAttribute('data-stx-template-scope', oldId);
      node.setAttribute('data-stx-scope', scopeMap[oldId]);
    });

    var oldIds = Object.keys(scopeMap);
    if (!oldIds.length) return;

    forEachGroupElement(nodes, function(node) {
      if (node.attributes) {
        Array.from(node.attributes).forEach(function(rawAttribute) {
          var attribute = Array.isArray(rawAttribute)
            ? { name: rawAttribute[0], value: rawAttribute[1] }
            : rawAttribute;
          if (!attribute || attribute.name === 'data-stx-scope' || attribute.name === 'data-stx-template-scope') return;
          var value = attribute.value;
          if (typeof value !== 'string') return;
          oldIds.forEach(function(oldId) {
            if (value.indexOf(oldId) !== -1)
              value = value.split(oldId).join(scopeMap[oldId]);
          });
          if (value !== attribute.value) node.setAttribute(attribute.name, value);
        });
      }
    });
  }

  function hydrateComponentScopes(nodes, callerScope) {
    var roots = [];
    var scripts = [];
    forEachGroupElement(nodes, function(node, insideTemplateContent) {
      // A template's content is inert source material. Remapping must traverse
      // it, but setup and event hydration belong to the live clones inserted by
      // bindIf/bindFor, where the correct iteration scope is available.
      if (insideTemplateContent) return;
      if (node.hasAttribute && node.hasAttribute('data-stx-scope')) roots.push(node);
      if (node.tagName === 'SCRIPT' && node.hasAttribute('data-stx-scoped')) scripts.push(node);
    });
    if (!roots.length) return;

    function hasPendingStructuralAncestor(root) {
      var cursor = root && root.parentElement;
      while (cursor && cursor.nodeType === Node.ELEMENT_NODE) {
        if (cursor.hasAttribute('@for')
          || cursor.hasAttribute(':for')
          || cursor.hasAttribute('x-for')
          || cursor.hasAttribute('@if')
          || cursor.hasAttribute(':if')
          || cursor.hasAttribute('x-if')
          || cursor.hasAttribute('@else-if')
          || cursor.hasAttribute(':else-if')
          || cursor.hasAttribute('x-else-if')
          || cursor.hasAttribute('@else')
          || cursor.hasAttribute(':else')
          || cursor.hasAttribute('x-else'))
          return true;
        cursor = cursor.parentElement;
      }
      return false;
    }

    // Scripts cloned from template.content are inert in browsers. Compile each
    // distinct component setup body once, then run that cached function for
    // every loop instance. Temporarily restoring the template's original scope
    // id lets existing compiled setup code locate the correct root without
    // rewriting and reparsing the full script for every row.
    scripts.forEach(function(old) {
      var text = old.textContent || '';
      var pendingRoots = roots.filter(function(root) {
        var scopeId = root.getAttribute('data-stx-scope');
        var originalScopeId = root.getAttribute('data-stx-template-scope') || scopeId;
        return scopeId
          && originalScopeId
          && text.indexOf(originalScopeId) !== -1
          && !hasPendingStructuralAncestor(root)
          && !(window.stx._scopes && window.stx._scopes[scopeId]);
      });
      if (!pendingRoots.length) return;

      var setup = __forComponentSetupFactories.get(text);
      if (!setup) {
        try {
          setup = new Function(text);
          __forComponentSetupFactories.set(text, setup);
        }
        catch (e) {
          console.error('[stx] cloned component setup compile error:', e);
          return;
        }
      }

      pendingRoots.forEach(function(root) {
        var scopeId = root.getAttribute('data-stx-scope');
        var originalScopeId = root.getAttribute('data-stx-template-scope') || scopeId;
        if (!scopeId || !originalScopeId) return;

        root.setAttribute('data-stx-scope', originalScopeId);
        try {
          setup();
          var registeredScope = window.stx._scopes && (window.stx._scopes[originalScopeId] || window.stx._scopes[scopeId]);
          if (registeredScope && originalScopeId !== scopeId) {
            delete window.stx._scopes[originalScopeId];
            window.stx._scopes[scopeId] = registeredScope;
          }
        }
        catch (e) {
          console.error('[stx] cloned component setup error:', e);
        }
        finally {
          root.setAttribute('data-stx-scope', scopeId);
        }
      });

      // A component that is itself a structural source still needs its setup
      // sibling when bindFor/bindIf turns that source into a clone template.
      // Final row instances have no structural attribute and can discard it.
      var isStructuralSource = pendingRoots.some(function(root) {
        return root.hasAttribute('@for')
          || root.hasAttribute(':for')
          || root.hasAttribute('x-for')
          || root.hasAttribute('@if')
          || root.hasAttribute(':if')
          || root.hasAttribute('x-if');
      });
      if (!isStructuralSource && old.parentNode) old.parentNode.removeChild(old);
    });

    roots.forEach(function(root) {
      var scopeId = root.getAttribute('data-stx-scope');
      var scopeVars = scopeId && window.stx._scopes && window.stx._scopes[scopeId];
      var resolvedCallerScope = resolveComponentCallerScope(root, callerScope);
      root.__stx_parent_scope = resolvedCallerScope;
      bindParentComponentProps(root, resolvedCallerScope);
      if (!scopeVars || root.__stx_disposers) return;
      scopeVars.__el = root;
      var childScope = { ...resolvedCallerScope, ...scopeVars };
      root.__stx_disposers = trackEffects(function() {
        processElement(root, childScope);
      });
      if (scopeVars.__mountCallbacks && !scopeVars.__mounted) {
        scopeVars.__mounted = true;
        runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
      }
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
    const componentSetupTemplates = [];
    if (!isTemplate && el.hasAttribute('data-stx-scope')) {
      const componentScopeId = el.getAttribute('data-stx-scope');
      const componentTemplateScopeId = el.getAttribute('data-stx-template-scope') || componentScopeId;
      let setupSibling = el.nextSibling;
      while (setupSibling) {
        const nextSetupSibling = setupSibling.nextSibling;
        if (setupSibling.nodeType === Node.TEXT_NODE && !(setupSibling.textContent || '').trim()) {
          setupSibling = nextSetupSibling;
          continue;
        }
        if (setupSibling.nodeType === Node.COMMENT_NODE) {
          setupSibling = nextSetupSibling;
          continue;
        }
        if (setupSibling.nodeType === Node.ELEMENT_NODE
          && setupSibling.tagName === 'SCRIPT'
          && setupSibling.hasAttribute('data-stx-scoped')
          && ((setupSibling.textContent || '').indexOf(componentScopeId) !== -1
            || (componentTemplateScopeId && (setupSibling.textContent || '').indexOf(componentTemplateScopeId) !== -1))) {
          componentSetupTemplates.push(setupSibling.cloneNode(true));
          setupSibling.remove();
          setupSibling = nextSetupSibling;
          continue;
        }
        break;
      }
    }

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
    // Component setup scripts execute while the server-rendered loop source is
    // still in the document. That source becomes a template, not a live
    // instance, so reclaim all registered scopes before removing it. Every
    // rendered iteration receives remapped setup scripts and fresh scopes.
    disposeSubtreeScopes(el);
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
    // One entry per list item, each holding EVERY node that item rendered.
    // currentElements stays flat for transition snapshots, but the keyed
    // diff below must pair a key with all of its nodes: a template row
    // routinely yields several (an element plus its surrounding text nodes),
    // and indexing a flat list by key position then paired the wrong node
    // with each key, leaving the list rotated after an update.
    let currentGroups = [];
    let currentKeys = [];
    let loadingElement = null;
    let emptyElement = null;

    // A <template :for> can contain another structural directive. That
    // nested directive replaces its source node with a placeholder and owns
    // additional live siblings around that placeholder. Track an explicit
    // boundary for every template iteration so keyed reuse moves the complete
    // live range, including nodes created by nested :for / :if bindings.
    // Moving only the original cloned nodes pulled static siblings past the
    // nested range on the next outer update (header, then rows became rows,
    // then header).
    const liveGroupNodes = (group) => {
      if (!isTemplate || !group || group.length < 2) return group || [];
      const start = group[0];
      const end = group[group.length - 1];
      if (!start || !end || start.parentNode !== parent || end.parentNode !== parent)
        return group.filter(groupNode => groupNode && groupNode.parentNode === parent);

      const nodes = [];
      let currentNode = start;
      while (currentNode) {
        nodes.push(currentNode);
        if (currentNode === end) break;
        currentNode = currentNode.nextSibling;
      }
      return nodes;
    };

    const removeGroup = (group) => {
      const liveNodes = liveGroupNodes(group);
      const liveSet = new Set(liveNodes);
      liveNodes.forEach(e => { disposeSubtreeScopes(e); e.remove(); });
      group.forEach(groupNode => {
        if (liveSet.has(groupNode)) return;
        disposeSubtreeScopes(groupNode);
        groupNode.remove();
      });
    };

    const clearRenderedItems = () => {
      currentGroups.forEach(removeGroup);
      currentElements = [];
      currentGroups = [];
      currentKeys = [];
    };

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
        const scope = { ...globalHelpers, ...passedScope, ...(capturedScope || {}), ...extraScope };
        const unwrapScope = createAutoUnwrapProxy(scope, function(prop) {
          if (typeof prop !== 'string') return false;
          return expressionCallsSignal(expression, prop)
            || expressionUsesSignalApi(expression, prop);
        });
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
        const scope = { ...globalHelpers, ...passedScope, ...(capturedScope || {}), ...extraScope };
        const unwrapScope = createAutoUnwrapProxy(scope, function(prop) {
          if (typeof prop !== 'string') return false;
          return expressionCallsSignal(expression, prop)
            || expressionUsesSignalApi(expression, prop);
        });
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
      itemSignal._isStxLoopItem = true;
      const indexSignal = state(index);
      if (key) itemSignalMap.set(key, { item: itemSignal, index: indexSignal });

      const itemScope = { ...globalHelpers, ...passedScope, ...(capturedScope || {}) };
      itemScope[itemName] = itemSignal;
      if (indexName) itemScope[indexName] = indexSignal;

      const elements = [];
      if (isTemplate) {
        elements.push(document.createComment('stx-for-item-start'));
        Array.from(templateContent.childNodes).forEach(node => {
          const clone = node.cloneNode(true);
          if (clone.nodeType === 1) {
            // Structural directives need a live parent. Keep the iteration
            // scope on the clone until the keyed diff inserts it, then bind.
            clone.__stx_for_scope = itemScope;
          }
          elements.push(clone);
        });
        elements.push(document.createComment('stx-for-item-end'));
      } else {
        const clone = templateContent.cloneNode(true);
        clone.__stx_for_scope = itemScope;
        elements.push(clone);
        componentSetupTemplates.forEach(function(setupTemplate) {
          elements.push(setupTemplate.cloneNode(true));
        });
      }
      remapForComponentScopes(elements);
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
          clearRenderedItems();
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
          clearRenderedItems();
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
          var diagMerged = { ...globalHelpers, ...passedScope, ...(capturedScope || {}) };
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
        clearRenderedItems();
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
        oldKeyMap.get(k).push(currentGroups[i] || []);
      }

      // Build new element list, reusing existing DOM nodes by key
      const newElements = [];
      const newGroups = [];
      const usedKeys = new Set();

      // Minimal-move reconciliation.
      //
      // Every reused row used to be round-tripped through a DocumentFragment,
      // and appendChild into a fragment DETACHES the node from the document
      // first. Removing a focused node blurs it and resets activeElement, so a
      // list could not contain a field the user was typing in: any write to the
      // backing array kicked them out of it, losing caret, selection and undo
      // history. It happened for every row unconditionally, including rows that
      // had not moved, and unkeyed loops took the same path because getItemKey
      // falls back to the index (#1882).
      //
      // The cursor walks the existing rendering in order. A node already at the
      // cursor is left ENTIRELY alone — an unchanged list now performs zero DOM
      // operations — and a node that genuinely has to move is moved with
      // insertBefore, which relocates it without a detach/reattach cycle.
      let cursor = null;
      for (let ci = 0; ci < currentGroups.length && !cursor; ci++) {
        const seed = liveGroupNodes(currentGroups[ci] || []);
        if (seed.length) cursor = seed[0];
      }

      for (let i = 0; i < list.length; i++) {
        const key = newKeys[i];
        const existing = oldKeyMap.get(key);

        if (existing && existing.length > 0 && !usedKeys.has(key)) {
          // Reuse this item's nodes — move the whole group into position, in
          // order, so a multi-node row stays contiguous and correctly ordered.
          // A structural directive may intentionally have detached one of the
          // group's nodes. Its own placeholder owns reinsertion, so keyed reuse
          // must not resurrect that hidden node.
          const group = existing.shift();
          const liveNodes = liveGroupNodes(group);
          for (let li = 0; li < liveNodes.length; li++) {
            const groupNode = liveNodes[li];
            if (groupNode === cursor) {
              // Already exactly where it belongs. Touching it here is what
              // used to blur it, so the correct action is to do nothing.
              cursor = cursor.nextSibling;
            }
            else {
              // Moves without detaching. The cursor does not advance: this node
              // is now behind it, and the cursor still marks the next position
              // to fill.
              parent.insertBefore(groupNode, cursor || placeholder);
            }
          }
          newElements.push(...group);
          newGroups.push(group);
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
          elements.forEach(el => {
            // Before the cursor, not before the placeholder: a new row inserted
            // in the MIDDLE of the list must land at its own position, without
            // forcing every row after it to be moved to get back in order.
            parent.insertBefore(el, cursor || placeholder);
            if (tgReady && el.isConnected) tgEnter(el, tgName);
          });
          hydrateComponentScopes(elements, elements.find(function(node) {
            return node && node.__stx_for_scope;
          })?.__stx_for_scope || passedScope);
          elements.forEach(el => {
            if (el.nodeType === 1) {
              var itemScope = el.__stx_for_scope || passedScope;
              delete el.__stx_for_scope;
              if (!el.__stx_disposers && el.tagName !== 'SCRIPT')
                processElement(el, itemScope);
              el.removeAttribute('x-cloak');
              el.querySelectorAll('[x-cloak]').forEach(c => c.removeAttribute('x-cloak'));
            }
          });
          newElements.push(...elements);
          newGroups.push(elements);
        }
      }

      // Remove old elements whose keys are no longer in the list.
      // Dispose any scopes registered inside removed items before the
      // remove() call (#1727).
      for (const [key, groups] of oldKeyMap) {
        if (!usedKeys.has(key)) {
          // In a transition group, run the leave animation and let it remove the
          // node; otherwise remove immediately. Scopes are disposed up-front
          // either way (their destroy hooks shouldn't wait on a CSS transition).
          groups.forEach((group) => {
            if (tgReady) {
              const liveNodes = liveGroupNodes(group);
              const transitioned = new Set();
              liveNodes.forEach((el) => {
                disposeSubtreeScopes(el);
                if (tgLeave(el, tgName)) transitioned.add(el);
                else el.remove();
              });
              group.forEach((el) => {
                if (transitioned.has(el) || liveNodes.includes(el)) return;
                disposeSubtreeScopes(el);
                el.remove();
              });
            }
            else {
              removeGroup(group);
            }
          });
          itemSignalMap.delete(key);
        }
      }

      currentElements = newElements;
      currentGroups = newGroups;
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
      preserveConditionalComponentScopes(b.el, capturedComponentScope);
      b.el.__stx_if_bound = true;
      b.el.__stx_chain_member = true;
      b.el.__stx_chain_active = false;
      b.capturedElementScope = findElementScope(b.el);
      b.placeholder = document.createComment('stx-if-chain');
      parent.insertBefore(b.placeholder, b.el);
      b.el.removeAttribute(b.attr);
      // A <template> branch (the wrapper convertSignalDirectivesToAttributes
      // emits for a multi-child / text branch) is INERT — inserting the element
      // renders nothing, its content lives in a document fragment. Clone that
      // content ONCE into a stable node set we toggle in and out, exactly as
      // bindIf/bindFor already do for template elements. An element branch is
      // its own single node. Without this, a multi-element @else / @else-if
      // branch rendered blank the moment the markup was well-formed enough to
      // survive as a real <template> (the #1784 markup fix). See #1784.
      b.isTemplate = b.el.tagName === 'TEMPLATE';
      b.nodes = b.isTemplate
        ? Array.prototype.slice.call(b.el.content.cloneNode(true).childNodes)
        : [b.el];
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
      var scope = { ...globalHelpers, ...capturedComponentScope, ...(b.capturedElementScope || {}) };
      try {
        var unwrapScope = createExpressionAutoUnwrapProxy(scope, expression);
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
      if (__stxDevtoolsTracking) {
        var __ifScope = null;
        try { __ifScope = (head && head.closest) ? head.closest('[data-stx-scope]') : null; } catch (e) { __ifScope = null; }
        __stxDevtoolsRecordIf({
          scopeId: __ifScope ? __ifScope.getAttribute('data-stx-scope') : null,
          branches: chain.map(function(c) { return c.attr; }),
          picked: pickedIdx,
          pickedAttr: pickedIdx >= 0 ? chain[pickedIdx].attr : null,
          prev: currentIdx
        });
      }
      if (pickedIdx === currentIdx) return;

      // Remove the previously-shown branch. Do NOT disposeSubtreeScopes here:
      // a chain branch is a TOGGLE (re-shown when its condition matches again),
      // not a permanent unmount, and a nested data-stx-scope inside it can't be
      // recreated once deleted from window.stx._scopes (its setup IIFE ran
      // once at page load). Deleting it broke re-show of nested scoped
      // components under reactive conditionals (#1737). Permanent disposal is
      // still handled by bindFor (item removal) and cleanupContainer (SPA nav).
      if (currentIdx !== -1) {
        chain[currentIdx].el.__stx_chain_active = false;
        chain[currentIdx].nodes.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      }

      // Insert + process the newly-picked branch.
      if (pickedIdx !== -1) {
        var pick = chain[pickedIdx];
        pick.el.__stx_chain_active = true;
        // Insert this branch's node(s) before the placeholder's next sibling.
        // The anchor is captured once so the nodes stack in source order.
        var anchor = pick.placeholder.nextSibling;
        pick.nodes.forEach(function (n) { pick.placeholder.parentNode.insertBefore(n, anchor); });
        pick.el.__stx_shown_at = performance.now();
        if (!pick.childrenProcessed) {
          pick.childrenProcessed = true;
          // Hydrate before the outer scope walk can see the inserted branch.
          // Chromium executes scripts cloned from template.content as soon as
          // they are connected, so deferring this pass allowed the global walk
          // to process projected slot expressions without the loop caller
          // scope. peek() keeps this synchronous pass from subscribing child
          // reads to the current chain effect.
          peek(function () {
            var childScope = { ...globalHelpers, ...capturedComponentScope, ...(pick.capturedElementScope || {}) };
            // Components compiled inside any branch of an if/else-if/else
            // chain carry scoped setup scripts with them. Branch nodes are
            // detached before those scripts can execute, so simply
            // re-inserting the selected branch leaves component props,
            // events, directives, and projected slot expressions inert.
            // Hydrate those scopes before the normal subtree walk, matching
            // the single-template :if and :for insertion paths.
            var previouslyTrackedNodes = new Set();
            pick.nodes.forEach(function (n) {
              if (n && n.__stx_disposers) previouslyTrackedNodes.add(n);
            });
            hydrateComponentScopes(pick.nodes, childScope);
            pick.nodes.forEach(function (n) {
              if (n.nodeType !== 1) return; // whitespace/text between template children
              // A scoped component receives its disposer in the outer scope
              // walk immediately after processElement returns from binding
              // this conditional. That first pass intentionally stops at
              // :if, so a disposer does not mean its children were hydrated.
              if (previouslyTrackedNodes.has(n) || !n.__stx_disposers)
                processElement(n, childScope);
              n.removeAttribute('x-cloak');
              n.querySelectorAll('[x-cloak]').forEach(function (c) { c.removeAttribute('x-cloak'); });
            });
          });
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

    // Handle <template> elements specially - clone their content
    const isTemplate = el.tagName === 'TEMPLATE';
    const componentSetupSiblings = isTemplate ? [] : findConditionalComponentSetupSiblings(el);
    let currentNodes = isTemplate ? [] : [el, ...componentSetupSiblings];

    // Capture BOTH element scope AND passedScope NOW before anything changes
    // passedScope may contain @for iteration variables or parent component signals
    const capturedElementScope = findElementScope(el);
    const capturedComponentScope = { ...passedScope };

    preserveConditionalComponentScopes(el, capturedComponentScope);
    parent.insertBefore(placeholder, el);
    el.removeAttribute(attrName);

    if (isTemplate) {
      // For templates, we need to handle the content fragment
      const content = el.content;
      currentNodes = Array.from(content.childNodes).map(n => n.cloneNode(true));
      // Insert cloned content initially
      // Capture the anchor once. Re-reading placeholder.nextSibling after
      // every insertion points at the node just inserted and reverses a
      // multi-root template branch.
      const initialAnchor = placeholder.nextSibling;
      currentNodes.forEach(node => parent.insertBefore(node, initialAnchor));
      el.remove(); // Remove the template element itself
    }

    // Helper to evaluate with captured scope (auto-unwraps signals).
    // A with-scope resolves only identifiers the expression actually references,
    // so the conditional subscribes narrowly instead of reading every signal
    // in a component scope. That broad subscription made an unrelated ref
    // update re-enter structural removal while the real condition was already
    // removing the same subtree. First try the auto-unwrap proxy (so a bare
    // comparison like count > 5 reads the signal value), then retry with the
    // raw scope so call syntax like count() === 0 still works (#1733).
    const evalExpr = (expression) => {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expression.trim())) {
        return expression;
      }
      try {
        const scope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
        const unwrapScope = createExpressionAutoUnwrapProxy(scope, expression);
        const fn = new Function('__scope__', 'with(__scope__) { return ' + expression + ' }');
        return fn(unwrapScope);
      }
catch (e1) {
        try {
          // Retry without the unwrap proxy so call-syntax (signal()) works.
          const scope2 = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
          const fn2 = new Function('__scope__', 'with(__scope__) { return ' + expression + ' }');
          return fn2(scope2);
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
      const childScope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };


      Array.from(el.childNodes).forEach(child => processElement(child, childScope));

      childrenProcessed = true;
    };

    // A <template :if> inserts clones of template.content rather than the
    // template element itself. Those clones still need the normal directive
    // and interpolation pass. Previously the initially-visible branch was
    // inserted and left inert, so bindings such as :text and {{ expression }}
    // leaked into the rendered UI until the condition toggled.
    const processTemplateNodes = (nodes) => {
      const childScope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
      // Components compiled inside a <template :if> carry setup scripts in the
      // template content. Browser-cloned scripts are inert, so register their
      // scopes and forwarded props before walking the inserted branch. This is
      // the same component hydration path used by <template :for>.
      hydrateComponentScopes(nodes, childScope);
      nodes.forEach(node => {
        if (!node.__stx_disposers && node.tagName !== 'SCRIPT')
          processElement(node, childScope);
        if (node.nodeType === 1) {
          node.removeAttribute('x-cloak');
          node.querySelectorAll('[x-cloak]').forEach(c => c.removeAttribute('x-cloak'));
        }
      });
    };

    // Evaluate the :if expression — use direct signal read for simple refs,
    // falling back to evalExpr for complex expressions
    const fullScope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
    const directSignal = fullScope[expr];

    effect(() => {
      var value;
      if (directSignal && (directSignal._isSignal || directSignal._isDerived)) {
        value = directSignal();
        console.log('[stx] bindIf effect (direct):', expr, '→', value, 'isInserted:', isInserted);
      } else {
        value = evalExpr(expr);
      }

      if (isTemplate) {
        if (value && !isInserted) {
          // Re-insert cloned content
          currentNodes = Array.from(el.content.childNodes).map(n => n.cloneNode(true));
          const insertionAnchor = placeholder.nextSibling;
          currentNodes.forEach(node => parent.insertBefore(node, insertionAnchor));
          processTemplateNodes(currentNodes);
          childrenProcessed = true;
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
          childrenProcessed = false;
        }
        else if (value && isInserted && !childrenProcessed) {
          // Initial template content is cloned before the effect runs. Process
          // it after the condition is confirmed so hidden branches stay inert.
          // Keep hydration synchronous so the outer scope walk cannot bind
          // caller-owned slot expressions first, while peek() prevents child
          // reads from subscribing to this conditional effect.
          childrenProcessed = true;
          peek(function() {
            if (isInserted) processTemplateNodes(currentNodes);
          });
        }
      }
else {
        if (value && !isInserted) {
          console.log('[stx] bindIf INSERTING element for :if=' + expr);
          const insertionAnchor = placeholder.nextSibling;
          currentNodes.forEach(node => parent.insertBefore(node, insertionAnchor));
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
          currentNodes.forEach(node => node.remove());
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
          // Until this deferred pass runs, the shown subtree still holds literal
          // {{ }}. Flag it so the hydration audit doesn't report those as a
          // binding miss in the gap before the setTimeout fires — a :for nested
          // in a :if binds a macrotask after the synchronous stx:load audit (#1773).
          el.__stx_if_pending = true;
          setTimeout(function() {
            var childScope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
            // A false single-element conditional is detached before the
            // DOMContentLoaded component-scope pass. When it becomes visible,
            // hydrate any component roots in the restored subtree first so
            // projected slot bindings and component-local directives receive
            // the same lifecycle as components inserted by template :if.
            var wasTrackedBeforeConditionalHydration = !!el.__stx_disposers;
            hydrateComponentScopes(currentNodes, childScope);
            if (wasTrackedBeforeConditionalHydration || !el.__stx_disposers)
              processElement(el, childScope);
            // Remove x-cloak from the inserted subtree — the initial
            // cloak removal (after processElement on the root) already
            // ran before this deferred processing, so newly-inserted
            // :if children still have x-cloak and stay hidden.
            el.removeAttribute('x-cloak');
            el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
            // Deferred bind complete — the audit may inspect this subtree now.
            el.__stx_if_pending = false;
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
  //
  // inject() was auto-imported but implemented nowhere, so half of the pair
  // worked: provide() succeeded and the failure surfaced only in the consumer
  // (#1804). Values are recorded in a private registry as well as on window,
  // because the global write collides with native properties — provide('name',
  // x) lands on window.name, which the browser coerces to a string.
  var __stxProvided = Object.create(null);

  function provide(name, value) {
    __stxProvided[name] = value;
    window[name] = value;
  }

  function inject(name, defaultValue) {
    if (name in __stxProvided) return __stxProvided[name];
    if (name in window) return window[name];
    return defaultValue;
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

  function useInterval(interval, options, thirdOptions) {
    // Accept the callback-first form too — useInterval(fn, 1000) is what most
    // callers reach for, and silently ignoring the callback (the previous
    // behaviour) produced a timer that ticked into the void. An options object
    // may follow the interval — useInterval(fn, 1000, { enabled, whileVisible })
    // — or replace it — useInterval(fn, { enabled }) (#1870).
    var callback = null;
    if (typeof interval === 'function') {
      callback = interval;
      if (typeof options === 'number') {
        interval = options;
        options = thirdOptions || {};
      }
      else {
        interval = 1000;
        options = (options && typeof options === 'object') ? options : {};
      }
    }
    interval = interval || 1000;
    options = options || {};
    var count = 0;
    var id = null;
    var running = false;
    var listeners = [];
    // A tick is skipped (not counted, listeners not called) while the timer is
    // gated off: enabled is false / returns false, or whileVisible is set
    // and the document is hidden. This makes "run only while authorized and
    // visible" expressible without the caller hand-pausing the timer (#1870).
    function shouldTick() {
      if (options.whileVisible && typeof document !== 'undefined' && document.hidden) return false;
      var en = options.enabled;
      if (typeof en === 'function') return !!en();
      return en !== false;
    }
    function tick() {
      if (!shouldTick()) return;
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
    if (callback) listeners.push(callback);
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
    function resolveTarget() {
      if (typeof target === 'string') return document.querySelector(target);
      if (target && typeof target === 'object') {
        if ('current' in target) return target.current;
        if ('value' in target) return target.value;
      }
      return target;
    }
    function listener(event) {
      var el = resolveTarget();
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

  // Queue work after the current synchronous signal/effect flush and after
  // structural directives finish their deferred subtree hydration. The
  // microtask schedules this timer only after every subscriber has run, so a
  // :if/:for timer created later in the same signal flush runs first and its
  // template refs are available to the callback.
  function nextTick(fn) {
    return Promise.resolve().then(function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          if (fn) fn();
          resolve();
        }, 0);
      });
    });
  }

  // Watch several sources at once, calling back with (newValues, oldValues).
  // Declared and auto-imported but never implemented here (#1804). NOT an alias
  // of $watch, which spreads the values and passes no oldValues — callers
  // written against the declared contract would silently receive the wrong
  // arguments. Sources may be signals, Vue-style refs, or plain values.
  function watchMultiple(sources, callback, options) {
    options = options || {};
    var read = function() {
      return sources.map(function(s) {
        if (typeof s === 'function') return s();
        if (s && typeof s === 'object' && 'value' in s) return s.value;
        return s;
      });
    };
    var oldValues = read();
    var first = true;
    return effect(function() {
      var newValues = read();
      if (first) {
        first = false;
        if (!options.immediate) return;
      }
      callback(newValues, oldValues);
      oldValues = newValues;
    });
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
    // The pre-paint boot script (stacksjs/stx#1794) publishes the app's
    // configured options here. Reading them makes a bare useColorMode() agree
    // with whatever already landed on <html> before first paint — without this
    // the composable would fall back to its own defaults, read a different
    // storage key, and undo the theme on hydration, reintroducing the very
    // flash the boot script exists to prevent.
    var boot = null;
    try { boot = window.__STX_COLOR_MODE__ || null; } catch (e) {}
    // Explicit-undefined checks rather than ||, so an explicit darkClass:null
    // or attribute:null opts out instead of falling through to the default.
    // An explicit null means "do not manage this", from the call site OR from
    // app.colorMode. The boot payload is generated by stx and always carries
    // every key, so absent and explicitly-null ARE distinguishable there, and
    // rejecting null made the boot global the one path that could not say it
    // (#1813). The asymmetry hid because it only bites where the fallback is
    // non-null: attribute:null looked fine, darkClass:null silently became
    // 'dark' — so opting out of the class required repeating the option at
    // every call site, defeating the single-source arrangement the global
    // exists for.
    function pick(a, b, fallback) {
      if (a !== undefined) return a;
      if (b !== undefined) return b;
      return fallback;
    }
    // Read through a helper rather than a short-circuit on boot itself: that
    // expression yields undefined for an undefined boot but NULL for a null
    // one, which pick would now honour as an explicit opt-out.
    function fromBoot(key) {
      return (boot && typeof boot === 'object') ? boot[key] : undefined;
    }
    var storageKey = pick(options.storageKey, fromBoot('storageKey'), 'stx-color-mode');
    var initialMode = pick(options.initialMode, fromBoot('initialMode'), 'auto');
    var darkClass = pick(options.darkClass, fromBoot('darkClass'), 'dark');
    var attribute = pick(options.attribute, fromBoot('attribute'), null);
    var autoValueOption = pick(options.autoValue, fromBoot('autoValue'), undefined);
    var disableTransitions = options.disableTransitions !== false;
    var resolved = 'light';
    var listeners = [];
    var cleanups = [];

    // Storage tokens meaning "follow the system". 'system' is a common spelling
    // for the same concept; rejecting it used to send the app down a silent
    // data-loss path — read 'system', fail to recognise it, fall back to
    // 'auto', then OVERWRITE the stored value with 'auto' (#1788).
    function normalizeMode(v) {
      if (v === 'light' || v === 'dark') return v;
      if (v === 'auto' || v === 'system') return 'auto';
      return null;
    }
    var preference = normalizeMode(initialMode) || 'auto';

    function getSystem() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function resolve(pref) { return pref === 'auto' ? getSystem() : pref; }
    function applyDOM(mode) {
      var el = document.documentElement;
      if (disableTransitions) el.style.setProperty('transition', 'none', 'important');
      // Both, when both are configured. The class drives the utility
      // framework's dark: variants, the attribute drives everything else —
      // complements, not alternatives.
      if (attribute) el.setAttribute(attribute, mode);
      // Explicit add/remove, not toggle(cls, force) — very-happy-dom ignores
      // the force argument and plain-toggles, inverting every light-mode test.
      if (darkClass) { if (mode === 'dark') el.classList.add(darkClass); else el.classList.remove(darkClass); }
      if (disableTransitions) { el.offsetHeight; el.style.removeProperty('transition'); }
    }
    function readRaw() {
      try { return localStorage.getItem(storageKey); }
catch (e) { return null; }
    }
    // The spelling written back for 'auto': an explicit option wins, else
    // whatever the app already stored, so its own pre-paint script keeps
    // reading a value it recognises.
    var storedRaw = readRaw();
    var autoValue = autoValueOption !== undefined
      ? autoValueOption
      : ((storedRaw === 'auto' || storedRaw === 'system') ? storedRaw : 'auto');

    function persist(pref) {
      try { localStorage.setItem(storageKey, pref === 'auto' ? autoValue : pref); }
catch (e) {} }
    // persistChoice: only an explicit user choice is written back. Persisting
    // on init would stamp the resolved default over a stored value this
    // composable didn't recognise, destroying it.
    function update(pref, persistChoice) {
      preference = normalizeMode(pref) || 'auto';
      resolved = resolve(preference);
      applyDOM(resolved);
      if (persistChoice !== false) persist(preference);
      listeners.forEach(function(fn) { fn(resolved, preference); });
    }

    update(normalizeMode(storedRaw) || initialMode, false);

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
      var v = normalizeMode(e.newValue);
      if (v) {
        // Track the other tab's spelling too, so a write from here doesn't
        // convert the key out from under it.
        if (v === 'auto' && (e.newValue === 'auto' || e.newValue === 'system')) autoValue = e.newValue;
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
    var dark = state(cm.isDark);
    var setSignal = dark.set;
    cm.subscribe(function(mode) { setSignal(mode === 'dark'); });
    dark.toggle = function() { cm.toggle(); };
    dark.set = function(value) { cm.set(value ? 'dark' : 'light'); };
    Object.defineProperty(dark, 'isDark', { get: function() { return dark(); } });
    return dark;
  }

  function useMediaQuery(query) {
    var mql = window.matchMedia(query);
    var matches = state(mql.matches);
    var onChange = function(event) { matches.set(event.matches); };
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if (mql.addListener) mql.addListener(onChange);
    onDestroy(function() {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else if (mql.removeListener) mql.removeListener(onChange);
    });
    Object.defineProperty(matches, 'matches', { get: function() { return matches(); } });
    Object.defineProperty(matches, 'value', { get: function() { return matches(); } });
    return matches;
  }

  var scrollLockStates = new WeakMap();

  function resolveScrollLockTarget(target) {
    var value = target;
    if (typeof value === 'function') value = value();
    if (value && typeof value === 'object' && 'current' in value) value = value.current;
    if (value && typeof value === 'object' && !value.nodeType && 'value' in value) value = value.value;
    return value || document.body || document.documentElement;
  }

  function acquireScrollLock(element) {
    if (!element) return;
    var existing = scrollLockStates.get(element);
    if (existing) {
      existing.count += 1;
      return;
    }
    scrollLockStates.set(element, { count: 1, overflow: element.style.overflow });
    element.style.overflow = 'hidden';
  }

  function releaseScrollLock(element) {
    if (!element) return;
    var existing = scrollLockStates.get(element);
    if (!existing) return;
    existing.count -= 1;
    if (existing.count > 0) return;
    element.style.overflow = existing.overflow;
    scrollLockStates.delete(element);
  }

  function useScrollLock(target) {
    var locked = state(false);
    var lockedElement = null;
    var unsubscribe = locked.subscribe(function(value) {
      if (value) {
        if (lockedElement) return;
        lockedElement = resolveScrollLockTarget(target);
        acquireScrollLock(lockedElement);
      }
      else if (lockedElement) {
        releaseScrollLock(lockedElement);
        lockedElement = null;
      }
    });
    onDestroy(function() {
      unsubscribe();
      if (lockedElement) {
        releaseScrollLock(lockedElement);
        lockedElement = null;
      }
    });
    return locked;
  }

  function usePreferredDark() { return useMediaQuery('(prefers-color-scheme: dark)'); }
  function usePreferredLight() { return useMediaQuery('(prefers-color-scheme: light)'); }
  function usePreferredReducedMotion() { return useMediaQuery('(prefers-reduced-motion: reduce)'); }
  function usePreferredContrast() { return useMediaQuery('(prefers-contrast: more)'); }

  // Vue-compat aliases
  var ref = state;

  // reactive() used to be a bare alias of state(), which made it the most
  // dangerous name in the runtime. state({n:0}) returns a SIGNAL, so the Vue
  // shape everyone reaches for silently did nothing:
  //
  //   const s = reactive({ count: 0 })
  //   s.count            // undefined — a signal has no such property
  //   s.count++          // writes an expando onto a function object
  //   {{ s.count }}      // renders empty, forever, with no warning
  //
  // Backed by one signal PER PROPERTY, created on first touch. That is what
  // makes a read inside an effect track only the field it read, so writing
  // b does not re-run an effect that only read a (#1885).
  var __stxReactiveProxies = new WeakMap();

  function reactive(target) {
    // Primitives have no properties to track. Returning them unchanged keeps
    // reactive(0) from silently becoming an object.
    if (!target || typeof target !== 'object') return target;
    var existing = __stxReactiveProxies.get(target);
    if (existing) return existing;

    var propSignals = Object.create(null);
    function signalFor(prop) {
      if (!propSignals[prop]) propSignals[prop] = state(target[prop]);
      return propSignals[prop];
    }

    var proxy = new Proxy(target, {
      get: function(t, prop, receiver) {
        // Symbols and inherited members are plumbing — toJSON, Symbol.iterator,
        // array methods. Tracking them would create a signal per method lookup
        // and make every effect depend on the whole object.
        if (typeof prop === 'symbol' || !Object.prototype.hasOwnProperty.call(t, prop))
          return Reflect.get(t, prop, receiver);
        var value = signalFor(prop)();
        // Nested objects are wrapped too, and cached in the WeakMap, so
        // identity is stable across reads — a fresh proxy each time would
        // break === comparisons and defeat keyed list reuse.
        return (value && typeof value === 'object') ? reactive(value) : value;
      },
      set: function(t, prop, value) {
        if (typeof prop === 'symbol') return Reflect.set(t, prop, value);
        var had = Object.prototype.hasOwnProperty.call(t, prop);
        t[prop] = value;
        // Write the plain target FIRST so a signal created later reads the
        // current value, then notify anyone already watching this property.
        if (propSignals[prop]) propSignals[prop].set(value);
        else if (had) signalFor(prop);
        return true;
      },
      deleteProperty: function(t, prop) {
        var had = Object.prototype.hasOwnProperty.call(t, prop);
        delete t[prop];
        if (had && propSignals[prop]) propSignals[prop].set(undefined);
        return true;
      },
    });

    __stxReactiveProxies.set(target, proxy);
    return proxy;
  }
  var computed = derived;
  var watch = $watch;
  var watchEffect = function(fn) { return effect(fn); };

  // Storage access is guarded end to end (stacksjs/stx#1793). Every one of
  // these can throw, and each throw took down the whole client script for the
  // page rather than just the composable:
  //
  //   getItem  - SecurityError in a sandboxed iframe or with storage disabled
  //   parse    - any non-JSON value already sitting at the key
  //   setItem  - QuotaExceededError, Safari private mode
  //
  // The parse fallback is deliberately LENIENT: a value that isn't JSON is
  // returned as the raw string rather than discarded for defaultValue. A key
  // that previously held a bare 'list' keeps reading back 'list' and is
  // rewritten as JSON on the next set, so migrating an existing key onto this
  // composable no longer needs the key to be renamed. This also matches
  // composables/use-storage.ts, whose default serializer already returns the
  // raw string on parse failure — the two implementations have to agree.
  function stxParseStored(raw, fallback, key, label) {
    if (raw === null || raw === undefined) return fallback;
    try { return JSON.parse(raw); }
    catch (e) {
      console.warn('[stx] ' + label + ': "' + key + '" holds a value that is not JSON (' + String(raw).slice(0, 64) + '); using it as a raw string. Write it with the same composable to store it as JSON.');
      return raw;
    }
  }
  function stxStorageRead(store, key, fallback, label) {
    var raw;
    try { raw = store.getItem(key); }
    catch (e) {
      console.warn('[stx] ' + label + ': cannot read "' + key + '" (' + (e && e.message ? e.message : e) + '); using the default.');
      return fallback;
    }
    return stxParseStored(raw, fallback, key, label);
  }
  function stxStorageWrite(store, key, value, label) {
    try { store.setItem(key, JSON.stringify(value)); }
    catch (e) {
      console.warn('[stx] ' + label + ': cannot persist "' + key + '" (' + (e && e.message ? e.message : e) + '); the value stays in memory only.');
    }
  }

  function useLocalStorage(key, defaultValue) {
    var s = state(stxStorageRead(localStorage, key, defaultValue, 'useLocalStorage'));
    effect(function() {
      stxStorageWrite(localStorage, key, s(), 'useLocalStorage');
    });
    var handler = function(e) {
      // Fires from ANOTHER tab at an arbitrary later time, so an unguarded
      // parse here throws inside a window listener with a stack pointing at
      // the runtime rather than at the consumer.
      // storageArea is also matched so a sessionStorage write to the same key
      // name can't clobber this signal — useSessionStorage already filtered,
      // this side didn't. Synthetic events (tests) leave storageArea null and
      // are still accepted; real browsers always populate it.
      if (e.key === key && (!e.storageArea || e.storageArea === localStorage))
        s.set(stxParseStored(e.newValue, defaultValue, key, 'useLocalStorage'));
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
    var s = state(stxStorageRead(sessionStorage, key, defaultValue, 'useSessionStorage'));
    effect(function() {
      stxStorageWrite(sessionStorage, key, s(), 'useSessionStorage');
    });
    var handler = function(e) {
      if (e.key === key && (!e.storageArea || e.storageArea === sessionStorage))
        s.set(stxParseStored(e.newValue, defaultValue, key, 'useSessionStorage'));
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
      else if (opts.expires !== undefined) {
        // Date, seconds-from-now, or anything Date can parse — matching the
        // composable. Accepting only a Date here meant the same option silently
        // produced a session cookie on the runtime path.
        var expiresDate = opts.expires instanceof Date
          ? opts.expires
          : (typeof opts.expires === 'number' ? new Date(Date.now() + opts.expires * 1000) : new Date(opts.expires));
        parts.push('expires=' + expiresDate.toUTCString());
      }
      parts.push('SameSite=' + (opts.sameSite || 'Lax'));
      var secure = opts.secure;
      if (secure === undefined) secure = typeof location !== 'undefined' && location.protocol === 'https:';
      if (secure) parts.push('Secure');
      return parts.join('; ');
    }
    // subscribe, not effect: an effect runs once at creation, so merely
    // DECLARING a cookie rewrote it from these options. A second declaration
    // that only wanted to read - no options, because it is not the owner of the
    // policy - therefore reserialised it with no max-age, which is the
    // definition of a session cookie. A 30-day login died at browser close
    // because the user opened a settings page (#1933).
    //
    // subscribe fires on set() only, so construction is a pure read: read()
    // above already seeds the signal. This matches the composable, which has
    // always used subscribe.
    s.subscribe(function(value) {
      if (typeof document === 'undefined') return;
      document.cookie = serialise(value);
    });
    return s;
  }

  var __stxGeneratedIdCounter = 0;

  // Stable, scope-aware DOM ids for component authoring. A component setup
  // runs with window.__STX_CURRENT_ELEMENT__ pointing at its compiled root, so
  // the data-stx scope id is already the canonical per-instance identity. The
  // local counter supports multiple useId() calls in one component while the
  // global fallback covers page scripts and manually-mounted roots.
  function useId(prefix) {
    var normalizedPrefix = String(prefix || 'stx')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'stx';
    var root = window.__STX_CURRENT_ELEMENT__;
    if (root && root.getAttribute) {
      var scopeId = root.getAttribute('data-stx-scope') || root.getAttribute('data-stx') || '';
      if (scopeId) {
        root.__stx_id_counter = (root.__stx_id_counter || 0) + 1;
        return normalizedPrefix + '-' + String(scopeId).replace(/[^a-zA-Z0-9_-]+/g, '-') + '-' + root.__stx_id_counter;
      }
    }
    __stxGeneratedIdCounter++;
    return normalizedPrefix + '-' + __stxGeneratedIdCounter;
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
      // Infer the prop's intended scalar type from its default. A string prop
      // with an empty value must stay "", not become the boolean true. This
      // mirrors typed component props and keeps form/error text stable when a
      // parent forwards an empty signal value through a DOM attribute.
      if (typeof defaultValue === 'string') return v == null ? '' : String(v);
      if (typeof defaultValue === 'boolean') {
        if (v === '' || v === 'true') return true;
        if (v === 'false' || v === null || v === undefined) return false;
        return Boolean(v);
      }
      if (v === '' || v === 'true') return true;
      if (v === 'false') return false;
      if (typeof v === 'string' && (v.charAt(0) === '[' || v.charAt(0) === '{')) {
        try { return JSON.parse(v); }
        catch (e) {}
      }
      if (typeof defaultValue === 'number')
        return v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : defaultValue;
      if (v != null && v !== '' && !isNaN(Number(v))) return Number(v);
      return v;
    };
    var root = window.__STX_CURRENT_ELEMENT__;
    var kebabName = name.replace(/([A-Z])/g, function(_, c) { return '-' + c.toLowerCase(); });
    var lowerName = name.toLowerCase();
    var attributeNames = [name];
    if (kebabName !== name) attributeNames.push(kebabName);
    if (lowerName !== name && lowerName !== kebabName) attributeNames.push(lowerName);
    function readAttribute() {
      if (!root || !root.hasAttribute) return { has: false, raw: null };
      for (var i = 0; i < attributeNames.length; i++) {
        var candidate = attributeNames[i];
        if (root.hasAttribute(candidate))
          return { has: true, raw: root.getAttribute(candidate) };
      }
      return { has: false, raw: null };
    }
    var staticValue = defaultValue;
    if (root && root.getAttribute) {
      var serializedProps = root.getAttribute('data-stx-props');
      if (serializedProps) {
        try {
          var parsedProps = JSON.parse(serializedProps);
          var camelName = name.replace(/-([a-z0-9])/g, function(_, c) { return c.toUpperCase(); });
          if (Object.prototype.hasOwnProperty.call(parsedProps, name)) staticValue = parsedProps[name];
          else if (Object.prototype.hasOwnProperty.call(parsedProps, camelName)) staticValue = parsedProps[camelName];
        }
        catch (e) {}
      }
    }
    var initial;
    var lastRaw = null;
    var initialAttribute = readAttribute();
    if (initialAttribute.has) {
      lastRaw = initialAttribute.raw;
      initial = parse(lastRaw);
    } else {
      initial = staticValue;
    }
    var s = state(initial);
    if (!root) return s;
    var propSignals = root.__stx_reactive_prop_signals
      || (root.__stx_reactive_prop_signals = {});
    propSignals[name] = s;
    propSignals[kebabName] = s;
    propSignals[lowerName] = s;
    var observer = new MutationObserver(function() {
      var attribute = readAttribute();
      var hasAttr = attribute.has;
      var raw = attribute.raw;
      if (raw === lastRaw) return;
      lastRaw = raw;
      var directValues = root.__stx_direct_prop_values;
      var directValue = directValues && directValues[name];
      var next;
      if (directValue && directValue.raw === raw) {
        next = directValue.value;
        delete directValues[name];
        for (var directKey in directValues) {
          if (directValues[directKey] === directValue) delete directValues[directKey];
        }
      }
      else {
        next = hasAttr ? parse(raw) : staticValue;
      }
      if (next !== s()) s.set(next);
    });
    observer.observe(root, { attributes: true, attributeFilter: attributeNames });
    onDestroy(function() {
      observer.disconnect();
      attributeNames.forEach(function(attributeName) {
        if (propSignals[attributeName] === s) delete propSignals[attributeName];
      });
    });
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
      // Html attributes. Every key, not just lang — the module impl
      // (head.ts updateHead) has always applied all of them, and a root-level
      // class is the main reason to reach for htmlAttrs at all (#1798).
      // class merges rather than replaces, matching bodyAttrs.class above:
      // the color-mode boot script owns a class on this same element.
      if (config.htmlAttrs) {
        for (var hk in config.htmlAttrs) {
          if (!config.htmlAttrs.hasOwnProperty(hk)) continue;
          var hv = config.htmlAttrs[hk];
          if (hv == null) continue;
          if (hk === 'class') {
            String(hv).split(' ').forEach(function(cls) { if (cls) document.documentElement.classList.add(cls); });
          } else {
            document.documentElement.setAttribute(hk, hv);
          }
        }
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

  /*
   * Is the APP in dark mode, not just the OS?
   *
   * stx's own color-mode boot writes a class (default 'dark') and/or an
   * attribute (data-theme / data-color-mode) onto <html>, so an app pinned to
   * light on a dark OS must not get a dark overlay over a light page. An
   * explicit override wins over both, and the media query is the last resort.
   *
   * One function rather than the resolution inlined per surface. #1875 fixed
   * this at the two dialog call sites, and toast kept the OS-only version and
   * shipped the exact bug #1875 describes; that is what a per-call-site fix
   * costs. See #1912.
   */
  function _resolveDark(override) {
    if (override != null)
      return !!override;

    var root = document.documentElement;
    if (root.classList.contains('dark'))
      return true;

    var attr = root.getAttribute('data-theme') || root.getAttribute('data-color-mode');
    if (attr === 'dark')
      return true;
    if (attr === 'light')
      return false;

    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
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

    /*
     * A semantic id replaces its own toast in place (stacksjs/stx#1913).
     *
     * Without it, a persistent 'Publishing...' toast and the call that clears
     * it on completion have to thread the numeric return value between two
     * different functions by hand, which is the state management the primitive
     * exists to remove. With an id of 'publish' the second call simply replaces
     * the first, and toast.dismiss('publish') ends it.
     */
    var key = opts.id != null ? String(opts.id) : '';
    if (key) {
      var prior = container.querySelector('[data-stx-toast-key="' + key.replace(/\"/g, '') + '"]');
      // Removed outright rather than through removeToast, which animates for
      // 300ms first. This is a REPLACEMENT, not a dismissal: animating the old
      // one out while the new one animates in shows both at once, in the same
      // slot, which is exactly the flicker a keyed toast exists to avoid.
      if (prior && prior.parentNode)
        prior.parentNode.removeChild(prior);
    }

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
    var isDark = _resolveDark(opts.dark);
    var bg = isDark ? '#1f2937' : '#ffffff';
    var textColor = isDark ? '#f3f4f6' : '#1f2937';
    var shadow = isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)';

    var el = document.createElement('div');
    el.id = 'stx-toast-' + id;
    el.setAttribute('data-stx-toast', String(id));
    if (key)
      el.setAttribute('data-stx-toast-key', key);
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.style.cssText = 'pointer-events:auto;display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem 1rem;border-radius:0.5rem;border-left:4px solid ' + borderColor + ';background:' + bg + ';color:' + textColor + ';box-shadow:' + shadow + ';animation:' + anims.inAnim + ' 0.3s ease;font-family:system-ui,-apple-system,sans-serif;font-size:0.875rem;line-height:1.4;max-width:100%';

    var iconSpan = document.createElement('span');
    iconSpan.style.cssText = 'flex-shrink:0;display:flex;align-items:center;margin-top:1px';
    iconSpan.innerHTML = icon;

    /*
     * Title above message, when one is given (#1913).
     *
     * Collapsing the two into one string loses the hierarchy that makes a toast
     * scannable, and every one of the 16 call sites in the reporting app passed
     * a title. A wrapper is used only when there IS a title, so the untitled
     * shape renders exactly as it did.
     */
    var msgSpan = document.createElement(opts.title ? 'div' : 'span');
    msgSpan.style.cssText = 'flex:1;word-wrap:break-word';

    if (opts.title) {
      var titleEl = document.createElement('div');
      titleEl.setAttribute('data-stx-toast-title', '');
      titleEl.style.cssText = 'font-weight:600;margin-bottom:0.125rem';
      titleEl.textContent = opts.title;
      msgSpan.appendChild(titleEl);

      var bodyEl = document.createElement('div');
      bodyEl.style.cssText = 'opacity:0.9';
      bodyEl.textContent = message;
      msgSpan.appendChild(bodyEl);
    }
    else {
      msgSpan.textContent = message;
    }

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
      if (id !== undefined) {
        // A string id is the semantic key the caller passed; a number is the
        // handle addToast returned. Both dismiss, so a caller does not have to
        // know which kind it is holding (#1913).
        if (typeof id === 'string') {
          var c = _getToastContainer();
          var match = c && c.querySelector('[data-stx-toast-key="' + id.replace(/\"/g, '') + '"]');
          if (match)
            removeToast(match.getAttribute('data-stx-toast'));
          return;
        }
        removeToast(id);
        return;
      }
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
    // Resolve dark from what the APP decided, not only from the OS. stx's own
    // color-mode boot writes a class (default 'dark') and/or an attribute
    // (e.g. data-theme) onto <html>, so an app pinned to light on a dark OS used
    // to get a dark dialog over a light page. An explicit opts.dark wins over
    // both, and the media query stays as the last resort. See #1875.
    var isDark = _resolveDark(opts.dark);
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
        titleEl.id = id + '-title';
        titleEl.style.cssText = 'margin:0 0 0.5rem;font-size:1.125rem;font-weight:600';
        titleEl.textContent = title;
        panel.appendChild(titleEl);
        // role=alertdialog was announced with no accessible name at all.
        backdrop.setAttribute('aria-labelledby', titleEl.id);
      }

      var msgEl = document.createElement('p');
      msgEl.id = id + '-message';
      msgEl.style.cssText = 'margin:0 0 1.25rem;font-size:0.875rem;line-height:1.5;color:' + subColor;
      msgEl.textContent = message;
      panel.appendChild(msgEl);
      backdrop.setAttribute('aria-describedby', msgEl.id);
      if (!title)
        backdrop.setAttribute('aria-label', message);

      var btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:0.75rem;justify-content:center';

      // Captured before the dialog steals focus, so it can be handed back on
      // close. Without this a keyboard or screen-reader user is dropped at the
      // top of the document every time a dialog closes.
      var previouslyFocused = document.activeElement;
      var closed = false;

      function cleanup(result) {
        // Guarded: the escape handler used to be able to fire after a button had
        // already closed the dialog, because the listener outlived it.
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', keyHandler, true);
        backdrop.style.opacity = '0';
        panel.style.transform = 'scale(0.95)';
        setTimeout(function() { backdrop.remove(); }, 200);
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
          try { previouslyFocused.focus(); }
          catch (_e) { /* element may be gone; not worth failing the dialog over */ }
        }
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

      // Escape, plus a real focus trap.
      //
      // The old handler removed itself ONLY inside the Escape branch, so every
      // dialog dismissed with a button left a permanent keydown listener on
      // document holding this whole closure — backdrop, panel and resolve — alive.
      // Removal now lives in cleanup(), which every exit path goes through.
      //
      // aria-modal="true" was already being claimed on the backdrop while Tab
      // walked straight out into the page behind it. Capture phase so the trap
      // wins over anything the page has bound.
      var keyHandler = function(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanup(isConfirm ? false : undefined);
          return;
        }
        if (e.key !== 'Tab') return;
        var focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        // Focus may sit outside the panel entirely (the page had it when the
        // dialog opened), in which case Tab must pull it back in rather than
        // continue through the document.
        if (!panel.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      document.addEventListener('keydown', keyHandler, true);

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

  // Hydrate a subtree inserted AFTER initial load — e.g. a streamed suspense
  // boundary (#1746 Phase 3). Mirrors the SPA re-init pass, scoped to the
  // container: (1) executes the subtree's scoped setup scripts (inert when
  // inserted via innerHTML, so they're cloned into fresh script elements to
  // run), (2) processes any data-stx-scope islands the scripts registered,
  // (3) binds directives across the subtree (content using already-live page
  // signals works too), (4) flushes onMount. Idempotent via the usual guards.
  function hydrateSubtree(container) {
    if (!container || !container.querySelectorAll) return;
    // 1. Run scoped setup scripts so their scopes register.
    var scoped = container.querySelectorAll('script[data-stx-scoped]');
    for (var i = 0; i < scoped.length; i++) {
      var old = scoped[i];
      if (old.__stx_ran) continue;
      var fresh = document.createElement('script');
      for (var a = 0; a < old.attributes.length; a++) fresh.setAttribute(old.attributes[a].name, old.attributes[a].value);
      fresh.textContent = old.textContent;
      fresh.__stx_ran = true;
      if (old.parentNode) old.parentNode.replaceChild(fresh, old);
    }
    // 2. Process scopes registered in this subtree (incl. the container itself).
    var scopeEls = [];
    if (container.matches && container.matches('[data-stx-scope]')) scopeEls.push(container);
    container.querySelectorAll('[data-stx-scope]').forEach(function(el) { scopeEls.push(el); });
    scopeEls.forEach(function(el) {
      if (el.__stx_disposers) return;
      var scopeId = el.getAttribute('data-stx-scope');
      var scopeVars = window.stx._scopes && window.stx._scopes[scopeId];
      if (!scopeVars) return;
      el.__stx_parent_scope = el.__stx_parent_scope
        || resolveComponentCallerScope(el, componentScope);
      bindParentComponentProps(el, el.__stx_parent_scope);
      Object.assign(componentScope, scopeVars);
      el.__stx_disposers = trackEffects(function() { processElement(el, componentScope); });
      if (scopeVars.__mountCallbacks && !scopeVars.__mounted) {
        scopeVars.__mounted = true;
        runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
      }
    });
    // 3. Bind directives across the subtree.
    processElement(container);
    if (container.removeAttribute) container.removeAttribute('x-cloak');
    container.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
    // 4. Flush any global mount callbacks the scripts queued.
    if (mountCallbacks.length) {
      var cbs = mountCallbacks.slice();
      mountCallbacks.length = 0;
      runMountCallbacks(cbs, destroyCallbacks);
    }
    window.dispatchEvent(new CustomEvent('stx:hydrated', { detail: { el: container, trigger: 'stream' } }));
  }

  // Component mount system
  var mountQueue = [];

  // MERGE, never replace (#1804). Three client bundles assign window.stx and
  // the last one used to erase the others. Object.assign also preserves the
  // object IDENTITY, which matters because the generated store runtime captures
  // window.stx in a closure variable — replacing the object leaves that closure
  // calling a detached one.
  window.stx = Object.assign(window.stx || {}, {
    hydrate: hydrateSubtree,
    state,
    derived,
    effect,
    batch,
    isSignal,
    isDerived,
    untrack,
    peek,
    inject,
    watchMultiple,
    onMount,
    onBeforeMount: onMount,
    onDestroy,
    onMounted: onMount,
    onBeforeUnmount: onDestroy,
    onUnmounted: onDestroy,
    useFetch,
    useRef,
    navigate,
    refresh,
    invalidateRoute,
    goBack,
    goForward,
    useRoute,
    useRouteParams,
    useRouteParam,
    setRouteParams,
    useSearchParams,
    useQuery,
    useMutation,
    configureFetch,
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
    nextTick,
    useAsync,
    useLocalStorage,
    useSessionStorage,
    useCookie,
    useId,
    useReactiveProp,
    useEventListener,
    useWebSocket,
    useColorMode,
    useDark,
    useMediaQuery,
    useScrollLock,
    usePreferredDark,
    usePreferredLight,
    usePreferredReducedMotion,
    usePreferredContrast,
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
    defineEmits: function(events) {
      var el = window.__STX_CURRENT_ELEMENT__ || null;
      var declaredEvents = Array.isArray(events)
        ? events
        : (events && typeof events === 'object' ? Object.keys(events) : []);
      if (el && declaredEvents.length) {
        el.__stx_component_emits = el.__stx_component_emits || Object.create(null);
        declaredEvents.forEach(function(event) {
          el.__stx_component_emits[event] = true;
        });
      }
      return function(event, payload) {
        var target = el || document.body;
        if (el) {
          el.__stx_component_emits = el.__stx_component_emits || Object.create(null);
          el.__stx_component_emits[event] = true;
        }
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
    // Vue spells the same lookup useSlots(); it was auto-imported with no
    // implementation behind it (#1804).
    useSlots: function() {
      return window.__STX_CURRENT_SLOTS__ || {};
    },

    _mountCallbacks: mountCallbacks,
    _destroyCallbacks: destroyCallbacks,
    _cleanupContainer: cleanupContainer,
    _registerSuspense: registerSuspense,  // <Suspense> query registration (#1742)
    _tg: { enter: tgEnter, leave: tgLeave, flip: tgFlip, snapshot: tgSnapshot },  // <TransitionGroup> helpers (#1742)
    _scopes: {},  // Component-level scopes
    _scopeCounter: 0,  // Counter for generating unique scope IDs during SPA navigation
    _latestSetup: window.__stx_latestSetup || null,  // Latest SFC setup function (including scripts parsed before the runtime)
    _stores: new Map(),  // Global store registry — survives SPA navigation

    // ── Store System ──
    // Pinia-inspired, signals-based. Stores survive SPA navigation.

    defineStore: function(id, setupOrOptions, storeOptions) {
      console.log('[stx:store] defineStore called:', id, 'type:', typeof setupOrOptions === 'function' ? 'setup' : 'options', 'persist:', !!(storeOptions && storeOptions.persist));
      // Return existing store if already defined.
      //
      // During a store HMR pass the definition is deliberately re-run, so the
      // cached instance must NOT short-circuit it (#1877 ask 4).
      if (window.stx._stores.has(id) && !window.stx.__hmrStoreReplacing) {
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
        var pick = pOpts.pick || null;

        // Three additions, all of which apps previously had to hand-roll outside
        // the store entirely (#1872):
        //
        //   keys        map a field to its OWN storage key, and optionally its own
        //               backend, instead of folding everything into one JSON blob
        //   serialize   / deserialize — the codec was hardcoded to JSON, so a
        //               persisted string came back quoted. A signed-out token
        //               stored as '""' is two characters and TRUTHY, which is a
        //               real class of auth bug, and a legacy raw value could not
        //               be read at all
        //   cookie      a backend the SERVER can read. Server-rendered,
        //               owner-scoped pages authenticate from a cookie and cannot
        //               see localStorage, so this previously meant a second
        //               persisted signal plus a hand-written mirroring effect
        var fieldMap = pOpts.keys || null;
        var defaultSerialize = pOpts.serialize || function(value) { return JSON.stringify(value); };
        var defaultDeserialize = pOpts.deserialize || function(raw) { return JSON.parse(raw); };

        // 'local' and 'localStorage' both accepted; the old code only recognised
        // 'sessionStorage', so 'session' silently fell through to localStorage.
        // Resolved through window when the bare global is absent, so persist also
        // works where the runtime is evaluated outside a page's global scope
        // (component test harnesses, embedded runtimes).
        function _backendFor(kind) {
          if (kind === 'cookie') return 'cookie';
          var scope = typeof window !== 'undefined' ? window : null;
          if (kind === 'session' || kind === 'sessionStorage')
            return typeof sessionStorage !== 'undefined' ? sessionStorage : (scope && scope.sessionStorage);
          return typeof localStorage !== 'undefined' ? localStorage : (scope && scope.localStorage);
        }
        var storageType = _backendFor(pOpts.storage);

        // Resolved config for a field that has its own key, or null if it belongs
        // in the shared blob.
        function _mappedConfig(field) {
          if (!fieldMap || !Object.prototype.hasOwnProperty.call(fieldMap, field)) return null;
          var cfg = fieldMap[field];
          if (typeof cfg === 'string') cfg = { key: cfg };
          cfg = cfg || {};
          return {
            key: cfg.key || field,
            backend: _backendFor(cfg.storage === undefined ? pOpts.storage : cfg.storage),
            cookieOpts: cfg,
            serialize: cfg.serialize || defaultSerialize,
            deserialize: cfg.deserialize || defaultDeserialize
          };
        }

        // A mapped field owns its key, so it must NOT also be written into the
        // blob — otherwise it round-trips through two places that can disagree.
        function _inBlob(field) {
          if (pick && pick.indexOf(field) === -1) return false;
          return !_mappedConfig(field);
        }

        // Read persisted state (overrides hydration)
        try {
          var saved = storageType === 'cookie' ? null : storageType.getItem(storageKey);
          if (saved) {
            var parsed = defaultDeserialize(saved);
            console.log('[stx:store] restoring persisted state:', id, 'key:', storageKey, Object.keys(parsed));
            batch(function() {
              for (var pk in parsed) {
                if (result[pk] && result[pk]._isSignal && _inBlob(pk)) {
                  result[pk].set(parsed[pk]);
                }
              }
            });
          } else {
            console.log('[stx:store] no persisted state found:', id, 'key:', storageKey);
          }
        } catch(e) { console.warn('[stx:store] persistence read error:', id, e); }

        // Per-field persistence: own key, own backend, own codec.
        //
        // The disposer swap is the same trick the blob effect below uses — these
        // effects must outlive the component that happened to instantiate the
        // store, or persistence would stop the first time that component
        // unmounted.
        var prevFieldDisposers = activeDisposers;
        activeDisposers = null;
        if (fieldMap) {
          for (var fk in fieldMap) {
            if (!Object.prototype.hasOwnProperty.call(fieldMap, fk)) continue;
            if (!result[fk] || !result[fk]._isSignal) {
              console.warn('[stx:store] persist.keys names a field that is not a signal:', id, fk);
              continue;
            }
            (function(field, cfg, signal) {
              if (cfg.backend === 'cookie') {
                // useCookie owns path / max-age / SameSite / Secure, so cookie
                // attributes do not have to be reimplemented here. It is a
                // string-valued signal, hence serialize on the way out.
                var cookieSignal = useCookie(cfg.key, cfg.cookieOpts);
                var initialCookie = cookieSignal();
                if (initialCookie !== '' && initialCookie != null) {
                  try { signal.set(cfg.deserialize(initialCookie)); }
                  catch(e) { console.warn('[stx:store] persist read error:', id, field, e); }
                }
                effect(function() {
                  var next = signal();
                  try { cookieSignal.set(next == null ? '' : String(cfg.serialize(next))); }
                  catch(e) { console.warn('[stx:store] persist write error:', id, field, e); }
                });
                return;
              }
              try {
                var rawValue = cfg.backend.getItem(cfg.key);
                if (rawValue !== null) signal.set(cfg.deserialize(rawValue));
              } catch(e) { console.warn('[stx:store] persist read error:', id, field, e); }
              effect(function() {
                var value = signal();
                try { cfg.backend.setItem(cfg.key, String(cfg.serialize(value))); }
                catch(e) { console.warn('[stx:store] persist write error:', id, field, e); }
              });
            })(fk, _mappedConfig(fk), result[fk]);
          }
        }
        activeDisposers = prevFieldDisposers;

        // Write on change (debounced)
        var writeTimer = null;
        var prevPersistDisposers = activeDisposers;
        activeDisposers = null;
        effect(function() {
          var snapshot = {};
          var wrote = false;
          for (var wk in result) {
            if (result[wk] && result[wk]._isSignal && _inBlob(wk)) {
              snapshot[wk] = result[wk]();
              wrote = true;
            }
          }
          // With every field mapped to its own key there is no blob left, and
          // writing an empty object would clobber whatever else owns that key.
          if (!wrote || storageType === 'cookie') return;
          if (writeTimer) clearTimeout(writeTimer);
          writeTimer = setTimeout(function() {
            console.log('[stx:store] persisting:', id, 'key:', storageKey, Object.keys(snapshot));
            try { storageType.setItem(storageKey, String(defaultSerialize(snapshot))); } catch(e) { console.warn('[stx:store] persist write error:', id, e); }
          }, 100);
        });
        activeDisposers = prevPersistDisposers;
      }

      // Marker so the template-scope auto-unwrap proxy knows to recursively
      // unwrap signal-valued properties on this object. Script-level callers
      // still see the bare store (so existing patterns like store.someSignal()
      // keep working); only template expression evaluation auto-unwraps.
      result._isStxStore = true;

      // Carry state across a hot replacement.
      //
      // The NEW store object is kept rather than patching the old one: a
      // setup-style store's actions close over the signals created in that
      // same run, so keeping the old signals would leave the new actions
      // writing to signals nothing is watching — an edit that appears to do
      // nothing, which is worse than the reload this replaces. Seeding the new
      // signals with the old values keeps state and behaviour consistent, and
      // the caller re-renders afterwards so components rebind to this object.
      var seed = window.stx.__hmrStoreSeed && window.stx.__hmrStoreSeed[id];
      if (seed) {
        for (var seedKey in seed) {
          var target = result[seedKey];
          if (target && target._isSignal && typeof target.set === 'function' && !target._isDerived) {
            try { target.set(seed[seedKey]); }
            catch (e) { /* shape changed across the edit — keep the new default */ }
          }
        }
      }

      // Register globally
      window.stx._stores.set(id, result);
      window.__STX_STORES__ = window.__STX_STORES__ || {};
      window.__STX_STORES__[id] = result;

      console.log('[stx:store] registered:', id, 'total stores:', window.stx._stores.size);
      return result;
    },

    // Replace the store definitions in place, keeping their state — the
    // acceptHMRUpdate contract (#1877 ask 4). Called by the dev server's HMR
    // client when a file under storesDir changes, instead of reloading the
    // document and throwing away everything the SPA exists to preserve.
    __hmrReplaceStores: function(code) {
      var seed = {};
      window.stx._stores.forEach(function(store, id) {
        var values = {};
        for (var key in store) {
          var value = store[key];
          // Derived values recompute from state, so seeding them would fight
          // their own recomputation.
          if (value && value._isSignal && !value._isDerived) {
            try { values[key] = value.peek ? value.peek() : value(); }
            catch (e) { /* unreadable — let the new default stand */ }
          }
        }
        seed[id] = values;
      });

      window.stx.__hmrStoreSeed = seed;
      window.stx.__hmrStoreReplacing = true;
      var ok = true;
      try {
        // Indirect eval, so the bundle evaluates at global scope the way it
        // does when inlined into the page.
        (0, eval)(code);
      }
      catch (e) {
        ok = false;
        console.error('[stx:hmr] store bundle failed to evaluate:', e);
      }
      finally {
        window.stx.__hmrStoreReplacing = false;
        window.stx.__hmrStoreSeed = null;
      }

      if (!ok) return false;

      // Components captured the PREVIOUS store object from useStore(), so
      // re-render the route to rebind them. Still not a document reload: the
      // swap keeps every non-store signal on the page alive.
      if (window.stxRouter && typeof window.stxRouter.refresh === 'function') {
        try { window.stxRouter.refresh(); }
        catch (e) { /* a refresh that cannot run is not worth a reload here */ }
      }
      return true;
    },

    registerStoresClient: function(stores) {
      window.__STX_STORES__ = window.__STX_STORES__ || {};
      var names = Object.keys(stores || {});
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        window.__STX_STORES__[name] = stores[name];
      }
      window.dispatchEvent(new CustomEvent('stx:stores-ready', { detail: names }));
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
          processElement(root, { ...componentScope, ...(scope || {}) });
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
        // Auto-mount scripts are emitted after their component template. Other
        // generated helper scripts can sit between the rendered root and this
        // script, so walk past script/style siblings before selecting the root.
        // Router-injected page scripts are marked data-stx-page and must use the
        // content-container fallback below instead.
        var isSpaPageScript = scriptEl && scriptEl.hasAttribute
          && scriptEl.hasAttribute('data-stx-page')
          && !scriptEl.hasAttribute('data-stx-positioned');
        var root = null;
        if (scriptEl && !isSpaPageScript) {
          var previous = scriptEl.previousElementSibling;
          while (previous && (previous.tagName === 'SCRIPT' || previous.tagName === 'STYLE'))
            previous = previous.previousElementSibling;

          var next = scriptEl.nextElementSibling;
          while (next && (next.tagName === 'SCRIPT' || next.tagName === 'STYLE'))
            next = next.nextElementSibling;

          root = previous || next || scriptEl.parentElement;
        }

        // SPA fallback: during router navigation, script is appended to body>
        // (not inside the content container), so nextElementSibling won't find the page content.
        // Only use fallback when we genuinely couldn't find a suitable root element.
        // Do NOT fallback just because the script is in body> — layout scripts in body>
        // with valid siblings (e.g. sidebar <aside>) should use those siblings as root.

        // An x-data root that initScope has not claimed yet is not ours to mount.
        //
        // The element carries its own state expression and the reactive runtime
        // owns it; data-stx-scope is on it from the server, but the id is not
        // in stx._scopes until initScope runs, which on a navigation happens
        // later in the stx:load handler. Mounting it in the meantime binds its
        // whole subtree against whatever scope the mounting script brought.
        //
        // That is what a layout script did after every SPA navigation. Its own
        // re-executed script now lands inside the content container next to the
        // incoming page, so previousElementSibling resolved to the *page's*
        // x-data root; mount() adopted it and ran processElement over it with the
        // sidebar's scope. Every :for template inside was consumed against a
        // scope holding none of the page's data, and bindFor replaces each
        // template with its stx-for anchor on that single pass — so the markup a
        // retry needed was gone, and the effect had read no signal to re-run on.
        // The list stayed empty for the life of the page while its state sat
        // fully populated beside it. Cold loads never hit it: there the page's
        // own script mounts first, with the right scope.
        //
        // Registered scopes are left alone, so an element the reactive runtime
        // has already initialised keeps whatever behaviour it had.
        function awaitingReactiveInit(el) {
          if (!el || !el.hasAttribute || !el.hasAttribute('data-stx-xdata'))
            return false;
          var id = el.getAttribute('data-stx-scope');
          return !(id && window.stx && window.stx._scopes && window.stx._scopes[id]);
        }

        var needsFallback = !root || root === document.body
          || (root && root.tagName === 'SCRIPT')
          || awaitingReactiveInit(root);
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
              var candidate = children[ci];
              if (candidate.__stx_scope || candidate.tagName === 'SCRIPT') continue;
              if (awaitingReactiveInit(candidate)) continue;
              root = candidate;
              break;
            }
          }
        }

        // The fallback can still land on one (a container whose only unmounted
        // child is the incoming page). Processing the container instead is safe:
        // processElement skips [data-stx-scope] children, so the reactive
        // runtime keeps its subtree and binds it with the right scope.
        if (awaitingReactiveInit(root)) {
          var reactiveOwnerParent = root.parentElement;
          root = reactiveOwnerParent && reactiveOwnerParent !== document.body ? reactiveOwnerParent : null;
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
          processElement(root, { ...componentScope, ...(scope || {}) });
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

      var isRoutedMount = scriptEl && scriptEl.hasAttribute
        && scriptEl.hasAttribute('data-stx-page');
      if (document.readyState === 'loading' || isRoutedMount) {
        mountQueue.push(doMount);
      }
else {
        doMount();
      }
    }
  });

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
  window.nextTick = nextTick;
  window.useAsync = useAsync;
  window.useLocalStorage = useLocalStorage;
  // Paired with the line above. Both are in STX_RUNTIME_GLOBALS, so a
  // <script client> block gets either via the setup destructure — but code
  // that reads the bare window global directly (a plain <script>, or a
  // bundled module that wasn't rewritten) found useLocalStorage defined and
  // useSessionStorage undefined.
  window.useSessionStorage = useSessionStorage;
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
  window.reactive = reactive;
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
    version: 4,
    // ── Phase 2: reactivity instrumentation (dev-mode, opt-in) ──
    // Turn counting on/off. OFF by default so the runtime stays zero-overhead
    // until a devtools session asks for it.
    enable: function() { __stxDevtoolsTracking = true; },
    disable: function() { __stxDevtoolsTracking = false; },
    tracking: function() { return __stxDevtoolsTracking; },
    // Global tallies since the last reset: total signal changes + effect re-runs.
    stats: function() {
      return { signalSets: __stxDevtoolsStats.signalSets, effectRuns: __stxDevtoolsStats.effectRuns, tracking: __stxDevtoolsTracking };
    },
    resetStats: function() { __stxDevtoolsStats.signalSets = 0; __stxDevtoolsStats.effectRuns = 0; __stxDevtoolsIfTrace.length = 0; __stxDevtoolsQueries.length = 0; __stxDevtoolsMutations.length = 0; },
    // Phase 3: structured :if decision trace — which branch each reactive
    // @if/v-if/:if chain picked, newest last. Recorded only while tracking.
    ifTrace: function() { return __stxDevtoolsIfTrace.slice(); },
    // Phase 3: data-layer query timeline — { source, url, method, status, ok, ms }
    // for each useFetch/useQuery/useMutation request, newest last.
    queries: function() { return __stxDevtoolsQueries.slice(); },
    // Phase 4: state-change log — each recorded signal mutation { name, scope,
    // prev, next }, newest last. Resolves each signal id to its name + owning
    // scope/store at query time, so the buffer itself holds no live references.
    mutations: function() {
      var nameById = {};
      function index(container, label) {
        if (!container || typeof container !== 'object') return;
        Object.keys(container).forEach(function(k) {
          if (k.indexOf('__') === 0) return;
          var v = container[k];
          if (typeof v === 'function' && v._stxSignalId) nameById[v._stxSignalId] = { name: k, scope: label };
        });
      }
      var scopes = (window.stx && window.stx._scopes) || {};
      Object.keys(scopes).forEach(function(id) { index(scopes[id], id); });
      if (window.stx && window.stx._stores && typeof window.stx._stores.forEach === 'function')
        window.stx._stores.forEach(function(s, id) { index(s, 'store:' + id); });
      return __stxDevtoolsMutations.map(function(m) {
        var info = nameById[m.sid];
        return { name: info ? info.name : '(anonymous)', scope: info ? info.scope : null, prev: m.prev, next: m.next };
      });
    },
    // Reactive graph: per scope, each signal/derived with its current value, how
    // many times it was set (when tracking), and how many effects subscribe to
    // it (the dependency edges — "which effects read this signal", as a count).
    graph: function() {
      var out = [];
      var scopes = (window.stx && window.stx._scopes) || {};
      Object.keys(scopes).forEach(function(scopeId) {
        var sv = scopes[scopeId];
        if (!sv || typeof sv !== 'object') return;
        var nodes = [];
        Object.keys(sv).forEach(function(k) {
          if (k.indexOf('__') === 0 || k === '$el' || k === '$refs' || k === '$props') return;
          var v = sv[k];
          if (typeof v === 'function' && (v._isSignal || v._isDerived)) {
            nodes.push({
              name: k,
              type: v._isDerived ? 'derived' : 'signal',
              value: peek(function() { return v(); }),
              setCount: v._setCount || 0,
              subscribers: (v._effects && typeof v._effects.size === 'number') ? v._effects.size : 0
            });
          }
        });
        if (nodes.length) out.push({ scopeId: scopeId, nodes: nodes });
      });
      return out;
    },
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
    // One store's state — its state signals / getters (derived) / plain values /
    // actions (methods). A store is just an object of those, so the same
    // classifier as scope() works (values read via peek — no graph pollution).
    store: function(id) {
      var reg = window.stx && window.stx._stores;
      var s = reg && typeof reg.get === 'function' ? reg.get(id) : null;
      return s ? __stxDevtoolsClassify(s) : null;
    },
  };

  // ==========================================================================
  // Auto-initialization
  // ==========================================================================

  // A dev runtime may be evaluated again by HMR, an embed, or a test harness.
  // Replace the previous listener so only the latest runtime closure can own
  // componentScope and reactive subscriptions.
  if (window.__stxDomReadyHandler) {
    document.removeEventListener('DOMContentLoaded', window.__stxDomReadyHandler);
  }
  const stxDomReadyHandler = () => {
    console.log('[stx] DOMContentLoaded fired — processing scopes');
    // Track which scoped elements have been processed
    const processedScopes = new Set();

    // Layout expansion can remove the data-stx marker from a page's first
    // element while leaving markers owned by the layout itself. The generated
    // page setup is still queued explicitly, so adopt it when its own marker
    // did not survive.
    const latestSetup = window.stx._latestSetup;
    const latestSetupName = typeof latestSetup === 'function' ? latestSetup.name : '';
    const hasLatestSetupMarker = latestSetupName && Array.from(document.querySelectorAll('[data-stx]'))
      .some(el => el.getAttribute('data-stx') === latestSetupName);
    if (latestSetup && !hasLatestSetupMarker) {
      try {
        const result = latestSetup();
        if (typeof result === 'object' && result !== null)
          Object.assign(componentScope, result);
      }
      catch (e) {
        console.error('[stx] initial setup error:', e);
      }
    }

    // Register page setup before mounting child components. Projected slot
    // content belongs to the caller, so child mounts need the caller's signals
    // available when they walk their own rendered roots.
    document.querySelectorAll('[data-stx]').forEach(el => {
      const setupName = el.getAttribute('data-stx');
      console.log('[DOMContentLoaded] data-stx:', setupName, 'el:', el.tagName, 'fn exists:', !!(setupName && window[setupName]));
      if (setupName && window[setupName]) {
        // Contained, like the two sibling setup call sites. An uncaught throw
        // here aborted the whole forEach and everything after it in this
        // handler, so ONE bad name in ONE page's setup left every root on the
        // page unhydrated — the user sees raw {{ }}, and the console names the
        // identifier without saying it cost them the document (#1805).
        try {
          const result = window[setupName]();
          console.log('[DOMContentLoaded] setup returned:', result ? Object.keys(result).slice(0, 10) : 'null');
          if (typeof result === 'object' && result !== null) {
            Object.assign(componentScope, result);
          }
        }
        catch (e) {
          console.error('[stx] page setup "' + setupName + '" threw; this root will not hydrate:', e);
        }
      }
    });
    var pageScopeSnapshot = { ...componentScope };

    /*
     * Any x-data scope the reactive bridge did not reach, initialized here.
     *
     * The bridge script addresses each scope by a selector it generated, and
     * that numbering restarts per render - so a page carrying three component
     * islands emits three scripts all looking for the same scope id, and two of
     * the three scopes are never initialized at all. The symptom is the
     * quietest one available: the markup is there, every binding shows its
     * initial value, and whatever x-init was meant to start never starts.
     *
     * Registered scopes are skipped, so the bridge stays authoritative where it
     * did run and this only picks up what it missed. The init expression is
     * read from data-stx-xinit, which the server preserves for exactly this.
     *
     * No backticks in this comment, deliberately: it lives inside the runtime
     * source that is embedded as a template literal, and one would end the
     * literal and take the whole file's syntax with it.
     */
    if (window.__stx_reactive && window.__stx_reactive.initScope) {
      document.querySelectorAll('[data-stx-xdata]').forEach(function(el) {
        var scopeId = el.getAttribute('data-stx-scope');
        if (scopeId && window.stx._scopes && window.stx._scopes[scopeId]) return;
        if (el.__stx_scope_initialized) return;

        var xdata = el.getAttribute('data-stx-xdata');
        if (!xdata) return;

        if (!scopeId) {
          scopeId = '__stx_scope_island_' + (++window.stx._scopeCounter);
          el.setAttribute('data-stx-scope', scopeId);
        }

        el.__stx_scope_initialized = true;

        try {
          window.__stx_reactive.initScope(el, xdata, [], {}, el.getAttribute('data-stx-xinit') || null);
        }
        catch (e) {
          console.error('[stx] island scope init error:', e);
        }
      });
    }

    // Process mount queue (from stx.mount() calls during loading) only after
    // caller setup is available for Vue-style projected slot ownership.
    mountQueue.forEach(function(fn) { fn(); });
    mountQueue = [];

    // Bind page roots after child components have registered their local scope.
    document.querySelectorAll('[data-stx]').forEach(el => {
      console.log('[DOMContentLoaded] processElement on:', el.tagName, 'scope keys:', Object.keys(componentScope).slice(0, 10));
      var disposeEffects = trackEffects(function() { processElement(el); });
      el.__stx_disposers = disposeEffects;

      // Remove x-cloak after bindings are applied (prevents FOUC)
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });

      runMountCallbacks(mountCallbacks, destroyCallbacks);
    });

    // Multi-root fragment fix: a no-body> setup page tags only the FIRST
    // top-level element with data-stx (signal-processing.ts marks one element),
    // so sibling root elements were orphaned — their :if / :for / {{ }} / x-text
    // never hydrated, which read as "{{ }} doesn't work under :if/:for". The
    // setup(s) above already populated the shared global componentScope, so
    // process each un-hydrated sibling root under that same scope — same signals,
    // so cross-root state stays coupled.
    var stxRoots = document.querySelectorAll('[data-stx]');
    if (stxRoots.length && Object.keys(componentScope).length) {
      var rootParent = stxRoots[0].parentNode;
      if (rootParent && rootParent.children) {
        Array.prototype.slice.call(rootParent.children).forEach(function(sib) {
          if (sib.nodeType !== 1) return;
          if (sib.hasAttribute('data-stx') || sib.hasAttribute('data-stx-scope')) return;
          if (sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE') return;
          if (sib.__stx_disposers) return; // already processed
          var disposeSib = trackEffects(function() { processElement(sib); });
          sib.__stx_disposers = disposeSib;
          sib.removeAttribute('x-cloak');
          sib.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
        });
      }
    }

    // Process scoped components FIRST (their scripts have already registered scope variables)
    var allScopes = document.querySelectorAll('[data-stx-scope]');
    console.log('[stx] found', allScopes.length, 'data-stx-scope elements');
    allScopes.forEach(el => {
      const scopeId = el.getAttribute('data-stx-scope');
      console.log('[stx] scope:', scopeId, 'registered:', !!(window.stx._scopes && window.stx._scopes[scopeId]), 'el:', el.tagName);
      processedScopes.add(el);

      const scopeVars = window.stx._scopes && window.stx._scopes[scopeId];
      // Record the element this scope is bound to so cleanupContainer can tell a
      // dead registry entry (element replaced by an SPA swap) from a live one.
      // See sweepOrphanedScopes / #1775.
      if (scopeVars) scopeVars.__el = el;

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

      // Forwarded props and events belong to the caller. Capture its scope
      // before this component's locals are merged, so identical child names
      // cannot shadow expressions such as :total-items="totalItems".
      el.__stx_parent_scope = el.__stx_parent_scope
        || resolveComponentCallerScope(el, pageScopeSnapshot);
      bindParentComponentProps(el, el.__stx_parent_scope);

      // Merge component scope vars into componentScope (don't restore - keep for head elements)
      // This ensures expressions can access component variables even for elements
      // where findElementScope might not work (e.g., cloned elements not yet in DOM)
      if (scopeVars) {
        componentScope = { ...componentScope, ...scopeVars };
      }

      console.log('[stx] calling processElement on scope:', scopeId, 'componentScope keys:', Object.keys(componentScope).length, 'scopeVars keys:', Object.keys(scopeVars).length);
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
        runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
      }
    });

    // Run global mount callbacks (from partial <script client> blocks that call onMount)
    // These are pushed during script execution, before DOMContentLoaded
    console.log('[stx] running global mountCallbacks:', mountCallbacks.length);
    runMountCallbacks(mountCallbacks, destroyCallbacks);
    mountCallbacks.length = 0;

    // Auto-process elements with data-stx-auto (skip already processed scoped elements)
    document.querySelectorAll('[data-stx-auto]').forEach(el => {
      // Process element but skip children that are in scoped containers
      processElementSkipScopes(el, processedScopes);

      // Remove x-cloak after bindings are applied
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
    });

    // Process head> elements (title, meta) that may contain {{ }} expressions
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

    // Everything that should have hydrated has now had its chance (#1773).
    auditHydration(document.body, 'DOMContentLoaded');
  };
  window.__stxDomReadyHandler = stxDomReadyHandler;
  console.log('[stx] registering DOMContentLoaded handler');
  document.addEventListener('DOMContentLoaded', stxDomReadyHandler);

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

  // Reclaim registry entries whose element is gone from the document.
  //
  // disposeSubtreeScopes only deletes scopes found UNDER the cleanup container,
  // so two shapes leaked forever across SPA navigation (#1775): components
  // rendered outside the swap container (an @include in the layout, above
  // <main>), and elements already detached by the time cleanup ran its
  // querySelectorAll. Each round-trip re-ran the include scripts under fresh
  // scope ids while the previous ids stayed in window.stx._scopes — ~4 orphans
  // per hop, unbounded, each retaining that scope's vars, signals and closures.
  //
  // The sweep is deliberately CONSERVATIVE — an over-eager delete is the #1737
  // failure (a scope removed from the registry cannot be recreated: its setup
  // IIFE ran once at page load), which is strictly worse than a leak. An entry
  // is dropped only when all three hold:
  //   1. the runtime actually bound it to an element (__el recorded),
  //   2. that element is no longer connected to the document, and
  //   3. neither it nor any ancestor is retained by a live conditional.
  // Entries with no __el (e.g. a scope whose element still sits inside untouched
  // <template> content, never inserted) are left alone — we can't prove they're
  // dead, and a later clone re-uses that registration.
  function sweepOrphanedScopes() {
    if (!window.stx || !window.stx._scopes) return;
    var scopes = window.stx._scopes;
    for (var id in scopes) {
      if (!Object.prototype.hasOwnProperty.call(scopes, id)) continue;
      var entry = scopes[id];
      if (!entry) continue;
      var el = entry.__el;
      if (!el || el.isConnected) continue;
      // Detached but RETAINED: :if toggles keep their element (bindIf re-inserts
      // the SAME node) and :if/:else chains keep their branches. Parent links
      // inside a detached subtree stay intact, so walking up from the scope
      // element still finds the conditional that owns it.
      var retained = false;
      for (var p = el; p; p = p.parentNode) {
        if (p.__stx_if_bound || p.__stx_chain_member) { retained = true; break; }
      }
      if (retained) continue;
      if (entry.__destroyCallbacks && Array.isArray(entry.__destroyCallbacks)) {
        for (var k = 0; k < entry.__destroyCallbacks.length; k++) {
          try { entry.__destroyCallbacks[k](); }
          catch (e) { console.warn('[stx] scope destroy error:', e); }
        }
      }
      delete scopes[id];
    }
  }

  // ==========================================================================
  // Post-hydration invariant sweep (stacksjs/stx#1773)
  // ==========================================================================
  //
  // Preserved moustaches are the framework's de-facto error UI: ANY failure in
  // the detect → extract → bundle → ship → rebind relay collapses into the same
  // visible symptom, literal {{ }} on screen. Eight separate fixes each patched
  // one site's heuristic, and no invariant anywhere asserted the actual
  // requirement — zero unhydrated scopes after hydration. So every new upstream
  // miss reached users silently and had to be diagnosed from a screenshot.
  //
  // This is that invariant. It runs at the end of both hydration entry points
  // and turns a silent miss into one loud, self-healing event:
  //
  //   - an element carrying data-stx-scope whose id isn't in the registry, or
  //     that hydration reached but never processed, is reported AND processed
  //     with the ambient scope, which is what the walk would have done had the
  //     script arrived. That recovers the D2/D3 shapes (a silent early return
  //     in the walk, a stale __stx_scope guard) rather than merely naming them.
  //   - leftover {{ }} text is reported. Diagnostic only, never auto-fixed:
  //     without a scope there is nothing to interpolate against, and a page may
  //     legitimately print moustaches.
  //
  // Deliberately quiet in the normal case: nothing is logged when the page has
  // no signals at all, and containers that legitimately show template syntax
  // (<pre>, <code>, <template>, <script>, <style>, <textarea>, and anything
  // under [data-stx-ignore]) are skipped.

  var AUDIT_SKIP_TAGS = { PRE: 1, CODE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, TEMPLATE: 1 };

  // Expressions whose evaluation threw a ReferenceError/TypeError and have not
  // since succeeded. evalAttrExpr swallows those two on purpose — a signal may
  // not exist yet on an effect's first pass — which is why a genuinely broken
  // binding produces no diagnostic at all today. The classic case is
  // :if="flag()" where flag is a signal: the auto-unwrap proxy returns the
  // VALUE, calling it throws TypeError, the directive suppresses it, and the
  // element silently stays hidden with no warning anywhere (see CLAUDE.md,
  // "Signals: scripts call, templates don't").
  //
  // Recording rather than warning immediately is what keeps this quiet on
  // working pages: a first-pass failure that later succeeds clears itself, so
  // only expressions still broken when hydration finishes are reported.
  var _exprFailures = {};
  var _exprFailureCount = 0;

  function noteExprFailure(expr, err) {
    if (_exprFailures[expr] !== undefined) return;
    // Bounded: one runaway loop must not grow this without limit.
    if (_exprFailureCount >= 50) return;
    _exprFailureCount++;
    _exprFailures[expr] = (err && err.message) ? err.message : String(err);
  }

  function noteExprSuccess(expr) {
    if (_exprFailures[expr] === undefined) return;
    delete _exprFailures[expr];
    _exprFailureCount--;
  }

  function auditSkipped(node) {
    // Not rendered, not audited. Covers <template> content (a detached
    // DocumentFragment — which some DOM implementations still walk into) and
    // :if branches parked off-document, neither of which the user can see.
    if (node.isConnected === false) return true;
    for (var p = node.parentNode; p; p = p.parentNode) {
      if (p.nodeType === Node.DOCUMENT_FRAGMENT_NODE) return true;
      if (p.nodeType !== Node.ELEMENT_NODE) continue;
      if (AUDIT_SKIP_TAGS[p.tagName]) return true;
      if (p.hasAttribute && p.hasAttribute('data-stx-ignore')) return true;
      // A :if whose deferred child-binding pass hasn't run yet legitimately holds
      // literal {{ }} that binds a macrotask later — not a hydration miss (#1773).
      if (p.__stx_if_pending) return true;
      // A deferred island (client=visible|idle|…) is unhydrated ON PURPOSE until
      // its trigger fires, so its {{ }} legitimately stay literal in the meantime
      // — not a miss (#1746). The stranded-scope pass already skips stx-hydrate;
      // the literal sweep must too.
      if (p.hasAttribute && p.hasAttribute('stx-hydrate') && !p.__stx_hydrated) return true;
    }
    return false;
  }

  function findLiteralMoustaches(root) {
    var found = [];
    if (!root || typeof document.createTreeWalker !== 'function') return found;
    // Read NodeFilter off window, not the bare global: in a real browser they
    // are the same object, but some DOM implementations used for testing expose
    // it only on window, and a bare reference then throws inside the audit.
    var showText = (window.NodeFilter && window.NodeFilter.SHOW_TEXT) || 4;
    var walker = document.createTreeWalker(root, showText, null);
    var node;
    while ((node = walker.nextNode())) {
      // Browsers expose Text.nodeValue as a string, while lightweight DOM and
      // native embedding shims can preserve an assigned number. Diagnostics
      // must normalize the boundary instead of aborting the entire audit on a
      // missing String#indexOf method.
      var text = node.nodeValue == null ? '' : String(node.nodeValue);
      if (text.indexOf('{{') === -1 || text.indexOf('}}') === -1) continue;
      if (auditSkipped(node)) continue;
      found.push(text.trim().slice(0, 80));
      if (found.length >= 5) break;
    }
    return found;
  }

  // A diagnostic that can break hydration is worse than no diagnostic, so the
  // whole sweep is wrapped and every DOM capability it uses is feature-checked.
  // Minimal document stubs (tests, non-browser embeddings) simply skip it.
  function auditHydration(container, phase) {
    try { auditHydrationUnsafe(container, phase); }
    catch (e) { console.warn('[stx] hydration audit skipped:', e && e.message ? e.message : e); }
  }

  function auditHydrationUnsafe(container, phase) {
    if (!window.stx || !window.stx._scopes) return;
    var root = container && typeof container.querySelectorAll === 'function' ? container : document.body;
    if (!root || typeof root.querySelectorAll !== 'function') return;

    // Unregistered / unprocessed scopes — the unambiguous failure, and the one
    // worth repairing.
    var stranded = [];
    root.querySelectorAll('[data-stx-scope]').forEach(function(el) {
      if (el.__stx_audit_recovered) return;
      // Deferred islands are unhydrated ON PURPOSE until their trigger fires.
      if (el.hasAttribute('stx-hydrate') || el.__stx_hydration_scheduled) return;
      var scopeId = el.getAttribute('data-stx-scope');
      var registered = window.stx._scopes[scopeId];
      if (registered && el.__stx_disposers) return;
      stranded.push({ el: el, id: scopeId, registered: !!registered });
    });

    if (stranded.length) {
      console.error(
        '[stx] hydration invariant failed after ' + phase + ': '
        + stranded.length + ' scope(s) left unhydrated — '
        + stranded.map(function(s) {
          return s.id + (s.registered ? ' (registered, never processed)' : ' (not registered)');
        }).join(', ')
        + '. Recovering with the ambient scope; please report with the page that produced it (stacksjs/stx#1773).',
      );
      stranded.forEach(function(s) {
        // Once per element: a repair that itself fails must not loop on the
        // next navigation.
        s.el.__stx_audit_recovered = true;
        try {
          var vars = s.registered ? window.stx._scopes[s.id] : null;
          if (vars) Object.assign(componentScope, vars);
          s.el.__stx_disposers = trackEffects(function() { processElement(s.el, componentScope); });
          s.el.removeAttribute('x-cloak');
          s.el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
        }
        catch (e) {
          console.error('[stx] hydration recovery failed for scope ' + s.id + ':', e);
        }
      });
    }

    var literals = findLiteralMoustaches(root);
    if (literals.length) {
      console.error(
        '[stx] hydration invariant failed after ' + phase + ': literal {{ }} left in the DOM — '
        + literals.join(' | ')
        + '. An expression did not bind; see stacksjs/stx#1773. Wrap intentional '
        + 'template syntax in <pre>/<code> or [data-stx-ignore] to exclude it.',
      );
    }

    // Expressions that threw and never recovered. Reported here rather than at
    // throw time so a first-pass miss that later resolves stays silent.
    var brokenExprs = [];
    for (var expr in _exprFailures) {
      if (Object.prototype.hasOwnProperty.call(_exprFailures, expr))
        brokenExprs.push(expr + ' → ' + _exprFailures[expr]);
    }
    if (brokenExprs.length) {
      var hint = brokenExprs.some(function(m) { return m.indexOf('is not a function') !== -1; })
        ? ' If one of these calls a signal, drop the parentheses: templates read '
          + 'a signal by bare name (:if="flag"), scripts call it (flag()). Calling '
          + 'the unwrapped value is a TypeError, which directives suppress — the '
          + 'element just stays hidden.'
        : '';
      console.error(
        '[stx] hydration invariant failed after ' + phase + ': '
        + brokenExprs.length + ' expression(s) never evaluated — '
        + brokenExprs.slice(0, 5).join(' | ') + '.' + hint,
      );
      _exprFailures = {};
      _exprFailureCount = 0;
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

    // 4. Reclaim entries the container walk can't see — components rendered
    // outside the swap container, or already detached before step 3 ran its
    // querySelectorAll. Without this the registry grew every navigation (#1775).
    sweepOrphanedScopes();
  }

  // Re-initialize components after SPA content swap.
  // Debounce to handle rapid re-fires (HMR triggers navigate which triggers stx:load again).
  var _stxLoadTimer = null;
  if (window.__stxLoadHandler) {
    window.removeEventListener('stx:load', window.__stxLoadHandler);
  }
  function stxLoadHandler() {
    if (_stxLoadTimer) { clearTimeout(_stxLoadTimer); }
    _stxLoadTimer = setTimeout(_handleStxLoad, 5);
  }
  window.__stxLoadHandler = stxLoadHandler;
  window.addEventListener('stx:load', stxLoadHandler);
  function _handleStxLoad() {
    _stxLoadTimer = null;
    console.log('[stx:load] START. mountQueue:', mountQueue.length, '_latestSetup:', !!window.stx._latestSetup);

    // Run any pending destroy callbacks before re-initializing
    destroyCallbacks.forEach(function(fn) {
      try { fn(); }
catch (e) { console.warn('[stx] destroy callback error:', e); }
    });
    destroyCallbacks.length = 0;

    // Re-process scoped components in new content
    var routerOpts = window.STX_ROUTER_OPTIONS || window.__stxRouterConfig || {};
    var container = document.querySelector('[data-stx-content]')
      || (routerOpts.container ? document.querySelector(routerOpts.container) : null)
      || document.querySelector('main')
      || document.querySelector('#main-content')
      || document.body;

    // Apply new page's SFC setup function. During SPA navigation, re-executed page
    // scripts set window.stx._latestSetup to the new setup function. This takes priority
    // over the stale data-stx attribute on body> (which has the PREVIOUS page's function name).
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
    var spaPageScopeSnapshot = { ...componentScope };

    // Routed component mount scripts execute after DOMContentLoaded. Queue them
    // until the destination page setup is active so projected props and parent
    // event handlers resolve against the caller, matching initial hydration.
    mountQueue.forEach(function(fn) { fn(); });
    mountQueue = [];

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
        // The init expression, which used to be dropped here. A scope
        // re-initialized with its data and none of its setup renders every
        // binding at its initial value and starts nothing - a live region
        // showing its empty state forever, which is indistinguishable from one
        // where nothing has happened yet.
        var xinit = el.getAttribute('data-stx-xinit');
        console.log('[stx:load] initializing x-data scope:', scopeId, xdata.substring(0, 40));
        window.__stx_reactive.initScope(el, xdata, [], {}, xinit || null);
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
      // Record the bound element for the orphan sweep (#1775) — see the
      // DOMContentLoaded walk above for the rationale.
      if (scopeVars) scopeVars.__el = el;
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
      el.__stx_parent_scope = el.__stx_parent_scope
        || resolveComponentCallerScope(el, spaPageScopeSnapshot);
      bindParentComponentProps(el, el.__stx_parent_scope);
      Object.assign(componentScope, scopeVars);
      if (el.__stx_disposers) return;
      var disposeEffects = trackEffects(function() { processElement(el, componentScope); });
      el.__stx_disposers = disposeEffects;
    });

    // Process the container content — bind {{ }}, :attr, @event directives.
    // Run synchronously (not in setTimeout) so componentScope is captured correctly.
    // The DOMContentLoaded path processes body> synchronously — the SPA path must match.
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
        runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
      }
    });

    // Flush global mountCallbacks (from scripts re-executed after SPA content swap)
    runMountCallbacks(mountCallbacks, destroyCallbacks);
    mountCallbacks.length = 0;

    // Everything that should have hydrated has now had its chance (#1773).
    auditHydration(container, 'stx:load');
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
    // Inactive chain members are owned by bindIfChain. Use explicit branch
    // state because an active nested branch can live under a detached outer
    // conditional while its reactive effects continue to run.
    if (el.__stx_chain_member && !el.__stx_chain_active) return;
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
    var mb = getModelBinding(el);
    if (mb) {
      bindModel(el, mb.expression, componentScope, mb.name);
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
