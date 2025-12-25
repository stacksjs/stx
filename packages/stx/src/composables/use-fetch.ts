/**
 * useFetch - Reactive data fetching with loading/error states
 *
 * Provides a streamlined API for fetching data with automatic state management.
 *
 * @example
 * ```ts
 * // Basic fetch
 * const { data, loading, error, refresh } = useFetch('/api/users')
 *
 * // With options
 * const { data } = useFetch('/api/users', {
 *   method: 'POST',
 *   body: { name: 'John' },
 *   immediate: false, // Don't fetch immediately
 * })
 *
 * // Async data with transform
 * const { data } = useAsyncData(
 *   () => fetch('/api/users').then(r => r.json()),
 *   { transform: (data) => data.users }
 * )
 * ```
 */

export interface FetchOptions<T = unknown> extends Omit<RequestInit, 'body'> {
  /** Request body (will be JSON stringified if object) */
  body?: BodyInit | Record<string, unknown> | null
  /** Base URL to prepend */
  baseURL?: string
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>
  /** Fetch immediately on creation */
  immediate?: boolean
  /** Transform response data */
  transform?: (data: unknown) => T
  /** Custom response parser (default: json) */
  parseResponse?: (response: Response) => Promise<unknown>
  /** Timeout in milliseconds */
  timeout?: number
  /** Retry count on failure */
  retry?: number
  /** Retry delay in milliseconds */
  retryDelay?: number
  /** Cache key for deduplication */
  key?: string
  /** Cache time in milliseconds (0 = no cache) */
  cacheTime?: number
  /** Refetch on window focus */
  refetchOnFocus?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
  /** Default value while loading */
  default?: T
}

export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  status: number | null
  statusText: string | null
}

export interface FetchRef<T> {
  /** Get current state */
  get: () => FetchState<T>
  /** Subscribe to state changes */
  subscribe: (fn: (state: FetchState<T>) => void) => () => void
  /** Refresh/refetch data */
  refresh: () => Promise<void>
  /** Execute fetch (if immediate was false) */
  execute: () => Promise<void>
  /** Abort current request */
  abort: () => void
  /** Check if currently loading */
  isLoading: () => boolean
}

// Simple in-memory cache
const fetchCache = new Map<string, { data: unknown; timestamp: number }>()

/**
 * Build URL with query parameters
 */
function buildURL(url: string, baseURL?: string, query?: Record<string, string | number | boolean | undefined>): string {
  let fullURL = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url

  if (query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    }
    const queryString = params.toString()
    if (queryString) {
      fullURL += (fullURL.includes('?') ? '&' : '?') + queryString
    }
  }

  return fullURL
}

/**
 * Reactive fetch with loading/error states
 */
