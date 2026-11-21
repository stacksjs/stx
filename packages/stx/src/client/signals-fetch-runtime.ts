/** Assemble the useFetch runtime around the shared hydration helpers. */
import { linkRequestAbort } from '../request-abort'

export function signalsFetchRuntime(readHydratedDataSource: string, clearServerDataSource: string): string {
  return `  // ==========================================================================
  // Declarative Data Fetching (Feature #6 - useFetch)
  // ==========================================================================

  var readHydratedData = ${readHydratedDataSource};
  var clearServerData = ${clearServerDataSource};
  var linkRequestAbort = ${linkRequestAbort.toString()};

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

    // A request owns state through response parsing and callbacks, even when
    // an interceptor or a body reader does not honor its AbortSignal.
    let current = null;
    let latest = null;
    let disposed = false;
    let stopUrl = null;
    let lastUrl;
    let __stxPoll = null;
    let __stxFocus = null;

    const fetchData = async (runOptions, trackedUrl) => {
      if (disposed) return;
      const background = !!(runOptions && runOptions.background);
      const previous = current;
      const run = { controller: typeof AbortController !== 'undefined' ? new AbortController() : null };
      current = latest = run;
      if (previous) {
        if (previous.unlink) previous.unlink();
        if (previous.controller) previous.controller.abort();
      }
      const ownsState = () => current === run;
      if (!ownsState()) return;
      let unlink;
      const finish = (publish) => {
        if (!ownsState()) return;
        if (unlink) unlink();
        batch(() => {
          if (publish) publish();
          if (!ownsState()) return;
          current = null;
          loading.set(false);
          if (!current) isFetching.set(false);
        });
      };
      const callerSignal = options.signal;
      unlink = run.unlink = linkRequestAbort(run.controller, callerSignal, finish);
      if (!ownsState()) return;

      batch(() => {
        if (!background) {
          loading.set(true);
          error.set(null);
        }
        isFetching.set(true);
      });
      if (!ownsState()) return;

      try {
        const url = trackedUrl !== undefined ? trackedUrl : (typeof urlOrFn === 'function' ? urlOrFn() : urlOrFn);
        if (ownsState()) lastUrl = url;
        if (!url || !ownsState()) return;

        const headers = __stxHeaders(options.headers);
        const fetchOptions = {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          signal: run.controller ? run.controller.signal : callerSignal
        };
        // Request cache policy is part of the transport contract. In
        // particular, no-store must reach an offline worker unchanged.
        for (const key of ['cache', 'credentials', 'mode', 'redirect', 'referrerPolicy', 'integrity', 'keepalive']) {
          if (options[key] !== undefined) fetchOptions[key] = options[key];
        }

        const body = options.body;
        if (body != null) {
          if (__stxRawBody(body) || (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream)) {
            fetchOptions.headers = headers;
            fetchOptions.body = body;
          } else {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
          }
        }

        if (!ownsState()) return;
        const response = await __stxFetch('useFetch', url, fetchOptions);
        if (!ownsState()) return;
        batch(() => {
          status.set(response.status);
          statusText.set(response.statusText || '');
        });
        if (!ownsState()) return;

        if (!response.ok) throw await __stxHttpError(response);

        const result = await response.json();
        if (!ownsState()) return;
        const transformed = options.transform ? options.transform(result) : result;
        if (!ownsState()) return;
        finish(() => {
          data.set(transformed);
          error.set(null);
        });
      }
      catch (e) {
        if (!ownsState() || (e && e.name === 'AbortError')) return;
        console.error('[STX] useFetch error:', e);
        finish(() => error.set(e instanceof Error ? e : new Error(String(e))));
        if (latest === run && options.onError) options.onError(e);
      }
      finally {
        unlink();
        finish();
      }
    };

    // Track the URL alone. Fetch setup can read other signals, such as a
    // request header, without turning them into URL dependencies.
    const reactiveURL = typeof urlOrFn === 'function';
    const followURL = (fetchInitially) => {
      let firstUrlRun = true;
      stopUrl = effect(() => {
        const url = urlOrFn();
        if (firstUrlRun) {
          firstUrlRun = false;
          lastUrl = url;
          if (!fetchInitially) return;
        }
        else if (url === lastUrl) return;
        lastUrl = url;
        peek(() => fetchData(undefined, url));
      });
    };
    if (reactiveURL) followURL(immediate);

    const abort = function() {
      const run = current;
      current = latest = null;
      if (run && run.unlink) run.unlink();
      if (__stxPoll !== null) clearInterval(__stxPoll);
      __stxPoll = null;
      if (__stxFocus) document.removeEventListener('visibilitychange', __stxFocus);
      __stxFocus = null;
      batch(() => {
        loading.set(false);
        isFetching.set(false);
      });
      if (run && run.controller) run.controller.abort();
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
    onMount(function() {
      const remount = disposed;
      disposed = false;
      if (options.immediate !== false) setupRefresh();
      if (reactiveURL) {
        if (remount) followURL(options.immediate !== false);
      }
      else if (immediate || (remount && options.immediate !== false)) {
        return fetchData();
      }
    });
    if (typeof onDestroy === 'function') onDestroy(function() {
      disposed = true;
      if (stopUrl) stopUrl();
      stopUrl = null;
      abort();
    });

    return {
      data,
      loading,
      isFetching,
      error,
      status,
      statusText,
      abort,
      execute: function() { if (!disposed) setupRefresh(); return fetchData(); },
      refetch: fetchData,
      // Convenience getters
      get isLoading() { return loading(); },
      get hasError() { return !!error(); },
      get isEmpty() { return !loading() && !data(); }
    };
  }
`
}
