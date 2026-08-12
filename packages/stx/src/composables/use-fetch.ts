/**
 * useFetch — reactive data fetching (module-import path).
 *
 * stx ships two `useFetch` implementations:
 *
 *   1. This one (signals-api / module-import path) — used by tests,
 *      SSR-side tooling, and any code that imports from `'stx'` or
 *      `'@stacksjs/stx/composables'` directly.
 *   2. The runtime template literal inside `packages/stx/src/signals.ts`
 *      (search for `function useFetch`), injected into client pages and
 *      exposed at `window.stx.useFetch`.
 *
 * Pre-stacksjs/stx#1726 these returned different shapes (composable used
 * a Vue-style `{ get, subscribe, refresh, execute, abort }` ref;
 * runtime returned Signal-shaped `{ data, loading, error, refetch }`).
 * That meant the same code crashed on one path or the other depending
 * on which entry point the bundler resolved. Now both return the
 * Signal shape — `data`, `loading`, `error` are signals; `refetch` is
 * a function. The composable additionally exposes `abort`, `status`,
 * `statusText` and accepts the richer options set (retry, cache,
 * refetchOnFocus, etc.) — these are supersets the runtime doesn't
 * implement, available to module-import consumers only.
 *
 * Parity tests in `test/composables/use-fetch-parity.test.ts` pin the
 * shared shape across both impls; do not change one side without the
 * other.
 *
 * @example
 * ```ts
 * const { data, loading, error, refetch } = useFetch('/api/users')
 * // data() — current value (null while loading)
 * // loading() — boolean signal
 * // error() — Error | null signal
 * // refetch() — trigger a new request
 * ```
 */
import type { Signal } from '../signals-api'
import { state } from '../signals-api'

export interface FetchOptions<T = unknown> extends Omit<RequestInit, 'body'> {
  /** Request body (will be JSON stringified if object) */
  body?: BodyInit | Record<string, unknown> | null
  /** Base URL to prepend */
  baseURL?: string
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>
  /** Fetch immediately on creation (default: true) */
  immediate?: boolean
  /** Transform response data */
  transform?: (data: unknown) => T
  /** Custom response parser (default: json) */
  parseResponse?: (response: Response) => Promise<unknown>
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Retry count on failure (default: 0) */
  retry?: number
  /** Retry delay in milliseconds (default: 1000) */
  retryDelay?: number
  /** Cache key for deduplication */
  key?: string
  /** Cache time in milliseconds (0 = no cache) */
  cacheTime?: number
  /** Refetch on document visibility change (default: false) */
  refetchOnFocus?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
  /** Initial value while loading (matches runtime's `initialData`) */
  initialData?: T | null
}

/** How one run of the request should behave. */
export interface RefetchOptions {
  /**
   * Refresh without touching `loading` or clearing the current error.
   *
   * A poll refreshes data that is already on screen, so driving the first-load
   * state from it puts a spinner over a populated view on every tick. Bind
   * `isFetching` for a subtle in-flight indicator instead (stacksjs/stx#1929).
   */
  background?: boolean
}

/** Signal-shaped fetch result. Matches the runtime's `useFetch` return. */
export interface FetchRef<T> {
  /** Current data, or `initialData`/null while loading. */
  data: Signal<T | null>
  /** True while a first-load request is in flight. A background one leaves it alone. */
  loading: Signal<boolean>
  /** True while ANY request is in flight, background ones included. */
  isFetching: Signal<boolean>
  /** The most recent error, or null. */
  error: Signal<Error | null>
  /** HTTP status code of the most recent response, or null. */
  status: Signal<number | null>
  /** HTTP status text of the most recent response, or null. */
  statusText: Signal<string | null>
  /** Trigger a new request. */
  refetch: (_options?: RefetchOptions) => Promise<void>
  /** Same as refetch — kept for runtime-parity callers. */
  execute: () => Promise<void>
  /** Abort the in-flight request. */
  abort: () => void
}

// Simple in-memory cache shared across useFetch instances.
const fetchCache = new Map<string, { data: unknown, timestamp: number }>()

function buildURL(url: string, baseURL?: string, query?: Record<string, string | number | boolean | undefined>): string {
  let fullURL = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url

  if (query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined)
        params.append(key, String(value))
    }
    const queryString = params.toString()
    if (queryString)
      fullURL += (fullURL.includes('?') ? '&' : '?') + queryString
  }

  return fullURL
}

/**
 * Reactive fetch with loading/error states. Returns Signal-shaped state.
 */
