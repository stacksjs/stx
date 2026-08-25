/**
 * Server-Side Rendering Module for STX
 *
 * Provides traditional server-rendered web app functionality:
 * - Session-based authentication
 * - Form submissions (POST, not JSON)
 * - CSRF protection
 * - Server-side data passing (like Laravel's view())
 *
 * ## Usage
 *
 * ```ts
 * import { createApp, render } from 'stx/ssr'
 *
 * const app = createApp({
 *   viewsDir: './views',
 *   sessionsSecret: 'your-secret-key',
 * })
 *
 * Bun.serve({
 *   fetch: app.fetch,
 * })
 *
 * // Or use render() directly:
 * app.get('/dashboard', async (ctx) => {
 *   const user = ctx.session.get('user')
 *   return render('dashboard.stx', { user })
 * })
 * ```
 *
 * @module ssr
 */

import type { StxOptions } from './types'
import crypto from 'node:crypto'
import path from 'node:path'
import { errorLogger } from './error-handling'
import { processDirectives } from './process'
import { extractVariables } from './utils'
import { patternToRegex } from 'stx-router'
import { serializeSetCookie } from './cookie-serialize'

// =============================================================================
// Types
// =============================================================================

/** Session data store */
export interface SessionData {
  [key: string]: unknown
}

/** Session interface */
export interface Session {
  id: string
  data: SessionData
  get<T = unknown>(key: string): T | undefined
  set(key: string, value: unknown): void
  delete(key: string): void
  clear(): void
  has(key: string): boolean
  flash(key: string, value?: unknown): unknown | undefined
  /** Regenerate session ID (for security after login) */
  regenerate(): void
  /** Destroy the session */
  destroy(): void
}

/** Pluggable session store interface for production-ready backends (Redis, DB, etc.) */
export interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>
  set(sessionId: string, data: SessionData, ttlSeconds: number): Promise<void>
  delete(sessionId: string): Promise<void>
}

/** Request context passed to route handlers */
export interface RequestContext {
  /** Original request */
  request: Request
  /** URL object */
  url: URL
  /** Route parameters (e.g., /users/:id -> { id: '123' }) */
  params: Record<string, string>
  /** Query parameters */
  query: Record<string, string>
  /** Session */
  session: Session
  /** CSRF token for this request */
  csrfToken: string
  /** Form data (for POST requests) */
  formData: () => Promise<Record<string, string | File>>
  /** JSON body (for API requests) */
  json: <T = unknown>() => Promise<T>
  /** Cookies */
  cookies: Record<string, string>
  /** Set a cookie */
  setCookie: (name: string, value: string, options?: CookieOptions) => void
  /** Response headers to send */
  responseHeaders: Headers
  /** Flash messages for next request */
  flash: (key: string, value: unknown) => void
  /** Get flash message */
  getFlash: (key: string) => unknown
  /** Validation errors */
  errors: ValidationErrors
  /** Old input (for form repopulation) */
  old: (key: string) => string
  /** Check if user is authenticated */
  isAuthenticated: () => boolean
  /** Get authenticated user */
  user: () => unknown
}

/** Cookie options */
export interface CookieOptions {
  maxAge?: number
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

/** Validation errors */
export interface ValidationErrors {
  [field: string]: string[]
}

/** Route handler */
// eslint-disable-next-line pickier/no-unused-vars
export type RouteHandler = (ctx: RequestContext) => Response | Promise<Response>

/** Middleware function */
export type Middleware = (ctx: RequestContext, next: () => Promise<Response>) => Response | Promise<Response>

/** App configuration */
export interface AppConfig {
  /** Directory containing .stx view files */
  viewsDir?: string
  /** Directory containing layout files */
  layoutsDir?: string
  /** Default layout to use */
  defaultLayout?: string
  /** Secret key for session encryption */
  sessionSecret?: string
  /** Session cookie name */
  sessionCookieName?: string
  /** Session TTL in seconds */
  sessionTtl?: number
  /** STX processing options */
  stxOptions?: StxOptions
  /** CSRF cookie name */
  csrfCookieName?: string
  /** Enable CSRF protection */
  csrfEnabled?: boolean
  /** Pluggable session store (defaults to in-memory MemorySessionStore) */
  sessionStore?: SessionStore
}

/** Route definition */
interface Route {
  method: string
  pattern: string
  handler: RouteHandler
  middleware: Middleware[]
}

// =============================================================================
// Session Store
// =============================================================================

/** Default in-memory session store. Use a custom SessionStore (Redis, DB) for production. */
export class MemorySessionStore implements SessionStore {
  private store = new Map<string, { data: SessionData, expires: number }>()

