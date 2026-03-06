import type { TestRequest, TestResponse } from './types'

/**
 * Create a TestRequest with sensible defaults.
 */
export function createTestRequest(options?: Partial<TestRequest>): TestRequest {
  return {
    method: options?.method ?? 'GET',
    url: options?.url ?? '/',
    headers: options?.headers ?? new Headers(),
    params: options?.params ?? {},
    query: options?.query ?? {},
    body: options?.body,
    cookies: options?.cookies ?? {},
  }
}

/**
 * Create a TestResponse with sensible defaults.
 */
export function createTestResponse(options?: {
  status?: number
  headers?: Record<string, string>
  body?: unknown
}): TestResponse {
  const status = options?.status ?? 200
  const headers = new Headers(options?.headers)
  const body = options?.body ?? ''

  return {
    status,
    headers,
    body,

    text(): string {
      if (typeof body === 'string')
        return body
      return JSON.stringify(body)
    },

    json<T>(): T {
      if (typeof body === 'string')
        return JSON.parse(body) as T
      return body as T
    },

    isOk(): boolean {
      return status >= 200 && status < 300
    },

    isRedirect(): boolean {
      return status >= 300 && status < 400
    },

    redirectUrl(): string | null {
      if (this.isRedirect())
        return headers.get('location')
      return null
    },
  }
}
