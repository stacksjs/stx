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

  function derived(compute) {
    let cached;
    let isDirty = true;
    const effects = new Set();

    // Passes a change on to what read this value. A signal's notification
    // collects through it (_stxCollect) instead of calling it, so an effect
    // reached both directly and through here still runs once.
    const markDirty = () => {
      if (!isDirty) {
        isDirty = true;
        notifySubscribers(effects);
      }
    };
    markDirty._stxCollect = (into) => {
      if (!isDirty) {
        isDirty = true;
        collectSubscribers(effects, into);
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
`
