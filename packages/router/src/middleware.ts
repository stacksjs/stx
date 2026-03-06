import fs from 'node:fs'
import path from 'node:path'
import type {
  AbortNavigationResult,
  CookieManager,
  CookieOptions,
  MiddlewareContext,
  MiddlewareMode,
  MiddlewareOptions,
  MiddlewareResult,
  NavigateToOptions,
  NavigateToResult,
  NavigationError,
  NavigationResult,
  RouteLocation,
  RouteMiddlewareDefinition,
  RouteMiddlewareHandler,
  StorageManager,
} from './types'

// =============================================================================
// Navigation Helpers
// =============================================================================

export function navigateTo(navPath: string, options: NavigateToOptions = {}): NavigateToResult {
  return {
    type: 'redirect',
    path: navPath,
    options: {
      replace: options.replace ?? false,
      external: options.external ?? false,
      redirectCode: options.redirectCode ?? 302,
    },
  }
}

export function abortNavigation(error: string | NavigationError): AbortNavigationResult {
  const normalizedError: NavigationError
    = typeof error === 'string' ? { statusCode: 500, message: error } : error

  return {
    type: 'abort',
    error: normalizedError,
  }
}

// =============================================================================
// Middleware Definition
// =============================================================================

export function defineMiddleware(
  handler: RouteMiddlewareHandler,
  options: MiddlewareOptions = {},
): RouteMiddlewareDefinition {
  return {
    handler,
    mode: options.mode ?? 'universal',
  }
}

// =============================================================================
// Cookie Manager
// =============================================================================

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

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (options.expires) {
    const expires
      = typeof options.expires === 'number'
        ? new Date(Date.now() + options.expires * 1000)
        : options.expires
    cookie += `; Expires=${expires.toUTCString()}`
  }

  if (options.path) cookie += `; Path=${options.path}`
  if (options.domain) cookie += `; Domain=${options.domain}`
  if (options.secure) cookie += '; Secure'
  if (options.httpOnly) cookie += '; HttpOnly'
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`

  return cookie
}

export function createServerCookieManager(
  request: Request,
  responseHeaders: Headers,
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
        serializeCookie(name, '', { expires: new Date(0), path: '/' }),
      )
    },
    getAll(): Record<string, string> {
      return { ...cookies }
    },
  }
}

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
// Storage Manager
// =============================================================================

export function createStorageManager(): StorageManager {
  const available
    = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

  return {
    get(key: string): string | null {
      if (!available) return null
      try { return window.localStorage.getItem(key) }
      catch { return null }
    },
    set(key: string, value: string): void {
      if (!available) return
      try { window.localStorage.setItem(key, value) }
      catch { /* storage full or blocked */ }
    },
    remove(key: string): void {
      if (!available) return
      try { window.localStorage.removeItem(key) }
      catch { /* ignore */ }
    },
    isAvailable(): boolean {
      return available
    },
  }
}

// =============================================================================
// Middleware Registry
// =============================================================================

const middlewareRegistry = new Map<string, RouteMiddlewareDefinition>()

export function registerMiddleware(name: string, middleware: RouteMiddlewareDefinition): void {
  middlewareRegistry.set(name, middleware)
}

export function getMiddleware(name: string): RouteMiddlewareDefinition | undefined {
  return middlewareRegistry.get(name)
}

export function hasMiddleware(name: string): boolean {
  return middlewareRegistry.has(name)
}

export function clearMiddleware(): void {
  middlewareRegistry.clear()
}

export function getMiddlewareNames(): string[] {
  return Array.from(middlewareRegistry.keys())
}

// =============================================================================
// Middleware Loading
// =============================================================================

export async function loadMiddlewareFromDirectory(
  baseDir: string,
  middlewareDir: string = 'middleware',
): Promise<void> {
  const fullPath = path.resolve(baseDir, middlewareDir)

  if (!fs.existsSync(fullPath)) {
    return
  }

  const files = fs.readdirSync(fullPath)

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue
    if (file.includes('.test.') || file.includes('.spec.')) continue

    const name = file.replace(/\.(ts|js)$/, '')
    const filePath = path.join(fullPath, file)

    try {
      const mod = await import(filePath)
      const mw = mod.default

      if (mw && typeof mw.handler === 'function') {
        registerMiddleware(name, mw)
      }
      else if (typeof mw === 'function') {
        registerMiddleware(name, { handler: mw, mode: 'universal' })
      }
    }
    catch (error) {
      console.warn(`Failed to load middleware '${name}' from ${filePath}:`, error)
    }
  }
}

// =============================================================================
// Middleware Context & Execution
// =============================================================================

function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {}
  if (!search) return query

  const params = new URLSearchParams(search)
  for (const [key, value] of params) {
    query[key] = value
  }
  return query
}

export function createRouteLocation(
  pathname: string,
  params: Record<string, string>,
  meta: Record<string, unknown>,
  search: string = '',
): RouteLocation {
  return {
    path: pathname,
    params,
    query: parseQuery(search),
    fullPath: search ? `${pathname}?${search}` : pathname,
    meta,
  }
}

export function createMiddlewareContext(
  to: RouteLocation,
  from: RouteLocation | null,
  request?: Request,
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

export async function runMiddleware(
  middlewareNames: string | string[],
  context: MiddlewareContext,
): Promise<MiddlewareResult> {
  const names = Array.isArray(middlewareNames) ? middlewareNames : [middlewareNames]
  const isServer = context.isServer

  for (const name of names) {
    const middleware = getMiddleware(name)

    if (!middleware) {
      console.warn(`Middleware '${name}' not found`)
      continue
    }

    if (middleware.mode === 'server' && !isServer) continue
    if (middleware.mode === 'client' && isServer) continue

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
    }
    catch (error) {
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
