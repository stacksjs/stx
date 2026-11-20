/**
 * useQuery / useMutation - Data fetching composable types for STX
 *
 * Runtime implementations live in signals.ts. These are TypeScript interfaces
 * and server-safe stubs.
 */

export interface UseQueryOptions<T = unknown> {
  /** Initial data before first fetch */
  initialData?: T
  /** Time in ms before cached data is considered stale (0 = always stale) */
  staleTime?: number
  /** Time in ms to keep data in cache (default: 300000 / 5 min) */
  cacheTime?: number
  /** Logical key for invalidation and mutation snapshots (defaults to URL). */
  cacheKey?: string
  /** Request headers. A getter can provide reactive headers. */
  headers?: HeadersInit | (() => HeadersInit)
  /** Match a server snapshot declared with useServerData. */
  key?: string
  /** Reuse matching server data (default: true when a key is provided). */
  hydrate?: boolean
  /** Refresh a hydrated value in the background on the initial mount. */
  revalidateOnMount?: boolean
  /** Transform the response before storing */
  transform?: (data: any) => T
  /** Refetch when tab regains focus */
  refetchOnFocus?: boolean
  /** Polling interval in ms */
  refetchInterval?: number
  /** Whether to start automatically on mount (default: true). */
  immediate?: boolean
  /** Gate automatic requests. Manual refetch and invalidate can still run. */
  enabled?: boolean | (() => boolean)
  /** Stop polling on the first error. */
  stopOnError?: boolean
  /** Send initial loading and errors to the nearest Suspense boundary. */
  suspense?: boolean
  /** Success callback */
  onSuccess?: (data: T) => void
  /** Error callback */
  onError?: (error: Error) => void
  /**
   * Keep the answer on the device, per account, and seed the next visit with
   * it synchronously (refreshed behind, not under a spinner). `true` keeps it
   * under the query's key; a string names it.
   */
  keep?: boolean | string
  /** Scope for shared and kept results. Defaults to the account given to setKeptScope. */
  scope?: string | number | false | null
}

/** How one run of a request should behave. */
export interface QueryRefetchOptions {
  /**
   * Refresh without touching `loading` or clearing the current error.
   *
   * A poll refreshes data already on screen, so driving the first-load state
   * from it puts a spinner over a populated view every tick (#1929). Bind
   * `isFetching` for a subtle in-flight indicator instead.
   */
  background?: boolean
}

export interface UseQueryResult<T = unknown> {
  /** Reactive data signal */
  data: { (): T | null, set: (v: T | null) => void }
  /** True while a first-load request is in flight. A background one leaves it alone. */
  loading: { (): boolean, set: (v: boolean) => void }
  /** True while ANY request is in flight, background ones included. */
  isFetching: { (): boolean, set: (v: boolean) => void }
  /** Reactive error signal */
  error: { (): string | null, set: (v: string | null) => void }
  /** Whether the data is stale and being revalidated */
  isStale: { (): boolean, set: (v: boolean) => void }
  /** Manually trigger a refetch */
  // eslint-disable-next-line pickier/no-unused-vars
  refetch: (options?: QueryRefetchOptions) => Promise<void>
  /** Invalidate cache and refetch */
  // eslint-disable-next-line pickier/no-unused-vars
  invalidate: (options?: QueryRefetchOptions) => Promise<void>
}

export interface UseMutationOptions<T = unknown> {
  /** HTTP method (default: 'POST') */
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Request headers */
  headers?: Record<string, string>
  /** Transform the response */
  transform?: (data: unknown) => T
  /** Optimistic data to set before the request completes */
  // eslint-disable-next-line pickier/no-unused-vars
  optimisticData?: T | ((body: unknown) => T)
  /** Evict these keys and refresh active consumers in the background on success. */
  invalidateQueries?: string[]
  /** Success callback */
  onSuccess?: (data: T) => void
  /** Error callback */
  onError?: (error: Error) => void
}

export interface UseMutationResult<T = unknown> {
  /** Reactive data signal */
  data: { (): T | null, set: (v: T | null) => void }
  /** Reactive loading signal */
  loading: { (): boolean, set: (v: boolean) => void }
  /** Reactive error signal */
  error: { (): string | null, set: (v: string | null) => void }
  /** Execute the mutation */
  mutate: (body?: unknown) => Promise<T>
  /** Reset state to initial */
  reset: () => void
}
