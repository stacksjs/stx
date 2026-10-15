/** Deferred island hydration scheduling for the generated client runtime. */
export const SIGNALS_LAZY_HYDRATION_RUNTIME = `  // Lazy hydration: defer processElement for subtrees marked with stx-hydrate.
  // Triggers: "visible" (IntersectionObserver), "idle" (requestIdleCallback),
  // "interaction" (mouseenter/click/focus), "media:<query>" (matchMedia).
  function deferHydration(el, trigger, scope) {
    if (el.__stx_hydration_scheduled) return;
    el.__stx_hydration_scheduled = true;

    var run = function() {
      if (el.__stx_hydrated) return;
      el.__stx_hydrated = true;
      el.__stx_hydration_cancel = null; // trigger consumed — nothing left to cancel
      el.removeAttribute('stx-hydrate');
      var sid = el.getAttribute && el.getAttribute('data-stx-scope');

      // Everything downstream of the island setup running: merge the now-
      // registered scope, bind the subtree, flush onMount, announce hydration.
      // Factored out so the async chunked path can run it from a <script> load
      // event while the inline path runs it synchronously (#1746).
      var finishHydrate = function() {
        var effectiveScope = scope;
        if (sid) {
          var reg = window.stx._scopes ? window.stx._scopes[sid] : null;
          if (reg) effectiveScope = Object.assign({}, scope || {}, reg);
        }
        // Walk children and process them with the (now scope-merged) context
        Array.from(el.children).forEach(function(child) { processElement(child, effectiveScope); });
        // Also process the element itself (attributes/bindings on the host)
        processAttributesOnly(el, effectiveScope);
        // Fire this scope's onMount now that it has actually hydrated — the
        // initial mount pass deferred it for stx-hydrate scopes so onMount lands
        // on hydration, not at page load (#1746). Guarded by __mounted so it
        // never double-fires with the eager path.
        var sv = sid && window.stx._scopes ? window.stx._scopes[sid] : null;
        if (sv && sv.__mountCallbacks && !sv.__mounted) {
          sv.__mounted = true;
          runMountCallbacks(sv.__mountCallbacks, scopeDestroySink(sv));
        }
        window.dispatchEvent(new CustomEvent('stx:hydrated', { detail: { el: el, trigger: trigger } }));
      };

      // Island (#1746): the component's setup script was emitted inert
      // (type="stx/island") so the browser skipped it at parse. Run it now — it
      // registers the scope (signals + methods) AND runs any side-effectful
      // setup (e.g. a fetch in the <script client> body) at hydration time.
      var islandScript = sid ? document.querySelector('script[data-stx-island="' + sid + '"]') : null;
      if (islandScript && !islandScript.__stx_ran) {
        islandScript.__stx_ran = true;
        var chunkSrc = islandScript.getAttribute && islandScript.getAttribute('data-stx-src');
        if (chunkSrc) {
          // Chunked island (production build): the IIFE lives in a separate
          // file fetched only now. Load it via a real <script src> (CSP-clean —
          // no eval/new Function) and defer ALL downstream work to its load
          // event, since the scope isn't registered until the chunk executes.
          var s = document.createElement('script');
          s.src = chunkSrc;
          // Subresource Integrity (opt-in at build): pin the chunk's bytes.
          var integ = islandScript.getAttribute('data-stx-integrity');
          if (integ) s.integrity = integ;
          s.onload = finishHydrate;
          s.onerror = function() {
            // Network error / 404: the island can't become interactive. Log,
            // emit an observable event (analytics/monitoring can react), then
            // best-effort finish. The server-rendered HTML stays visible
            // (x-cloak was already removed on arming) — it just won't wire up.
            console.error('[stx] island chunk load failed:', sid, chunkSrc);
            window.dispatchEvent(new CustomEvent('stx:island-error', { detail: { el: el, scopeId: sid, src: chunkSrc } }));
            finishHydrate();
          };
          document.head.appendChild(s);
          return; // finishHydrate runs from the chunk's load event
        }
        // Inline island (dev / SSR / chunking off): execute synchronously.
        // eslint-disable-next-line no-new-func
        try { (new Function(islandScript.textContent))(); }
        catch (e) { console.error('[stx] island setup error:', sid, e); }
      }
      finishHydrate();
    };

    // Record how to cancel a still-pending trigger so SPA navigation can tear it
    // down — otherwise an unhydrated island's observer/timer/listener leaks and
    // may fire run() on a detached element after the page swapped (#1746).
    // Cleared once run() fires (it guards on __stx_hydrated anyway).
    if (trigger === 'idle') {
      if (typeof requestIdleCallback === 'function') {
        var idleId = requestIdleCallback(run, { timeout: 2000 });
        el.__stx_hydration_cancel = function() { if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId); };
      }
      else {
        var idleTimer = setTimeout(run, 200);
        el.__stx_hydration_cancel = function() { clearTimeout(idleTimer); };
      }
    }
    else if (trigger === 'visible') {
      if (typeof IntersectionObserver === 'function') {
        var io = new IntersectionObserver(function(entries) {
          entries.forEach(function(e) {
            if (e.isIntersecting) { io.disconnect(); run(); }
          });
        }, { rootMargin: '50px' });
        io.observe(el);
        el.__stx_hydration_cancel = function() { io.disconnect(); };
      } else {
        run(); // fallback: no IO support, hydrate immediately
      }
    }
    else if (trigger === 'interaction') {
      var events = ['mouseenter', 'click', 'focusin', 'touchstart'];
      var handler = function() {
        events.forEach(function(ev) { el.removeEventListener(ev, handler); });
        run();
      };
      events.forEach(function(ev) { el.addEventListener(ev, handler, { once: true, passive: true }); });
      el.__stx_hydration_cancel = function() { events.forEach(function(ev) { el.removeEventListener(ev, handler); }); };
    }
    else if (trigger && trigger.indexOf('media:') === 0) {
      var query = trigger.slice(6);
      var mql = window.matchMedia(query);
      if (mql.matches) run();
      else {
        var mqHandler = function(e) {
          if (e.matches) { mql.removeEventListener('change', mqHandler); run(); }
        };
        mql.addEventListener('change', mqHandler);
        el.__stx_hydration_cancel = function() { mql.removeEventListener('change', mqHandler); };
      }
    }
    else {
      // Unknown trigger — hydrate immediately
      run();
    }
  }
`
