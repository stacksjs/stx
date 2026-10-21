/** Dynamic subtree hydration used by the generated client runtime. */
export const SIGNALS_HYDRATION_RUNTIME = `  // Hydrate a subtree inserted AFTER initial load — e.g. a streamed suspense
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
      assignTemplateScope(componentScope, scopeVars);
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
`