  async get(sessionId: string): Promise<SessionData | null> {
    const entry = this.store.get(sessionId)
    if (!entry || entry.expires <= Date.now()) {
      if (entry) this.store.delete(sessionId)
      return null
    }
    return { ...entry.data }
  }

  async set(sessionId: string, data: SessionData, ttlSeconds: number): Promise<void> {
    this.store.set(sessionId, { data: { ...data }, expires: Date.now() + ttlSeconds * 1000 })
  }

  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId)
  }
}

async function createSession(sessionId: string, ttl: number, store: SessionStore): Promise<Session> {
  const sessionData: SessionData = {}
  const flashData: SessionData = {}

  // Load existing session if present
  const existing = await store.get(sessionId)
  if (existing) {
    Object.assign(sessionData, existing)
  }

  const session: Session = {
    id: sessionId,
    data: sessionData,

    get<T = unknown>(key: string): T | undefined {
      return sessionData[key] as T | undefined
    },

    set(key: string, value: unknown): void {
      sessionData[key] = value
      saveSession()
    },

    delete(key: string): void {
      delete sessionData[key]
      saveSession()
    },

    clear(): void {
      Object.keys(sessionData).forEach(key => delete sessionData[key])
      saveSession()
    },

    has(key: string): boolean {
      return key in sessionData
    },

    flash(key: string, value?: unknown): unknown | undefined {
      if (value !== undefined) {
        flashData[key] = value
        return undefined
      }
      const val = flashData[key]
      delete flashData[key]
      return val
    },

    regenerate(): void {
      const oldId = sessionId
      sessionId = generateSessionId()
      session.id = sessionId
      store.delete(oldId)
      saveSession()
    },

    destroy(): void {
      store.delete(sessionId)
      Object.keys(sessionData).forEach(key => delete sessionData[key])
    },
  }

  function saveSession() {
    store.set(sessionId, { ...sessionData, __flash: flashData }, ttl)
  }

  // Initial save
  saveSession()

  return session
}

function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

// =============================================================================
// Cookie Helpers
// =============================================================================

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=')
    if (name) {
      cookies[name] = decodeURIComponent(valueParts.join('='))
    }
    return cookies
  }, {} as Record<string, string>)
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  return serializeSetCookie(name, value, options)
}

/**
 * Copy the context's response headers onto an outgoing `Headers`.
 *
 * `Set-Cookie` is the only header that can legitimately appear more than once,
 * and it needs `append` — the plain `forEach` + `set` this replaces kept just
 * the LAST cookie, because `set` overwrites what the previous iteration wrote.
 * That was harmless only for as long as stacksjs/stx#1944 meant a response
 * never carried more than the session cookie; fixing that bug is what would
 * have made this one reachable, so the two travel together.
 *
 * Everything else keeps `set`, so a context header still overrides a default
 * (Content-Type) rather than being appended alongside it.
 */
function copyContextHeaders(from: Headers, into: Headers): void {
  for (const cookie of from.getSetCookie())
    into.append('Set-Cookie', cookie)

  from.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie')
      into.set(key, value)
  })
}

// =============================================================================
// CSRF Token Management
// =============================================================================

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function verifyCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken),
    )
  }
catch {
    return false
  }
}

// =============================================================================
// Render Function
// =============================================================================

