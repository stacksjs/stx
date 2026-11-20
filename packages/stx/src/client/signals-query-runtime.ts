/** Query and mutation composables used by the generated client runtime. */
import { MUTATION_RESPONSE_CONTENT_TYPE } from '../mutation-response'

export const SIGNALS_QUERY_RUNTIME = `  // ==========================================================================
  // Advanced Data Fetching (useQuery / useMutation)
  // ==========================================================================

  var _queryCache = new Map();
  var _queryInflight = new Map();
  var _activeQueries = new Set();
  var _queryWrites = new Map();

  function evictQuery(key) {
    var cached = _queryCache.get(key);
    if (cached) clearTimeout(cached.timer);
    _queryCache.delete(key);
  }

  function cacheQueryResult(key, result, cacheTime) {
    if (cacheTime <= 0) return;
    evictQuery(key);
    var cached = { data: result, timestamp: Date.now(), timer: null };
    cached.timer = setTimeout(function() {
      if (_queryCache.get(key) === cached) _queryCache.delete(key);
    }, cacheTime);
    _queryCache.set(key, cached);
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
        if (_queryInflight.get(key) === entry) cacheQueryResult(key, result, cacheTime);
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

  function beginQueryWrite(keys) {
    var write = {};
    keys.forEach(function(key) {
      var writes = _queryWrites.get(key);
      if (!writes) _queryWrites.set(key, writes = { count: 0, latest: null });
      writes.count++;
      writes.latest = write;
    });
    return write;
  }

  function finishQueryWrite(keys) {
    keys.forEach(function(key) {
      var writes = _queryWrites.get(key);
      if (--writes.count === 0) _queryWrites.delete(key);
    });
  }

  function refreshActiveQueries(keys, queries, write) {
    var snapshots = new Map();
    keys.forEach(function(key) {
      evictQuery(key);
      // A read started before the mutation cannot satisfy revalidation.
      _queryInflight.delete(key);
      // A response from an earlier overlapping write may carry an older
      // snapshot. A fresh read still accounts for that write reaching the server.
      if (queries && _queryWrites.get(key).latest === write && Object.hasOwn(queries, key))
        snapshots.set(key, { data: queries[key], cached: false });
    });
    batch(function() {
      Array.from(_activeQueries).forEach(function(query) {
        var key = query.key();
        if (!keys.has(key)) return;
        query.refresh(snapshots.get(key)).catch(function(error) {
          console.error('[stx] query refresh error:', error);
        });
      });
    });
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
      refresh: function(snapshot) {
        return fetchData({ background: hasValue }, snapshot);
      }
    };

    var fetchData = async function(runOptions, snapshot) {
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
        var cached = snapshot ? undefined : _queryCache.get(key);
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

        var rawResult;
        if (snapshot) {
          rawResult = snapshot.data;
          if (!snapshot.cached && cacheTime > 0) {
            cacheQueryResult(key, rawResult, cacheTime);
            snapshot.cached = true;
          }
        } else {
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
          rawResult = await entry.promise;
        }
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
      refetch: function(runOptions) { return fetchData(runOptions); },
      invalidate: invalidate
    };
  }

  function useMutation(url, options) {
    options = options || {};
    var data = state(null);
    var loading = state(false);
    var error = state(null);
    var nextId = 0;
    var committedId = 0;
    var committed = null;
    var pending = new Map();

    function publish() {
      var visible = committed;
      pending.forEach(function(entry, id) {
        if (id > committedId && entry.optimistic) visible = entry.value;
      });
      data.set(visible);
      loading.set(pending.size > 0);
    }

    var mutate = async function(body) {
      if (!pending.size) committed = peek(data);
      var id = ++nextId;
      var entry = { optimistic: false, value: undefined };
      pending.set(id, entry);
      var keys = new Set(options.invalidateQueries || []);
      var write = beginQueryWrite(keys);

      try {
        batch(function() {
          loading.set(true);
          error.set(null);
        });
        if (options.optimisticData !== undefined) {
          entry.value = typeof options.optimisticData === 'function' ? options.optimisticData(body) : options.optimisticData;
          entry.optimistic = true;
          if (pending.has(id)) batch(publish);
        }
        var resolvedUrl = typeof url === 'function' ? url() : url;
        var fetchOpts = {
          method: options.method || 'POST',
          // FormData owns its multipart content type and boundary.
          headers: __stxRawBody(body) ? __stxHeaders(options.headers) : { 'Content-Type': 'application/json', ...__stxHeaders(options.headers) },
          body: typeof body === 'string' || __stxRawBody(body) ? body : JSON.stringify(body)
        };
        var response = await __stxFetch('useMutation', resolvedUrl, fetchOpts);
        if (!response.ok) throw await __stxHttpError(response);
        var contentType = response.headers.get('content-type');
        var result = await response.json();
        var queries;
        if (contentType && contentType.split(';')[0].trim().toLowerCase() === ${JSON.stringify(MUTATION_RESPONSE_CONTENT_TYPE)}) {
          if (!result || !Object.hasOwn(result, 'data') || !result.queries || typeof result.queries !== 'object' || Array.isArray(result.queries))
            throw new Error('Invalid stx mutation response');
          queries = result.queries;
          result = result.data;
        }
        var transformed = options.transform ? options.transform(result) : result;
        if (pending.has(id)) batch(function() {
          if (id > committedId) {
            committedId = id;
            committed = transformed;
          }
          if (id === nextId) {
            error.set(null);
          }
          pending.delete(id);
          publish();
        });
        if (keys.size) refreshActiveQueries(keys, queries, write);
        if (options.onSuccess) options.onSuccess(transformed);
        return transformed;
      } catch (failure) {
        var cause = failure instanceof Error ? failure : new Error(String(failure));
        if (pending.delete(id)) batch(function() {
          if (id === nextId) {
            error.set(cause.message || 'Mutation failed');
          }
          publish();
        });
        if (options.onError) options.onError(cause);
        throw failure;
      } finally {
        finishQueryWrite(keys);
      }
    };

    return {
      data: data,
      loading: loading,
      error: error,
      mutate: mutate,
      reset: function() {
        pending.clear();
        committed = null;
        batch(function() {
          publish();
          error.set(null);
        });
      }
    };
  }
`
