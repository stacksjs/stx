/**
 * Route Middleware System
 *
 * Nuxt-style route middleware for stx with proper async support.
 *
 * ## Usage
 *
 * ```typescript
 * // middleware/auth.ts
 * export default defineMiddleware(async (context) => {
 *   const { to, from, cookies, isClient, isServer } = context
 *
 *   const token = cookies.get('auth_token')
 *   if (!token) {
 *     return navigateTo('/login')
 *   }
 * })
 * ```
 *
 * ```html
 * <!-- pages/dashboard.stx -->
 * <script>
 * definePageMeta({
 *   middleware: 'auth'
 * })
 * </script>
 * ```
 *
 * @module route-middleware
 */

import fs from 'node:fs'
import path from 'node:path'
import type { PageMeta } from './head'

// =============================================================================
// Types
// =============================================================================

/**
 * Route location information
 */
export interface RouteLocation {
  /** URL path (e.g., /dashboard) */
  path: string
  /** Route parameters from dynamic segments */
  params: Record<string, string>
  /** Query string parameters */
  query: Record<string, string>
  /** Full URL path including query string */
  fullPath: string
  /** Page metadata from definePageMeta() */
  meta: PageMeta
}

/**
 * Cookie manager for reading/writing cookies
 */
export interface CookieManager {
  /** Get a cookie value by name */
  get(name: string): string | undefined
  /** Set a cookie */
  set(name: string, value: string, options?: CookieOptions): void
  /** Delete a cookie */
  delete(name: string): void
  /** Get all cookies as an object */
  getAll(): Record<string, string>
}

/**
 * Cookie options for setting cookies
 */
export interface CookieOptions {
  /** Expiration date or max age in seconds */
  expires?: Date | number
  /** Path for the cookie */
  path?: string
  /** Domain for the cookie */
  domain?: string
  /** Secure flag (HTTPS only) */
  secure?: boolean
  /** HttpOnly flag */
  httpOnly?: boolean
  /** SameSite policy */
  sameSite?: 'strict' | 'lax' | 'none'
}

/**
 * Safe localStorage wrapper (returns null on server)
 */
export interface StorageManager {
  /** Get a value from localStorage */
  get(key: string): string | null
  /** Set a value in localStorage */
  set(key: string, value: string): void
  /** Remove a value from localStorage */
  remove(key: string): void
  /** Check if storage is available */
  isAvailable(): boolean
}

/**
 * Middleware context passed to handlers
 */
export interface MiddlewareContext {
  /** Target route being navigated to */
  to: RouteLocation
  /** Previous route (null on initial load) */
  from: RouteLocation | null
  /** Whether running in browser */
  isClient: boolean
  /** Whether running on server (SSR) */
  isServer: boolean
  /** Cookie manager (works on both server and client) */
  cookies: CookieManager
  /** localStorage wrapper (only works on client) */
  storage: StorageManager
  /** State to pass to the page */
  state: Record<string, unknown>
  /** Request object (server-side only) */
  request?: Request
  /** Response headers to set (server-side only) */
  responseHeaders: Headers
}

/**
 * Middleware execution mode
 */
export type MiddlewareMode = 'universal' | 'server' | 'client'

/**
 * Middleware handler function
 */
export type RouteMiddlewareHandler = (
  context: MiddlewareContext
) => void | Promise<void> | NavigationResult | Promise<NavigationResult | void>

/**
 * Middleware definition options
 */
export interface MiddlewareOptions {
  /** When to run: 'universal' (both), 'server' (SSR only), 'client' (browser only) */
  mode?: MiddlewareMode
}

/**
 * Registered middleware definition
 */
export interface RouteMiddlewareDefinition {
  /** Middleware handler */
  handler: RouteMiddlewareHandler
  /** Execution mode */
  mode: MiddlewareMode
}

/**
 * Navigation redirect result
 */
export interface NavigateToResult {
  type: 'redirect'
  path: string
  options: NavigateToOptions
}