/**
 * Render a STX template with server-side data
 *
 * @param template - Template path relative to viewsDir, or inline template string
 * @param data - Data to pass to the template
 * @param options - Render options
 */
export async function render(
  template: string,
  data: Record<string, unknown> = {},
  options: {
    viewsDir?: string
    layoutsDir?: string
    stxOptions?: StxOptions
    ctx?: RequestContext
  } = {},
): Promise<Response> {
  const viewsDir = options.viewsDir || './views'
  const layoutsDir = options.layoutsDir || './layouts'

  // Determine if template is a path or inline content
  const isPath = !template.includes('<') && !template.includes('@')

  let templateContent: string
  let templatePath: string

  if (isPath) {
    // Load from file
    templatePath = path.resolve(viewsDir, template)
    if (!templatePath.endsWith('.stx')) {
      templatePath += '.stx'
    }

    if (!await Bun.file(templatePath).exists()) {
      return new Response(`Template not found: ${template}`, { status: 500 })
    }

    templateContent = await Bun.file(templatePath).text()
  }
else {
    // Inline template
    templateContent = template
    templatePath = 'inline-template.stx'
  }

  // Build context with server data
  const context: Record<string, unknown> = {
    ...data,
    props: data,
    __filename: templatePath,
    __dirname: path.dirname(templatePath),
  }

  // Add request context helpers if available
  if (options.ctx) {
    context.csrf_token = options.ctx.csrfToken
    context.csrf_field = `<input type="hidden" name="_token" value="${options.ctx.csrfToken}">`
    context.old = options.ctx.old
    context.errors = options.ctx.errors
    context.session = options.ctx.session
    context.user = options.ctx.user()
    context.isAuthenticated = options.ctx.isAuthenticated()
  }

  // Extract server script variables
  const serverScriptMatch = templateContent.match(/<script\s+server\b[^>]*>([\s\S]*?)<\/script>/i)
  if (serverScriptMatch) {
    const serverScript = serverScriptMatch[1]
    // Remove server script from template
    templateContent = templateContent.replace(/<script\s+server\b[^>]*>[\s\S]*?<\/script>/gi, '')
    // Extract variables (they can access the passed data)
    await extractVariables(serverScript, context, templatePath)
  }

  // Process the template
  const stxOptions: StxOptions = {
    layoutsDir,
    ...options.stxOptions,
  }

  const dependencies = new Set<string>()
  const html = await processDirectives(templateContent, context, templatePath, stxOptions, dependencies)

  // Build response headers
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
  })

  // Copy response headers from context if available
  if (options.ctx)
    copyContextHeaders(options.ctx.responseHeaders, headers)

  return new Response(html, { headers })
}

// =============================================================================
// App Creation
// =============================================================================

/**
 * Handle returned by {@link createApp} — the server application surface.
 */
export interface StxServerApp {
  /** Main fetch handler for Bun.serve() */
  fetch: (request: Request) => Promise<Response>
  /** Register a GET route */
  get: (pattern: string, handler: RouteHandler, middleware?: Middleware[]) => StxServerApp
  /** Register a POST route */
  post: (pattern: string, handler: RouteHandler, middleware?: Middleware[]) => StxServerApp
  /** Register a PUT route */
  put: (pattern: string, handler: RouteHandler, middleware?: Middleware[]) => StxServerApp
  /** Register a DELETE route */
  delete: (pattern: string, handler: RouteHandler, middleware?: Middleware[]) => StxServerApp
  /** Register a PATCH route */
  patch: (pattern: string, handler: RouteHandler, middleware?: Middleware[]) => StxServerApp
  /** Register middleware for all routes */
  use: (middleware: Middleware) => StxServerApp
  /** Render a view with data */
  render: (template: string, data?: Record<string, unknown>, ctx?: RequestContext) => Promise<Response>
  /** Redirect helper */
  redirect: (url: string, status?: 302 | 301 | 303 | 307 | 308) => Response
  /** Redirect back with input (for form validation) */
  back: (ctx: RequestContext, errors?: ValidationErrors, oldInput?: Record<string, string>) => Response
  /** Start the server */
  listen: (port?: number) => ReturnType<typeof Bun.serve>
}