export function useFetch<T = unknown>(
  url: string | (() => string),
  options: FetchOptions<T> = {}
): FetchRef<T> {
  const {
    immediate = true,
    transform,
    parseResponse = (r) => r.json(),
    timeout = 30000,
    retry = 0,
    retryDelay = 1000,
    key,
    cacheTime = 0,
    refetchOnFocus = false,
    refetchInterval,
    default: defaultValue = null as T,
    baseURL,
    query,
    body,
    ...fetchOptions
  } = options

  let state: FetchState<T> = {
    data: defaultValue,
    loading: false,
    error: null,
    status: null,
    statusText: null,
  }

  let listeners: Array<(state: FetchState<T>) => void> = []
  let abortController: AbortController | null = null
  let focusHandler: (() => void) | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const getURL = (): string => {
    const rawURL = typeof url === 'function' ? url() : url
    return buildURL(rawURL, baseURL, query)
  }

  const getCacheKey = (): string => {
    return key || getURL()
  }

  const getFromCache = (): T | null => {
    if (cacheTime <= 0) return null
    const cached = fetchCache.get(getCacheKey())
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data as T
    }
    return null
  }

  const setCache = (data: T) => {
    if (cacheTime > 0) {
      fetchCache.set(getCacheKey(), { data, timestamp: Date.now() })
    }
  }

  const doFetch = async (attempt = 0): Promise<void> => {
    // Check cache first
    const cached = getFromCache()
    if (cached !== null) {
      state = { ...state, data: cached, loading: false, error: null }
      notify()
      return
    }

    // Abort previous request
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    state = { ...state, loading: true, error: null }
    notify()

    // Setup timeout
    const timeoutId = setTimeout(() => {
      abortController?.abort()
    }, timeout)

    try {
      // Prepare body
      let requestBody: BodyInit | undefined
      if (body) {
        if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
          requestBody = JSON.stringify(body)
          fetchOptions.headers = {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          }
        } else {
          requestBody = body as BodyInit
        }
      }

      const response = await fetch(getURL(), {
        ...fetchOptions,
        body: requestBody,
        signal: abortController.signal,
      })

      clearTimeout(timeoutId)

      state.status = response.status
      state.statusText = response.statusText

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      let data = await parseResponse(response)
      if (transform) {
        data = transform(data)
      }

      setCache(data as T)

      state = {
        ...state,
        data: data as T,
        loading: false,
        error: null,
      }
      notify()
    } catch (err) {
      clearTimeout(timeoutId)

      // Don't treat abort as error
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      // Retry logic
      if (attempt < retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return doFetch(attempt + 1)
      }

      state = {
        ...state,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }
      notify()
    }
  }

  const setupRefetchOnFocus = () => {
    if (!refetchOnFocus || typeof window === 'undefined') return

    focusHandler = () => {
      if (document.visibilityState === 'visible') {
        doFetch()
      }
    }
    document.addEventListener('visibilitychange', focusHandler)
  }

  const setupRefetchInterval = () => {
    if (!refetchInterval || typeof window === 'undefined') return

    intervalId = setInterval(() => {
      doFetch()
    }, refetchInterval)
  }

  const cleanup = () => {
    if (focusHandler) {
      document.removeEventListener('visibilitychange', focusHandler)
      focusHandler = null
    }
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  // Start immediately if requested
  if (immediate) {
    doFetch()
    setupRefetchOnFocus()
    setupRefetchInterval()
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      listeners.push(fn)
      fn(state)

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0) {
          cleanup()
        }
      }
    },
    refresh: doFetch,
    execute: async () => {
      await doFetch()
      setupRefetchOnFocus()
      setupRefetchInterval()
    },
    abort: () => {
      if (abortController) {
        abortController.abort()
      }
    },
    isLoading: () => state.loading,
  }
}

/**
 * Generic async data fetcher
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: {
    immediate?: boolean
    transform?: (data: T) => T
    default?: T
    key?: string
    cacheTime?: number
  } = {}
): FetchRef<T> {
  const {
    immediate = true,
    transform,
    default: defaultValue = null as T,
    key,
    cacheTime = 0,
  } = options

  let state: FetchState<T> = {
    data: defaultValue,
    loading: false,
    error: null,
    status: null,
    statusText: null,
  }

  let listeners: Array<(state: FetchState<T>) => void> = []

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const getCacheKey = (): string => {
    return key || fetcher.toString()
  }

  const getFromCache = (): T | null => {
    if (cacheTime <= 0) return null
    const cached = fetchCache.get(getCacheKey())
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data as T
    }
    return null
  }

  const setCache = (data: T) => {
    if (cacheTime > 0) {
      fetchCache.set(getCacheKey(), { data, timestamp: Date.now() })
    }
  }

  const doFetch = async (): Promise<void> => {
    // Check cache first
    const cached = getFromCache()
    if (cached !== null) {
      state = { ...state, data: cached, loading: false, error: null }
      notify()
      return
    }

    state = { ...state, loading: true, error: null }
    notify()

    try {
      let data = await fetcher()
      if (transform) {
        data = transform(data)
      }

      setCache(data)

      state = {
        ...state,
        data,
        loading: false,
        error: null,
      }
      notify()
    } catch (err) {
      state = {
        ...state,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }
      notify()
    }
  }

  if (immediate) {
    doFetch()
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      listeners.push(fn)
      fn(state)
      return () => {
        listeners = listeners.filter(l => l !== fn)
      }
    },
    refresh: doFetch,
    execute: doFetch,
    abort: () => {},
    isLoading: () => state.loading,
  }
}

/**
 * POST request helper
 */
export function usePost<T = unknown, B = unknown>(
  url: string,
  options: Omit<FetchOptions<T>, 'method' | 'body'> = {}
): {
  execute: (body?: B) => Promise<T | null>
  state: FetchRef<T>
} {
  let requestBody: B | undefined

  const state = useFetch<T>(url, {
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
      await state.execute()
      return state.get().data
    },
    state,
  }
}

/**
 * Clear fetch cache
 */
export function clearFetchCache(key?: string): void {
  if (key) {
    fetchCache.delete(key)
  } else {
    fetchCache.clear()
  }
}

/**
 * Prefetch data into cache
 */
export async function prefetch<T>(url: string, options?: FetchOptions<T>): Promise<void> {
  const fetcher = useFetch<T>(url, { ...options, immediate: false })
  await fetcher.execute()
}
