/**
 * Middleware handler compatible with the original stx page middleware API.
 */
export type MiddlewareHandler = (
  req: MiddlewareRequest,
  ctx: MiddlewareContext,
  ...args: string[]
) => Response | null | undefined | void | Promise<Response | null | undefined | void>

/**
 * Request surface shared with class-style middleware such as
 * `@stacksjs/router`'s `Middleware` class.
 */
export interface MiddlewareRequest extends Request {
  params?: Record<string, string>
  _middlewareParams?: Record<string, string>
}

type MiddlewareDefinitionHandler = {
  bivarianceHack: (
    req: MiddlewareRequest,
    ctx: MiddlewareContext,
    ...args: string[]
  ) => Response | null | undefined | void | Promise<Response | null | undefined | void>
}['bivarianceHack']

/**
 * Structural middleware contract. A `Middleware` instance from
 * `@stacksjs/router` satisfies this without an adapter.
 */
export interface MiddlewareDefinition {
  readonly name: string
  readonly priority?: number
  /**
   * Bivariant so a framework may promise a prepared request subtype, such as
   * Stacks' EnhancedRequest, through `prepareMiddlewareRequest`.
   */
  readonly handle: MiddlewareDefinitionHandler
}

export type PageMiddleware = MiddlewareHandler | MiddlewareDefinition

export interface MiddlewareContext {
  /** Current URL pathname, e.g. `/host/dashboard`. */
  path: string
  /** Parsed URL, useful for query strings and hashes. */
  url: URL
  /** Path params extracted from a dynamic segment, e.g. `{ id: 'tesla' }`. */
  params: Record<string, string>
  /** Cookies already parsed from the request. */
  cookies: Record<string, string>
  /** Build a redirect to `to`, preserving the original target. */
  redirect: (to: string, status?: number) => Response
}

export type PrepareMiddlewareRequest = (
  request: MiddlewareRequest,
  context: MiddlewareContext,
) => MiddlewareRequest | Promise<MiddlewareRequest>

export interface RunPageMiddlewareOptions {
  request: MiddlewareRequest
  context: MiddlewareContext
  entries: string[]
  registry: Readonly<Record<string, PageMiddleware>>
  prepareRequest?: PrepareMiddlewareRequest
}

interface ResolvedMiddleware {
  args: string[]
  index: number
  middleware: PageMiddleware
  name: string
  negated: boolean
  params?: string
  priority: number
}

const DEFAULT_PRIORITY = 10

function middlewarePriority(middleware: PageMiddleware): number {
  const raw = (middleware as { priority?: unknown }).priority
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0
    ? raw
    : DEFAULT_PRIORITY
}

function parseMiddlewareEntry(
  entry: string,
  registry: Readonly<Record<string, PageMiddleware>>,
): { args: string[], name: string, negated: boolean, params?: string } {
  const negated = entry.startsWith('!')
  const bare = negated ? entry.slice(1) : entry

  // Resolve the whole name first. This keeps aliases containing a colon, such
  // as `env:production`, distinct from parameterized `role:admin` entries.
  if (Object.hasOwn(registry, bare))
    return { args: [], name: bare, negated }

  const colon = bare.indexOf(':')
  if (colon === -1)
    return { args: [], name: bare, negated }

  const params = bare.slice(colon + 1)
  return {
    args: params === '' ? [] : params.split(','),
    name: bare.slice(0, colon),
    negated,
    params,
  }
}

function statusResponse(thrown: unknown): Response | null {
  if (thrown instanceof Response)
    return thrown

  if (typeof thrown !== 'object' || thrown === null)
    return null

  const candidate = thrown as { message?: unknown, status?: unknown, statusCode?: unknown }
  const rawStatus = candidate.statusCode ?? candidate.status
  if (typeof rawStatus !== 'number' || !Number.isInteger(rawStatus) || rawStatus < 100 || rawStatus > 599)
    return null

  const message = typeof candidate.message === 'string' ? candidate.message : 'Middleware rejected the request'
  return new Response(message, { status: rawStatus })
}

async function invokeMiddleware(
  middleware: PageMiddleware,
  request: MiddlewareRequest,
  context: MiddlewareContext,
  args: string[],
): Promise<Response | null> {
  try {
    const result = typeof middleware === 'function'
      ? await middleware(request, context, ...args)
      : await middleware.handle(request, context, ...args)

    return result instanceof Response ? result : null
  }
  catch (thrown) {
    const response = statusResponse(thrown)
    if (response)
      return response
    throw thrown
  }
}

/**
 * Run stx page middleware through one public seam.
 *
 * Function handlers remain supported. Class-style middleware additionally
 * contributes a priority, receives colon parameters through
 * `request._middlewareParams`, and may throw a Response or status-carrying
 * error to stop the chain.
 */
export async function runPageMiddleware(options: RunPageMiddlewareOptions): Promise<Response | null> {
  options.request.params = options.context.params
  const request = options.prepareRequest
    ? await options.prepareRequest(options.request, options.context)
    : options.request

  request.params = options.context.params
  request._middlewareParams ||= {}

  const resolved: ResolvedMiddleware[] = []
  for (const [index, entry] of options.entries.entries()) {
    const parsed = parseMiddlewareEntry(entry, options.registry)
    const middleware = options.registry[parsed.name]
    if (!middleware) {
      console.warn(`[stx serve] unknown middleware "${parsed.name}" on ${options.context.path}; failing closed`)
      return new Response(`Route middleware '${parsed.name}' is not registered`, { status: 500 })
    }

    resolved.push({
      ...parsed,
      index,
      middleware,
      priority: middlewarePriority(middleware),
    })
  }

  resolved.sort((a, b) => a.priority - b.priority || a.index - b.index)

  for (const entry of resolved) {
    if (entry.params !== undefined)
      request._middlewareParams[entry.name] = entry.params

    const response = await invokeMiddleware(
      entry.middleware,
      request,
      options.context,
      entry.args,
    )

    if (entry.negated) {
      if (response)
        continue
      return new Response(`Access denied. This route requires "${entry.name}" not to apply.`, { status: 403 })
    }

    if (response)
      return response
  }

  return null
}
