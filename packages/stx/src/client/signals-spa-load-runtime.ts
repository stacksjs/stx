/** SPA content rehydration used by the generated client runtime. */
export const SIGNALS_SPA_LOAD_RUNTIME = `  function _handleStxLoad() {
    _stxLoadTimer = null;
    console.log('[stx:load] START. mountQueue:', mountQueue.length, '_latestSetup:', !!window.stx._latestSetup);

    // Run the outgoing page's destroy callbacks before re-initializing. Taken
    // out of their queue first, so one that registers another lands in the
    // next generation instead of being cleared unrun.
    var departing = departingDestroys !== null ? departingDestroys : destroyCallbacks.splice(0);
    departingDestroys = null;
    departing.forEach(function(fn) {
      try { fn(); }
catch (e) { console.warn('[stx] destroy callback error:', e); }
    });

    // Re-process scoped components in new content
    var routerOpts = window.STX_ROUTER_OPTIONS || window.__stxRouterConfig || {};
    var container = document.querySelector('[data-stx-content]')
      || (routerOpts.container ? document.querySelector(routerOpts.container) : null)
      || document.querySelector('main')
      || document.querySelector('#main-content')
      || document.body;

    // Apply new page's SFC setup function. During SPA navigation, re-executed page
    // scripts set window.stx._latestSetup to the new setup function. This takes priority
    // over the stale data-stx attribute on body> (which has the PREVIOUS page's function name).
    var usedLatestSetup = false;
    if (window.stx._latestSetup && typeof window.stx._latestSetup === 'function') {
      try {
        var setupResult = window.stx._latestSetup();
        // Keep _latestSetup for re-fires (HMR, auto-refresh re-navigation)
        // It will be overwritten when a NEW page's script sets it
        usedLatestSetup = true;
        if (typeof setupResult === 'object' && setupResult !== null) {
          console.log('[stx:load] _latestSetup keys:', Object.keys(setupResult).slice(0, 10));
          assignTemplateScope(componentScope, setupResult);
        }
      } catch (e) {
        console.error('[stx:load] _latestSetup error:', e);
        usedLatestSetup = true; // Don't fall back to stale data-stx
      }
    }
    console.log('[stx:load] usedLatestSetup:', usedLatestSetup, 'scope keys:', Object.keys(componentScope).slice(0, 10));

    // Only fall back to [data-stx] attribute lookup if _latestSetup wasn't available.
    // This handles the initial DOMContentLoaded-like case and pages that don't use _latestSetup.
    if (!usedLatestSetup) {
      document.querySelectorAll('[data-stx]').forEach(function(el) {
        var setupName = el.getAttribute('data-stx');
        if (setupName && window[setupName]) {
          var result = window[setupName]();
          if (typeof result === 'object') assignTemplateScope(componentScope, result);
        }
      });
    }
    var spaPageScopeSnapshot = mergeTemplateScopes(componentScope);

    // Routed component mount scripts execute after DOMContentLoaded. Queue them
    // until the destination page setup is active so projected props and parent
    // event handlers resolve against the caller, matching initial hydration.
    mountQueue.forEach(function(fn) { fn(); });
    mountQueue = [];

    // Initialize x-data scopes after SPA fragment swap.
    // On full page load, the reactive bridge <script> calls initScope(). But after SPA
    // navigation, only the HTML fragment is swapped — the bridge script isn't re-executed.
    // The server renames x-data → data-stx-xdata so we can read the state expression here.
    if (window.__stx_reactive && window.__stx_reactive.initScope) {
      container.querySelectorAll('[data-stx-xdata]').forEach(function(el) {
        var scopeId = el.getAttribute('data-stx-scope');
        // Skip if scope already registered (e.g. nav scope that persists across navigations)
        if (scopeId && window.stx._scopes && window.stx._scopes[scopeId]) return;
        var xdata = el.getAttribute('data-stx-xdata');
        if (!xdata) return;
        // Assign a scope ID if not already present
        if (!scopeId) {
          scopeId = '__stx_scope_spa_' + (++window.stx._scopeCounter);
          el.setAttribute('data-stx-scope', scopeId);
        }
        // The init expression, which used to be dropped here. A scope
        // re-initialized with its data and none of its setup renders every
        // binding at its initial value and starts nothing - a live region
        // showing its empty state forever, which is indistinguishable from one
        // where nothing has happened yet.
        var xinit = el.getAttribute('data-stx-xinit');
        console.log('[stx:load] initializing x-data scope:', scopeId, xdata.substring(0, 40));
        window.__stx_reactive.initScope(el, xdata, [], {}, xinit || null);
      });
    }

    // Apply scope from [data-stx-scope] elements and process them.
    // Walk document.body (not just container) so layout-level scopes dropped
    // by a full-body-swap SPA nav (e.g. nav/header/footer when the layout
    // group changes) get bound. The __stx_disposers guard makes the walk
    // idempotent — persistent layout scopes across same-layout navs are
    // skipped instead of double-disposed. See stacksjs/stx#1697.
    document.body.querySelectorAll('[data-stx-scope]').forEach(function(el) {
      var scopeId = el.getAttribute('data-stx-scope');
      var scopeVars = window.stx._scopes && window.stx._scopes[scopeId];
      // Record the bound element for the orphan sweep (#1775) — see the
      // DOMContentLoaded walk above for the rationale.
      if (scopeVars) scopeVars.__el = el;
      // Deferred island reached via SPA navigation (#1746): its setup script is
      // inert (type="stx/island"), so the scope isn't registered yet. Arm the
      // hydration trigger (deferHydration) instead of skipping it — mirrors the
      // initial-load DOMContentLoaded path, which has the same guard. Without
      // this, a client="visible|idle|…" island on a page reached by SPA nav
      // (inline OR chunked) never hydrates.
      if (!scopeVars && el.hasAttribute && el.hasAttribute('stx-hydrate')
        && !el.__stx_hydration_scheduled
        && document.querySelector('script[data-stx-island="' + scopeId + '"]')) {
        processElement(el, componentScope);
        el.removeAttribute('x-cloak');
        el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
        return;
      }
      if (!scopeVars) return;
      el.__stx_parent_scope = el.__stx_parent_scope
        || resolveComponentCallerScope(el, spaPageScopeSnapshot);
      bindParentComponentProps(el, el.__stx_parent_scope);
      // Already bound: a layout component that stayed on the page. Its
      // bindings are live and read its own scope, so there is nothing to
      // merge — and merging it AFTER the destination page's setup let a name
      // the two share take the component's value for the page. The offline
      // banner's connected flag read as a Settings card's "Connected".
      if (el.__stx_disposers) return;
      assignTemplateScope(componentScope, scopeVars);
      var disposeEffects = trackEffects(function() { processElement(el, componentScope); });
      el.__stx_disposers = disposeEffects;
      // A replacement layout's scope can live outside the router container.
      // Reveal it after binding, matching the initial hydration and mount paths.
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
    });

    // The page's own names win over its components' locals. The walk above
    // merges each component's locals into the scope the container is bound
    // with, so a component declaring a name the page also declares took it
    // over for the whole page: HQ's coach dashboard aliases store signals as
    // loading and roster, a card further down declares its own loading and
    // roster, and reached by the router the page's
    // :if="loading && !roster.length" read the card's and never cleared. A
    // full load binds the page before any component, so it never saw this.
    // A component's own bindings resolve its locals through its scope element,
    // and a name only a component declares stays reachable as before.
    assignTemplateScope(componentScope, spaPageScopeSnapshot);

    // Process the container content — bind {{ }}, :attr, @event directives.
    // Run synchronously (not in setTimeout) so componentScope is captured correctly.
    // The DOMContentLoaded path processes body> synchronously — the SPA path must match.
    console.log('[stx:load] container:', container.tagName, '__stx_scope:', !!container.__stx_scope, 'scope keys:', Object.keys(componentScope).slice(0, 10));
    if (!container.__stx_scope) {
      // Dispose previous effects on the container (from prior navigation)
      if (container.__stx_disposers && typeof container.__stx_disposers === 'function') {
        container.__stx_disposers();
      }
      console.log('[stx:load] processElement on container');
      var disposeEffects = trackEffects(function() { processElement(container, componentScope); });
      container.__stx_disposers = disposeEffects;
    } else {
      console.log('[stx:load] SKIPPED processElement — container has __stx_scope');
    }

    // Remove x-cloak
    container.removeAttribute('x-cloak');
    container.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });

    // Fire mount callbacks from scoped components. Walk document.body so
    // layout-level scopes added by a full-body swap mount; __mounted guard
    // prevents persistent layout scopes from re-firing their onMount on
    // every same-layout SPA nav. See stacksjs/stx#1697.
    document.body.querySelectorAll('[data-stx-scope]').forEach(function(el) {
      var scopeId = el.getAttribute('data-stx-scope');
      var scopeVars = window.stx._scopes && window.stx._scopes[scopeId];
      if (scopeVars && scopeVars.__mountCallbacks && !scopeVars.__mounted) {
        scopeVars.__mounted = true;
        runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
      }
    });

    // Flush global mountCallbacks (from scripts re-executed after SPA content swap)
    runMountCallbacks(mountCallbacks, destroyCallbacks);
    mountCallbacks.length = 0;

    // Everything that should have hydrated has now had its chance (#1773).
    auditHydration(container, 'stx:load');
  }
`
