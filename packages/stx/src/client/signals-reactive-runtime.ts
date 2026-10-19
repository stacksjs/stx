/** Vue-compatible reactive helpers used by the generated client runtime. */
export const SIGNALS_REACTIVE_RUNTIME = `  // Vue-compat aliases
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
  var watchEffect = function(fn) { return effect(fn); };`
