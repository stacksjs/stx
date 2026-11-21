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
import { canReuseDataResponse } from '../http-cache-policy'
import { batch, effect, peek, state } from '../signals-api'

/** @internal Closure-free: also embedded in the generated browser runtime. */
export function readHydratedData(key?: string, hydrate = true, transform?: (data: any) => unknown): { data: unknown, error?: Error } | undefined {
  if (!hydrate || !key || typeof window === 'undefined')
    return undefined
  const host = window as unknown as { __STX_DATA__?: Record<string, unknown> }
  if (!host.__STX_DATA__) {
    const tag = document.querySelector('script[data-stx-server-data]')
    try {
      const parsed = JSON.parse(tag?.textContent || '{}')
      host.__STX_DATA__ = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    }
    catch {
      host.__STX_DATA__ = {}
    }
  }
  const values = host.__STX_DATA__
  if (values && Object.prototype.hasOwnProperty.call(values, key)) {
    try { return { data: transform ? transform(values[key]) : values[key] } }
    catch (error) { return { data: null, error: error instanceof Error ? error : new Error(String(error)) } }
  }
  return undefined
}

/** Forget a hydration snapshot; existing signals change only on explicit refresh. */
export function clearServerData(key?: string): void {
  if (typeof window === 'undefined') return
  const host = window as unknown as { __STX_DATA__?: Record<string, unknown> }
  if (key === undefined) host.__STX_DATA__ = {}
  else {
    // Initialize before deleting, otherwise the next reader reloads the tag.
    if (!host.__STX_DATA__) {
      try {
        const parsed = JSON.parse(document.querySelector('script[data-stx-server-data]')?.textContent || '{}')
        host.__STX_DATA__ = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
      }
      catch { host.__STX_DATA__ = {} }
    }
    if (host.__STX_DATA__) delete host.__STX_DATA__[key]
  }
}

export interface FetchOptions<T = unknown> extends Omit<RequestInit, 'body'> {
  /** Request body (will be JSON stringified if object) */
  body?: BodyInit | Record<string, unknown> | null
  /** Base URL to prepend */
  baseURL?: string
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>
  /** Send initial loading and errors to the nearest Suspense boundary in .stx. */
  suspense?: boolean
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
  /** Hydration key and optional namespace for cached responses. */
  key?: string
  /** Reuse matching useServerData data for the initial load (default: true). */
  hydrate?: boolean
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
interface FetchCacheEntry {
  group: string
  data: unknown
  timestamp: number
  status: number
  statusText: string
}
const fetchCache = new Map<string, FetchCacheEntry>()
const cacheWriters = new Map<string, { group: string }>()
const parserIds = new WeakMap<NonNullable<FetchOptions['parseResponse']>, number>()
let nextParserId = 0
const readJSON = (response: Response): Promise<unknown> => response.json()

function requestBody(body: FetchOptions['body'], headers: Headers): BodyInit | null | undefined {
  if (body == null || typeof body === 'string') return body
  if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob
    || body instanceof ReadableStream || body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return body as BodyInit
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return JSON.stringify(body)
}

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
  return createFetch(url, options).resource
}

