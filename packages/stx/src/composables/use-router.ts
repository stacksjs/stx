/**
 * useRouter - Navigation composable for STX applications
 *
 * Provides clean APIs for navigation without raw `window.location` or `window.history`.
 * These are server-safe stubs; the actual runtime implementations live in signals.ts.
 */

export interface RouteInfo {
  /** Current pathname (e.g., '/about') */
  path: string
  /** Full path including search and hash */
  fullPath: string
  /** URL hash (e.g., '#section') */
  hash: string
  /** Parsed query parameters */
  query: Record<string, string>
  /** Route params from dynamic segments (requires stxRouter) */
  params: Record<string, string>
}

export interface SearchParamsRef {
  /** Reactive signal containing current search params */
  data: { (): Record<string, string>, set: (v: Record<string, string>) => void }
  /** Get a single param value */
  get: (key: string) => string | undefined
  /** Set a single param and push to history */
  set: (key: string, value: string) => void
  /** Set multiple params and push to history */
  setAll: (obj: Record<string, string>) => void
}

/**
 * Navigate to a URL. Uses stxRouter if available, otherwise falls back to location.href.
 *
 * @example
 * ```ts
 * navigate('/about')
 * navigate('https://example.com')
 * ```
 */
export function navigate(url: string): void {
  if (typeof window !== 'undefined') {
    if ((window as any).stxRouter?.navigate) {
      ;(window as any).stxRouter.navigate(url)
    }
    else {
      window.location.href = url
    }
  }
}

/**
 * Go back in browser history.
 */
export function goBack(): void {
  if (typeof window !== 'undefined') {
    window.history.back()
  }
}

/**
 * Go forward in browser history.
 */
export function goForward(): void {
  if (typeof window !== 'undefined') {
    window.history.forward()
  }
}

/**
 * Get reactive route information.
 *
 * @example
 * ```ts
 * const route = useRoute()
 * console.log(route.path)   // '/about'
 * console.log(route.query)  // { page: '2' }
 * ```
 */
export function useRoute(): RouteInfo {
  if (typeof window === 'undefined') {
    return { path: '/', fullPath: '/', hash: '', query: {}, params: {} }
  }
  return {
    get path() { return window.location.pathname },
    get fullPath() { return window.location.pathname + window.location.search + window.location.hash },
    get hash() { return window.location.hash },
    get query() {
      const params: Record<string, string> = {}
      new URLSearchParams(window.location.search).forEach((v, k) => { params[k] = v })
      return params
    },
    get params() { return (window as any).stxRouter?.params ?? {} },
  }
}

/**
 * Reactive URL search parameters with get/set/setAll methods.
 *
 * @example
 * ```ts
 * const search = useSearchParams()
 * search.set('page', '2')
 * console.log(search.get('page')) // '2'
 * ```
 */
export function useSearchParams(): SearchParamsRef {
  // Server stub
  const noop = Object.assign(() => ({}), { set: () => {} })
  return { data: noop as any, get: () => undefined, set: () => {}, setAll: () => {} }
}