/**
 * Create a STX server application
 */
export function createApp(config: AppConfig = {}): StxServerApp {
  const {
    viewsDir = './views',
    layoutsDir = './layouts',
    defaultLayout,
    sessionSecret = crypto.randomBytes(32).toString('hex'),
    sessionCookieName = 'stx_session',
    sessionTtl = 86400, // 24 hours
    stxOptions = {},
    csrfCookieName = 'csrf_token',
    csrfEnabled = true,
  } = config

  const store = config.sessionStore ?? new MemorySessionStore()
  const routes: Route[] = []
  const globalMiddleware: Middleware[] = []

  // Route matching helper
  function matchRoute(method: string, pathname: string): { route: Route, params: Record<string, string> } | null {
    for (const route of routes) {
      if (route.method !== method && route.method !== '*') continue

      // Convert route pattern to regex
      // Shared compiler. The hand-rolled version matched `\w+` only, so a
      // catch-all name (`path*`) never matched and the route silently did not
      // exist under SSR.
      const { regex, params: paramNames } = patternToRegex(route.pattern)
      const match = pathname.match(regex)

      if (match) {
        const params: Record<string, string> = {}
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1]
        })
        return { route, params }
      }
    }
    return null
  }

  // Create request context
  async function createContext(request: Request, params: Record<string, string>): Promise<RequestContext> {
    const url = new URL(request.url)
    const cookies = parseCookies(request.headers.get('Cookie'))
    const responseHeaders = new Headers()

    // Get or create session
    let sessionId = cookies[sessionCookieName]
    if (!sessionId) {
      sessionId = generateSessionId()
      responseHeaders.append('Set-Cookie', serializeCookie(sessionCookieName, sessionId, {
        httpOnly: true,
        secure: url.protocol === 'https:',
        sameSite: 'Lax',
        path: '/',
        maxAge: sessionTtl,
      }))
    }
    const session = await createSession(sessionId, sessionTtl, store)

    // Get or create CSRF token
    let csrfToken = session.get<string>('_csrf')
    if (!csrfToken) {
      csrfToken = generateCsrfToken()
      session.set('_csrf', csrfToken)
    }

    // Parse query parameters
    const query: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      query[key] = value
    })

    // Validation errors from flash
    const errors = (session.flash('_errors') as ValidationErrors) || {}
    const oldInput = (session.flash('_old_input') as Record<string, string>) || {}

    const ctx: RequestContext = {
      request,
      url,
      params,
      query,
      session,
      csrfToken,
      cookies,
      responseHeaders,
      errors,

      async formData() {
        const formData = await request.formData()
        const data: Record<string, string | File> = {}
        formData.forEach((value, key) => {
          data[key] = value
        })
        return data
      },

      async json<T = unknown>() {
        return await request.json() as T
      },

      setCookie(name: string, value: string, options: CookieOptions = {}) {
        // Straight onto the live Headers. The previous version pushed to an
        // array that `createContext` drained into `responseHeaders` as its last
        // statement — before returning, and therefore before any handler could
        // call this (stacksjs/stx#1944). Anything a handler set landed in an
        // array nothing read again.
        //
        // It looked like it worked because the session cookie is appended above,
        // inside createContext, ahead of that drain. So responses did carry
        // Set-Cookie and only the call an application makes was dead.
        responseHeaders.append('Set-Cookie', serializeCookie(name, value, options))
      },

      flash(key: string, value: unknown) {
        session.flash(key, value)
      },

      getFlash(key: string) {
        return session.flash(key)
      },

      old(key: string) {
        return oldInput[key] || ''
      },

      isAuthenticated() {
        return session.has('user')
      },

      user() {
        return session.get('user')
      },
    }

    return ctx
  }

  // CSRF middleware
  const csrfMiddleware: Middleware = async (ctx, next) => {
    // Skip CSRF check for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(ctx.request.method)) {
      return next()
    }

    if (!csrfEnabled) {
      return next()
    }

    // Get token from form data or header
    const formData = await ctx.request.clone().formData().catch(() => new FormData())
    const tokenFromForm = formData.get('_token') as string | null
    const tokenFromHeader = ctx.request.headers.get('X-CSRF-Token')
    const token = tokenFromForm || tokenFromHeader

    const sessionToken = ctx.session.get<string>('_csrf')

    if (!token || !sessionToken || !verifyCsrfToken(token, sessionToken)) {
      return new Response('CSRF token mismatch', { status: 419 })
    }

    return next()
  }

  // Main fetch handler
  async function fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const method = request.method

    // Match route
    const match = matchRoute(method, url.pathname)

    if (!match) {
      return new Response('Not Found', { status: 404 })
    }

    // Create context
    const ctx = await createContext(request, match.params)

    // Build middleware chain
    const middleware = [...globalMiddleware, csrfMiddleware, ...match.route.middleware]

    let index = 0
    const next = async (): Promise<Response> => {
      if (index < middleware.length) {
        const mw = middleware[index++]
        return mw(ctx, next)
      }
      return match.route.handler(ctx)
    }

    try {
      const response = await next()

      // Add response headers (cookies, etc.)
      copyContextHeaders(ctx.responseHeaders, response.headers)

      return response
    }