function createFetch<T>(url: string | (() => string), options: FetchOptions<T>) {
  const {
    immediate = true,
    transform,
    parseResponse = readJSON,
    timeout = 30000,
    retry = 0,
    retryDelay = 1000,
    key,
    hydrate = true,
    cacheTime = 0,
    refetchOnFocus = false,
    refetchInterval,
    initialData = null as T | null,
    baseURL,
    query,
  } = options

  const hydrated = readHydratedData(key, hydrate, transform)
  const hydratedValue = hydrated ? hydrated.data as T : initialData
  const data = state<T | null>(hydratedValue)
  const loading = state(false)
  const isFetching = state(false)
  const error = state<Error | null>(hydrated?.error ?? null)
  const status = state<number | null>(null)
  const statusText = state<string | null>(null)

  let abortController: AbortController | null = null
  let focusHandler: (() => void) | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null
  let stopURL: (() => void) | undefined
  let lastURL: string | undefined

  const getURL = (): string => {
    const rawURL = typeof url === 'function' ? url() : url
    return rawURL ? buildURL(rawURL, baseURL, query) : ''
  }

  const doFetch = async (background = false, selectedURL?: string, body = options.body): Promise<T | undefined> => {
    const previous = abortController
    const controller = new AbortController()
    abortController = controller
    previous?.abort()
    const ownsState = () => abortController === controller
    if (!ownsState()) return

    function finish(publish?: () => void) {
      if (!ownsState()) return
      batch(() => {
        publish?.()
        if (!ownsState()) return
        abortController = null
        loading.set(false)
        if (!abortController) isFetching.set(false)
      })
    }

    let cacheKey: string | undefined
    let writer: { group: string } | undefined
    try {
      const requestURL = selectedURL ?? getURL()
      if (ownsState()) lastURL = requestURL
      if (!requestURL || !ownsState()) return
      const headers = new Headers(options.headers)
      const init: RequestInit = {
        headers,
        body: requestBody(body, headers),
        signal: controller.signal,
        method: options.method,
        cache: options.cache,
        credentials: options.credentials,
        integrity: options.integrity,
        keepalive: options.keepalive,
        mode: options.mode,
        redirect: options.redirect,
        referrer: options.referrer,
        referrerPolicy: options.referrerPolicy,
      }
      const method = (init.method || 'GET').toUpperCase()
      // Cache parsed raw data only for equivalent read requests.
      if (cacheTime > 0 && (method === 'GET' || method === 'HEAD') && init.body == null) {
        let parserId = parserIds.get(parseResponse)
        if (parserId === undefined) parserIds.set(parseResponse, parserId = ++nextParserId)
        const group = key || requestURL
        cacheKey = JSON.stringify([group, requestURL, method, [...headers], parserId,
          init.credentials, init.mode, init.redirect, init.referrer, init.referrerPolicy, init.integrity])
        const cached = fetchCache.get(cacheKey)
        if (cached && init.cache !== 'reload' && init.cache !== 'no-cache' && init.cache !== 'no-store'
          && Date.now() - cached.timestamp < cacheTime) {
          const payload = transform ? transform(cached.data) : cached.data as T
          if (!ownsState()) return
          finish(() => {
            status.set(cached.status)
            statusText.set(cached.statusText)
            data.set(payload)
            error.set(null)
          })
          return payload
        }
        if (cached && Date.now() - cached.timestamp >= cacheTime) fetchCache.delete(cacheKey)
        writer = { group }
        cacheWriters.set(cacheKey, writer)
      }

      batch(() => {
        if (!background) {
          loading.set(true)
          error.set(null)
        }
        isFetching.set(true)
      })

      for (let attempt = 0; ownsState(); attempt++) {
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        try {
          if (!ownsState()) return
          const response = await fetch(requestURL, init)
          clearTimeout(timeoutId)
          if (!ownsState() || controller.signal.aborted) return
          const reusable = cacheKey !== undefined && canReuseDataResponse(response, init)
          if (!reusable && cacheKey !== undefined && cacheWriters.get(cacheKey) === writer)
            fetchCache.delete(cacheKey)
          batch(() => {
            status.set(response.status)
            statusText.set(response.statusText)
          })
          if (!ownsState()) return

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

          const raw = await parseResponse(response)
          if (!ownsState()) return
          const payload = transform ? transform(raw) : raw as T
          if (!ownsState()) return
          if (reusable && cacheKey !== undefined && writer && cacheWriters.get(cacheKey) === writer)
            fetchCache.set(cacheKey, { group: writer.group, data: raw, timestamp: Date.now(), status: response.status, statusText: response.statusText })
          finish(() => {
            data.set(payload)
            error.set(null)
          })
          return payload
        }
        catch (err) {
          if (!ownsState() || controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return
          if (!(attempt < retry)) throw err
        }
        finally {
          clearTimeout(timeoutId)
        }

        // Cancel queued retries on supersession as well as active network work.
        await new Promise<void>((resolve) => {
          const timer = setTimeout(done, retryDelay)
          function done() {
            clearTimeout(timer)
            controller.signal.removeEventListener('abort', done)
            resolve()
          }
          controller.signal.addEventListener('abort', done, { once: true })
        })
      }
    }
    catch (err) {
      finish(() => error.set(err instanceof Error ? err : new Error(String(err))))
    }
    finally {
      if (cacheKey !== undefined && cacheWriters.get(cacheKey) === writer) cacheWriters.delete(cacheKey)
      finish()
    }
  }

  // A refetch nobody asked for does not set `loading`. Both of these refresh
  // data that is already on screen; driving the first-load state from them put
  // a spinner over a populated view on every tick, which is why a polling view
  // could not use this composable at all (#1929).
  const setupRefetchOnFocus = () => {
    if (focusHandler || !refetchOnFocus || typeof window === 'undefined')
      return
    focusHandler = () => {
      if (document.visibilityState === 'visible' && !isFetching())
        void doFetch(true)
    }
    document.addEventListener('visibilitychange', focusHandler)
  }

  const setupRefetchInterval = () => {
    if (intervalId !== null || !refetchInterval || typeof window === 'undefined')
      return
    intervalId = setInterval(() => { if (!isFetching()) void doFetch(true) }, refetchInterval)
  }

  const followURL = (fetchInitially: boolean) => {
    if (typeof url !== 'function' || stopURL) return
    let first = true
    stopURL = effect(() => {
      const selected = getURL()
      if (!first && selected === lastURL) return
      lastURL = selected
      const shouldFetch = !first || fetchInitially
      first = false
      if (shouldFetch) peek(() => { void doFetch(false, selected) })
    })
  }

  const execute = (body?: FetchOptions['body']) => {
    followURL(false)
    setupRefetchOnFocus()
    setupRefetchInterval()
    return doFetch(false, undefined, body)
  }

  followURL(immediate && !hydrated)
  if (immediate) {
    if (typeof url !== 'function' && !hydrated) void doFetch()
    setupRefetchOnFocus()
    setupRefetchInterval()
  }

  const resource: FetchRef<T> = {
    data,
    loading,
    isFetching,
    error,
    status,
    statusText,
    refetch: async (refetchOptions?: RefetchOptions) => {
      followURL(false)
      await doFetch(!!refetchOptions?.background)
    },
    execute: async () => { await execute() },
    abort: () => {
      const controller = abortController
      abortController = null
      stopURL?.()
      stopURL = undefined
      if (focusHandler) {
        document.removeEventListener('visibilitychange', focusHandler)
        focusHandler = null
      }
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
      batch(() => {
        loading.set(false)
        if (!abortController) isFetching.set(false)
      })
      controller?.abort()
    },
  }
  return { resource, execute }
}

export interface AsyncDataOptions<T> {
  immediate?: boolean
  transform?: (data: T) => T
  initialData?: T | null
  key?: string
  hydrate?: boolean
  cacheTime?: number
  /** Let a template's nearest Suspense boundary show first-load and error UI. Default true. */
  suspense?: boolean
}

export type AsyncDataValue<T> = T | AsyncIterable<T> | PromiseLike<T | AsyncIterable<T>>

type AsyncDataUpdate =
  | { kind: 'value', value: unknown }
  | { kind: 'done', result?: { value: unknown } }
  | { kind: 'error', cause: unknown }

interface AsyncDataEntry {
  controller: AbortController
  listeners: Set<(update: AsyncDataUpdate) => void>
  cacheTime: number
  iterator?: AsyncIterator<unknown>
  result?: { value: unknown }
  timestamp?: number
  settled: boolean
}

type AsyncDataSources = Map<unknown, AsyncDataEntry>
interface AsyncDataCache {
  keyed: Map<string, AsyncDataSources>
  loaders: WeakMap<object, AsyncDataSources>
}

interface AsyncDataRun {
  entry?: AsyncDataEntry
  release?: () => void
  resolve: () => void
}

/** @internal Closure-free so the browser and module runtimes use the same resource. */
export function createAsyncData<T, S>(
  fetcher: ((signal: AbortSignal) => AsyncDataValue<T>) | ((source: S, signal: AbortSignal) => AsyncDataValue<T>),
  options: AsyncDataOptions<T>,
  state: typeof import('../signals-api').state,
  batch: typeof import('../signals-api').batch,
  observe: typeof import('../signals-api').effect,
  peek: typeof import('../signals-api').peek,
  readHydratedData: typeof import('./use-fetch').readHydratedData,
  cache: AsyncDataCache,
  source?: () => S,
  trackRead?: (data: Signal<T | null>, loading: Signal<boolean>, error: () => Error | null) => Signal<T | null>,
): { resource: FetchRef<T>, pause: () => void, resume: () => void } {
  const { immediate = true, transform, initialData = null, key, hydrate = true, cacheTime = 0 } = options
  const snapshot = readHydratedData(key, hydrate, transform)
  const data = state<T | null>(snapshot ? snapshot.data as T | null : initialData)
  const loading = state(false)
  const isFetching = state(false)
  const error = state<Error | null>(snapshot?.error ?? null)
  let hasValue = snapshot ? !snapshot.error : options.initialData !== undefined
  let current: AsyncDataRun | undefined
  let stopSource: (() => void) | undefined
  let selected: S | undefined
  let observedSource = false
  let restart = false
  let paused = false

  function cancelIterator(iterator?: AsyncIterator<unknown>) {
    try { void Promise.resolve(iterator?.return?.()).catch(() => {}) }
    catch { /* A canceled iterator may already be closed. */ }
  }

  function retire(entry: AsyncDataEntry, remove: () => void) {
    if (entry.settled || entry.listeners.size) return
    entry.settled = true
    remove()
    entry.controller.abort()
    const iterator = entry.iterator
    entry.iterator = undefined
    cancelIterator(iterator)
  }

  async function pump(
    entry: AsyncDataEntry,
    input: S | undefined,
    remove: () => void,
    stored: () => boolean,
  ): Promise<void> {
    function publish(update: AsyncDataUpdate) {
      for (const listener of [...entry.listeners]) listener(update)
    }

    function settle(update: AsyncDataUpdate) {
      if (entry.settled) return
      entry.settled = true
      if (update.kind === 'done' && entry.result && entry.cacheTime > 0 && stored()) {
        entry.timestamp = Date.now()
        if (Number.isFinite(entry.cacheTime)) {
          const timer = setTimeout(remove, entry.cacheTime) as unknown as { unref?: () => void }
          timer.unref?.()
        }
      }
      else remove()
      publish(update)
      entry.listeners.clear()
    }

    try {
      const result = await (source
        ? (fetcher as (input: S, signal: AbortSignal) => AsyncDataValue<T>)(input as S, entry.controller.signal)
        : (fetcher as (signal: AbortSignal) => AsyncDataValue<T>)(entry.controller.signal))
      const iterable = result as AsyncIterable<T> | null | undefined
      if (typeof iterable?.[Symbol.asyncIterator] === 'function') {
        const iterator = iterable[Symbol.asyncIterator]()
        if (entry.settled) {
          cancelIterator(iterator)
          return
        }
        entry.iterator = iterator
        while (!entry.settled) {
          const step = await iterator.next()
          if (entry.settled) return
          if (step.done) {
            entry.iterator = undefined
            settle({ kind: 'done' })
            return
          }
          entry.result = { value: step.value }
          publish({ kind: 'value', value: step.value })
        }
      }
      else if (!entry.settled) {
        entry.result = { value: result }
        settle({ kind: 'done', result: entry.result })
      }
    }
    catch (cause) {
      if (entry.settled) return
      const iterator = entry.iterator
      entry.iterator = undefined
      settle({ kind: 'error', cause })
      cancelIterator(iterator)
    }
  }

  function complete(run: AsyncDataRun, publish?: () => void) {
    if (current !== run) return
    batch(() => {
      publish?.()
      if (current !== run) return
      current = undefined
      loading.set(false)
      if (!current) isFetching.set(false)
    })
    run.release?.()
    run.resolve()
  }

  function load(input: S | undefined): Promise<void> {
    let resolve!: () => void
    const done = new Promise<void>((finish) => { resolve = finish })
    const previous = current
    const run: AsyncDataRun = { resolve }
    current = run
    previous?.release?.()
    previous?.resolve()
    if (current !== run) return done

    const bucket = key ? cache.keyed.get(key) : cache.loaders.get(fetcher)
    const entries = bucket || new Map<unknown, AsyncDataEntry>()
    if (!bucket) {
      if (key) cache.keyed.set(key, entries)
      else cache.loaders.set(fetcher, entries)
    }

    function receive(update: AsyncDataUpdate) {
      if (current !== run) return
      try {
        if (update.kind === 'error') {
          complete(run, () => error.set(update.cause instanceof Error ? update.cause : new Error(String(update.cause))))
          return
        }
        const result = update.kind === 'value' ? update : update.result
        const raw = result?.value as T
        const value = result && transform ? transform(raw) : raw
        if (current !== run) return
        const publish = () => {
          if (result) {
            hasValue = true
            data.set(value)
          }
          if (current === run) error.set(null)
        }
        if (update.kind === 'done') complete(run, publish)
        else batch(() => {
          publish()
          if (current === run) loading.set(false)
        })
      }
      catch (cause) {
        complete(run, () => error.set(cause instanceof Error ? cause : new Error(String(cause))))
      }
    }

    const found = entries.get(input)
    if (cacheTime > 0 && found?.timestamp !== undefined && Date.now() - found.timestamp < cacheTime) {
      receive({ kind: 'done', result: found.result })
      return done
    }

    // Distinct consumers join one run. Refetching your own run starts a new
    // one while other readers can finish with the entry they already own.
    const joined = found && !found.settled && found !== previous?.entry
    const entry: AsyncDataEntry = joined
      ? found
      : { controller: new AbortController(), listeners: new Set(), cacheTime, settled: false }
    if (!joined) entries.set(input, entry)
    else entry.cacheTime = Math.max(entry.cacheTime, cacheTime)

    const stored = () => entries.get(input) === entry
    const remove = () => {
      if (!stored()) return
      entries.delete(input)
      if (entries.size) return
      if (key && cache.keyed.get(key) === entries) cache.keyed.delete(key)
      if (!key && cache.loaders.get(fetcher) === entries) cache.loaders.delete(fetcher)
    }
    run.entry = entry
    run.release = () => {
      entry.listeners.delete(receive)
      retire(entry, remove)
    }
    entry.listeners.add(receive)
    batch(() => {
      loading.set(!hasValue)
      isFetching.set(true)
      if (!hasValue) error.set(null)
    })
    // Reactive observers may transfer their interest to a second consumer
    // before this creator finishes publishing its loading state.
    if (!joined && !entry.settled) void pump(entry, input, remove, stored)
    else if (joined && current === run && entry.result) receive({ kind: 'value', value: entry.result.value })
    return done
  }

  function followSource(fetchInitially: boolean) {
    if (!source || stopSource) return
    let first = true
    stopSource = observe(() => {
      const next = source()
      if (!first && Object.is(selected, next)) return
      const changed = observedSource && !Object.is(selected, next)
      const shouldFetch = first ? fetchInitially || changed : true
      selected = next
      observedSource = true
      first = false
      if (!shouldFetch) return
      peek(() => batch(() => {
        if (changed) {
          hasValue = false
          data.set(null)
        }
        void load(next)
      }))
    })
  }

  const trackedData = trackRead && options.suspense !== false
    ? trackRead(data, loading, () => {
      const failure = error()
      return hasValue ? null : failure
    })
    : data

  followSource(immediate && !snapshot)
  if (!source && immediate && !snapshot) void load(undefined)

  function pause(restartPending = true) {
    if (paused) {
      if (!restartPending) restart = false
      return
    }
    paused = true
    restart = restartPending && !!current
    stopSource?.()
    stopSource = undefined
    if (current) complete(current)
  }

  function resume() {
    if (!paused) return
    paused = false
    const pending = restart
    restart = false
    followSource(pending)
    if (!source && pending) void load(undefined)
  }

  function refetch(): Promise<void> {
    const input = source ? peek(source) : undefined
    const changed = observedSource && !Object.is(selected, input)
    selected = input
    if (paused) {
      paused = false
      restart = false
      followSource(false)
    }
    if (!changed) return load(input)
    let result!: Promise<void>
    batch(() => {
      hasValue = false
      data.set(null)
      result = load(input)
    })
    return result
  }

  return {
    resource: {
      data: trackedData,
      loading,
      isFetching,
      error,
      status: state<number | null>(null),
      statusText: state<string | null>(null),
      refetch,
      execute: refetch,
      abort: () => pause(false),
    },
    pause,
    resume,
  }
}

const asyncDataCache: AsyncDataCache = { keyed: new Map(), loaders: new WeakMap() }

/** Resolve a loader, optionally following a reactive source and consuming async iterables. */
export function useAsyncData<T>(fetcher: (signal: AbortSignal) => AsyncDataValue<T>, options?: AsyncDataOptions<T>): FetchRef<T>
export function useAsyncData<S, T>(source: () => S, fetcher: (value: S, signal: AbortSignal) => AsyncDataValue<T>, options?: AsyncDataOptions<T>): FetchRef<T>
export function useAsyncData<T, S>(
  sourceOrFetcher: (() => S) | ((signal: AbortSignal) => AsyncDataValue<T>),
  optionsOrFetcher: AsyncDataOptions<T> | ((value: S, signal: AbortSignal) => AsyncDataValue<T>) = {},
  options: AsyncDataOptions<T> = {},
): FetchRef<T> {
  if (typeof optionsOrFetcher === 'function')
    return createAsyncData(optionsOrFetcher, options, state, batch, effect, peek, readHydratedData, asyncDataCache, sourceOrFetcher as () => S).resource
  return createAsyncData(sourceOrFetcher as (signal: AbortSignal) => AsyncDataValue<T>, optionsOrFetcher, state, batch, effect, peek, readHydratedData, asyncDataCache).resource
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
  const request = createFetch<T>(url, { ...options, method: 'POST', hydrate: false, immediate: false })
  return {
    execute: async body => (await request.execute(body as FetchOptions['body'])) ?? null,
    state: request.resource,
  }
}

/** Clear fetch cache (one key or all). */
export function clearFetchCache(key?: string): void {
  if (key) {
    for (const [id, entry] of fetchCache) if (entry.group === key) fetchCache.delete(id)
    for (const [id, writer] of cacheWriters) if (writer.group === key) cacheWriters.delete(id)
    asyncDataCache.keyed.delete(key)
  }
  else {
    fetchCache.clear()
    cacheWriters.clear()
    asyncDataCache.keyed.clear()
    asyncDataCache.loaders = new WeakMap()
  }
}

/** Prefetch data into cache. */
export async function prefetch<T>(url: string, options?: FetchOptions<T>): Promise<void> {
  const fetcher = useFetch<T>(url, { ...options, immediate: false })
  await fetcher.execute()
}
