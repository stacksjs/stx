/**
 * useRouter - Navigation composable for STX applications
 *
 * Provides clean APIs for navigation without raw `window.location` or `window.history`.
 * In a browser these delegate to the client runtime (signals.ts) when it is
 * present, fall back to a real implementation when it is not, and degrade to
 * inert stubs on the server.
 */
import { state } from '../signals-api'

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

/**
 * How a search-param mutation is written to session history.
 *
 * Spelled `{ replace }` to match `navigate()`, which already takes it — before
 * this the two halves of the routing API disagreed on whether replacing was
 * expressible at all.
 */
export interface SearchParamsCommitOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean
}

export interface SearchParamsRef {
  /** Reactive signal containing current search params */
  data: { (): Record<string, string>, set: (v: Record<string, string>) => void }
  /** Get a single param value. `undefined` when absent. */
  get: (key: string) => string | undefined
  /** Whether the param is present. */
  has: (key: string) => boolean
  /**
   * Set a single param. Pushes a history entry unless `replace` is passed.
   *
   * Pass `{ replace: true }` when the URL change should not be a place the user
   * can go Back to — see `delete` for the case that makes this necessary.
   */
  set: (key: string, value: string, options?: SearchParamsCommitOptions) => void
  /**
   * Remove a param. Pushes a history entry unless `replace` is passed.
   *
   * CONSUMING a one-shot param — an OAuth callback result, `?checkout=success`,
   * a flash token — needs `{ replace: true }`. With the default push, the URL
   * that still carries the param becomes the previous history entry, so Back
   * replays the callback and re-runs whatever consuming it triggered (#1825).
   */
  delete: (key: string, options?: SearchParamsCommitOptions) => void
  /** Set multiple params. Pushes a history entry unless `replace` is passed. */
  setAll: (obj: Record<string, string>, options?: SearchParamsCommitOptions) => void
}

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean
  /** Bypass the SPA router and perform a full document load. */
  reload?: boolean
}

/**
 * Navigate to a URL. Uses stxRouter if available, otherwise falls back to a
 * full document load.
 *
 * Kept in step with the client runtime's `navigate` (#1807), which used to take
 * a bare `forceReload` boolean while the shipped declaration promised
 * `{ replace }` — so `navigate(url, { replace: true })` type-checked and then
 * did a full load that PUSHED a history entry.
 *
 * @example
 * ```ts
 * navigate('/about')
 * navigate('/dashboard', { replace: true })
 * navigate('/legacy', { reload: true })
 * ```
 */
export function navigate(url: string, options?: NavigateOptions | boolean): void {
  if (typeof window === 'undefined')
    return

  // A bare boolean still means "full reload" — the shape that actually shipped.
  const opts: NavigateOptions = (options && typeof options === 'object') ? options : { reload: !!options }
  const router = (window as any).stxRouter

  if (!opts.reload && router?.navigate) {
    router.navigate(url, { replace: !!opts.replace })
    return
  }

  if (opts.replace)
    window.location.replace(url)
  else
    window.location.href = url
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
  // Runtime version in signals.ts uses reactive state for params
  if ((window as any).stx?.useRoute) {
    return (window as any).stx.useRoute()
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
    get params() { return (window as any).stx?._rp ?? {} },
  }
}

/**
 * Set route params (called by server injection or page scripts).
 */
export function setRouteParams(params: Record<string, string>): void {
  if (typeof window !== 'undefined' && (window as any).stx?.setRouteParams) {
    (window as any).stx.setRouteParams(params)
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
  // Delegate to the client runtime when it is present, exactly as useRoute does
  // above. This used to be a server stub in EVERY environment, browser
  // included — every write silently did nothing, so a `functions/` composable
  // importing it (the layout the docs prescribe) got a handle that dropped
  // every set() on the floor (#1806).
  if (typeof window !== 'undefined' && (window as any).stx?.useSearchParams)
    return (window as any).stx.useSearchParams()

  if (typeof window === 'undefined') {
    const noop = Object.assign(() => ({}), { set: () => {} })
    return {
      data: noop as any,
      get: () => undefined,
      has: () => false,
      set: () => {},
      delete: () => {},
      setAll: () => {},
    }
  }

  const read = (): Record<string, string> => {
    const out: Record<string, string> = {}
    new URLSearchParams(window.location.search).forEach((v, k) => { out[k] = v })
    return out
  }

  const data = state<Record<string, string>>(read())
  const sync = () => data.set(read())
  window.addEventListener('popstate', sync)
  window.addEventListener('stx:navigate', sync)

  const commit = (url: URL, options?: SearchParamsCommitOptions) => {
    // Deliberately the same test as the client runtime's commit
    // (signals.ts) — `options?.replace` alone diverges from it on '',
    // because optional chaining only short-circuits on null/undefined and
    // String.prototype.replace is truthy. Same call, two entry points, opposite
    // history semantics is exactly what this composable must not have.
    const replace = !!(options && typeof options === 'object' && options.replace)
    if (replace)
      window.history.replaceState({}, '', url)
    else
      window.history.pushState({}, '', url)
    sync()
  }
  // Own-property reads only: the backing object would otherwise inherit
  // Object.prototype and return a function for 'toString', 'constructor', …
  const has = (key: string) => Object.prototype.hasOwnProperty.call(data(), key)

  return {
    data: data as any,
    get: key => (has(key) ? data()[key] : undefined),
    has,
    set: (key, value, options) => {
      const url = new URL(window.location.href)
      url.searchParams.set(key, value)
      commit(url, options)
    },
    delete: (key, options) => {
      const url = new URL(window.location.href)
      url.searchParams.delete(key)
      commit(url, options)
    },
    setAll: (obj, options) => {
      const url = new URL(window.location.href)
      for (const [k, v] of Object.entries(obj)) url.searchParams.set(k, v)
      commit(url, options)
    },
  }
}
