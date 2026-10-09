/**
 * Persisted queries: data a screen shows at once from last time, refreshed
 * behind, kept per signed-in account.
 *
 * The phone app's stores each did this by hand: a `keptState` for the data,
 * a `loadedAt` to decide whether to fetch again, a flag against two screens
 * fetching at once, and nothing to tell them when the offline worker had a
 * newer answer or when a write waiting in the outbox should still show. A
 * cached query is that, once:
 *
 * - seeded synchronously from the kept store (`keptState`'s storage, per
 *   account scope), so the first draw has data;
 * - fetched again behind when older than `staleTime` (a copy kept from an
 *   earlier launch is always revalidated once), one request for every caller;
 * - kept again after every answer;
 * - refreshed when the offline worker says the API answer changed
 *   (`stx:updated` { kind: 'api', url });
 * - shown with the outbox's waiting writes applied on top (`affects` /
 *   `apply` on an outbox entry), so a change made offline never disappears
 *   when the data is fetched again before it synced.
 *
 * Closure-free: the browser runtime embeds `createQueryCache` and
 * `queryTargetMatches` by source (signals.ts), so neither may use anything
 * from this module's scope. The signal implementation and the kept store are
 * passed in.
 */

import type { KeptStore } from './kept-store'

/** The part of a signal this needs. */
export interface QuerySignal<T> {
  (): T
  set: (value: T) => void
}

export type KeptScope = string | number | false | null | undefined

/** What a query is known by: its key, and the URL it reads, when it has one. */
export interface QueryTarget {
  key: string
  url?: string | null
}

export interface CachedQueryOptions<T> {
  /** The URL to GET (or a function giving it). Answered as JSON. */
  url?: string | (() => string | null | undefined)
  /** Load the data some other way than a GET of `url`. */
  load?: (context: { force: boolean, url: string | null, signal?: AbortSignal }) => Promise<T>
  /** How to send the GET: give it current credentials here (default `fetch`). */
  fetch?: (url: string, init: RequestInit) => Promise<Response>
  /**
   * Whose data this is, as for `keptState`: the signed-in account's id, or a
   * function returning it (read at every load, so signing in as someone else
   * swaps the data). `false`, `null` or `''` keeps nothing on the device.
   * Default: the scope given to `setKeptScope`.
   */
  scope?: KeptScope | (() => KeptScope)
  /** How long an answer counts as fresh, ms: `load()` within it does not fetch. Default 0. */
  staleTime?: number
  /** The value before anything was kept or fetched. Default null. */
  initial?: T
  /** Shape the answer before it is kept and shown. */
  transform?: (raw: any) => T
  /** Give up on a request after this long, ms (the data stays). Default 15000. */
  timeoutMs?: number
  /** Fetch when created, rather than at the first `load()`. */
  immediate?: boolean
}

export interface CachedQuery<T> {
  /** What to show: the last answer, with writes still waiting in the outbox applied. */
  data: QuerySignal<T>
  /** True while fetching with nothing to show yet. */
  loading: QuerySignal<boolean>
  /** True while any request is out, a background one included. */
  isFetching: QuerySignal<boolean>
  /** The last request's error message, cleared by the next answer. */
  error: QuerySignal<string | null>
  /** When the data shown was fetched (ms), from this launch or a kept one; 0 for none. */
  updatedAt: QuerySignal<number>
  /** Fetch when older than `staleTime` (or always, with `force`). Every caller shares one request. */
  load: (force?: boolean) => Promise<T>
  /** Fetch now, past any cache: a pull to refresh. */
  refresh: () => Promise<T>
  /** Replace the data here (an edit made on this device), kept like an answer. */
  set: (value: T | ((current: T) => T)) => void
  /** Count the data as stale, so the next `load()` fetches. */
  invalidate: () => void
  readonly key: string
}

export interface QueryCacheEnv {
  state: <T>(value: T) => QuerySignal<T>
  kept: KeptStore
  /** Where kept values live, as `keptState` names them. Default 'stx:kept:'. */
  prefix?: string
  /** Listen for `stx:updated` and `stx:outbox` on window. Default true. */
  listen?: boolean
  matches?: (item: string, target: QueryTarget) => boolean
}

export interface QueryWatcher {
  target: () => QueryTarget
  /** The worker has a newer answer for this query's URL. */
  updated: () => void
  /** The outbox changed. `sent` is an entry that just reached the server. */
  outbox: (sent: { id: string, affects?: string[] } | null) => void
}

export interface QueryCache {
  cachedQuery: <T>(key: string, options?: CachedQueryOptions<T>) => CachedQuery<T>
  /** The account scope queries (and kept state) use when given none. */
  setScope: (scope: KeptScope) => void
  scope: () => KeptScope
  /** The kept-store key of a query's data in a scope, or null when that scope keeps nothing. */
  keyFor: (key: string, scope?: KeptScope) => string | null
  /** A kept answer, synchronously, or undefined. */
  seed: (key: string, scope?: KeptScope) => { data: unknown, at: number } | undefined
  /** A kept answer, from anywhere it is kept. */
  restore: (key: string, scope?: KeptScope) => Promise<{ data: unknown, at: number } | undefined>
  persist: (key: string, data: unknown, scope?: KeptScope) => void
  /** `data` with the outbox's waiting writes for this target applied (only entry `onlyId`, when given). */
  overlay: <T>(target: QueryTarget, data: T, onlyId?: string) => T
  watch: (watcher: QueryWatcher) => () => void
}