export function useFetch<T = unknown>(
  url: string | (() => string),
  options: FetchOptions<T> = {},
): FetchRef<T> {
  const {
    immediate = true,
    transform,
    parseResponse = (r: Response) => r.json(),
    timeout = 30000,
    retry = 0,
    retryDelay = 1000,
    key,
    cacheTime = 0,
    refetchOnFocus = false,
    refetchInterval,
    initialData = null as T | null,
    baseURL,
    query,
    body,
    ...fetchOptions
  } = options

  const data = state<T | null>(initialData)
  const loading = state(false)
  const isFetching = state(false)
  const error = state<Error | null>(null)
  const status = state<number | null>(null)
  const statusText = state<string | null>(null)

  let abortController: AbortController | null = null
  let focusHandler: (() => void) | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null

  const getURL = (): string => {
    const rawURL = typeof url === 'function' ? url() : url
    return buildURL(rawURL, baseURL, query)
  }

  const getCacheKey = (): string => key || getURL()

  const getFromCache = (): T | null => {
    if (cacheTime <= 0)
      return null
    const cached = fetchCache.get(getCacheKey())
    if (cached && Date.now() - cached.timestamp < cacheTime)
      return cached.data as T
    return null
  }

  const setCache = (value: T) => {
    if (cacheTime > 0)
      fetchCache.set(getCacheKey(), { data: value, timestamp: Date.now() })
  }

  // `background` refreshes without touching `loading` or clearing the current
  // error, so a poll cannot flash a spinner over data already on screen or
  // blank a message that is still true (#1929). It is threaded through the
  // retry recursion: a retried background run is still a background run.
  const doFetch = async (attempt = 0, background = false): Promise<void> => {
    const cached = getFromCache()
    if (cached !== null) {
      data.set(cached)
      loading.set(false)
      isFetching.set(false)
      error.set(null)
      return
    }

    // Abort previous in-flight request
    if (abortController)
      abortController.abort()
    abortController = new AbortController()

    if (!background)
      loading.set(true)
    isFetching.set(true)
    if (!background)
      error.set(null)

    const timeoutId = setTimeout(() => abortController?.abort(), timeout)

    try {
      let requestBody: BodyInit | undefined
      if (body) {
        if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
          requestBody = JSON.stringify(body)
          fetchOptions.headers = {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          }
        }
        else {
          requestBody = body as BodyInit
        }
      }

      const response = await fetch(getURL(), {
        ...fetchOptions,
        body: requestBody,
        signal: abortController.signal,
      })

      clearTimeout(timeoutId)
      status.set(response.status)
      statusText.set(response.statusText)

      // Read the body before throwing, and carry it on the error. Throwing a
      // synthesized 'HTTP nnn' first made the server's own message unreachable
      // from every stx data primitive (stacksjs/stx#1848). Kept in step with
      // __stxHttpError in the generated runtime — same shape, same fields, per
      // CLAUDE.md item 40.
      if (!response.ok) {
        let body: unknown = null
        try {
          const text = await response.text()
          if (text) {
            try { body = JSON.parse(text) }
            catch { body = text }
          }
        }
        catch { body = null }

        let detail = ''
        if (body && typeof body === 'object')
          detail = String((body as Record<string, unknown>).message ?? (body as Record<string, unknown>).error ?? '')
        else if (typeof body === 'string')
          detail = body.slice(0, 200)

        let message = `HTTP ${response.status}`
        if (response.statusText)
          message += `: ${response.statusText}`
        if (detail)
          message += ` - ${detail}`

        const httpError = new Error(message) as Error & {
          status?: number
          statusText?: string
          data?: unknown
          response?: Response
        }
        httpError.status = response.status
        httpError.statusText = response.statusText
        httpError.data = body
        httpError.response = response
        throw httpError
      }

      let payload = await parseResponse(response) as unknown
      if (transform)
        payload = transform(payload)

      setCache(payload as T)
      data.set(payload as T)
      // A background run did not clear the error up front, so a recovery has to
      // clear it here — otherwise one failed poll leaves the message on screen
      // for the life of the page.
      if (background)
        error.set(null)
      if (!background)
        loading.set(false)
      isFetching.set(false)
    }
    catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof Error && err.name === 'AbortError')
        return

      if (attempt < retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return doFetch(attempt + 1, background)
      }

      error.set(err instanceof Error ? err : new Error(String(err)))
      if (!background)
        loading.set(false)
      isFetching.set(false)
    }
  }

  // A refetch nobody asked for does not set `loading`. Both of these refresh
  // data that is already on screen; driving the first-load state from them put
  // a spinner over a populated view on every tick, which is why a polling view
  // could not use this composable at all (#1929).
  const setupRefetchOnFocus = () => {
    if (!refetchOnFocus || typeof window === 'undefined')
      return
    focusHandler = () => {
      if (document.visibilityState === 'visible')
        void doFetch(0, true)
    }
    document.addEventListener('visibilitychange', focusHandler)
  }

  const setupRefetchInterval = () => {
    if (!refetchInterval || typeof window === 'undefined')
      return
    intervalId = setInterval(() => void doFetch(0, true), refetchInterval)
  }

  if (immediate) {
    void doFetch()
    setupRefetchOnFocus()
    setupRefetchInterval()
  }

  return {
    data,
    loading,
    isFetching,
    error,
    status,
    statusText,
    refetch: (refetchOptions?: RefetchOptions) => doFetch(0, !!refetchOptions?.background),
    execute: async () => {
      await doFetch()
      setupRefetchOnFocus()
      setupRefetchInterval()
    },
    abort: () => {
      if (abortController)
        abortController.abort()
      if (focusHandler) {
        document.removeEventListener('visibilitychange', focusHandler)
        focusHandler = null
      }
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    },
  }
}

