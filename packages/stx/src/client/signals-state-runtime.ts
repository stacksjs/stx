/** State and derived primitives embedded in the browser signals runtime. */
export const SIGNALS_STATE_RUNTIME = `  // ==========================================================================
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
        subscribers.forEach(cb => {
          try { cb(value, prev); }
          catch (e) { console.error('[stx] subscriber error:', e); }
        });
        notifySubscribers(effects);
      }
    };

    signal.update = (fn) => signal.set(fn(value));
    // Notify as if the value changed, for an array or object mutated in place.
    // set() cannot do it: the value is the same reference, so Object.is skips.
    signal.trigger = () => {
      subscribers.forEach(cb => {
        try { cb(value, value); }
        catch (e) { console.error('[stx] subscriber error:', e); }
      });
      notifySubscribers(effects);
    };
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

  // derived(compute, { equals }): with equals, a change upstream recomputes
  // the value at once (when anything reads it) and passes the change on only
  // when equals(previous, next) is false, so an effect over
  // derived(() => user().id) does not run again for a new user object with the
  // same id. Without it the value is lazy and every upstream change is passed
  // on, as before. memo(compute, equals) is the short form.
  function derived(compute, options) {
    let cached;
    let isDirty = true;
    let hasValue = false;
    const effects = new Set();
    const equals = options && typeof options.equals === 'function' ? options.equals : null;

    function recompute() {
      const prev = activeEffect;
      activeEffect = markDirty;
      effectStack.push(markDirty);
      try {
        cached = compute();
        hasValue = true;
      }
finally {
        effectStack.pop();
        activeEffect = prev;
      }
      isDirty = false;
    }

    // Recompute now and say whether the value changed. A compute that throws
    // counts as a change: the reader recomputes and sees the error.
    function changedNow() {
      const before = cached;
      const had = hasValue;
      try { recompute(); }
      catch (e) { isDirty = true; return true; }
      return !had || !equals(before, cached);
    }

    // Passes a change on to what read this value. A signal's notification
    // collects through it (_stxCollect) instead of calling it, so an effect
    // reached both directly and through here still runs once.
    const markDirty = () => {
      if (isDirty) return;
      if (equals && effects.size) {
        if (changedNow()) notifySubscribers(effects);
        return;
      }
      isDirty = true;
      notifySubscribers(effects);
    };
    markDirty._stxCollect = (into) => {
      if (isDirty) return;
      if (equals && effects.size) {
        if (changedNow()) collectSubscribers(effects, into);
        return;
      }
      isDirty = true;
      collectSubscribers(effects, into);
    };

    const signal = () => {
      if (activeEffect) effects.add(activeEffect);
      if (isDirty) recompute();
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

  // A derived value that passes a change on only when it is a different value
  // (Object.is, or the equals given).
  function memo(compute, equals) {
    return derived(compute, { equals: typeof equals === 'function' ? equals : Object.is });
  }
`