catch (error) {
      errorLogger.log(error instanceof Error ? error : new Error(String(error)), { handler: 'request' }, 'error')
      return new Response('Internal Server Error', { status: 500 })
    }
  }

  // Route registration helpers
  function addRoute(method: string, pattern: string, handler: RouteHandler, middleware: Middleware[] = []) {
    routes.push({ method, pattern, handler, middleware })
  }

  return {
    /** Main fetch handler for Bun.serve() */
    fetch,

    /** Register a GET route */
    get(pattern: string, handler: RouteHandler, middleware: Middleware[] = []) {
      addRoute('GET', pattern, handler, middleware)
      return this
    },

    /** Register a POST route */
    post(pattern: string, handler: RouteHandler, middleware: Middleware[] = []) {
      addRoute('POST', pattern, handler, middleware)
      return this
    },

    /** Register a PUT route */
    put(pattern: string, handler: RouteHandler, middleware: Middleware[] = []) {
      addRoute('PUT', pattern, handler, middleware)
      return this
    },

    /** Register a DELETE route */
    delete(pattern: string, handler: RouteHandler, middleware: Middleware[] = []) {
      addRoute('DELETE', pattern, handler, middleware)
      return this
    },

    /** Register a PATCH route */
    patch(pattern: string, handler: RouteHandler, middleware: Middleware[] = []) {
      addRoute('PATCH', pattern, handler, middleware)
      return this
    },

    /** Register middleware for all routes */
    use(middleware: Middleware) {
      globalMiddleware.push(middleware)
      return this
    },

    /** Render a view with data */
    async render(template: string, data: Record<string, unknown> = {}, ctx?: RequestContext) {
      return render(template, data, { viewsDir, layoutsDir, stxOptions, ctx })
    },

    /** Redirect helper */
    redirect(url: string, status: 302 | 301 | 303 | 307 | 308 = 302) {
      return new Response(null, {
        status,
        headers: { Location: url },
      })
    },

    /** Redirect back with input (for form validation) */
    back(ctx: RequestContext, errors?: ValidationErrors, oldInput?: Record<string, string>) {
      if (errors) {
        ctx.session.flash('_errors', errors)
      }
      if (oldInput) {
        ctx.session.flash('_old_input', oldInput)
      }
      const referer = ctx.request.headers.get('Referer') || '/'
      return new Response(null, {
        status: 302,
        headers: { Location: referer },
      })
    },

    /** Start the server */
    listen(port: number = 3000) {
      return Bun.serve({
        port,
        fetch,
      })
    },
  }
}

// =============================================================================
// Exports
// =============================================================================

// Types are already exported at their declaration sites
