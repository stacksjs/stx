import type { TestRequest, TestResponse } from './types'
import { createTestRequest, createTestResponse } from './request'

/**
 * Create a mock request with optional overrides.
 */
export function mockRequest(overrides?: Partial<TestRequest>): TestRequest {
  return createTestRequest(overrides)
}

/**
 * Create a mock response with optional overrides.
 */
export function mockResponse(overrides?: Partial<{ status: number, body: unknown }>): TestResponse {
  return createTestResponse(overrides)
}

/**
 * Create a mock loader context with optional overrides.
 */
export function mockLoaderContext(overrides?: Record<string, unknown>): any {
  const request = createTestRequest({ method: 'GET' })
  const response = createTestResponse()

  return {
    request,
    response,
    params: request.params,
    query: request.query,
    headers: request.headers,
    cookies: request.cookies,
    ...overrides,
  }
}

/**
 * Create a mock action context with optional overrides.
 */
export function mockActionContext(overrides?: Record<string, unknown>): any {
  const request = createTestRequest({ method: 'POST' })
  const response = createTestResponse()

  return {
    request,
    response,
    params: request.params,
    body: request.body,
    formData: {},
    ...overrides,
  }
}