/**
 * Navigation abort result
 */
export interface AbortNavigationResult {
  type: 'abort'
  error: NavigationError
}

/**
 * Result from middleware (redirect or abort)
 */
export type NavigationResult = NavigateToResult | AbortNavigationResult

/**
 * Options for navigateTo()
 */
export interface NavigateToOptions {
  /** Replace current history entry instead of pushing */
  replace?: boolean
  /** Whether this is an external URL */
  external?: boolean
  /** HTTP redirect code for SSR (default: 302) */
  redirectCode?: 301 | 302 | 303 | 307 | 308
}

/**
 * Navigation error for abortNavigation()
 */
export interface NavigationError {
  /** HTTP status code */
  statusCode: number
  /** Error message */
  message: string
}

// =============================================================================
// Navigation Helpers
// =============================================================================

/**
 * Redirect to a different route
 *
 * @param path - Path to redirect to
 * @param options - Redirect options
 * @returns Navigation result for the middleware system
 *
 * @example
 * ```typescript
 * export default defineMiddleware(async (ctx) => {
 *   if (!ctx.cookies.get('token')) {
 *     return navigateTo('/login')
 *   }
 * })
 * ```
 */
export function navigateTo(path: string, options: NavigateToOptions = {}): NavigateToResult {
  return {
    type: 'redirect',
    path,
    options: {
      replace: options.replace ?? false,
      external: options.external ?? false,
      redirectCode: options.redirectCode ?? 302,
    },
  }
}

/**
 * Abort navigation with an error
 *
 * @param error - Error message or error object
 * @returns Navigation result for the middleware system
 *
 * @example
 * ```typescript
 * export default defineMiddleware(async (ctx) => {
 *   if (!hasPermission(ctx)) {
 *     return abortNavigation({ statusCode: 403, message: 'Forbidden' })
 *   }
 * })
 * ```
 */
export function abortNavigation(error: string | NavigationError): AbortNavigationResult {
  const normalizedError: NavigationError =
    typeof error === 'string' ? { statusCode: 500, message: error } : error

  return {
    type: 'abort',
    error: normalizedError,
  }
}

// =============================================================================
// Middleware Definition
// =============================================================================

/**
 * Define a route middleware
 *
 * @param handler - Middleware handler function
 * @param options - Middleware options
 * @returns Middleware definition
 *
 * @example
 * ```typescript
 * // middleware/auth.ts - runs on both server and client
 * export default defineMiddleware(async (ctx) => {
 *   const token = ctx.cookies.get('auth_token')
 *   if (!token) {
 *     return navigateTo('/login')
 *   }
 * })
 *
 * // middleware/theme.ts - client only (can use localStorage)
 * export default defineMiddleware(async (ctx) => {
 *   const theme = ctx.storage.get('theme')
 *   ctx.state.theme = theme || 'light'
 * }, { mode: 'client' })
 * ```
 */
export function defineMiddleware(
  handler: RouteMiddlewareHandler,
  options: MiddlewareOptions = {}
): RouteMiddlewareDefinition {
  return {
    handler,
    mode: options.mode ?? 'universal',
  }
}

// =============================================================================
// Cookie Manager Implementation
// =============================================================================

/**
 * Parse cookies from a cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  const pairs = cookieHeader.split(';')
  for (const pair of pairs) {
    const [name, ...rest] = pair.split('=')
    if (name) {
      const key = name.trim()
      const value = rest.join('=').trim()
      if (key) {
        cookies[key] = decodeURIComponent(value)
      }
    }
  }
  return cookies
}

/**
 * Serialize a cookie to a Set-Cookie header value
 */
