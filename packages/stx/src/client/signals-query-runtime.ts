/** Query and mutation composables used by the generated client runtime. */
export const SIGNALS_QUERY_RUNTIME = `  // ==========================================================================
  // Advanced Data Fetching (useQuery / useMutation)
  // ==========================================================================

  var _queryCache = new Map();
  var _queryInflight = new Map();
  var _activeQueries = new Set();

  function evictQuery(key) {
    var cached = _queryCache.get(key);
    if (cached) clearTimeout(cached.timer);
    _queryCache.delete(key);
  }

  function startQuery(key, url, headers, cacheTime) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var entry = { key: key, controller: controller, refs: 0, settled: false };
    _queryInflight.set(key, entry);
    entry.promise = (async function() {
      try {
        var response = await __stxFetch('useQuery', url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...__stxHeaders(headers) },
          signal: controller ? controller.signal : undefined
        });
        if (!response.ok) throw await __stxHttpError(response);
        var result = await response.json();
        // Only the newest request for a key can publish to the shared cache.
        // Older requests may still have consumers and settle independently.
        if (_queryInflight.get(key) === entry && cacheTime > 0) {
          evictQuery(key);
          var cached = { data: result, timestamp: Date.now(), timer: null };
          cached.timer = setTimeout(function() {
            if (_queryCache.get(key) === cached) _queryCache.delete(key);
          }, cacheTime);
          _queryCache.set(key, cached);
        }
        return result;
      } finally {
        entry.settled = true;
        if (_queryInflight.get(key) === entry) _queryInflight.delete(key);
      }
    })();
    return entry;
  }

  function releaseQuery(run) {
    if (!run || !run.entry) return;
    var entry = run.entry;
    run.entry = null;
    if (--entry.refs !== 0 || entry.settled) return;
    if (_queryInflight.get(entry.key) === entry) _queryInflight.delete(entry.key);
    if (entry.controller) entry.controller.abort();
  }

  function refreshActiveQueries(keys) {
    var invalidated = new Set(keys);
    invalidated.forEach(function(key) {
      evictQuery(key);
      // A read started before the mutation cannot satisfy revalidation.
      _queryInflight.delete(key);
    });
    Array.from(_activeQueries).forEach(function(query) {
      if (!invalidated.has(query.key())) return;
      query.refresh().catch(function(error) {
        console.error('[stx] query refresh error:', error);
      });
    });
  }

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
    var cacheTime = options.cacheTime ?? 300000; // 5 min default
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
    var base = options.initialData ?? null;
    var seeded = keepKey ? __stxQueries.seed(keepKey, options.scope) : undefined;
    if (seeded) base = seeded.data;
    var data = state(seeded ? __stxQueries.overlay(queryTarget(), base) : base);
    var show = function(value) {
      base = value;
      data.set(__stxQueries.overlay(queryTarget(), value));
    };
    var answered = false;
    var hasValue = !!seeded || options.initialData !== undefined;
    var disposed = false;
    var loading = state(options.immediate !== false && !hasValue);
    // See useFetch: loading means "nothing to show yet", isFetching means "a
    // request is open" — including a background refresh, which is the case that
    // makes the distinction necessary (#1929).
    var isFetching = state(options.immediate !== false);
    var error = state(null);
    var isStale = state(!!seeded);
    if (options.suspense) registerSuspense(loading, error);
    // Kept too large for a synchronous read: it arrives a moment later, and
    // shows unless an answer came first.
    if (keepKey && !seeded) {
      __stxQueries.restore(keepKey, options.scope).then(function(found) {
        if (!found || answered || disposed) return;
        hasValue = true;
        show(found.data);
        loading.set(false);
        isStale.set(true);
      });
    }

    var currentRun = null;
    var subscriber = {
      key: function() {
        var target = queryTarget();
        return target.url ? (cacheKey || target.url) : null;
      },
      refresh: function() {
        return fetchData({ background: hasValue });
      }
    };

    var fetchData = async function(runOptions) {
      if (disposed) return;
      var background = !!(runOptions && runOptions.background);
      var previous = currentRun;
      var run = { entry: null };
      currentRun = run;
      // A refetch cannot rejoin the request it is meant to supersede.
      var previousEntry = previous && previous.entry;
      releaseQuery(previous);
      if (currentRun !== run) return;

      try {
        var resolvedUrl = typeof url === 'function' ? url() : url;
        if (currentRun !== run) return;
        if (!resolvedUrl) {
          _activeQueries.delete(subscriber);
          return;
        }
        _activeQueries.add(subscriber);
        var key = cacheKey || resolvedUrl;
        var cached = _queryCache.get(key);
        var transform = function(value) {
          return options.transform ? options.transform(value) : value;
        };
        if (cached) {
          var cachedResult = transform(cached.data);
          if (currentRun !== run) return;
          hasValue = true;
          show(cachedResult);
          if (currentRun !== run) return;
          if (Date.now() - cached.timestamp < staleTime) {
            answered = true;
            error.set(null);
            isStale.set(false);
            if (options.onSuccess) options.onSuccess(cachedResult);
            return;
          }
          isStale.set(true);
        }

        var entry = _queryInflight.get(key);
        if (!entry || entry === previousEntry) entry = startQuery(key, resolvedUrl, options.headers, cacheTime);
        run.entry = entry;
        entry.refs++;
        batch(function() {
          if (!background) {
            loading.set(true);
            error.set(null);
          }
          isFetching.set(true);
        });
        var rawResult = await entry.promise;
        if (currentRun !== run) return;
        var result = transform(rawResult);
        if (currentRun !== run) return;
        answered = true;
        hasValue = true;
        batch(function() {
          show(result);
          error.set(null);
          isStale.set(false);
        });
        if (currentRun !== run) return;
        if (keepKey) __stxQueries.persist(keepKey, result, options.scope);
        if (options.onSuccess) options.onSuccess(result);
      } catch (e) {
        if (currentRun !== run || (e && e.name === 'AbortError')) return;
        error.set(e && e.message || 'Query failed');
        if (options.onError) options.onError(e);
      } finally {
        releaseQuery(run);
        if (currentRun === run) {
          currentRun = null;
          batch(function() {
            loading.set(false);
            isFetching.set(false);
          });
        }
      }
    };

    function invalidate(runOptions) {
      var key = subscriber.key();
      if (key !== null) {
        evictQuery(key);
        _queryInflight.delete(key);
      }
      return fetchData(runOptions);
    }

    // A refetch nobody asked for does not set loading (see backgroundRun below).
    var backgroundRun = { background: true };

    onMount(function() {
      disposed = false;
      if (options.immediate !== false) return fetchData(hasValue ? backgroundRun : undefined);
    });

    // The worker has a newer answer for this URL, or the outbox changed: a
    // write waiting on it is shown on top, and one that reached the server
    // stays shown until the refetch it triggers includes it.
    var unwatch = __stxQueries.watch({
      target: queryTarget,
      updated: function() {
        evictQuery(cacheKey || queryTarget().url);
        fetchData(backgroundRun);
      },
      outbox: function(sent) {
        if (sent) {
          base = __stxQueries.overlay(queryTarget(), base, sent.id);
          evictQuery(cacheKey || queryTarget().url);
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

    onDestroy(function() {
      disposed = true;
      _activeQueries.delete(subscriber);
      releaseQuery(currentRun);
      currentRun = null;
    });

    return {
      data: data,
      loading: loading,
      isFetching: isFetching,
      error: error,
      isStale: isStale,
      refetch: fetchData,
      invalidate: invalidate
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
        if (options.invalidateQueries) refreshActiveQueries(options.invalidateQueries);
        if (options.onSuccess) options.onSuccess(transformed);
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
