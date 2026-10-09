/**
 * cachedQuery - data kept per account, shown at once, refreshed behind
 *
 * The module-import twin of `window.stx.cachedQuery` (the browser runtime
 * embeds the same implementation, offline/query-cache.ts). A store keeps its
 * API data with it rather than by hand:
 *
 * @example
 * ```ts
 * const calendar = cachedQuery('calendar', {
 *   url: '/api/health/calendar-week',
 *   fetch: (url, init) => auth().authFetch(url, init),
 *   scope: () => phoneScope(),
 *   staleTime: 2 * 60_000,
 *   initial: {},
 * })
 * calendar.data()      // last time's calendar, at once
 * await calendar.load() // fetched again when older than staleTime; one request for every caller
 * await calendar.refresh() // a pull to refresh: past every cache
 * ```
 *
 * Writes queued in the outbox with `affects: ['/api/health/calendar-week']`
 * are applied on top of `data()` until they reach the server, and the query
 * refetches when one does, or when the offline worker says the answer
 * changed.
 */
import type { CachedQuery, CachedQueryOptions, KeptScope, QueryCache } from '../offline/query-cache'
import type { KeptStore } from '../offline/kept-store'
import { createKeptStore, indexedDbBackend } from '../offline/kept-store'
import { createQueryCache, queryTargetMatches } from '../offline/query-cache'
import { state } from '../signals-api'

export type { CachedQuery, CachedQueryOptions, KeptScope } from '../offline/query-cache'

let kept: KeptStore | null = null
let queries: QueryCache | null = null

/** The page's kept store (localStorage for small values, IndexedDB for large). */
export function keptStore(): KeptStore {
  if (!kept)
    kept = createKeptStore(undefined, indexedDbBackend)
  return kept
}

/** The page's query layer. */
export function queryCache(): QueryCache {
  if (!queries)
    queries = createQueryCache({ state: state as any, kept: keptStore(), matches: queryTargetMatches })
  return queries
}

/** A query kept per account and refreshed behind. Calling it again with the same key returns the same query. */
export function cachedQuery<T = unknown>(key: string, options?: CachedQueryOptions<T>): CachedQuery<T> {
  return queryCache().cachedQuery<T>(key, options)
}

/**
 * The account kept state and cached queries belong to when they name no
 * scope: set it on sign-in (and to `false` on sign-out, with `forgetKeptState()`).
 */
export function setKeptScope(scope: KeptScope): void {
  queryCache().setScope(scope)
}

/** Finish writing what is kept. */
export function flushKeptState(): Promise<void> {
  return keptStore().flush()
}

/** @internal Start over, for tests. */
export function resetKeptState(): void {
  kept = null
  queries = null
}
