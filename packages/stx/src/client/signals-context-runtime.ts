/** Computed helpers and component value sharing for the client runtime. */
export const SIGNALS_CONTEXT_RUNTIME = `  // ==========================================================================
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

  // watch(source, callback, options): the module watch's contract (Vue's).
  // source is a signal, a derived, a getter, a reactive object, or an array of
  // those. callback(next, previous, onCleanup) runs when the value changes
  // (Object.is; structurally with deep), not when the watch is created unless
  // immediate is set, and returns a stop function. once stops after the first
  // call. flush: 'post' (the default, as in the module) calls back after the
  // next render (nextTick), 'pre' on a microtask, 'sync' inside the change;
  // changes before a deferred call land as one, with the latest value. The
  // immediate first call is made at the same timing. The callback is
  // untracked: what it reads does not become something the watch follows, and
  // a callback that throws is reported without stopping the watch.
  //
  // It used to be $watch, which with a getter called back once with the getter
  // itself, and with a signal called back at once with no previous value and
  // again for every write, equal or not. $watch is kept as it was.
  function __stxWatchRead(s) {
    if (typeof s === 'function') return s();
    if (s && typeof s === 'object' && 'value' in s && !Array.isArray(s)) return s.value;
    return s;
  }
  function __stxWatchTraverse(value, seen) {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return value;
    seen.add(value);
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) __stxWatchTraverse(value[i], seen);
    }
    else if (value instanceof Map || value instanceof Set) {
      value.forEach(function(v) { __stxWatchTraverse(v, seen); });
    }
    else {
      for (var k in value) __stxWatchTraverse(value[k], seen);
    }
    return value;
  }
  // A copy to compare the next value with: plain objects, arrays, Maps, Sets
  // and Dates are copied, anything else (a DOM node, a class instance) is kept.
  function __stxWatchCopy(value, seen) {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return seen.get(value);
    var out;
    if (Array.isArray(value)) {
      out = [];
      seen.set(value, out);
      for (var i = 0; i < value.length; i++) out.push(__stxWatchCopy(value[i], seen));
      return out;
    }
    if (value instanceof Date) return new Date(value.getTime());
    if (value instanceof Map) {
      out = new Map();
      seen.set(value, out);
      value.forEach(function(v, k) { out.set(k, __stxWatchCopy(v, seen)); });
      return out;
    }
    if (value instanceof Set) {
      out = new Set();
      seen.set(value, out);
      value.forEach(function(v) { out.add(__stxWatchCopy(v, seen)); });
      return out;
    }
    var proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) return value;
    out = {};
    seen.set(value, out);
    for (var k in value) out[k] = __stxWatchCopy(value[k], seen);
    return out;
  }
  function __stxWatchEqual(a, b, seen) {
    if (Object.is(a, b)) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
    if (seen.has(a)) return seen.get(a) === b;
    seen.set(a, b);
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (a instanceof Date || b instanceof Date) return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
    if (a instanceof Map || b instanceof Map) {
      if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
      var same = true;
      a.forEach(function(v, k) { if (same && (!b.has(k) || !__stxWatchEqual(v, b.get(k), seen))) same = false; });
      return same;
    }
    if (a instanceof Set || b instanceof Set) {
      if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
      var all = true;
      a.forEach(function(v) { if (all && !b.has(v)) all = false; });
      return all;
    }
    var ka = Object.keys(a);
    var kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(b, ka[i]) || !__stxWatchEqual(a[ka[i]], b[ka[i]], seen)) return false;
    }
    return true;
  }

  function watch(source, callback, options) {
    options = options || {};
    var flush = options.flush || 'post';
    var multi = Array.isArray(source);
    var deep = !!options.deep;
    var getter;
    if (multi) getter = function() { return source.map(__stxWatchRead); };
    else if (typeof source === 'function') getter = source;
    else if (source && typeof source === 'object' && 'value' in source) getter = function() { return source.value; };
    else if (source && typeof source === 'object') {
      // A reactive object: what changes is inside it, so it is watched deeply.
      getter = function() { return source; };
      deep = options.deep !== false;
    }
    else {
      console.warn('[stx] watch() needs a signal, a getter, a reactive object or an array of those; got', source);
      getter = function() { return source; };
    }

    var oldValue;
    var first = true;
    var stopped = false;
    var cleanup;
    var queued = false;
    var forceNext = false;
    var latest;

    function snapshot(value) {
      return deep ? __stxWatchCopy(value, new Map()) : (multi ? value.slice() : value);
    }
    function changed(next, prev) {
      if (deep) return !__stxWatchEqual(next, prev, new Map());
      if (multi) {
        if (!prev || prev.length !== next.length) return true;
        for (var i = 0; i < next.length; i++) if (!Object.is(next[i], prev[i])) return true;
        return false;
      }
      return !Object.is(next, prev);
    }
    function onCleanup(fn) { cleanup = fn; }
    function fire(next) {
      var prev = oldValue;
      oldValue = snapshot(next);
      if (cleanup) {
        var pending = cleanup;
        cleanup = undefined;
        try { pending(); }
        catch (e) { console.error('[stx] watch cleanup error:', e); }
      }
      peek(function() {
        try { callback(next, prev, onCleanup); }
        catch (e) { console.error('[stx] watch callback error:', e); }
      });
      if (options.once) stop();
    }
    function job() {
      queued = false;
      var force = forceNext;
      forceNext = false;
      if (stopped || (!force && !changed(latest, oldValue))) return;
      fire(latest);
    }
    function schedule(next) {
      latest = next;
      if (queued) return;
      queued = true;
      if (flush === 'post') nextTick(job);
      else Promise.resolve().then(job);
    }

    var dispose = effect(function() {
      var next = getter();
      if (deep) __stxWatchTraverse(next, new Set());
      if (stopped) return;
      if (first) {
        first = false;
        if (!options.immediate) oldValue = snapshot(next);
        else if (flush === 'sync') fire(next);
        else {
          forceNext = true;
          schedule(next);
        }
        return;
      }
      if (flush !== 'sync') schedule(next);
      else if (changed(next, oldValue)) fire(next);
    });

    // once with immediate stops inside the first run, before dispose exists.
    if (stopped) dispose();

    function stop() {
      if (stopped) return;
      stopped = true;
      if (dispose) dispose();
      if (cleanup) {
        var pending = cleanup;
        cleanup = undefined;
        try { pending(); }
        catch (e) { console.error('[stx] watch cleanup error:', e); }
      }
    }
    return stop;
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
`
