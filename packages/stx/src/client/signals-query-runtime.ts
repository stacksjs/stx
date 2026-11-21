/** Query and mutation composables used by the generated client runtime. */
import { MUTATION_RESPONSE_CONTENT_TYPE } from '../mutation-response'

export const SIGNALS_QUERY_RUNTIME = `  // ==========================================================================
  // Advanced Data Fetching (useQuery / useMutation)
  // ==========================================================================

  var _queryCache = new Map();
  var _queryInflight = new Map();
  var _activeQueries = new Set();
  var _queryWrites = new Map();
  var _offlineRefreshes = new Map();

  function evictQuery(key) {
    var cached = _queryCache.get(key);
    if (cached) clearTimeout(cached.timer);
    _queryCache.delete(key);
  }

  function cacheQueryResult(key, group, result, cacheTime) {
    if (cacheTime <= 0) return;
    evictQuery(key);
    var cached = { group: group, data: result, timestamp: Date.now(), timer: null };
    cached.timer = setTimeout(function() {
      if (_queryCache.get(key) === cached) _queryCache.delete(key);
    }, cacheTime);
    _queryCache.set(key, cached);
  }

  function evictQueryGroup(group) {
    _queryCache.forEach(function(entry, key) { if (entry.group === group) evictQuery(key); });
    // Reads started before invalidation cannot satisfy revalidation.
    _queryInflight.forEach(function(entry, key) { if (entry.group === group) _queryInflight.delete(key); });
  }

  function startQuery(key, selection, cacheTime, controller, prepared) {
    var group = selection.key;
    var entry = { key: key, group: group, controller: controller, refs: 0, settled: false };
    _queryInflight.set(key, entry);
    entry.promise = (async function() {
      try {
        var init = {
          method: 'GET',
          headers: { ...selection.headers },
          signal: controller ? controller.signal : undefined
        };
        var response = await __stxFetch('useQuery', selection.url, init, prepared);
        entry.reusable = canReuseDataResponse(response, prepared ? prepared.options : init);
        if (!entry.reusable && _queryInflight.get(key) === entry) evictQuery(key);
        if (!response.ok) throw await __stxHttpError(response);
        var result = await response.json();
        // Only the latest request for an identity may update its shared cache.
        if (entry.reusable && _queryInflight.get(key) === entry) cacheQueryResult(key, group, result, cacheTime);
        return result;
      } finally {
        entry.latest = _queryInflight.get(key) === entry;
        entry.settled = true;
        if (entry.latest) _queryInflight.delete(key);
      }
    })();
    return entry;
  }

  function releaseQuery(run) {
    if (!run) return;
    if (run.preparing) {
      var preparing = run.preparing;
      run.preparing = null;
      preparing.abort();
    }
    if (!run.entry) return;
    var entry = run.entry;
    run.entry = null;
    if (--entry.refs !== 0 || entry.settled) return;
    if (_queryInflight.get(entry.key) === entry) _queryInflight.delete(entry.key);
    if (entry.controller) entry.controller.abort();
  }

  function beginQueryWrite(keys) {
    var write = { scope: peek(queryScope) };
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

  function refreshActiveQueries(keys, queries, write, callbacks, extra) {
    var active = new Map();
    var snapshotTargets = new Map();
    keys.forEach(evictQueryGroup);
    _activeQueries.forEach(function(query) {
      var target = query.target();
      if (!target || !keys.has(target.key)) return;
      var identity = query.identity();
      active.set(query, { target: target, identity: identity });
      if (!write || target.scope !== write.scope) return;
      if (!snapshotTargets.has(target.key)) snapshotTargets.set(target.key, identity);
      else if (snapshotTargets.get(target.key) !== identity) snapshotTargets.set(target.key, null);
    });
    if (extra) extra.forEach(function(item, query) { active.set(query, item); });

    var snapshots = new Map();
    var pending = [];
    batch(function() {
      active.forEach(function(item, query) {
        var target = item.target;
        var key = target.key;
        var snapshot;
        // An unnamed header variant or an ambiguous key needs its own GET.
        if (queries && target.scope === write.scope
          && (target.named || (!target.customHeaders && !__stxFetchHooks.onRequest))
          && snapshotTargets.get(key) === item.identity
          && _queryWrites.get(key).latest === write && Object.hasOwn(queries, key)) {
          snapshot = snapshots.get(key);
          if (!snapshot) snapshots.set(key, snapshot = { data: queries[key], cached: false });
        }
        pending.push(query.refresh(snapshot, target, callbacks, item).catch(function(error) {
          console.error('[stx] query refresh error:', error);
        }));
      });
    });
    return Promise.all(pending);
  }

  function queueOfflineRefresh(query, target) {
    var key = target.key;
    if (!key || !target.url) return;
    var pending = _offlineRefreshes.get(key);
    if (!pending) {
      _offlineRefreshes.set(key, pending = new Map());
      queueMicrotask(function() {
        _offlineRefreshes.delete(key);
        pending.forEach(function(item, subscriber) {
          if (subscriber.target() !== item.target) pending.delete(subscriber);
        });
        if (pending.size) refreshActiveQueries(new Set([key]), null, null, null, pending);
      });
    }
    pending.set(query, { target: target, runOptions: { background: true } });
  }

  function useQuery(url, options) {
    options = options || {};
    var staleTime = options.staleTime || 0;
    var cacheTime = options.cacheTime ?? 300000;
    var immediate = options.immediate !== false;
    var readEnabled = function() {
      return typeof options.enabled === 'function' ? !!options.enabled() : options.enabled !== false;
    };
    var readTarget = function() {
      try {
        var resolved = typeof url === 'function' ? url() : url;
        var scope = options.scope === undefined ? queryScope() : options.scope;
        var source = __stxHeaders(options.headers);
        var supplied = new Headers(source);
        var headers = typeof source.entries === 'function' || Array.isArray(source)
          ? Object.fromEntries(supplied)
          : { ...source };
        var customHeaders = !supplied.keys().next().done;
        if (!supplied.has('Content-Type')) {
          supplied.set('Content-Type', 'application/json');
          headers['Content-Type'] = 'application/json';
        }
        var key = options.cacheKey || resolved;
        return {
          key: key,
          url: resolved,
          headers: headers,
          scope: scope,
          identity: JSON.stringify([key, resolved, Array.from(supplied), { scope: scope }]),
          named: !!options.cacheKey,
          customHeaders: customHeaders,
        };
      } catch (error) {
        return { failure: error instanceof Error ? error : new Error(String(error)) };
      }
    };
    var target = peek(readTarget);
    var initialUrl = target.url;
    var enabled = peek(readEnabled);
    var transform = function(value) { return options.transform ? options.transform(value) : value; };
    var hydrated = readHydratedData(options.key, options.hydrate !== false, transform);
    var skipInitial = !!hydrated && !options.revalidateOnMount;
    var mounted = false;
    var started = !!hydrated;
    var disposed = false;
    var currentRun = null;
    var latestRun = null;
    var reusable = true;
    var effectiveIdentity;
    var stopSelection;
    var stopOffline;
    var intervalId;
    var onVisibility;

    function storageKey(selection) {
      if (!options.keep || !selection.url) return null;
      // Explicit names describe one representation. Default persistence only
      // uses a URL for unvaried requests and never writes headers to storage.
      if (typeof options.keep === 'string' || options.cacheKey) {
        if (selection.url !== initialUrl) return null;
        return typeof options.keep === 'string' ? options.keep : options.cacheKey;
      }
      return !selection.customHeaders ? selection.url : null;
    }

    function overlayTarget() {
      return { key: options.cacheKey || storageKey(target) || target.url || '', url: target.url };
    }

    var base = hydrated ? hydrated.data : (options.initialData ?? null);
    var keepKey = storageKey(target);
    var seeded = !hydrated && keepKey ? __stxQueries.seed(keepKey, target.scope) : undefined;
    if (seeded) base = seeded.data;
    var answered = !!hydrated;
    var hasValue = (hydrated ? !hydrated.error : options.initialData !== undefined) || !!seeded;
    var data = state(seeded ? __stxQueries.overlay(overlayTarget(), base) : base);
    var loading = state(enabled && immediate && !skipInitial && !hasValue);
    var isFetching = state(enabled && immediate && !skipInitial);
    var error = state(hydrated && hydrated.error ? hydrated.error.message : null);
    var isStale = state(!!seeded);
    if (options.suspense) registerSuspense(loading, error);

    function show(value) {
      base = value;
      data.set(__stxQueries.overlay(overlayTarget(), value));
    }

    function restoreKept(selection, key) {
      if (!key) return;
      __stxQueries.restore(key, selection.scope).then(function(found) {
        if (!found || answered || disposed || target !== selection) return;
        hasValue = true;
        batch(function() {
          show(found.data);
          loading.set(false);
          isStale.set(true);
        });
      });
    }
    if (!seeded && !hydrated) restoreKept(target, keepKey);

    var subscriber = {
      target: function() { return enabled && target.url ? target : null; },
      identity: function() { return effectiveIdentity || target.identity; },
      refresh: async function(snapshot, selection, callbacks, item) {
        if ((enabled || item.manual) && target === selection)
          await fetchData(item.runOptions || { background: hasValue }, snapshot, selection, callbacks);
      }
    };
    if (enabled && hydrated && target.url) _activeQueries.add(subscriber);

    function cancel() {
      var previous = currentRun;
      currentRun = latestRun = null;
      releaseQuery(previous);
    }

    function select(next) {
      if (next.identity === target.identity && next.failure?.message === target.failure?.message) return false;
      target = next;
      effectiveIdentity = undefined;
      reusable = true;
      skipInitial = false;
      var previous = currentRun;
      currentRun = latestRun = null;
      var key = storageKey(next);
      var saved = key ? __stxQueries.seed(key, next.scope) : undefined;
      answered = false;
      hasValue = !!saved;
      batch(function() {
        show(saved ? saved.data : null);
        error.set(null);
        isStale.set(!!saved);
        loading.set(false);
        isFetching.set(false);
      });
      if (!saved) restoreKept(next, key);
      releaseQuery(previous);
      return true;
    }

    async function fetchData(runOptions, snapshot, selection, callbacks) {
      if (disposed) return;
      started = true;
      var background = !!(runOptions && runOptions.background);
      if (!selection) selection = peek(readTarget);
      if (selection !== target) select(selection);
      selection = target;
      var previous = currentRun;
      var run = { entry: null, preparing: null };
      currentRun = latestRun = run;
      // A refetch cannot rejoin the request it is meant to supersede.
      var previousEntry = previous && previous.entry;
      releaseQuery(previous);
      if (currentRun !== run) return;

      function finish(publish) {
        if (currentRun !== run) return;
        batch(function() {
          if (publish) publish();
          if (currentRun !== run) return;
          currentRun = null;
          loading.set(false);
          if (!currentRun) isFetching.set(false);
        });
      }

      function notifyAfterCommit(callback) {
        var notify = function() { if (latestRun === run) callback(); };
        if (callbacks) callbacks.push(notify);
        else notify();
      }

      function succeeded(result) {
        if (!options.onSuccess) return;
        notifyAfterCommit(function() {
          try { options.onSuccess(result); }
          catch (failure) {
            if (latestRun !== run) return;
            error.set(failure && failure.message || 'Query failed');
            if (options.onError) options.onError(failure);
          }
        });
      }

      function discardIfRequired(entry) {
        if (!entry || entry.reusable !== false) return;
        reusable = false;
        var key = storageKey(selection);
        if (key && entry.latest) __stxQueries.discard(key, selection.scope);
      }

      try {
        if (selection.failure) throw selection.failure;
        if (!selection.url) {
          _activeQueries.delete(subscriber);
          return;
        }
        _activeQueries.add(subscriber);
        var key = selection.identity;
        var cacheDuration = cacheTime;
        var controller;
        var prepared;
        if (!snapshot && __stxFetchHooks.onRequest) {
          // Interceptors can rewrite the URL, headers and request options. Use
          // what will actually be sent before joining or reading a cached GET.
          controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          run.preparing = controller;
          batch(function() {
            if (!background) {
              loading.set(true);
              error.set(null);
            }
            isFetching.set(true);
          });
          if (currentRun !== run) return;
          prepared = await __stxPrepareFetch('useQuery', selection.url, {
            method: 'GET',
            headers: { ...selection.headers },
            signal: controller ? controller.signal : undefined
          });
          if (currentRun !== run) return;
          run.preparing = null;
          var request = prepared.options;
          if (String(request.method || 'GET').toUpperCase() !== 'GET'
            || request.body != null || request.signal !== prepared.signal) {
            key = {};
            cacheDuration = 0;
          } else {
            key = JSON.stringify([
              key, prepared.url, Array.from(new Headers(request.headers)), request.credentials,
              request.mode, request.cache, request.redirect, request.referrer, request.referrerPolicy,
              request.integrity, request.keepalive, request.priority
            ]);
            if (request.cache === 'no-store') cacheDuration = 0;
          }
        }
        if (!snapshot) effectiveIdentity = key;
        var cached = snapshot || runOptions?.force ? undefined : _queryCache.get(key);
        if (cached) {
          var cachedResult = transform(cached.data);
          if (currentRun !== run) return;
          hasValue = true;
          var fresh = Date.now() - cached.timestamp < staleTime;
          if (fresh) answered = true;
          var publishCached = function() {
            show(cachedResult);
            if (fresh) error.set(null);
            isStale.set(!fresh);
          };
          if (fresh) {
            finish(publishCached);
            succeeded(cachedResult);
            return;
          }
          batch(publishCached);
          if (currentRun !== run) return;
        }

        var rawResult;
        if (snapshot) {
          rawResult = snapshot.data;
          if (reusable && !snapshot.cached && cacheTime > 0 && !__stxFetchHooks.onRequest) {
            cacheQueryResult(key, selection.key, rawResult, cacheTime);
            snapshot.cached = true;
          }
        } else {
          var entry = _queryInflight.get(key);
          if (!entry || entry === previousEntry) {
            if (!prepared && typeof AbortController !== 'undefined') controller = new AbortController();
            entry = startQuery(key, selection, cacheDuration, controller, prepared);
          }
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
          if (currentRun !== run) return;
          if (entry.reusable) reusable = true;
          else discardIfRequired(entry);
        }
        if (currentRun !== run) return;
        var result = transform(rawResult);
        if (currentRun !== run) return;
        answered = true;
        hasValue = true;
        var keep = storageKey(selection);
        if (keep && reusable && (snapshot || entry.latest)) __stxQueries.persist(keep, result, selection.scope);
        finish(function() {
          show(result);
          error.set(null);
          isStale.set(false);
        });
        succeeded(result);
      } catch (e) {
        if (currentRun !== run || (e && e.name === 'AbortError')) return;
        discardIfRequired(entry);
        finish(function() { error.set(e && e.message || 'Query failed'); });
        if (options.onError) notifyAfterCommit(function() { options.onError(e); });
      } finally {
        releaseQuery(run);
        finish();
      }
    }

    async function invalidate(runOptions) {
      if (disposed) return;
      var next = peek(readTarget);
      select(next);
      if (!target.key) return fetchData(runOptions, undefined, target);
      var extra = new Map([[subscriber, { target: target, runOptions: runOptions || {}, manual: true }]]);
      await refreshActiveQueries(new Set([target.key]), null, null, null, extra);
    }

    var backgroundRun = { background: true };

    function attach() {
      stopSelection = effect(function() {
        var next = readTarget();
        var nextEnabled = readEnabled();
        peek(() => batch(() => {
          var wasEnabled = enabled;
          enabled = nextEnabled;
          var changed = select(next);
          if (!enabled) {
            if (wasEnabled) {
              cancel();
              _activeQueries.delete(subscriber);
              batch(function() {
                loading.set(false);
                isFetching.set(false);
              });
            }
            return;
          }
          if (!currentRun && (changed || !wasEnabled) && (started || (mounted && immediate)))
            fetchData(hasValue ? backgroundRun : undefined, undefined, target);
        }));
      });
      stopOffline = __stxQueries.watch({
        target: overlayTarget,
        updated: function() {
          if (peek(readEnabled)) queueOfflineRefresh(subscriber, target);
        },
        outbox: function(sent) {
          if (sent && peek(readEnabled)) {
            base = __stxQueries.overlay(overlayTarget(), base, sent.id);
            queueOfflineRefresh(subscriber, target);
          }
          show(base);
        }
      });
      if (options.refetchOnFocus) {
        onVisibility = function() {
          if (!document.hidden && peek(readEnabled) && !isFetching()) fetchData(backgroundRun);
        };
        document.addEventListener('visibilitychange', onVisibility);
      }
      if (options.refetchInterval) {
        intervalId = setInterval(function() {
          if (document.hidden || !peek(readEnabled) || isFetching()) return;
          fetchData(backgroundRun).then(function() {
            if (options.stopOnError && error()) clearInterval(intervalId);
          });
        }, options.refetchInterval);
      }
    }
    attach();

    onMount(function() {
      if (disposed) {
        disposed = false;
        attach();
      }
      mounted = true;
      enabled = peek(readEnabled);
      if (skipInitial) {
        skipInitial = false;
        return;
      }
      if (immediate && enabled && !currentRun) {
        var runOptions = { background: hasValue, force: !!hydrated && !!options.revalidateOnMount };
        return fetchData(runOptions);
      }
    });

    onDestroy(function() {
      mounted = false;
      disposed = true;
      stopSelection();
      stopOffline();
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
      if (intervalId !== undefined) clearInterval(intervalId);
      _activeQueries.delete(subscriber);
      cancel();
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
        var afterCommit = [];
        batch(function() {
          if (pending.has(id)) {
            if (id > committedId) {
              committedId = id;
              committed = transformed;
            }
            if (id === nextId) error.set(null);
            pending.delete(id);
            publish();
          }
          if (keys.size) refreshActiveQueries(keys, queries, write, afterCommit);
        });
        afterCommit.forEach(function(notify) {
          try { notify(); }
          catch (error) { console.error('[stx] query refresh callback error:', error); }
        });
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
