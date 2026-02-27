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
  /** Custom cache key (defaults to URL) */
  cacheKey?: string
  /** Request headers */
  headers?: Record<string, string>
  /** Transform the response before storing */
  transform?: (data: unknown) => T
  /** Refetch when tab regains focus */
  refetchOnFocus?: boolean
  /** Polling interval in ms */
  refetchInterval?: number
  /** Whether to fetch immediately on mount (default: true) */
  immediate?: boolean
  /** Success callback */
  onSuccess?: (data: T) => void
  /** Error callback */
  onError?: (error: Error) => void
}

export interface UseQueryResult<T = unknown> {
  /** Reactive data signal */
  data: { (): T | null, set: (v: T | null) => void }
  /** Reactive loading signal */
  loading: { (): boolean, set: (v: boolean) => void }
  /** Reactive error signal */
  error: { (): string | null, set: (v: string | null) => void }
  /** Whether the data is stale and being revalidated */
  isStale: { (): boolean, set: (v: boolean) => void }
  /** Manually trigger a refetch */
  refetch: () => Promise<void>
  /** Invalidate cache and refetch */
  invalidate: () => Promise<void>
}

export interface UseMutationOptions<T = unknown> {
  /** HTTP method (default: 'POST') */
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Request headers */
  headers?: Record<string, string>
  /** Transform the response */
  transform?: (data: unknown) => T
  /** Optimistic data to set before the request completes */
  optimisticData?: T | ((body: unknown) => T)
  /** Query cache keys to invalidate on success */
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
