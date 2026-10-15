/** Scope and effect disposal used by the generated client runtime. */
export const SIGNALS_SCOPE_DISPOSAL_RUNTIME = `  // ==========================================================================
  // Scope Disposal
  // ==========================================================================

  // Walk a subtree (root + descendants) and fire each [data-stx-scope]'s
  // destroy callbacks + remove the entry from window.stx._scopes. Pre-fix
  // (stacksjs/stx#1727) only cleanupContainer (called during SPA navigation)
  // ran this walk, so dynamic unmounts driven by :if/:for leaked scopes
  // indefinitely. Now bindIf, bindFor, and cleanupContainer all funnel
  // through this helper so the cleanup is symmetric regardless of who
  // initiated the removal.
  // Dispose the EFFECTS bound inside a subtree leaving the page for good: a
  // removed :for row, a hidden template :if clone, a hidden :for empty
  // placeholder, or a container on SPA navigation (#1954).
  // disposeSubtreeScopes only releases scope registrations. Without this, the
  // effects that bound the subtree stay subscribed to every signal they read
  // and keep running, so work per update grows with every removal.
  // Descendants first, then the root, the order cleanupContainer always used.
  function disposeSubtreeEffects(root) {
    if (!root) return;
    var nodes = stxHost.descendants(root);
    nodes.push(root);
    var owned = ['__stx_disposers', '__stx_effect_disposers', '__stx_if_disposers', '__stx_chain_disposers'];
    for (var n = 0; n < nodes.length; n++) {
      var el = nodes[n];
      if (typeof el.__stx_hydration_cancel === 'function') {
        try { el.__stx_hydration_cancel(); } catch (e) { /* noop */ }
        el.__stx_hydration_cancel = null;
      }
      if (Array.isArray(el.__stx_destroy)) {
        var hooks = el.__stx_destroy;
        el.__stx_destroy = null;
        hooks.forEach(function(fn) {
          try { fn(); }
          catch (e) { console.warn('[stx] destroy hook error:', e); }
        });
      }
      if (el.__stx_detached_if) {
        var detached = el.__stx_detached_if;
        el.__stx_detached_if = null;
        detached.forEach(function(node) { disposeSubtreeEffects(node); });
      }
      for (var k = 0; k < owned.length; k++) {
        var disposeOwned = el[owned[k]];
        if (typeof disposeOwned === 'function') {
          el[owned[k]] = null;
          disposeOwned();
        }
      }
    }
  }

  // :if is a toggle, and a component inside one lives through every toggle:
  // its scope is registered once and kept (#1737), and showing the branch puts
  // the same markup back. Its LIFECYCLE follows the toggle, though. Hiding runs
  // what the component registered to release -- its onDestroy, and whatever
  // its onMount handed back -- and showing it again runs its onMount again.
  // Each show is a mount and each hide an unmount, which is the pairing every
  // component on a page already gets.
  //
  // Before this, a hidden component never heard about it and a re-shown one
  // was never told it was back (the asymmetry stacksjs/stx#2036 stopped short
  // of). A gated modal shell -- one that traps focus, locks body scroll and
  // claims Escape from onMount, and releases them in onDestroy -- did all of
  // that on its first opening and on no later one: the second time it opened
  // with the page scrolling behind it and Escape doing nothing.
  //
  // Only scopes that actually mounted are suspended, so a component whose
  // first mount is still deferred (behind a false :if, or an stx-hydrate
  // island) keeps waiting for its own flush.
  function suspendSubtreeScopes(nodes) {
    if (!nodes || !window.stx || !window.stx._scopes) return;
    var ids = [];
    for (var i = 0; i < nodes.length; i++) {
      var found = stxHost.scopesIn(nodes[i]);
      for (var k = 0; k < found.length; k++) {
        if (ids.indexOf(found[k]) === -1) ids.push(found[k]);
      }
    }
    // Innermost first, the order a page unmounts in: a child releases what it
    // holds before the component it sits in does.
    for (var n = ids.length - 1; n >= 0; n--) {
      var scopeVars = window.stx._scopes[ids[n]];
      if (!scopeVars || !scopeVars.__mounted) continue;
      scopeVars.__mounted = false;
      scopeVars.__suspended = true;
      var release = scopeVars.__destroyCallbacks || [];
      // What onDestroy registered at setup is owed again at the next hide;
      // a cleanup a mount handed back belonged to that mount alone.
      scopeVars.__destroyCallbacks = (scopeVars.__destroyHooks || []).slice();
      for (var j = 0; j < release.length; j++) {
        try { release[j](); }
        catch (e) { console.warn('[stx] scope destroy error:', e); }
      }
      scopeVars.__mountCallbacks = (scopeVars.__mountHooks || []).slice();
    }
  }

  // The other half: a suspended scope whose markup is back on the page mounts
  // again. A scope still off the page (hidden by an :if of its own inside this
  // branch) is left for that :if to resume.
  function resumeSubtreeScopes(nodes) {
    if (!nodes || !window.stx || !window.stx._scopes) return;
    for (var i = 0; i < nodes.length; i++) {
      var ids = stxHost.scopesIn(nodes[i]);
      for (var k = 0; k < ids.length; k++) {
        var scopeVars = window.stx._scopes[ids[k]];
        if (!scopeVars || scopeVars.__mounted || !scopeVars.__suspended) continue;
        if (scopeVars.__el && scopeVars.__el.isConnected === false) continue;
        scopeVars.__suspended = false;
        scopeVars.__mounted = true;
        runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
      }
    }
  }

  function disposeSubtreeScopes(root) {
    if (!root || !window.stx || !window.stx._scopes) return;
    // The host reports which scopes live in this subtree: the document finds
    // them with a selector, a native host reads the map it keeps as it builds
    // views (#1984).
    var scopeIds = stxHost.scopesIn(root);
    for (var n = 0; n < scopeIds.length; n++) {
      var scopeId = scopeIds[n];
      if (!scopeId) continue;
      var scopeVars = window.stx._scopes[scopeId];
      if (!scopeVars) continue;
      // Hidden by an :if, it already released everything on the way out;
      // running the hooks again would unmount it twice. (A hidden component's
      // root is detached, so no walk reaches it today; this keeps the next
      // disposal path that does from unmounting it twice.)
      var alreadyReleased = scopeVars.__suspended && !scopeVars.__mounted;
      if (!alreadyReleased && scopeVars.__destroyCallbacks && Array.isArray(scopeVars.__destroyCallbacks)) {
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
  // Since #1958 a same-layout navigation no longer re-runs the layout's
  // component scripts, and a layout change cleans up the whole body first, so
  // navigation should no longer produce the first shape; the sweep stays for
  // the second, and as the backstop for anything that still does.
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
      // Suspended by an :if: released when it hid, so not again here.
      if (!(entry.__suspended && !entry.__mounted) && entry.__destroyCallbacks && Array.isArray(entry.__destroyCallbacks)) {
        for (var k = 0; k < entry.__destroyCallbacks.length; k++) {
          try { entry.__destroyCallbacks[k](); }
          catch (e) { console.warn('[stx] scope destroy error:', e); }
        }
      }
      delete scopes[id];
    }
  }
`
