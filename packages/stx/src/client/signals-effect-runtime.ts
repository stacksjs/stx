/** Effects, batching, tracking, and signal utility helpers for the client runtime. */
export const SIGNALS_EFFECT_RUNTIME = `  // ==========================================================================
  // Effect
  // ==========================================================================

  function effect(fn, options = {}) {
    let cleanup;
    let isDisposed = false;

    const runEffect = () => {
      if (isDisposed) return;
      if (__stxDevtoolsTracking) { runEffect._runCount++; __stxDevtoolsStats.effectRuns++; }
      if (cleanup) {
        const pending = cleanup;
        cleanup = undefined;
        try { pending(); }
        catch (e) { console.error('[stx] effect cleanup error:', e); }
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
        //
        // Reported, never re-thrown. Re-thrown, it escaped the .set() that ran
        // this effect, and that set() stopped notifying everything after it:
        // a list half-rendered with raw {{ }} and no click handlers, a
        // selection that moved while the view it drives did not, and nothing
        // in the console, because the exception ended inside an event handler
        // or a native callback. One broken effect took the page with it.
        if (e instanceof ReferenceError) {
          // Silently dispose — this is expected during SPA navigation when
          // old effects fire against the new page's scope.
        } else {
          console.error('[stx] effect error (the effect is disposed):', e);
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
      // Idempotent. A removed :for row is disposed on removal, and the page
      // tracker that collected its effects on first render still holds the
      // same disposer, which cleanupContainer calls on SPA navigation (#1954).
      // Clearing cleanup before calling it stops that second call running it
      // twice.
      if (cleanup) {
        const pending = cleanup;
        cleanup = undefined;
        pending();
      }
    };
    // Auto-register with active tracker
    if (activeDisposers) activeDisposers.push(dispose);
    return dispose;
  }

  // ==========================================================================
  // Effect Tracking
  // ==========================================================================

  // Collect the effects made from now until the returned end() is called, which
  // hands back one disposer for all of them. trackEffects for code that cannot
  // be passed as a callback: a component's setup script is its own block, and
  // opens and closes the collection around its body.
  function beginEffects() {
    var parentDisposers = activeDisposers;
    var disposers = [];
    activeDisposers = disposers;
    return function endEffects() {
      activeDisposers = parentDisposers;
      if (parentDisposers) {
        disposers.forEach(function(d) { parentDisposers.push(d); });
      }
      return function disposeAll() {
        disposers.forEach(function(d) { try { d(); }
catch (e) { console.warn('[stx] dispose error:', e); } });
        disposers.length = 0;
      };
    };
  }

  function trackEffects(fn) {
    var endEffects = beginEffects();
    var disposeAll;
    try {
      fn();
    }
finally {
      disposeAll = endEffects();
    }
    return disposeAll;
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
    // finally: a throw inside fn left isBatching set for good, and every later
    // update was queued for a flush that never came - the page stopped.
    try {
      fn();
    }
    finally {
      isBatching = false;
      const queued = Array.from(pendingEffects);
      pendingEffects.clear();
      queued.forEach(e => e());
    }
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

  // Read a signal (or derived) without subscribing the effect running now: an
  // effect that calls untrack(count) does not run again when count changes.
  // Anything else is returned as it is.
  function untrack(v) {
    if (!(isSignal(v) || (typeof v === 'function' && v._isDerived))) return v;
    const prev = activeEffect;
    activeEffect = null;
    try {
      return v();
    }
finally {
      activeEffect = prev;
    }
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
`