/**
 * Whether an outbox entry's `affects` item, or a URL the worker refreshed,
 * names this query: its key, or its URL (an item without a query string
 * matches the URL's path with any). Closure-free.
 */
export function queryTargetMatches(item: string, target: QueryTarget): boolean {
  if (!item)
    return false
  if (item === target.key)
    return true
  if (!target.url)
    return false
  if (item === target.url)
    return true
  try {
    const base = typeof location !== 'undefined' && location.origin && location.origin !== 'null' ? location.origin : 'http://localhost'
    const a = new URL(item, base)
    const b = new URL(target.url, base)
    if (a.origin !== b.origin || a.pathname !== b.pathname)
      return false
    return !a.search || a.search === b.search
  }
  catch {
    return false
  }
}

/** The query layer, for one page. Closure-free. */
export function createQueryCache(env: QueryCacheEnv): QueryCache {
  const prefix = env.prefix || 'stx:kept:'
  const matches = env.matches || ((item: string, target: QueryTarget) => item === target.key || item === target.url)
  const watchers = new Set<QueryWatcher>()
  const queries = new Map<string, CachedQuery<any>>()
  let defaultScope: KeptScope

  const resolveScope = (scope: KeptScope): KeptScope => scope === undefined ? defaultScope : scope
  const keyFor = (key: string, scope?: KeptScope): string | null => {
    const s = resolveScope(scope)
    if (s === false || s === null || s === '')
      return null
    return `${prefix}${s === undefined ? '' : `${s}:`}query:${key}`
  }
  const unpack = (found: { value: unknown } | undefined): { data: unknown, at: number } | undefined => {
    const record = found && found.value as { d?: unknown, at?: number } | null
    if (!record || typeof record !== 'object' || !('d' in record))
      return undefined
    return { data: record.d, at: Number(record.at) || 0 }
  }

  const outboxes = (): Map<string, { overlay: (target: QueryTarget, data: unknown, onlyId?: string) => unknown }> | null => {
    const g = globalThis as any
    return g.__stx_outboxes instanceof Map ? g.__stx_outboxes : null
  }

  const cache: QueryCache = {
    setScope(scope) {
      defaultScope = scope
    },
    scope: () => defaultScope,
    keyFor,
    seed(key, scope) {
      const at = keyFor(key, scope)
      return at ? unpack(env.kept.peek(at)) : undefined
    },
    restore(key, scope) {
      const at = keyFor(key, scope)
      return at ? env.kept.load(at).then(unpack) : Promise.resolve(undefined)
    },
    persist(key, data, scope) {
      const at = keyFor(key, scope)
      if (at)
        env.kept.set(at, { d: data, at: Date.now() })
    },
    overlay(target, data, onlyId) {
      const boxes = outboxes()
      if (!boxes || !boxes.size)
        return data
      let out: any = data
      boxes.forEach((box) => {
        try {
          out = box.overlay(target, out, onlyId)
        }
        catch {}
      })
      return out
    },
    watch(watcher) {
      watchers.add(watcher)
      return () => { watchers.delete(watcher) }
    },

    cachedQuery<T>(key: string, options?: CachedQueryOptions<T>): CachedQuery<T> {
      const existing = queries.get(key) as (CachedQuery<T> & { __options?: (o: CachedQueryOptions<T>) => void }) | undefined
      if (existing) {
        if (options && existing.__options)
          existing.__options(options)
        return existing
      }
      let opts: CachedQueryOptions<T> = options || {}
      const initial = (opts.initial === undefined ? null : opts.initial) as T
      const scopeNow = (): KeptScope => typeof opts.scope === 'function' ? (opts.scope as () => KeptScope)() : opts.scope as KeptScope
      const urlNow = (): string | null => {
        const u = typeof opts.url === 'function' ? opts.url() : opts.url
        return u || null
      }
      const target = (): QueryTarget => ({ key, url: urlNow() })

      let scope = scopeNow()
      let base: T = initial
      let fetchedAt = 0
      let inflight: Promise<T> | null = null
      const seeded = cache.seed(key, scope)
      if (seeded)
        base = seeded.data as T

      const data = env.state<T>(cache.overlay(target(), base))
      const loading = env.state<boolean>(false)
      const isFetching = env.state<boolean>(false)
      const error = env.state<string | null>(null)
      const updatedAt = env.state<number>(seeded ? seeded.at : 0)
      let generation = 0

      const show = (): void => { data.set(cache.overlay(target(), base)) }
      const restoreFrom = (from: KeptScope): void => {
        // A large copy is kept where only an asynchronous read reaches.
        const asked = generation
        void cache.restore(key, from).then((found) => {
          if (!found || asked !== generation || fetchedAt)
            return
          base = found.data as T
          updatedAt.set(found.at)
          show()
        })
      }
      if (!seeded)
        restoreFrom(scope)

      // Signed in as someone else since: their data, not the last person's.
      const followScope = (): void => {
        const now = scopeNow()
        if (now === scope)
          return
        scope = now
        generation++
        inflight = null
        fetchedAt = 0
        const found = cache.seed(key, scope)
        base = found ? found.data as T : initial
        updatedAt.set(found ? found.at : 0)
        show()
        if (!found)
          restoreFrom(scope)
      }

      const request = (force: boolean): Promise<T> => {
        const url = urlNow()
        const timeout = opts.timeoutMs || 15000
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
        let timer: ReturnType<typeof setTimeout> | null = null
        const expired = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            if (controller)
              controller.abort()
            reject(new Error('The request took too long.'))
          }, timeout)
        })
        let work: Promise<unknown>
        if (opts.load) {
          work = opts.load({ force, url, signal: controller ? controller.signal : undefined })
        }
        else if (url) {
          const send = opts.fetch || ((u: string, init: RequestInit) => fetch(u, init))
          const init: RequestInit = { method: 'GET', headers: { Accept: 'application/json' } }
          // Past the offline worker's kept copy and the HTTP cache: a pull to
          // refresh has to show what the server has now.
          if (force)
            init.cache = 'no-cache'
          if (controller)
            init.signal = controller.signal
          work = send(url, init).then((response) => {
            if (!response.ok) {
              return response.json().catch(() => null).then((body: any) => {
                throw new Error((body && (body.error || body.message)) || `Request failed (${response.status})`)
              })
            }
            return response.json()
          })
        }
        else {
          return Promise.resolve(data())
        }
        return Promise.race([work, expired]).then((raw) => {
          if (timer)
            clearTimeout(timer)
          return (opts.transform ? opts.transform(raw) : raw) as T
        }, (cause) => {
          if (timer)
            clearTimeout(timer)
          throw cause
        })
      }

      const run = (force: boolean): Promise<T> => {
        if (inflight)
          return inflight
        const asked = generation
        isFetching.set(true)
        if (fetchedAt === 0 && !updatedAt())
          loading.set(true)
        const done = (): void => {
          if (asked !== generation)
            return
          inflight = null
          isFetching.set(false)
          loading.set(false)
        }
        const promise = request(force).then((value) => {
          if (asked !== generation)
            return data()
          base = value
          fetchedAt = Date.now()
          updatedAt.set(fetchedAt)
          error.set(null)
          cache.persist(key, value, scope)
          show()
          done()
          return data()
        }, (cause) => {
          if (asked === generation)
            error.set(cause && cause.message ? cause.message : 'Could not load.')
          done()
          return data()
        })
        inflight = promise
        return promise
      }

      const query: CachedQuery<T> & { __options: (o: CachedQueryOptions<T>) => void } = {
        data,
        loading,
        isFetching,
        error,
        updatedAt,
        get key() { return key },
        load(force) {
          followScope()
          if (!force && fetchedAt && Date.now() - fetchedAt < (opts.staleTime || 0))
            return Promise.resolve(data())
          return run(!!force)
        },
        refresh() {
          return query.load(true)
        },
        set(value) {
          base = typeof value === 'function' ? (value as (current: T) => T)(base) : value
          cache.persist(key, base, scope)
          show()
        },
        invalidate() {
          fetchedAt = 0
        },
        __options(next) {
          opts = { ...opts, ...next }
        },
      }

      watchers.add({
        target,
        updated: () => {
          // The worker already holds the newer answer: an ordinary read gets it.
          if (fetchedAt || updatedAt())
            void run(false)
        },
        outbox: (sent) => {
          if (sent) {
            // Reached the server: keep showing it until the next answer
            // includes it, rather than flash back to the copy from before.
            base = cache.overlay(target(), base, sent.id)
            fetchedAt = 0
            void run(true)
          }
          show()
        },
      })
      queries.set(key, query)
      if (opts.immediate)
        void query.load()
      return query
    },
  }

  const events: any = typeof window !== 'undefined' ? window : (typeof addEventListener === 'function' ? globalThis : null)
  if (env.listen !== false && events && typeof events.addEventListener === 'function') {
    events.addEventListener('stx:updated', (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      if (detail.kind !== 'api' || typeof detail.url !== 'string')
        return
      watchers.forEach((watcher) => {
        if (matches(detail.url, watcher.target()))
          watcher.updated()
      })
    })
    events.addEventListener('stx:outbox', (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const sent = detail.sent && typeof detail.sent.id === 'string' ? detail.sent : null
      watchers.forEach((watcher) => {
        if (sent) {
          const affects: string[] = Array.isArray(sent.affects) ? sent.affects : []
          const t = watcher.target()
          if (!affects.some(item => matches(item, t)))
            return
        }
        watcher.outbox(sent)
      })
    })
  }

  return cache
}
