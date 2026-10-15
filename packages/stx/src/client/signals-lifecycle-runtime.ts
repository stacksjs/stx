/** Lifecycle queues and scope-aware hook ownership for the client runtime. */
export const SIGNALS_LIFECYCLE_RUNTIME = `  // ==========================================================================
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
      // Kept apart from the queue, which a flush drains: a component behind an
      // :if mounts again every time it is shown (see suspendSubtreeScopes).
      scope.__mountHooks = scope.__mountHooks || [];
      scope.__mountHooks.push(fn);
      return;
    }
    mountCallbacks.push(fn);
  }

  // Where an onDestroy called from inside a running mount callback belongs:
  // the queue runMountCallbacks is parking cleanups on, which is the mounting
  // component's own. Null outside a flush.
  //
  // Without it such a call, typically a composable like useEventListener
  // invoked in onMount, found no current element and went to the global
  // queue, and every stx:load drains that queue. A component that stays on
  // the page across navigations (one the layout renders) lost the listener at
  // the first navigation while its markup stayed bound (#1958).
  var activeDestroySink = null;

  function onDestroy(fn) {
    var scope = currentLifecycleScope();
    if (scope) {
      scope.__destroyCallbacks = scope.__destroyCallbacks || [];
      scope.__destroyCallbacks.push(fn);
      // Registered once, at setup, and owed at every unmount -- including each
      // time an :if hides the component (see suspendSubtreeScopes).
      scope.__destroyHooks = scope.__destroyHooks || [];
      scope.__destroyHooks.push(fn);
      return;
    }
    if (activeDestroySink) {
      activeDestroySink.push(fn);
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
    // An onDestroy registered while the batch runs joins the same queue as a
    // returned cleanup. Saved and restored, so a mount that mounts something
    // else (stx.mount inside onMount) hands the outer sink back afterwards.
    var previousSink = activeDestroySink;
    activeDestroySink = target;
    try {
      for (var i = 0; i < batch.length; i++) {
        try {
          var cleanup = batch[i]();
          if (typeof cleanup === 'function') target.push(cleanup);
        }
        catch (e) { console.error('[stx] onMount error:', e); }
      }
    }
    finally {
      activeDestroySink = previousSink;
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
`
