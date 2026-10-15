/** Query and mutation composables used by the generated client runtime. */
export const SIGNALS_QUERY_RUNTIME = `  // ==========================================================================
  // Advanced Data Fetching (useQuery / useMutation)
  // ==========================================================================

  var _queryCache = {};
  // Requests currently in flight, keyed exactly like _queryCache. _queryCache
  // is written only after the body parses, so the whole in-flight window was a
  // cache miss and N components mounting together issued N identical requests
  // (#1869). Refcounted: a caller that loses interest must not cancel a
  // response another caller is still waiting on.
  var _queryInflight = {};
  var __stxQueryInstance = 0;

  // Suspense registry (#1742). A query created with { suspense: true } pushes
  // { el, loading, error } here at creation time (which runs during partial-scope
  // script execution, BEFORE the <Suspense> boundary inits on content-load).
  // Each boundary then CLAIMS the descendant entries for which it is the nearest
  // [data-stx-suspense] ancestor, and aggregates their loading/error signals.
  // Kept on the window (one registry per page) rather than a per-instance
  // closure so a boundary and the queries it claims agree even if the page
  // somehow has more than one runtime instance (e.g. across test files).
  function suspenseRegistry() {
    if (typeof window === 'undefined') return [];
    return window.__stx_suspense_registry || (window.__stx_suspense_registry = []);
  }
  function registerSuspense(loading, error) {
    var el = (typeof window !== 'undefined' && window.__STX_CURRENT_ELEMENT__) || null;
    suspenseRegistry().push({ el: el, loading: loading, error: error });
  }

  function useQuery(url, options) {
    options = options || {};
    var staleTime = options.staleTime || 0;
    var cacheTime = options.cacheTime || 300000; // 5 min default
    var cacheKey = options.cacheKey || (typeof url === 'function' ? null : url);
    // keep: the answer is kept on the device per account (setKeptScope, or
    // options.scope) and seeds the next visit synchronously, refreshed behind.
    // true keeps it under the query's key; a string names it.
    var keepKey = options.keep ? (typeof options.keep === 'string' ? options.keep : cacheKey) : null;
    var queryTarget = function() {
      var resolved = null;
      try { resolved = typeof url === 'function' ? url() : url; } catch (e) {}
      return { key: cacheKey || keepKey || resolved || '', url: resolved };
    };
    // What is shown is the last answer with the outbox's waiting writes on
    // top, so a change made offline is not undone by a refetch.
    var base = options.initialData || null;
    var seeded = keepKey ? __stxQueries.seed(keepKey, options.scope) : undefined;
    if (seeded) base = seeded.data;
    var data = state(seeded ? __stxQueries.overlay(queryTarget(), base) : base);
    var show = function(value) {
      base = value;
      data.set(__stxQueries.overlay(queryTarget(), value));
    };
    var answered = false;
    var loading = state(!seeded);
    // See useFetch: loading means "nothing to show yet", isFetching means "a
    // request is open" — including a background refresh, which is the case that
    // makes the distinction necessary (#1929).
    var isFetching = state(true);
    var error = state(null);
    var isStale = state(!!seeded);
    if (options.suspense) registerSuspense(loading, error);
    // Kept too large for a synchronous read: it arrives a moment later, and
    // shows unless an answer came first.
    if (keepKey && !seeded) {
      __stxQueries.restore(keepKey, options.scope).then(function(found) {
        if (!found || answered) return;
        show(found.data);
        loading.set(false);
        isStale.set(true);
      });
    }

    // Per-run AbortController: a newer run aborts the previous in-flight one and
    // onDestroy aborts the last, so a resolved request can't write into a
    // torn-down scope (#1871).
    var __stxAbort = null;
    // Identity, so dedup can tell "another component wants this key" from
    // "this component asked again". They must behave differently: joining is
    // right for the first, and wrong for the second — refetch() after a
    // mutation has to hit the network, not adopt the pre-mutation request that
    // happens to still be open (#1869).
    var __instanceId = ++__stxQueryInstance;
    // The shared entry this instance is currently attached to, so superseding
    // can release its claim without cancelling a request someone else joined.
    var __joined = null;

    // runOptions: { background: true } refreshes without touching loading or
    // clearing the current error. A poll must not flash a spinner over data
    // that is already on screen (#1929).
    var fetchData = async function(runOptions) {
      var background = !!(runOptions && runOptions.background);
      var resolvedUrl = typeof url === 'function' ? url() : url;
      if (!resolvedUrl) { if (!background) loading.set(false); isFetching.set(false); return; }
      var key = cacheKey || resolvedUrl;

      // Check cache
      var cached = _queryCache[key];
      if (cached && (Date.now() - cached.timestamp < staleTime)) {
        answered = true;
        show(cached.data);
        if (!background) loading.set(false);
        isFetching.set(false);
        isStale.set(false);
        if (options.onSuccess) options.onSuccess(cached.data);
        return;
      }

      // Stale-while-revalidate
      if (cached) {
        show(cached.data);
        isStale.set(true);
      }

      // Join a request ANOTHER instance already has open for this key. Not one
      // of our own: this instance calling refetch() means "I want fresh data",
      // and adopting its own pre-mutation request would silently return stale
      // data — so an own-instance run still supersedes, exactly as #1871 says.
      var shared = _queryInflight[key];
      if (shared && shared.owner !== __instanceId) {
        shared.refs++;
        __joined = shared;
        if (!background) loading.set(true);
        isFetching.set(true);
        if (!background) error.set(null);
        try {
          var joinedResult = await shared.promise;
          var joinedTransformed = options.transform ? options.transform(joinedResult) : joinedResult;
          answered = true;
          show(joinedTransformed);
          if (keepKey) __stxQueries.persist(keepKey, joinedTransformed, options.scope);
          if (background) error.set(null);
          isStale.set(false);
          if (options.onSuccess) options.onSuccess(joinedTransformed);
        }
        catch (e) {
          if (e && e.name === 'AbortError') return;
          error.set(e.message || 'Query failed');
          if (options.onError) options.onError(e);
        }
        finally {
          shared.refs--;
          if (__joined === shared) __joined = null;
          if (!background) loading.set(false);
          isFetching.set(false);
        }
        return;
      }

      // Superseding this instance's own run. Abort ONLY if nobody joined it —
      // cancelling a request another component is waiting on would leave it
      // loading forever, which would turn #1871's fix into a worse bug.
      if (__stxAbort) {
        if (__joined && __joined.refs > 1) __joined.refs--;
        else __stxAbort.abort();
      }
      __joined = null;
      __stxAbort = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var __signal = __stxAbort ? __stxAbort.signal : undefined;
      if (!background) loading.set(true);
      isFetching.set(true);
      if (!background) error.set(null);
      try {
        var fetchOpts = { method: 'GET', headers: { 'Content-Type': 'application/json', ...__stxHeaders(options.headers) }, signal: __signal };
        // Published BEFORE it is awaited, so a caller starting in the same tick
        // finds it. The network part only — transform, cache write and
        // onSuccess stay per-caller, since each may transform differently.
        var netPromise = (async function() {
          var response = await __stxFetch('useQuery', resolvedUrl, fetchOpts);
          if (!response.ok) throw await __stxHttpError(response);
          return await response.json();
        })();
        var entry = { owner: __instanceId, refs: 1, controller: __stxAbort, promise: netPromise };
        _queryInflight[key] = entry;
        __joined = entry;
        // Cleared on settle, both ways. A settled entry left behind would turn
        // dedup into a permanent cache and no request for this key would ever
        // be issued again.
        var releaseEntry = function() { if (_queryInflight[key] === entry) delete _queryInflight[key]; };
        netPromise.then(releaseEntry, releaseEntry);

        var result = await netPromise;
        if (__signal && __signal.aborted) return;
        var transformed = options.transform ? options.transform(result) : result;
        answered = true;
        show(transformed);
        if (keepKey) __stxQueries.persist(keepKey, transformed, options.scope);
        if (background) error.set(null);
        isStale.set(false);
        _queryCache[key] = { data: transformed, timestamp: Date.now() };
        if (options.onSuccess) options.onSuccess(transformed);
        // Schedule cache eviction
        setTimeout(function() { delete _queryCache[key]; }, cacheTime);
      }
catch (e) {
        // A superseded/unmounted request rejects with AbortError — expected;
        // the run that superseded it owns the state (#1871).
        if (e && e.name === 'AbortError') return;
        error.set(e.message || 'Query failed');
        if (options.onError) options.onError(e);
      }
finally {
        if (!__signal || !__signal.aborted) {
          if (!background) loading.set(false);
          isFetching.set(false);
        }
      }
    };

    // A refetch nobody asked for does not set loading (see backgroundRun below).
    var backgroundRun = { background: true };

    if (options.immediate !== false) {
      // Seeded from the device: the kept copy is on screen, so the first
      // fetch refreshes it behind rather than putting a spinner over it.
      onMount(function() { return seeded ? fetchData(backgroundRun) : fetchData(); });
    }

    // The worker has a newer answer for this URL, or the outbox changed: a
    // write waiting on it is shown on top, and one that reached the server
    // stays shown until the refetch it triggers includes it.
    var unwatch = __stxQueries.watch({
      target: queryTarget,
      updated: function() {
        delete _queryCache[cacheKey || queryTarget().url];
        fetchData(backgroundRun);
      },
      outbox: function(sent) {
        if (sent) {
          base = __stxQueries.overlay(queryTarget(), base, sent.id);
          delete _queryCache[cacheKey || queryTarget().url];
          fetchData(backgroundRun);
        }
        show(base);
      }
    });
    onDestroy(unwatch);

    // A refetch nobody asked for does not set loading. Both of these refresh
    // data that is ALREADY on screen, so driving the first-load state from them
    // put a spinner over a populated view once a minute, forever — the reason a
    // polling view could not use this composable at all (#1929). Bind
    // isFetching for a subtle in-flight indicator.

    // refetchOnFocus — removed on destroy, like refetchInterval right below.
    // It used to add a listener and never remove it, so every instance leaked
    // one for the life of the page and each SPA navigation added more; every
    // stale listener still fired, refetching for components long gone (#1818).
    if (options.refetchOnFocus) {
      var onVisibility = function() {
        if (!document.hidden) fetchData(backgroundRun);
      };
      document.addEventListener('visibilitychange', onVisibility);
      onDestroy(function() { document.removeEventListener('visibilitychange', onVisibility); });
    }

    // refetchInterval: poll only while the tab is visible and (if given)
    // enabled holds; optionally stop after an error so a broken endpoint is
    // not hammered every interval in a backgrounded tab (#1870).
    if (options.refetchInterval) {
      var intervalId = setInterval(function() {
        if (typeof document !== 'undefined' && document.hidden) return;
        var en = options.enabled;
        if (typeof en === 'function' ? !en() : en === false) return;
        var p = fetchData(backgroundRun);
        if (options.stopOnError && p && typeof p.then === 'function') {
          p.then(function() { if (error()) clearInterval(intervalId); });
        }
      }, options.refetchInterval);
      onDestroy(function() { clearInterval(intervalId); });
    }

    // Abort an in-flight request when the owning scope is destroyed (#1871).
    onDestroy(function() { if (__stxAbort) __stxAbort.abort(); });

    return {
      data: data,
      loading: loading,
      isFetching: isFetching,
      error: error,
      isStale: isStale,
      refetch: fetchData,
      invalidate: function(runOptions) {
        var key = cacheKey || (typeof url === 'function' ? url() : url);
        delete _queryCache[key];
        return fetchData(runOptions);
      }
    };
  }

  function useMutation(url, options) {
    options = options || {};
    var data = state(null);
    var loading = state(false);
    var error = state(null);

    var mutate = async function(body) {
      loading.set(true);
      error.set(null);
      var previousData = data();

      // Optimistic update
      if (options.optimisticData) {
        var optimistic = typeof options.optimisticData === 'function' ? options.optimisticData(body) : options.optimisticData;
        data.set(optimistic);
      }

      try {
        var resolvedUrl = typeof url === 'function' ? url() : url;
        var fetchOpts = {
          method: options.method || 'POST',
          // A file upload is a FormData body. Stringifying it sent "{}", and
          // the browser has to write its own multipart Content-Type (the
          // boundary lives there), so raw bodies pass through untouched.
          headers: __stxRawBody(body) ? __stxHeaders(options.headers) : { 'Content-Type': 'application/json', ...__stxHeaders(options.headers) },
          body: typeof body === 'string' || __stxRawBody(body) ? body : JSON.stringify(body)
        };
        var response = await __stxFetch('useMutation', resolvedUrl, fetchOpts);
        if (!response.ok) throw await __stxHttpError(response);
        var result = await response.json();
        var transformed = options.transform ? options.transform(result) : result;
        data.set(transformed);
        if (options.onSuccess) options.onSuccess(transformed);
        // Invalidate related queries
        if (options.invalidateQueries) {
          options.invalidateQueries.forEach(function(key) { delete _queryCache[key]; });
        }
        return transformed;
      }
catch (e) {
        error.set(e.message || 'Mutation failed');
        // Rollback optimistic update
        if (options.optimisticData) data.set(previousData);
        if (options.onError) options.onError(e);
        throw e;
      }
finally {
        loading.set(false);
      }
    };

    return {
      data: data,
      loading: loading,
      error: error,
      mutate: mutate,
      reset: function() { data.set(null); error.set(null); loading.set(false); }
    };
  }
`
