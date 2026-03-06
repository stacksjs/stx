import type { ApiRoute, ApiRouterConfig, HandlerContext, HttpMethod } from './types'
import { createHandlerContextWithBody } from './handler'
import { scanApiRoutes } from './scanner'

interface MatchResult {
  route: ApiRoute
  params: Record<string, string>
}

function matchRoute(pathname: string, method: HttpMethod, routes: ApiRoute[]): MatchResult | null {
  for (const route of routes) {
    if (route.method !== method)
      continue

    const routeParts = route.path.split('/').filter(Boolean)
    const pathParts = pathname.split('/').filter(Boolean)

    if (routeParts.length !== pathParts.length)
      continue

    const params: Record<string, string> = {}
    let matched = true

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i]
      const pathPart = pathParts[i]

      if (routePart.startsWith(':')) {
        params[routePart.slice(1)] = pathPart
      }
      else if (routePart !== pathPart) {
        matched = false
        break
      }
    }

    if (matched)
      return { route, params }
  }

  return null
}

export async function handleApiRequest(request: Request, routes: ApiRoute[]): Promise<Response> {
  const url = new URL(request.url)
  const method = request.method as HttpMethod
  const match = matchRoute(url.pathname, method, routes)

  if (!match) {
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { route, params } = match
  const handler = route.handler

  try {
    const ctx: HandlerContext = await createHandlerContextWithBody(request, params)

    if (handler.input) {
      ctx.body = handler.input.parse(ctx.body)
    }

    const result = await handler.handler(ctx)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function createApiRouter(config: ApiRouterConfig): Promise<{
  routes: ApiRoute[]
  handle: (request: Request) => Promise<Response>
}> {
  const routes = await scanApiRoutes(config.apiDir, config.prefix)

  return {
    routes,
    handle: (request: Request) => handleApiRequest(request, routes),
  }
}
