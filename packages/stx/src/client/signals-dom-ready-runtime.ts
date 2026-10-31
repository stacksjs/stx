/** DOM-ready initialization used by the generated client runtime. */
export const SIGNALS_DOM_READY_RUNTIME = `  // ==========================================================================
  // Auto-initialization
  // ==========================================================================

  // A dev runtime may be evaluated again by HMR, an embed, or a test harness.
  // Replace the previous listener so only the latest runtime closure can own
  // componentScope and reactive subscriptions.
  if (window.__stxDomReadyHandler) {
    document.removeEventListener('DOMContentLoaded', window.__stxDomReadyHandler);
  }
  const stxDomReadyHandler = () => {
    console.log('[stx] DOMContentLoaded fired — processing scopes');
    // Track which scoped elements have been processed
    const processedScopes = new Set();

    // Layout expansion can remove the data-stx marker from a page's first
    // element while leaving markers owned by the layout itself. The generated
    // page setup is still queued explicitly, so adopt it when its own marker
    // did not survive.
    const latestSetup = window.stx._latestSetup;
    const latestSetupName = typeof latestSetup === 'function' ? latestSetup.name : '';
    const hasLatestSetupMarker = latestSetupName && Array.from(document.querySelectorAll('[data-stx]'))
      .some(el => el.getAttribute('data-stx') === latestSetupName);
    if (latestSetup && !hasLatestSetupMarker) {
      try {
        const result = runPageSetup(latestSetup);
        if (typeof result === 'object' && result !== null)
          assignTemplateScope(componentScope, result);
      }
      catch (e) {
        console.error('[stx] initial setup error:', e);
      }
    }

    // Register page setup before mounting child components. Projected slot
    // content belongs to the caller, so child mounts need the caller's signals
    // available when they walk their own rendered roots.
    document.querySelectorAll('[data-stx]').forEach(el => {
      const setupName = el.getAttribute('data-stx');
      console.log('[DOMContentLoaded] data-stx:', setupName, 'el:', el.tagName, 'fn exists:', !!(setupName && window[setupName]));
      if (setupName && window[setupName]) {
        // Contained, like the two sibling setup call sites. An uncaught throw
        // here aborted the whole forEach and everything after it in this
        // handler, so ONE bad name in ONE page's setup left every root on the
        // page unhydrated — the user sees raw {{ }}, and the console names the
        // identifier without saying it cost them the document (#1805).
        try {
          const result = runPageSetup(window[setupName]);
          console.log('[DOMContentLoaded] setup returned:', result ? Object.keys(result).slice(0, 10) : 'null');
          if (typeof result === 'object' && result !== null) {
            assignTemplateScope(componentScope, result);
          }
        }
        catch (e) {
          console.error('[stx] page setup "' + setupName + '" threw; this root will not hydrate:', e);
        }
      }
    });
    var pageScopeSnapshot = mergeTemplateScopes(componentScope);

    /*
     * Any x-data scope the reactive bridge did not reach, initialized here.
     *
     * The bridge script addresses each scope by a selector it generated, and
     * that numbering restarts per render - so a page carrying three component
     * islands emits three scripts all looking for the same scope id, and two of
     * the three scopes are never initialized at all. The symptom is the
     * quietest one available: the markup is there, every binding shows its
     * initial value, and whatever x-init was meant to start never starts.
     *
     * Registered scopes are skipped, so the bridge stays authoritative where it
     * did run and this only picks up what it missed. The init expression is
     * read from data-stx-xinit, which the server preserves for exactly this.
     *
     * No backticks in this comment, deliberately: it lives inside the runtime
     * source that is embedded as a template literal, and one would end the
     * literal and take the whole file's syntax with it.
     */
    if (window.__stx_reactive && window.__stx_reactive.initScope) {
      document.querySelectorAll('[data-stx-xdata]').forEach(function(el) {
        var scopeId = el.getAttribute('data-stx-scope');
        if (scopeId && window.stx._scopes && window.stx._scopes[scopeId]) return;
        if (el.__stx_scope_initialized) return;

        var xdata = el.getAttribute('data-stx-xdata');
        if (!xdata) return;

        if (!scopeId) {
          scopeId = '__stx_scope_island_' + (++window.stx._scopeCounter);
          el.setAttribute('data-stx-scope', scopeId);
        }

        el.__stx_scope_initialized = true;

        try {
          window.__stx_reactive.initScope(el, xdata, [], {}, el.getAttribute('data-stx-xinit') || null);
        }
        catch (e) {
          console.error('[stx] island scope init error:', e);
        }
      });
    }

    // Process mount queue (from stx.mount() calls during loading) only after
    // caller setup is available for Vue-style projected slot ownership.
    mountQueue.forEach(function(fn) { fn(); });
    mountQueue = [];

    // A queued layout mount owns a separate $refs map and merges it into the
    // compatibility scope. Page useRef accessors already captured the page's
    // map during setup; bind its DOM back into that same map before onMount.
    // Keep the layout's other exposed names available for legacy bindings.
    componentScope.$refs = pageScopeSnapshot.$refs;
    __stxScopeGen++;

    // Bind page roots after child components have registered their local scope.
    document.querySelectorAll('[data-stx]').forEach(el => {
      console.log('[DOMContentLoaded] processElement on:', el.tagName, 'scope keys:', Object.keys(componentScope).slice(0, 10));
      var disposeEffects = trackEffects(function() {
        // The server's list when the page shipped one, the walk otherwise.
        if (!processFromManifest(el, componentScope, window.__stx_bindings)) processElement(el);
      });
      el.__stx_disposers = disposeEffects;

      // Remove x-cloak after bindings are applied (prevents FOUC)
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });

      // Refs inside a component scope (content projected into a layout shell,
      // for one) are attached when that scope hydrates, further down. A page
      // that has such scopes mounts after them, in the global flush below, so
      // an onMount reading a ref finds the element rather than null
      // (stacksjs/stx#2142). A page without any mounts here, as it always did.
      if (!el.querySelector('[data-stx-scope]')) runMountCallbacks(mountCallbacks, destroyCallbacks);
    });

    // Multi-root fragment fix: a no-body> setup page tags only the FIRST
    // top-level element with data-stx (signal-processing.ts marks one element),
    // so sibling root elements were orphaned — their :if / :for / {{ }} / x-text
    // never hydrated, which read as "{{ }} doesn't work under :if/:for". The
    // setup(s) above already populated the shared global componentScope, so
    // process each un-hydrated sibling root under that same scope — same signals,
    // so cross-root state stays coupled.
    var stxRoots = document.querySelectorAll('[data-stx]');
    if (stxRoots.length && Object.keys(componentScope).length) {
      var rootParent = stxRoots[0].parentNode;
      if (rootParent && rootParent.children) {
        Array.prototype.slice.call(rootParent.children).forEach(function(sib) {
          if (sib.nodeType !== 1) return;
          if (sib.hasAttribute('data-stx') || sib.hasAttribute('data-stx-scope')) return;
          if (sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE') return;
          if (sib.__stx_disposers) return; // already processed
          var disposeSib = trackEffects(function() { processElement(sib); });
          sib.__stx_disposers = disposeSib;
          sib.removeAttribute('x-cloak');
          sib.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
        });
      }
    }

    // Process scoped components FIRST (their scripts have already registered scope variables)
    var allScopes = document.querySelectorAll('[data-stx-scope]');
    console.log('[stx] found', allScopes.length, 'data-stx-scope elements');
    allScopes.forEach(el => {
      const scopeId = el.getAttribute('data-stx-scope');
      console.log('[stx] scope:', scopeId, 'registered:', !!(window.stx._scopes && window.stx._scopes[scopeId]), 'el:', el.tagName);
      processedScopes.add(el);

      const scopeVars = window.stx._scopes && window.stx._scopes[scopeId];
      // Record the element this scope is bound to so cleanupContainer can tell a
      // dead registry entry (element replaced by an SPA swap) from a live one.
      // See sweepOrphanedScopes / #1775.
      if (scopeVars) scopeVars.__el = el;

      // Deferred island (#1746): its setup script (type="stx/island") hasn't run
      // yet, so the scope isn't registered. Arm the hydration trigger anyway —
      // processElement sees stx-hydrate and defers; deferHydration's run()
      // executes the script (registering the scope + running side-effectful
      // setup like fetches) and binds on the trigger. Reveal the HTML now.
      var isDeferredIsland = !scopeVars && el.hasAttribute && el.hasAttribute('stx-hydrate')
        && !!document.querySelector('script[data-stx-island="' + scopeId + '"]');
      if (isDeferredIsland) {
        processElement(el);
        el.removeAttribute('x-cloak');
        el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
        return;
      }

      if (!scopeVars) return;

      // Forwarded props and events belong to the caller. Capture its scope
      // before this component's locals are merged, so identical child names
      // cannot shadow expressions such as :total-items="totalItems".
      el.__stx_parent_scope = el.__stx_parent_scope
        || resolveComponentCallerScope(el, pageScopeSnapshot);
      bindParentComponentProps(el, el.__stx_parent_scope);

      // Merge component scope vars into componentScope (don't restore - keep for head elements)
      // This ensures expressions can access component variables even for elements
      // where findElementScope might not work (e.g., cloned elements not yet in DOM)
      if (scopeVars) {
        componentScope = mergeTemplateScopes(componentScope, scopeVars);
      }

      console.log('[stx] calling processElement on scope:', scopeId, 'componentScope keys:', Object.keys(componentScope).length, 'scopeVars keys:', Object.keys(scopeVars).length);
      var disposeEffects = trackEffects(function() { processElement(el); });
      el.__stx_disposers = disposeEffects;
      console.log('[stx] scope processed OK:', scopeId);

      // Remove x-cloak after bindings are applied
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });

      // Run scope-specific mount callbacks (mark mounted so _handleStxLoad
      // doesn't re-fire onMount on persistent layout scopes — see #1697).
      // EXCEPT when this scope's hydration is deferred (stx-hydrate, e.g. a
      // client=visible|idle island, #1746): processElement above only SCHEDULED
      // the work, so onMount must fire when the trigger actually hydrates the
      // scope, not now. deferHydration's run() flushes it then.
      var scopeDeferred = el.hasAttribute && el.hasAttribute('stx-hydrate') && !el.__stx_hydrated;
      // A component behind a false :if is in the document's MARKUP but not in
      // the document: bindIf detached the subtree before this walk reached it,
      // while the component's own setup script already ran and queued its
      // onMount. Mounting it from here anyway is what made being mounted
      // unusable as an open state (stacksjs/stx#2036) -- three gated modal
      // shells each locked body scroll and registered an Escape handler before
      // anything had been opened, so the page could not be scrolled and Escape
      // reached whichever instance registered last.
      //
      // Left unmounted rather than mounted-and-torn-down, so hydrateComponentScopes
      // flushes it when bindIf shows the subtree -- the same deferral
      // stx-hydrate uses above, and the same flush an island gets.
      var scopeDetached = el.isConnected === false;
      if (scopeVars && scopeVars.__mountCallbacks && !scopeVars.__mounted && !scopeDeferred && !scopeDetached) {
        scopeVars.__mounted = true;
        runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
      }
    });

    // Run global mount callbacks (from partial <script client> blocks that call onMount)
    // These are pushed during script execution, before DOMContentLoaded
    console.log('[stx] running global mountCallbacks:', mountCallbacks.length);
    runMountCallbacks(mountCallbacks, destroyCallbacks);
    mountCallbacks.length = 0;

    // Auto-process elements with data-stx-auto (skip already processed scoped elements)
    document.querySelectorAll('[data-stx-auto]').forEach(el => {
      // Process element but skip children that are in scoped containers
      processElementSkipScopes(el, processedScopes);

      // Remove x-cloak after bindings are applied
      el.removeAttribute('x-cloak');
      el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
    });

    // Process head> elements (title, meta) that may contain {{ }} expressions
    // Use componentScope which now contains variables from processed components
    const headElements = document.querySelectorAll('head title, head meta[content]');
    headElements.forEach(el => {
      if (el.tagName === 'TITLE') {
        const text = el.textContent;
        if (text && text.includes('{{')) {
          effect(() => {
            try {
              let result = text;
              const matches = text.match(/\\{\\{\\s*(.+?)\\s*\\}\\}/g);
              if (matches) {
                matches.forEach(match => {
                  const expr = match.replace(/^\\{\\{\\s*|\\s*\\}\\}$/g, '');
                  const fn = __stxCompileScoped(componentScope, [], 'return ' + expr);
                  const value = fn(...__stxArgs(fn, componentScope));
                  result = result.replace(match, value != null ? value : '');
                });
              }
              el.textContent = result;
            }
catch (e) {
              if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Title expression error:', e);
            }
          });
        }
      }
else if (el.tagName === 'META') {
        const content = el.getAttribute('content');
        if (content && content.includes('{{')) {
          // Skip build-time placeholders like {{__TITLE__}}
          const hasOnlyPlaceholders = !content.replace(/\\{\\{\\s*__[A-Z_]+__\\s*\\}\\}/g, '').includes('{{');
          if (hasOnlyPlaceholders) return;
          effect(() => {
            try {
              let result = content;
              const matches = content.match(/\\{\\{\\s*(.+?)\\s*\\}\\}/g);
              if (matches) {
                matches.forEach(match => {
                  const expr = match.replace(/^\\{\\{\\s*|\\s*\\}\\}$/g, '');
                  if (/^__[A-Z_]+__$/.test(expr.trim())) return;
                  const fn = __stxCompileScoped(componentScope, [], 'return ' + expr);
                  const value = fn(...__stxArgs(fn, componentScope));
                  result = result.replace(match, value != null ? value : '');
                });
              }
              el.setAttribute('content', result);
            }
catch (e) {
              if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Meta expression error:', e);
            }
          });
        }
      }
    });

    // Everything that should have hydrated has now had its chance (#1773).
    auditHydration(document.body, 'DOMContentLoaded');
  };
  window.__stxDomReadyHandler = stxDomReadyHandler;
  console.log('[stx] registering DOMContentLoaded handler');
  document.addEventListener('DOMContentLoaded', stxDomReadyHandler);
`
