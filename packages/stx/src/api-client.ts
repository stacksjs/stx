/** Augmented by .stx/api-types.d.ts. This module has no server imports. */
export interface KnownApiRoutes {}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
export type ApiRouteKey = [keyof KnownApiRoutes] extends [never] ? `${ApiMethod} /${string}` : keyof KnownApiRoutes & string
type Params<K extends ApiRouteKey> = K extends keyof KnownApiRoutes ? KnownApiRoutes[K] extends { params: infer P } ? P : never : Record<string, string>
/** Match JSON wire types rather than pretending Date survives serialization. */
export type ApiJson<T> = T extends Response ? unknown : T extends Date ? string : T extends bigint | symbol | ((...args: any[]) => any) ? never : T extends object ? { [K in keyof T]: ApiJson<T[K]> } : T
export type ApiResponse<K extends ApiRouteKey> = K extends keyof KnownApiRoutes ? KnownApiRoutes[K] extends { response: infer R } ? ApiJson<R> : unknown : unknown
export type ApiFetchOptions<K extends ApiRouteKey> = Omit<RequestInit, 'method'> & {
  params?: Params<K>
  query?: Record<string, string | number | boolean | undefined>
  /** Useful for server-side callers. Browser calls default to the current origin. */
  baseURL?: string
}

/** Typed JSON fetch. Example: apiFetch('GET /api/users/:id', { params: { id: '42' } }). */
export async function apiFetch<K extends ApiRouteKey>(route: K, ...args: {} extends Params<K> ? [options?: ApiFetchOptions<K>] : [options: ApiFetchOptions<K> & { params: Params<K> }]): Promise<ApiResponse<K>> {
  const { params = {}, query, baseURL = '', ...init } = args[0] ?? {}
  const separator = route.indexOf(' ')
  const method = route.slice(0, separator)
  let pathname = route.slice(separator + 1)
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method) || !pathname.startsWith('/'))
    throw new Error(`Invalid API route: ${route}`)
  pathname = pathname.replace(/:([\w]+)(\*)?/g, (_match, name: string, catchAll: string) => {
    const value = (params as Record<string, string>)[name]
    if (!Object.hasOwn(params, name) || value === undefined || value === '')
      throw new Error(`Missing API route parameter: ${name}`)
    return catchAll ? String(value).split('/').map(encodeURIComponent).join('/') : encodeURIComponent(String(value))
  })
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) search.set(key, String(value))
  }
  const response = await fetch(`${baseURL.replace(/\/$/, '')}${pathname}${search.size ? `?${search}` : ''}`, { ...init, method })
  if (!response.ok)
    throw Object.assign(new Error(`API request failed: ${response.status} ${method} ${pathname}`), { status: response.status, response })
  if (response.status === 204 || method === 'HEAD')
    return undefined as ApiResponse<K>
  return response.json() as Promise<ApiResponse<K>>
}
