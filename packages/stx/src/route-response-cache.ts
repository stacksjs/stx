import { LRUCache } from './performance-utils'
import { isSpaNavRequest, SPA_LAYOUT_HEADERS, spaNavVaryHeaders } from './spa-nav'
import type { RouteCacheRule } from './route-rules'

/** Headers the cache key accounts for (see respond), so a response may vary on them and still be kept. */
const KEYED_VARY = new Set(['x-stx-router', 'accept-encoding', ...SPA_LAYOUT_HEADERS.map(name => name.toLowerCase())])

interface CachedResponse {
  body: ArrayBuffer
  headers: [string, string][]
  created: number
  path: string
}

/** Process-local, bounded origin cache; never caches actions or personalized responses. */
export class RouteResponseCache {
  private entries = new LRUCache<string, CachedResponse>(1000, {
    maxBytes: 32 * 1024 * 1024,
    sizeOf: entry => entry.body.byteLength + JSON.stringify(entry.headers).length * 2,
  })

  private pending = new Map<string, Promise<CachedResponse | null>>()
  private generation = 0

  constructor(private now: () => number = Date.now) {}

  /** Invalidates both document/fragment representations, query variants and in-flight writes. */
  invalidate(pathname?: string): void {
    this.generation++
    this.pending.clear()
    for (const key of Array.from(this.entries.keys())) {
      if (pathname === undefined || this.entries.get(key)?.path === pathname)
        this.entries.delete(key)
    }
  }

  async respond(request: Request, policy: RouteCacheRule | false | undefined, render: () => Promise<Response>): Promise<Response> {
    let original: Response | undefined
    const privateResponse = async (): Promise<Response> => {
      const response = original ?? await render()
      response.headers.set('Cache-Control', 'private, no-store')
      response.headers.set('Vary', spaNavVaryHeaders(response.headers.get('Vary')).Vary)
      return response
    }
    if (!policy || request.method !== 'GET' || request.headers.has('Cookie') || request.headers.has('Authorization') || request.headers.has('Range'))
      return privateResponse()

    const url = new URL(request.url)
    // A router request says which layout its page is on, and from another
    // layout it is answered with the document, so that is part of the key:
    // one stored answer per layout the router comes from.
    const variant = isSpaNavRequest(request)
      ? `fragment|${SPA_LAYOUT_HEADERS.map(name => request.headers.get(name) ?? '').join('|')}`
      : 'document'
    const key = `${url.origin}${url.pathname}${url.search}|${variant}`
    const cached = this.entries.get(key)
    const reply = (entry: CachedResponse): Response => {
      const headers = new Headers(entry.headers)
      // Origin caching only: downstream caches cannot invalidate with us.
      headers.set('Cache-Control', 'private, no-store')
      headers.set('Age', String(Math.max(0, Math.floor((this.now() - entry.created) / 1000))))
      return new Response(entry.body.slice(0), { headers })
    }
    const age = cached ? (this.now() - cached.created) / 1000 : Infinity
    if (cached && age < policy.maxAge)
      return reply(cached)

    const generation = this.generation
    const refresh = async (): Promise<CachedResponse | null> => {
      const response = await render()
      original = response
      const vary = (response.headers.get('Vary') ?? '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean)
      if (response.status !== 200 || response.headers.has('Set-Cookie') || /(?:private|no-store|no-cache)/i.test(response.headers.get('Cache-Control') ?? '') || vary.some(value => !KEYED_VARY.has(value)))
        return null
      const body = await response.clone().arrayBuffer()
      if (body.byteLength > 1024 * 1024)
        return null
      response.headers.set('Vary', spaNavVaryHeaders(response.headers.get('Vary')).Vary)
      const entry = { body, headers: Array.from(response.headers.entries()), created: this.now(), path: url.pathname }
      if (this.generation === generation)
        this.entries.set(key, entry)
      return entry
    }
    // Coalesce only cacheable responses. A private miss gets its own render,
    // never another request's body, even when the URLs are identical.
    let pending = this.pending.get(key)
    if (!pending) {
      if (this.pending.size >= 1000)
        return privateResponse()
      pending = refresh().finally(() => {
        if (this.pending.get(key) === pending)
          this.pending.delete(key)
      })
      this.pending.set(key, pending)
    }
    if (cached && age < policy.maxAge + (policy.swr ?? 0)) {
      void pending.catch(() => {})
      return reply(cached)
    }
    const fresh = await pending
    return fresh ? reply(fresh) : privateResponse()
  }
}
