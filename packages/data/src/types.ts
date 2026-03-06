export interface LoaderContext {
  params: Record<string, string>
  request: Request
  cookies: CookieAccessor
  headers: Headers
  url: URL
}

export interface CookieAccessor {
  get(name: string): string | undefined
  getAll(): Record<string, string>
}

export interface ActionContext extends LoaderContext {
  formData: () => Promise<FormData>
  json: <T>() => Promise<T>
}

export interface ActionResult<T = unknown> {
  data?: T
  errors?: Record<string, string[]>
  redirect?: string
  status?: number
}

export type LoaderHandler<T> = (ctx: LoaderContext) => Promise<T> | T

export interface LoaderDefinition<T = unknown> {
  _type: 'loader'
  handler: LoaderHandler<T>
}

export type ActionHandler<T> = (ctx: ActionContext) => Promise<ActionResult<T>>

export interface ActionDefinition<T = unknown> {
  _type: 'action'
  handler: ActionHandler<T>
}

export interface FetchOptions extends RequestInit {
  key?: string
  lazy?: boolean
  pick?: string[]
  server?: boolean
  default?: () => unknown
}

export interface AsyncDataResult<T> {
  data: T | null
  pending: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export interface CacheEntry<T = unknown> {
  value: T
  timestamp: number
  ttl: number
}