function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (options.expires) {
    const expires =
      typeof options.expires === 'number'
        ? new Date(Date.now() + options.expires * 1000)
        : options.expires
    cookie += `; Expires=${expires.toUTCString()}`
  }

  if (options.path) {
    cookie += `; Path=${options.path}`
  }

  if (options.domain) {
    cookie += `; Domain=${options.domain}`
  }

  if (options.secure) {
    cookie += '; Secure'
  }

  if (options.httpOnly) {
    cookie += '; HttpOnly'
  }

  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`
  }

  return cookie
}

/**
 * Create a cookie manager for server-side usage
 */
export function createServerCookieManager(
  request: Request,
  responseHeaders: Headers
): CookieManager {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies(cookieHeader)

  return {
    get(name: string): string | undefined {
      return cookies[name]
    },
    set(name: string, value: string, options: CookieOptions = {}): void {
      cookies[name] = value
      responseHeaders.append('Set-Cookie', serializeCookie(name, value, options))
    },
    delete(name: string): void {
      delete cookies[name]
      responseHeaders.append(
        'Set-Cookie',
        serializeCookie(name, '', { expires: new Date(0), path: '/' })
      )
    },
    getAll(): Record<string, string> {
      return { ...cookies }
    },
  }
}

/**
 * Create a cookie manager for client-side usage
 */
export function createClientCookieManager(): CookieManager {
  return {
    get(name: string): string | undefined {
      if (typeof document === 'undefined') return undefined
      const cookies = parseCookies(document.cookie)
      return cookies[name]
    },
    set(name: string, value: string, options: CookieOptions = {}): void {
      if (typeof document === 'undefined') return
      document.cookie = serializeCookie(name, value, options)
    },
    delete(name: string): void {
      if (typeof document === 'undefined') return
      document.cookie = serializeCookie(name, '', { expires: new Date(0), path: '/' })
    },
    getAll(): Record<string, string> {
      if (typeof document === 'undefined') return {}
      return parseCookies(document.cookie)
    },
  }
}

// =============================================================================
// Storage Manager Implementation
// =============================================================================

/**
 * Create a storage manager (localStorage wrapper)
 */
export function createStorageManager(): StorageManager {
  const isAvailable =
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

  return {
    get(key: string): string | null {
      if (!isAvailable) return null
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    set(key: string, value: string): void {
      if (!isAvailable) return
      try {
        window.localStorage.setItem(key, value)
      } catch {
        // Storage might be full or blocked
      }
    },
    remove(key: string): void {
      if (!isAvailable) return
      try {
        window.localStorage.removeItem(key)
      } catch {
        // Ignore errors
      }
    },
    isAvailable(): boolean {
      return isAvailable
    },
  }
}

// =============================================================================
// Middleware Registry
// =============================================================================

/** Global middleware registry */
const middlewareRegistry = new Map<string, RouteMiddlewareDefinition>()

/**
 * Register a middleware by name
 */
export function registerMiddleware(name: string, middleware: RouteMiddlewareDefinition): void {
  middlewareRegistry.set(name, middleware)
}

/**
 * Get a middleware by name
 */
export function getMiddleware(name: string): RouteMiddlewareDefinition | undefined {
  return middlewareRegistry.get(name)
}

/**
 * Check if a middleware is registered
 */
export function hasMiddleware(name: string): boolean {
  return middlewareRegistry.has(name)
}

/**
 * Clear all registered middleware
 */
export function clearMiddleware(): void {
  middlewareRegistry.clear()
}

/**
 * Get all registered middleware names
 */
export function getMiddlewareNames(): string[] {
  return Array.from(middlewareRegistry.keys())
}

// =============================================================================
// Middleware Loading
// =============================================================================

/**
 * Load middleware from the middleware/ directory
 */
export async function loadMiddlewareFromDirectory(
  baseDir: string,
  middlewareDir: string = 'middleware'
): Promise<void> {
  const fullPath = path.resolve(baseDir, middlewareDir)

  if (!fs.existsSync(fullPath)) {
    return // No middleware directory, that's fine
  }

  const files = fs.readdirSync(fullPath)

  for (const file of files) {
    // Only process .ts and .js files
    if (!file.endsWith('.ts') && !file.endsWith('.js')) {
      continue
    }

    // Skip test files
    if (file.includes('.test.') || file.includes('.spec.')) {
      continue
    }

    const name = file.replace(/\.(ts|js)$/, '')
    const filePath = path.join(fullPath, file)

    try {
      // Dynamic import the middleware file
      const module = await import(filePath)
      const middleware = module.default

      if (middleware && typeof middleware.handler === 'function') {
        registerMiddleware(name, middleware)
      } else if (typeof middleware === 'function') {
        // Support plain function exports
        registerMiddleware(name, {
          handler: middleware,
          mode: 'universal',
        })
      }
    } catch (error) {
      console.warn(`Failed to load middleware '${name}' from ${filePath}:`, error)
    }
  }
}

// =============================================================================
// Middleware Execution
// =============================================================================

/**
 * Parse query string into object
 */
function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {}
  if (!search) return query

  const params = new URLSearchParams(search)
  for (const [key, value] of params) {
    query[key] = value
  }
  return query
}

/**
 * Create a route location object
 */
export function createRouteLocation(
  pathname: string,
  params: Record<string, string>,
  meta: PageMeta,
  search: string = ''
): RouteLocation {
  return {
    path: pathname,
    params,
    query: parseQuery(search),
    fullPath: search ? `${pathname}?${search}` : pathname,
    meta,
  }
}

/**
 * Create a middleware context
 */
export function createMiddlewareContext(
  to: RouteLocation,
  from: RouteLocation | null,
  request?: Request
): MiddlewareContext {
  const isServer = typeof window === 'undefined'
  const isClient = !isServer
  const responseHeaders = new Headers()

  return {
    to,
    from,
    isClient,
    isServer,
    cookies: isServer && request
      ? createServerCookieManager(request, responseHeaders)
      : createClientCookieManager(),
    storage: createStorageManager(),
    state: {},
    request,
    responseHeaders,
  }
}

/**
 * Result of running middleware chain
 */
export interface MiddlewareResult {
  /** Whether all middleware passed */
  passed: boolean
  /** Redirect result if any middleware returned navigateTo() */
  redirect?: NavigateToResult
  /** Abort result if any middleware returned abortNavigation() */
  abort?: AbortNavigationResult
  /** State accumulated from all middleware */
  state: Record<string, unknown>
  /** Response headers to set */
  responseHeaders: Headers
}

/**
 * Run middleware chain for a route
 *
 * @param middlewareNames - Names of middleware to run
 * @param context - Middleware context
 * @returns Result of middleware execution
 */
export async function runMiddleware(
  middlewareNames: string | string[],
  context: MiddlewareContext
): Promise<MiddlewareResult> {
  const names = Array.isArray(middlewareNames) ? middlewareNames : [middlewareNames]
  const isServer = context.isServer

  for (const name of names) {
    const middleware = getMiddleware(name)

    if (!middleware) {
      console.warn(`Middleware '${name}' not found`)
      continue
    }

    // Check if middleware should run in current environment
    if (middleware.mode === 'server' && !isServer) {
      continue
    }
    if (middleware.mode === 'client' && isServer) {
      continue
    }

    try {
      const result = await middleware.handler(context)

      if (result) {
        if (result.type === 'redirect') {
          return {
            passed: false,
            redirect: result,
            state: context.state,
            responseHeaders: context.responseHeaders,
          }
        }

        if (result.type === 'abort') {
          return {
            passed: false,
            abort: result,
            state: context.state,
            responseHeaders: context.responseHeaders,
          }
        }
      }
    } catch (error) {
      console.error(`Error in middleware '${name}':`, error)
      return {
        passed: false,
        abort: {
          type: 'abort',
          error: {
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Middleware error',
          },
        },
        state: context.state,
        responseHeaders: context.responseHeaders,
      }
    }
  }

  return {
    passed: true,
    state: context.state,
    responseHeaders: context.responseHeaders,
  }
}