/**
 * Generic async data fetcher. Same Signal shape as `useFetch`.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: {
    immediate?: boolean
    transform?: (data: T) => T
    initialData?: T | null
    key?: string
    cacheTime?: number
  } = {},
): FetchRef<T> {
  const {
    immediate = true,
    transform,
    initialData = null as T | null,
    key,
    cacheTime = 0,
  } = options

  const data = state<T | null>(initialData)
  const loading = state(false)
  const isFetching = state(false)
  const error = state<Error | null>(null)
  // status / statusText are not meaningful for arbitrary async fetchers,
  // but exposed for shape parity with useFetch.
  const status = state<number | null>(null)
  const statusText = state<string | null>(null)

  const getCacheKey = (): string => key || fetcher.toString()

  const getFromCache = (): T | null => {
    if (cacheTime <= 0)
      return null
    const cached = fetchCache.get(getCacheKey())
    if (cached && Date.now() - cached.timestamp < cacheTime)
      return cached.data as T
    return null
  }

  const setCache = (value: T) => {
    if (cacheTime > 0)
      fetchCache.set(getCacheKey(), { data: value, timestamp: Date.now() })
  }

  const doFetch = async (background = false): Promise<void> => {
    const cached = getFromCache()
    if (cached !== null) {
      data.set(cached)
      loading.set(false)
      isFetching.set(false)
      error.set(null)
      return
    }

    if (!background)
      loading.set(true)
    isFetching.set(true)
    if (!background)
      error.set(null)

    try {
      // `payload` is typed as Awaited<T> from the await; transform takes T
      // and returns T. TS's strict variance check sees the two as
      // distinct, so we narrow through `unknown` to satisfy both sides.
      let payload = (await fetcher()) as unknown as T
      if (transform)
        payload = transform(payload)

      setCache(payload)
      data.set(payload)
      if (background)
        error.set(null)
      if (!background)
        loading.set(false)
      isFetching.set(false)
    }
    catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)))
      if (!background)
        loading.set(false)
      isFetching.set(false)
    }
  }

  if (immediate)
    void doFetch()

  return {
    data,
    loading,
    isFetching,
    error,
    status,
    statusText,
    refetch: (refetchOptions?: RefetchOptions) => doFetch(!!refetchOptions?.background),
    execute: () => doFetch(),
    abort: () => {},
  }
}

/**
 * POST request helper. Returns the fetch state plus an execute(body) helper.
 */
export function usePost<T = unknown, B = unknown>(
  url: string,
  options: Omit<FetchOptions<T>, 'method' | 'body'> = {},
): {
    execute: (body?: B) => Promise<T | null>
    state: FetchRef<T>
  } {
  let requestBody: B | undefined

  const fetchState = useFetch<T>(url, {
    ...options,
    method: 'POST',
    immediate: false,
    get body() {
      return requestBody as Record<string, unknown>
    },
  })

  return {
    execute: async (body?: B) => {
      requestBody = body
      await fetchState.execute()
      return fetchState.data()
    },
    state: fetchState,
  }
}

/** Clear fetch cache (one key or all). */
export function clearFetchCache(key?: string): void {
  if (key)
    fetchCache.delete(key)
  else
    fetchCache.clear()
}

/** Prefetch data into cache. */
export async function prefetch<T>(url: string, options?: FetchOptions<T>): Promise<void> {
  const fetcher = useFetch<T>(url, { ...options, immediate: false })
  await fetcher.execute()
}
