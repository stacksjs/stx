export interface Route {
  pattern: string
  regex: RegExp
  params: string[]
  filePath: string
  isDynamic: boolean
  layout?: string
  middleware?: string[]
  meta?: Record<string, unknown>
}

export interface RouteMatch {
  route: Route
  params: Record<string, string>
}

export interface RouterConfig {
  /**
   * Single page root. Resolved relative to `baseDir`. Default: `'pages'`.
   *
   * Use `pagesDirs` instead when you want a stack of roots (e.g. user
   * views on top, framework defaults underneath).
   */
  pagesDir?: string
  /**
   * Stack of page roots, scanned in order. The first match for any
   * given route pattern wins, so earlier entries override later ones.
   *
   * Useful for app frameworks that ship default views (cart, checkout,
   * orders) but want apps to override individual pages by dropping a
   * file with the same name into their own views directory.
   *
   * If both `pagesDir` and `pagesDirs` are set, `pagesDirs` takes precedence.
   */
  pagesDirs?: string[]
  /**
   * Where the generated route manifest and route types are written.
   * Resolved relative to `baseDir`. Default: `.stx`, or `STX_DIR` when set.
   *
   * stx calls this its state directory and lets a project move it (a Stacks
   * application points it at `storage/framework/stx` so nothing generated sits
   * in the project root). The router is standalone, so it reads the same
   * environment variable rather than depending on stx to tell it.
   */
  stateDir?: string
  extensions?: string[]
  layouts?: boolean
  middleware?: boolean
  trailingSlash?: boolean
  caseSensitive?: boolean
}

export interface RouteLocation {
  path: string
  params: Record<string, string>
  query: Record<string, string>
  fullPath: string
  meta: Record<string, unknown>
}

export interface CookieOptions {
  expires?: Date | number
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

export interface CookieManager {
  get(name: string): string | undefined
  set(name: string, value: string, options?: CookieOptions): void
  delete(name: string): void
  getAll(): Record<string, string>
}

export interface StorageManager {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
  isAvailable(): boolean
}

export interface MiddlewareContext {
  to: RouteLocation
  from: RouteLocation | null
  isClient: boolean
  isServer: boolean
  cookies: CookieManager
  storage: StorageManager
  state: Record<string, unknown>
  request?: Request
  responseHeaders: Headers
}

// 'client' was removed (stacksjs/stx#1891): the SPA router is a stringified
// runtime with no access to this registry, and every runMiddleware caller is a
// server process, so a client-mode guard could never run. Keeping the mode was
// an API that looked like a browser-side security boundary while doing nothing —
// worse than not having it. If browser-side UX guards are wanted, they belong in
// a separately named, non-enforcement API.
export type MiddlewareMode = 'universal' | 'server'

export type RouteMiddlewareHandler = (
  context: MiddlewareContext,
) => void | Promise<void> | NavigationResult | Promise<NavigationResult | void>

export interface MiddlewareOptions {
  mode?: MiddlewareMode
}

export interface RouteMiddlewareDefinition {
  handler: RouteMiddlewareHandler
  mode: MiddlewareMode
}

export interface NavigateToOptions {
  replace?: boolean
  external?: boolean
  redirectCode?: 301 | 302 | 303 | 307 | 308
}

export interface NavigateToResult {
  type: 'redirect'
  path: string
  options: NavigateToOptions
}

export interface NavigationError {
  statusCode: number
  message: string
}

export interface AbortNavigationResult {
  type: 'abort'
  error: NavigationError
}

export type NavigationResult = NavigateToResult | AbortNavigationResult

export interface MiddlewareResult {
  passed: boolean
  redirect?: NavigateToResult
  abort?: AbortNavigationResult
  state: Record<string, unknown>
  responseHeaders: Headers
}

interface RouteDefinition {
  path: string
  name?: string
  params?: Record<string, any>
}
