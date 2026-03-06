export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface HandlerContext {
  params: Record<string, string>
  request: Request
  headers: Headers
  url: URL
  body: unknown
}

export interface HandlerConfig<T = unknown> {
  handler: (ctx: HandlerContext) => Promise<T> | T
  middleware?: string[]
  input?: { parse: (data: unknown) => unknown }
}

export interface ApiRoute {
  path: string
  method: HttpMethod
  handler: HandlerConfig
  filePath: string
}

export interface ApiRouterConfig {
  apiDir: string
  prefix?: string
}
