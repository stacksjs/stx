import type { HandlerConfig, HandlerContext } from './types'

export function defineHandler<T>(config: HandlerConfig<T>): HandlerConfig<T> {
  return config
}

export function createHandlerContext(request: Request, params: Record<string, string> = {}): HandlerContext {
  const url = new URL(request.url)

  return {
    params,
    request,
    headers: request.headers,
    url,
    body: null,
  }
}

export async function createHandlerContextWithBody(request: Request, params: Record<string, string> = {}): Promise<HandlerContext> {
  const url = new URL(request.url)
  let body: unknown = null

  const contentType = request.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      body = await request.json()
    }
    catch {
      body = null
    }
  }

  return {
    params,
    request,
    headers: request.headers,
    url,
    body,
  }
}
