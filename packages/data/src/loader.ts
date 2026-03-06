import type { ActionContext, ActionDefinition, ActionHandler, ActionResult, LoaderContext, LoaderDefinition, LoaderHandler } from './types'

export function defineLoader<T>(handler: LoaderHandler<T>): LoaderDefinition<T> {
  return {
    _type: 'loader',
    handler,
  }
}

export function defineLoaders<T extends Record<string, LoaderHandler<any>>>(
  loaders: T,
): { [K in keyof T]: LoaderDefinition<Awaited<ReturnType<T[K]>>> } {
  const result = {} as any
  for (const [key, handler] of Object.entries(loaders)) {
    result[key] = defineLoader(handler)
  }
  return result
}

export function defineAction<T>(handler: ActionHandler<T>): ActionDefinition<T> {
  return {
    _type: 'action',
    handler,
  }
}

function parseCookiesFromHeader(header: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  for (const pair of header.split(';')) {
    const [name, ...rest] = pair.split('=')
    if (name) {
      cookies[name.trim()] = decodeURIComponent(rest.join('=').trim())
    }
  }
  return cookies
}

export function createLoaderContext(request: Request, params: Record<string, string> = {}): LoaderContext {
  const url = new URL(request.url)
  const cookieHeader = request.headers.get('cookie') || ''
  const allCookies = parseCookiesFromHeader(cookieHeader)

  return {
    params,
    request,
    headers: request.headers,
    url,
    cookies: {
      get(name: string) { return allCookies[name] },
      getAll() { return { ...allCookies } },
    },
  }
}

export function createActionContext(request: Request, params: Record<string, string> = {}): ActionContext {
  const base = createLoaderContext(request, params)
  return {
    ...base,
    formData: () => request.formData(),
    json: <T>() => request.json() as Promise<T>,
  }
}

export async function executeLoader<T>(loader: LoaderDefinition<T>, request: Request, params?: Record<string, string>): Promise<T> {
  const ctx = createLoaderContext(request, params)
  return await loader.handler(ctx)
}

export async function executeAction<T>(action: ActionDefinition<T>, request: Request, params?: Record<string, string>): Promise<ActionResult<T>> {
  const ctx = createActionContext(request, params)
  return await action.handler(ctx)
}
