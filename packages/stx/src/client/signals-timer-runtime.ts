/** Timer and utility composables used by the generated client runtime. */
export const SIGNALS_TIMER_RUNTIME = `  // ==========================================================================
  // Timer & Utility Composables
  // ==========================================================================

  // Native bridge access and readiness live here so templates need no browser globals.
  function useNativeDesktop() {
    var get = function() { return window.craft || null; };
    get.onReady = function(callback) {
      var disposed = false;
      var delivered = false;
      var run = function() {
        if (disposed || delivered || !get()) return;
        delivered = true;
        window.removeEventListener('craft:ready', run);
        callback(get());
      };
      var stop = function() {
        disposed = true;
        window.removeEventListener('craft:ready', run);
      };
      window.addEventListener('craft:ready', run);
      onMount(run);
      onDestroy(stop);
      return stop;
    };
    return get;
  }

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

  // VueUse-compatible alias; both names use the same callback contract.
  var useDebounceFn = useDebounce;

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

  // VueUse-compatible alias; keep the existing value-ref shape.
  var refDebounced = useDebouncedValue;

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

  var useThrottleFn = useThrottle;

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

  var useTimeoutFn = useTimeout;

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
`
