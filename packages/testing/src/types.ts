export interface RenderResult {
  html: string
  contains(text: string): boolean
  querySelector(selector: string): string | null
  hasElement(tag: string): boolean
  getAttribute(tag: string, attr: string): string | null
}

export interface TestRequest {
  method: string
  url: string
  headers: Headers
  params: Record<string, string>
  query: Record<string, string>
  body?: unknown
  cookies: Record<string, string>
}

export interface TestResponse {
  status: number
  headers: Headers
  body: unknown
  text(): string
  json<T>(): T
  isOk(): boolean
  isRedirect(): boolean
  redirectUrl(): string | null
}

export interface TestContext {
  request: TestRequest
  response: TestResponse
}
