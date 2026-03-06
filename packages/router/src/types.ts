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
  pagesDir?: string
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

export type MiddlewareMode = 'universal' | 'server' | 'client'

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
