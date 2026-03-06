import { createTestRequest, createTestResponse } from './request'

/**
 * Test a loader by calling its handler with a mock context.
 */
export async function testLoader<T>(
  loader: { handler: (ctx: any) => Promise<T> | T },
  options?: {
    params?: Record<string, string>
    headers?: Record<string, string>
    cookies?: Record<string, string>
  },
): Promise<T> {
  const request = createTestRequest({
    method: 'GET',
    params: options?.params,
    headers: options?.headers ? new Headers(options.headers) : undefined,
    cookies: options?.cookies,
  })

  const response = createTestResponse()

  const ctx = {
    request,
    response,
    params: request.params,
    query: request.query,
    headers: request.headers,
    cookies: request.cookies,
  }

  return loader.handler(ctx)
}

/**
 * Test an action by calling its handler with a mock context (POST-like).
 */
export async function testAction<T>(
  action: { handler: (ctx: any) => Promise<T> | T },
  options?: {
    params?: Record<string, string>
    body?: unknown
    formData?: Record<string, string>
  },
): Promise<T> {
  const body = options?.body ?? options?.formData ?? undefined

  const request = createTestRequest({
    method: 'POST',
    params: options?.params,
    body,
  })

  const response = createTestResponse()

  const ctx = {
    request,
    response,
    params: request.params,
    body: request.body,
    formData: options?.formData ?? {},
  }

  return action.handler(ctx)
}
