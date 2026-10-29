/** Client-side navigation, route params, and search params runtime. */
export const SIGNALS_NAVIGATION_RUNTIME = `  // ==========================================================================
  // Navigation API
  // ==========================================================================

  // Second argument is an options object: { replace, reload, instant }.
  //
  // It used to be a bare forceReload boolean while the shipped declaration
  // promised { replace?: boolean } — so the one call the type system invited,
  // navigate(url, { replace: true }), took the truthy branch and did a full
  // document load that PUSHED a history entry: the opposite of replace, at the
  // cost of the SPA router, with no error (#1807).
  //
  // A bare boolean is still accepted and still means "full reload", because
  // that was the real shipped behaviour and docs and examples contain it.
  function navigate(url, options) {
    var opts = (options && typeof options === 'object') ? options : { reload: !!options };
    var replace = !!opts.replace;
    var reload = !!(opts.reload || opts.forceReload);
    if (!reload && window.stxRouter && typeof window.stxRouter.navigate === 'function') {
      var routed = { replace: replace };
      if (opts.instant) routed.instant = true;
      window.stxRouter.navigate(url, routed);
      return;
    }
    var destination = { url: url };
    window.dispatchEvent(new CustomEvent('stx:before-navigate', { detail: destination }));
    if (typeof destination.url === 'string') url = destination.url;
    if (replace) window.location.replace(url);
    else window.location.href = url;
  }

  // Re-run the CURRENT route against the server and swap the result, keeping
  // every client signal on the page alive.
  //
  // The router grew refresh()/invalidate() for this, but they lived only on
  // window.stxRouter — nothing in the authoring surface reached them, so a
  // <script client> block still had no way to say "the mutation changed what
  // the server rendered". Apps kept calling location.reload() and threw away
  // the state the SPA exists to preserve. See #1850.
  //
  // Degrades to a real reload when the router is absent (a page that never
  // booted it, or a mid-boot call), mirroring how navigate() falls through to
  // window.location.
  function refresh() {
    if (window.stxRouter && typeof window.stxRouter.refresh === 'function')
      return window.stxRouter.refresh();
    window.location.reload();
    return Promise.resolve(false);
  }

  // Expire a cached route so the NEXT visit re-fetches it, without navigating
  // now. Pairs with refresh(): refresh the page you are on, invalidate the ones
  // your mutation also changed.
  function invalidateRoute(url) {
    if (window.stxRouter && typeof window.stxRouter.invalidate === 'function')
      window.stxRouter.invalidate(url);
  }

  function goBack() { window.history.back(); }
  function goForward() { window.history.forward(); }

  // Route params — set by server injection or parsed from URL on client navigation
  var _routeParams = state({});

  // setRouteParams: called by the server-injected script to set initial params
  function setRouteParams(params) {
    var nextParams = params || {};
    _routeParams.set(nextParams);
    window.__stx_rp = nextParams;
    if (window.stx) window.stx._rp = nextParams;
  }

  // Listen for SPA navigation to update params
  window.addEventListener('stx:navigate', function(e) {
    // The destination fragment's data-stx-route-params script runs after this
    // event and before stx:load. Reset first so a static route can never inherit
    // params from the dynamic route that preceded it.
    var nextParams = e.detail
      && Object.prototype.hasOwnProperty.call(e.detail, 'params')
      ? e.detail.params
      : {};
    setRouteParams(nextParams);
  });

  // Apply any server-injected params (set before runtime loaded)
  if ((window.stx && window.stx._rp) || window.__stx_rp) {
    _routeParams.set(window.stx?._rp || window.__stx_rp);
  }

  function useRoute() {
    return {
      get path() { return window.location.pathname; },
      get fullPath() { return window.location.pathname + window.location.search + window.location.hash; },
      get hash() { return window.location.hash; },
      get query() {
        var params = {};
        new URLSearchParams(window.location.search).forEach(function(v, k) { params[k] = v; });
        return params;
      },
      get params() { return _routeParams(); }
    };
  }

  // Exported from src/runtime.ts, whose whole stated purpose is client-facing
  // APIs that hide window internals — but never published on window.stx, so a
  // client script importing them destructured undefined and threw on use. The
  // capability was always here behind useRoute().params; only the documented
  // names were unreachable (stacksjs/stx#1843).
  function useRouteParams() {
    return _routeParams();
  }

  function useRouteParam(name, fallback) {
    var value = _routeParams()[name];
    return value === undefined ? fallback : value;
  }

  function keptHistoryState(wasPushed) {
    var current = window.history.state;
    if (!current || typeof current !== 'object') return wasPushed ? { __stxPushed: true } : {};
    var copy = {};
    for (var key in current) copy[key] = current[key];
    return copy;
  }
  function useSearchParams() {
    var params = state(Object.fromEntries(new URLSearchParams(window.location.search)));
    var syncFromUrl = function() {
      params.set(Object.fromEntries(new URLSearchParams(window.location.search)));
    };
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('stx:navigate', syncFromUrl);
    // Own-property reads only. The backing object comes from Object.fromEntries,
    // so it inherits Object.prototype — an unguarded params()[key] returned a
    // FUNCTION for 'toString', 'constructor', 'valueOf' and friends, which is
    // neither a string nor undefined and matches no declared return type.
    var own = function(key) {
      var current = params();
      return Object.prototype.hasOwnProperty.call(current, key);
    };
    // pushState by default; replaceState when the caller asks for it (#1825).
    //
    // The canonical reason to delete a param is to CONSUME a one-shot value —
    // an OAuth callback result, ?checkout=success, a flash token — and the
    // point of consuming it is that it must not survive a Back press. Under
    // pushState the pre-delete URL, the one still carrying the param, becomes
    // the previous entry, so Back replays the callback and whatever consuming
    // it triggered runs again.
    //
    // Default stays pushState so nothing that works today changes, and the
    // option is spelled { replace } to match navigate(), which already takes it.
    var commit = function(url, options) {
      // A plain truthy read of the replace property looks equivalent and is
      // not: it asks whether the value HAS a replace property, and every string
      // has String.prototype.replace — so delete(key, 'push') would have
      // replaced, the exact opposite of what it reads as. Requiring an object
      // also keeps this identical to the module implementation in
      // composables/use-router.ts; with optional chaining alone the two
      // disagreed on the empty string, which short-circuits in one and hits
      // String.prototype.replace in the other.
      //
      // NB: no backticks anywhere in this block. This runtime is assembled as a
      // template literal, so a backtick in a COMMENT ends the string and the
      // rest of the runtime is parsed as code.
      var replace = !!(options && typeof options === 'object' && options.replace);
      // Pushed entries are marked as the router marks them, and a replaced
      // one stays what it was, so Back knows whether it stays in the app.
      var wasPushed = !!(window.history.state && window.history.state.__stxPushed);
      // A replaced entry keeps the state it had: the router's scroll token,
      // its depth and tab are in there, and an entry stripped of them was
      // restored to the top on Back and miscounted by the tab bar.
      if (replace)
        window.history.replaceState(keptHistoryState(wasPushed), '', url);
      else
        window.history.pushState({ __stxPushed: true }, '', url);
      syncFromUrl();
    };
    return {
      data: params,
      get: function(key) { return own(key) ? params()[key] : undefined; },
      has: own,
      set: function(key, value, options) {
        var url = new URL(window.location.href);
        url.searchParams.set(key, value);
        commit(url, options);
      },
      // delete and has were DECLARED but absent, so the compiler endorsed calls
      // that threw in the browser; setAll and data were present but undeclared
      // (#1806). Deleting writes history the same way set does, for consistency.
      'delete': function(key, options) {
        var url = new URL(window.location.href);
        url.searchParams['delete'](key);
        commit(url, options);
      },
      setAll: function(obj, options) {
        var url = new URL(window.location.href);
        Object.keys(obj).forEach(function(k) { url.searchParams.set(k, obj[k]); });
        commit(url, options);
      }
    };
  }
`
