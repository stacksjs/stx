/** Assemble the useFetch runtime around the shared hydration helpers. */
export function signalsFetchRuntime(readHydratedDataSource: string, clearServerDataSource: string): string {
  return `  // ==========================================================================
  // Declarative Data Fetching (Feature #6 - useFetch)
  // ==========================================================================

  var readHydratedData = ${readHydratedDataSource};
  var clearServerData = ${clearServerDataSource};

  function useFetch(urlOrFn, options = {}) {
    const hydrated = readHydratedData(options.key, options.hydrate !== false, options.transform);
    const initial = hydrated ? hydrated.data : (options.initialData ?? null);
    const data = state(initial);
    // Starts false when nothing will be requested. It used to start true
    // unconditionally while the only thing clearing it was the fetch that
    // immediate:false suppresses — so the documented way to declare a deferred
    // request produced a composable stuck loading forever, which is exactly the
    // case where a template is most likely driving a spinner off it (#1818).
    const immediate = options.immediate !== false && !hydrated;
    const loading = state(immediate);
    // Any request in flight, background ones included. loading answers "is
    // there nothing to show yet"; isFetching answers "is a request open" — and
    // a background refresh is the case where those two stop agreeing (#1929).
    const isFetching = state(immediate);
    const error = state(hydrated ? (hydrated.error || null) : null);
    const status = state(null);
    const statusText = state(null);
    if (options.suspense) registerSuspense(loading, error);

    // A superseded or unmounted request must not resolve into a torn-down
    // scope. Each run gets its own AbortController; a newer run (refetch or a
    // reactive URL change) aborts the one before it, and onDestroy aborts the
    // last in-flight one. State writes are guarded on signal.aborted (#1871).
    let __stxAbort = null;
    let __stxPoll = null;
    let __stxFocus = null;

    // runOptions: { background: true } refreshes data WITHOUT touching loading
    // or clearing the current error, so a poll cannot flash a spinner or blank
    // an error message that is still true. Everything already on screen stays
    // there until the new response actually lands (#1929).
    const fetchData = async (runOptions) => {
      const background = !!(runOptions && runOptions.background);
      if (__stxAbort) __stxAbort.abort();
      __stxAbort = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const __signal = __stxAbort ? __stxAbort.signal : undefined;
      if (!background) loading.set(true);
      isFetching.set(true);
      if (!background) error.set(null);

      try {
        const url = typeof urlOrFn === 'function' ? urlOrFn() : urlOrFn;
        if (!url) {
          if (!background) loading.set(false);
          isFetching.set(false);
          return;
        }

        const fetchOptions = {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...__stxHeaders(options.headers)
          },
          signal: __signal
        };
        // Request cache policy is part of the transport contract. In
        // particular, no-store must reach an offline worker unchanged.
        for (const key of ['cache', 'credentials', 'mode', 'redirect', 'referrerPolicy', 'integrity', 'keepalive']) {
          if (options[key] !== undefined) fetchOptions[key] = options[key];
        }

        if (options.body) {
          fetchOptions.body = typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body);
        }

        const response = await __stxFetch('useFetch', url, fetchOptions);
        if (__signal && __signal.aborted) return;
        status.set(response.status);
        statusText.set(response.statusText || '');

        if (!response.ok) throw await __stxHttpError(response);

        const result = await response.json();
        if (__signal && __signal.aborted) return;

        // Apply transform if provided
        const transformed = options.transform ? options.transform(result) : result;
        data.set(transformed);
        // A background run did not clear the error up front, so a recovery has
        // to clear it here — otherwise the first failed poll would leave the
        // message on screen for the life of the page.
        if (background) error.set(null);
      }
catch (e) {
        // A superseded/unmounted request rejects with AbortError — expected,
        // not a failure to surface. The run that superseded it owns the state.
        if (e && e.name === 'AbortError') return;
        console.error('[STX] useFetch error:', e);
        // Store Error objects (not just messages) so consumers can use
        // .message, .stack, instanceof Error. Matches the composable's
        // shape; pinned by use-fetch-parity.test.ts (#1726).
        error.set(e instanceof Error ? e : new Error(String(e)));
        if (options.onError) options.onError(e);
      }
finally {
        // If a newer run (or onDestroy) aborted this one, that run owns loading.
        if (!__signal || !__signal.aborted) {
          if (!background) loading.set(false);
          isFetching.set(false);
        }
      }
    };

    // A reactive URL drives its own fetching: effect() runs eagerly on creation,
    // so the first run IS the mount fetch. Registering onMount as well issued
    // two requests for every function URL (#1818).
    if (typeof urlOrFn === 'function') {
      var firstUrlRun = true;
      effect(() => {
        const url = urlOrFn();
        if (!url) return;
        // Honour immediate:false for the FIRST evaluation only. A later change
        // to the URL is a new request the caller asked for by changing it, not
        // the initial one they deferred.
        if (firstUrlRun) {
          firstUrlRun = false;
          if (!immediate) return;
        }
        fetchData();
      });
    }
else if (immediate) {
      onMount(fetchData);
    }

    const abort = function() {
      if (__stxAbort) __stxAbort.abort();
      if (__stxPoll !== null) clearInterval(__stxPoll);
      __stxPoll = null;
      if (__stxFocus) document.removeEventListener('visibilitychange', __stxFocus);
      __stxFocus = null;
      loading.set(false);
      isFetching.set(false);
    };

    // Polling and focus refreshes retain existing data and never supersede a
    // slow request with the next timer tick. One scope owns their cleanup.
    const setupRefresh = function() {
      if (__stxPoll === null && typeof options.refetchInterval === 'number' && Number.isFinite(options.refetchInterval) && options.refetchInterval > 0) {
        __stxPoll = setInterval(function() { if (!isFetching()) fetchData({ background: true }); }, options.refetchInterval);
      }
      if (!__stxFocus && options.refetchOnFocus && typeof document !== 'undefined') {
        __stxFocus = function() {
          if (document.visibilityState === 'visible' && !isFetching()) fetchData({ background: true });
        };
        document.addEventListener('visibilitychange', __stxFocus);
      }
    };
    onMount(function() { if (options.immediate !== false) setupRefresh(); });
    if (typeof onDestroy === 'function') onDestroy(abort);

    return {
      data,
      loading,
      isFetching,
      error,
      status,
      statusText,
      abort,
      execute: async function() { await fetchData(); setupRefresh(); },
      refetch: fetchData,
      // Convenience getters
      get isLoading() { return loading(); },
      get hasError() { return !!error(); },
      get isEmpty() { return !loading() && !data(); }
    };
  }
`
}
