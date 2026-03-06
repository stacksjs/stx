import type { AsyncDataResult, FetchOptions } from './types'

export function useAsyncData<T>(
  key: string,
  handler: () => Promise<T>,
  options?: { lazy?: boolean, server?: boolean, default?: () => T },
): AsyncDataResult<T> {
  const result: AsyncDataResult<T> = {
    data: options?.default?.() ?? null,
    pending: true,
    error: null,
    refresh: async () => {
      result.pending = true
      result.error = null
      try {
        result.data = await handler()
      }
      catch (err) {
        result.error = err instanceof Error ? err : new Error(String(err))
      }
      finally {
        result.pending = false
      }
    },
  }

  // Auto-execute unless lazy
  if (!options?.lazy) {
    handler()
      .then((data) => {
        result.data = data
        result.pending = false
      })
      .catch((err) => {
        result.error = err instanceof Error ? err : new Error(String(err))
        result.pending = false
      })
  }
  else {
    result.pending = false
  }

  return result
}

export function useFetch<T>(
  url: string,
  options?: FetchOptions,
): AsyncDataResult<T> {
  const fetchHandler = async (): Promise<T> => {
    const { key: _key, lazy: _lazy, pick, server: _server, default: _default, ...fetchInit } = options ?? {}
    const response = await fetch(url, fetchInit)

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
    }

    let data = await response.json() as T

    // Pick specific fields
    if (pick && typeof data === 'object' && data !== null) {
      const picked: Record<string, unknown> = {}
      for (const field of pick) {
        if (field in (data as any)) {
          picked[field] = (data as any)[field]
        }
      }
      data = picked as T
    }

    return data
  }

  return useAsyncData(
    options?.key ?? url,
    fetchHandler,
    {
      lazy: options?.lazy,
      server: options?.server,
      default: options?.default as (() => T) | undefined,
    },
  )
}
