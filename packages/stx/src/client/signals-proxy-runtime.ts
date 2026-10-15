/** Read and write proxies that preserve signal semantics in template scopes. */
export const SIGNALS_PROXY_RUNTIME = `  // ==========================================================================
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
`
