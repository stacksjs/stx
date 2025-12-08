/**
 * Edge Runtime Module
 *
 * Provides platform-agnostic edge runtime support for stx templates.
 * Enables deployment to Cloudflare Workers, Deno Deploy, Vercel Edge,
 * and other edge computing platforms.
 *
 * ## Features
 *
 * 1. **Platform Detection** - Detect runtime environment automatically
 * 2. **Portable APIs** - Unified APIs across different edge runtimes
 * 3. **Streaming Support** - Edge-native streaming responses
 * 4. **KV Storage** - Platform-agnostic key-value storage
 * 5. **Cache API** - Edge caching with platform-specific backends
 * 6. **Environment Variables** - Unified env access
 *
 * ## Supported Platforms
 *
 * - Cloudflare Workers
 * - Deno Deploy
 * - Vercel Edge Functions
 * - Netlify Edge Functions
 * - Fastly Compute@Edge
 * - Node.js (fallback)
 * - Bun (native)
 *
 * ## Usage
 *
 * ```typescript
 * import { createEdgeHandler, detectRuntime } from 'stx/edge-runtime'
 *
 * const handler = createEdgeHandler({
 *   render: async (request) => {
 *     return renderTemplate('home.stx', { url: request.url })
 *   }
 * })
 *
 * export default handler
 * ```
 *
 * @module edge-runtime
 */

import nodeProcess from 'node:process'

// =============================================================================
// Types
// =============================================================================

/** Supported edge runtime platforms */
export type EdgePlatform =
  | 'cloudflare'
  | 'deno'
  | 'vercel'
  | 'netlify'
  | 'fastly'
  | 'node'
  | 'bun'
  | 'unknown'

/** Edge runtime detection result */
export interface RuntimeInfo {
  /** Detected platform */
  platform: EdgePlatform
  /** Platform version if available */
  version?: string
  /** Whether streaming is supported */
  supportsStreaming: boolean
  /** Whether Web Crypto API is available */
  supportsCrypto: boolean
  /** Whether KV storage is available */
  supportsKV: boolean
  /** Whether cache API is available */
  supportsCache: boolean
  /** Additional platform-specific capabilities */
  capabilities: string[]
}

/** Edge handler configuration */
export interface EdgeHandlerConfig {
  /** Render function to process requests */
  render: (request: Request, context: EdgeContext) => Promise<Response | string>
  /** Error handler */
  onError?: (error: Error, request: Request) => Response
  /** Request middleware */
  middleware?: EdgeMiddleware[]
  /** Cache configuration */
  cache?: EdgeCacheConfig
  /** CORS configuration */
  cors?: CorsConfig
}

/** Edge context passed to handlers */
export interface EdgeContext {
  /** Runtime information */
  runtime: RuntimeInfo
  /** Platform-specific context (env, ctx, etc.) */
  platform: Record<string, unknown>
  /** Request ID */
  requestId: string
  /** Geo information if available */
  geo?: GeoInfo
  /** Timing information */
  timing: {
    start: number
    getElapsed: () => number
  }
  /** KV storage interface */
  kv?: KVNamespace
  /** Cache interface */
  cache?: EdgeCache
  /** Environment variables */
  env: EnvAccessor
}

/** Geographic information */
export interface GeoInfo {
  city?: string
  country?: string
  countryCode?: string
  region?: string
  latitude?: number
  longitude?: number
  timezone?: string
}

/** Middleware function */
export type EdgeMiddleware = (
  request: Request,
  context: EdgeContext,
  next: () => Promise<Response>
) => Promise<Response>

/** Cache configuration */
export interface EdgeCacheConfig {
  /** Enable caching */
  enabled: boolean
  /** Default TTL in seconds */
  ttl?: number
  /** Cache key generator */
  keyGenerator?: (request: Request) => string
  /** Paths to cache */
  includePaths?: RegExp[]
  /** Paths to exclude */
  excludePaths?: RegExp[]
  /** Stale-while-revalidate */
  staleWhileRevalidate?: number
}

/** CORS configuration */
export interface CorsConfig {
  /** Allowed origins */
  origins?: string[] | '*'
  /** Allowed methods */
  methods?: string[]
  /** Allowed headers */
  headers?: string[]
  /** Expose headers */
  exposeHeaders?: string[]
  /** Allow credentials */
  credentials?: boolean
  /** Max age for preflight */
  maxAge?: number
}

/** KV namespace interface (platform-agnostic) */
export interface KVNamespace {
  get: (key: string) => Promise<string | null>
  getWithMetadata: <T>(key: string) => Promise<{ value: string | null, metadata: T | null }>
  put: (key: string, value: string, options?: KVPutOptions) => Promise<void>
  delete: (key: string) => Promise<void>
  list: (options?: KVListOptions) => Promise<KVListResult>
}

/** KV put options */
export interface KVPutOptions {
  expiration?: number
  expirationTtl?: number
  metadata?: Record<string, unknown>
}

/** KV list options */
export interface KVListOptions {
  prefix?: string
  limit?: number
  cursor?: string
}

/** KV list result */
export interface KVListResult {
  keys: { name: string, expiration?: number, metadata?: Record<string, unknown> }[]
  cursor?: string
  list_complete: boolean
}

/** Edge cache interface */
export interface EdgeCache {
  match: (request: Request) => Promise<Response | undefined>
  put: (request: Request, response: Response) => Promise<void>
  delete: (request: Request) => Promise<boolean>
}

/** Environment variable accessor */
export interface EnvAccessor {
  get: (key: string) => string | undefined
  getOrThrow: (key: string) => string
  has: (key: string) => boolean
  all: () => Record<string, string>
}

// =============================================================================
// Runtime Detection
// =============================================================================

/**
 * Detect the current edge runtime platform.
 */
export function detectRuntime(): RuntimeInfo {
  // Cloudflare Workers
  if (typeof globalThis !== 'undefined' && 'caches' in globalThis && 'CF' in (globalThis as any)) {
    return {
      platform: 'cloudflare',
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: true,
      supportsCache: true,
      capabilities: ['kv', 'r2', 'd1', 'durable-objects', 'queues'],
    }
  }

  // Deno
  if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
    const deno = (globalThis as any).Deno
    return {
      platform: 'deno',
      version: deno.version?.deno,
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: true,
      supportsCache: true,
      capabilities: ['kv', 'deploy', 'ffi'],
    }
  }

  // Bun
  if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
    const bun = (globalThis as any).Bun
    return {
      platform: 'bun',
      version: bun.version,
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: false,
      supportsCache: false,
      capabilities: ['sqlite', 'ffi', 'native-modules'],
    }
  }

  // Vercel Edge (detected by edge runtime header in request usually)
  if (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) {
    return {
      platform: 'vercel',
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: true,
      supportsCache: true,
      capabilities: ['edge-config', 'blob'],
    }
  }

  // Netlify Edge
  if (typeof globalThis !== 'undefined' && 'Netlify' in globalThis) {
    return {
      platform: 'netlify',
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: true,
      supportsCache: false,
      capabilities: ['blobs', 'edge-functions'],
    }
  }

  // Fastly Compute@Edge
  if (typeof globalThis !== 'undefined' && 'fastly' in globalThis) {
    return {
      platform: 'fastly',
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: true,
      supportsCache: true,
      capabilities: ['dictionary', 'backend', 'geolocation'],
    }
  }

  // Node.js
  if (nodeProcess.versions?.node) {
    return {
      platform: 'node',
      version: nodeProcess.versions.node,
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: false,
      supportsCache: false,
      capabilities: ['fs', 'child-process', 'native-modules'],
    }
  }

  return {
    platform: 'unknown',
    supportsStreaming: false,
    supportsCrypto: false,
    supportsKV: false,
    supportsCache: false,
    capabilities: [],
  }
}

/**
 * Check if running in an edge environment.
 */
export function isEdgeEnvironment(): boolean {
  const runtime = detectRuntime()
  return ['cloudflare', 'deno', 'vercel', 'netlify', 'fastly'].includes(runtime.platform)
}

/**
 * Check if running in a server environment (including edge).
 */
export function isServerEnvironment(): boolean {
  const runtime = detectRuntime()
  return runtime.platform !== 'unknown'
}

// =============================================================================
// Environment Variables
// =============================================================================

/**
 * Create a platform-agnostic environment accessor.
 */
export function createEnvAccessor(platformEnv?: Record<string, unknown>): EnvAccessor {
  return {
    get(key: string): string | undefined {
      // Check platform-specific env first
      if (platformEnv && key in platformEnv) {
        const value = platformEnv[key]
        return typeof value === 'string' ? value : undefined
      }

      // Deno
      if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
        return (globalThis as any).Deno.env.get(key)
      }

      // Node/Bun
      if (nodeProcess.env) {
        return nodeProcess.env[key]
      }

      return undefined
    },

    getOrThrow(key: string): string {
      const value = this.get(key)
      if (value === undefined) {
        throw new Error(`Environment variable "${key}" is not set`)
      }
      return value
    },

    has(key: string): boolean {
      return this.get(key) !== undefined
    },

    all(): Record<string, string> {
      const result: Record<string, string> = {}

      // Include platform env
      if (platformEnv) {
        for (const [key, value] of Object.entries(platformEnv)) {
          if (typeof value === 'string') {
            result[key] = value
          }
        }
      }

      // Deno
      if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
        const denoEnv = (globalThis as any).Deno.env.toObject()
        Object.assign(result, denoEnv)
      }

      // Node/Bun
      if (nodeProcess.env) {
        for (const [key, value] of Object.entries(nodeProcess.env)) {
          if (value !== undefined) {
            result[key] = value
          }
        }
      }

      return result
    },
  }
}

// =============================================================================
// KV Storage Adapters
// =============================================================================

/**
 * Create a platform-agnostic KV namespace.
 */
export function createKVNamespace(platformKV?: unknown): KVNamespace | undefined {
  const runtime = detectRuntime()

  // Cloudflare KV
  if (runtime.platform === 'cloudflare' && platformKV) {
    return platformKV as KVNamespace
  }

  // Deno KV
  if (runtime.platform === 'deno' && 'Deno' in globalThis) {
    return createDenoKVAdapter()
  }

  // In-memory fallback for development
  if (runtime.platform === 'node' || runtime.platform === 'bun') {
    return createInMemoryKV()
  }

  return undefined
}

/**
 * Create a Deno KV adapter.
 */
function createDenoKVAdapter(): KVNamespace {
  let kvInstance: any = null

  const getKV = async () => {
    if (!kvInstance) {
      kvInstance = await (globalThis as any).Deno.openKv()
    }
    return kvInstance
  }

  return {
    async get(key: string): Promise<string | null> {
      const kv = await getKV()
      const result = await kv.get(['stx', key])
      return result.value as string | null
    },

    async getWithMetadata<T>(key: string): Promise<{ value: string | null, metadata: T | null }> {
      const kv = await getKV()
      const result = await kv.get(['stx', key])
      const metaResult = await kv.get(['stx-meta', key])
      return {
        value: result.value as string | null,
        metadata: metaResult.value as T | null,
      }
    },

    async put(key: string, value: string, options?: KVPutOptions): Promise<void> {
      const kv = await getKV()
      const expireIn = options?.expirationTtl ? options.expirationTtl * 1000 : undefined
      await kv.set(['stx', key], value, expireIn ? { expireIn } : undefined)
      if (options?.metadata) {
        await kv.set(['stx-meta', key], options.metadata, expireIn ? { expireIn } : undefined)
      }
    },

    async delete(key: string): Promise<void> {
      const kv = await getKV()
      await kv.delete(['stx', key])
      await kv.delete(['stx-meta', key])
    },

    async list(options?: KVListOptions): Promise<KVListResult> {
      const kv = await getKV()
      const prefix = options?.prefix ? ['stx', options.prefix] : ['stx']
      const iter = kv.list({ prefix, limit: options?.limit || 100 })
      const keys: KVListResult['keys'] = []

      for await (const entry of iter) {
        const keyParts = entry.key as string[]
        const name = keyParts.slice(1).join('/')
        if (!name.startsWith('stx-meta/')) {
          keys.push({ name })
        }
      }

      return { keys, list_complete: true }
    },
  }
}

/**
 * Create an in-memory KV store for development.
 */
function createInMemoryKV(): KVNamespace {
  const store = new Map<string, { value: string, metadata?: Record<string, unknown>, expiration?: number }>()

  const cleanup = () => {
    const now = Date.now()
    for (const [key, data] of store.entries()) {
      if (data.expiration && data.expiration < now) {
        store.delete(key)
      }
    }
  }

  return {
    async get(key: string): Promise<string | null> {
      cleanup()
      const data = store.get(key)
      if (!data)
        return null
      if (data.expiration && data.expiration < Date.now()) {
        store.delete(key)
        return null
      }
      return data.value
    },

    async getWithMetadata<T>(key: string): Promise<{ value: string | null, metadata: T | null }> {
      cleanup()
      const data = store.get(key)
      if (!data)
        return { value: null, metadata: null }
      if (data.expiration && data.expiration < Date.now()) {
        store.delete(key)
        return { value: null, metadata: null }
      }
      return { value: data.value, metadata: (data.metadata as T) || null }
    },

    async put(key: string, value: string, options?: KVPutOptions): Promise<void> {
      const expiration = options?.expiration
        ? options.expiration * 1000
        : options?.expirationTtl
          ? Date.now() + options.expirationTtl * 1000
          : undefined

      store.set(key, { value, metadata: options?.metadata, expiration })
    },

    async delete(key: string): Promise<void> {
      store.delete(key)
    },

    async list(options?: KVListOptions): Promise<KVListResult> {
      cleanup()
      const keys: KVListResult['keys'] = []

      for (const [name, data] of store.entries()) {
        if (options?.prefix && !name.startsWith(options.prefix))
          continue
        keys.push({ name, expiration: data.expiration, metadata: data.metadata })
        if (options?.limit && keys.length >= options.limit)
          break
      }

      return { keys, list_complete: true }
    },
  }
}

// =============================================================================
// Cache Adapters
// =============================================================================

/**
 * Create a platform-agnostic cache.
 */
export function createEdgeCache(): EdgeCache | undefined {
  const runtime = detectRuntime()

  // Cloudflare Cache API
  if (runtime.platform === 'cloudflare' && 'caches' in globalThis) {
    return createCacheAPIAdapter()
  }

  // In-memory cache for other platforms
  if (runtime.supportsStreaming) {
    return createInMemoryCache()
  }

  return undefined
}

/**
 * Create a Cache API adapter.
 */
function createCacheAPIAdapter(): EdgeCache {
  return {
    async match(request: Request): Promise<Response | undefined> {
      const cache = await (caches as any).default
      return cache.match(request)
    },

    async put(request: Request, response: Response): Promise<void> {
      const cache = await (caches as any).default
      await cache.put(request, response.clone())
    },

    async delete(request: Request): Promise<boolean> {
      const cache = await (caches as any).default
      return cache.delete(request)
    },
  }
}

/**
 * Create an in-memory cache.
 */
function createInMemoryCache(): EdgeCache {
  const cache = new Map<string, { response: Response, expiration: number }>()
  const DEFAULT_TTL = 60 * 1000 // 1 minute

  return {
    async match(request: Request): Promise<Response | undefined> {
      const key = request.url
      const entry = cache.get(key)

      if (!entry)
        return undefined

      if (Date.now() > entry.expiration) {
        cache.delete(key)
        return undefined
      }

      return entry.response.clone()
    },

    async put(request: Request, response: Response): Promise<void> {
      const key = request.url
      const cacheControl = response.headers.get('Cache-Control')
      let ttl = DEFAULT_TTL

      if (cacheControl) {
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/)
        if (maxAgeMatch) {
          ttl = Number.parseInt(maxAgeMatch[1], 10) * 1000
        }
      }

      cache.set(key, {
        response: response.clone(),
        expiration: Date.now() + ttl,
      })
    },

    async delete(request: Request): Promise<boolean> {
      return cache.delete(request.url)
    },
  }
}

// =============================================================================
// Edge Handler
// =============================================================================

/**
 * Generate a unique request ID.
 */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Extract geo information from request headers.
 */
function extractGeoInfo(request: Request, runtime: RuntimeInfo): GeoInfo | undefined {
  // Cloudflare
  if (runtime.platform === 'cloudflare') {
    const cf = (request as any).cf
    if (cf) {
      return {
        city: cf.city,
        country: cf.country,
        countryCode: cf.country,
        region: cf.region,
        latitude: cf.latitude ? Number.parseFloat(cf.latitude) : undefined,
        longitude: cf.longitude ? Number.parseFloat(cf.longitude) : undefined,
        timezone: cf.timezone,
      }
    }
  }

  // Vercel
  if (runtime.platform === 'vercel') {
    const geo: GeoInfo = {}
    const city = request.headers.get('x-vercel-ip-city')
    const country = request.headers.get('x-vercel-ip-country')
    const region = request.headers.get('x-vercel-ip-country-region')
    const lat = request.headers.get('x-vercel-ip-latitude')
    const lng = request.headers.get('x-vercel-ip-longitude')

    if (city)
      geo.city = decodeURIComponent(city)
    if (country)
      geo.countryCode = country
    if (region)
      geo.region = region
    if (lat)
      geo.latitude = Number.parseFloat(lat)
    if (lng)
      geo.longitude = Number.parseFloat(lng)

    return Object.keys(geo).length > 0 ? geo : undefined
  }

  // Netlify
  if (runtime.platform === 'netlify') {
    const geo: GeoInfo = {}
    const city = request.headers.get('x-nf-geo-city')
    const country = request.headers.get('x-nf-geo-country')

    if (city)
      geo.city = city
    if (country)
      geo.countryCode = country

    return Object.keys(geo).length > 0 ? geo : undefined
  }

  return undefined
}

/**
 * Apply CORS headers to response.
 */
function applyCorsHeaders(response: Response, config: CorsConfig, origin?: string): Response {
  const headers = new Headers(response.headers)

  // Origin
  if (config.origins === '*') {
    headers.set('Access-Control-Allow-Origin', '*')
  }
  else if (config.origins && origin && config.origins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')
  }

  // Methods
  if (config.methods) {
    headers.set('Access-Control-Allow-Methods', config.methods.join(', '))
  }

  // Headers
  if (config.headers) {
    headers.set('Access-Control-Allow-Headers', config.headers.join(', '))
  }

  // Expose headers
  if (config.exposeHeaders) {
    headers.set('Access-Control-Expose-Headers', config.exposeHeaders.join(', '))
  }

  // Credentials
  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Max age
  if (config.maxAge) {
    headers.set('Access-Control-Max-Age', String(config.maxAge))
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Create an edge handler.
 */
export function createEdgeHandler(config: EdgeHandlerConfig) {
  const runtime = detectRuntime()

  return async (request: Request, platformContext?: Record<string, unknown>): Promise<Response> => {
    const startTime = performance.now()
    const requestId = generateRequestId()

    // Create context
    const context: EdgeContext = {
      runtime,
      platform: platformContext || {},
      requestId,
      geo: extractGeoInfo(request, runtime),
      timing: {
        start: startTime,
        getElapsed: () => performance.now() - startTime,
      },
      kv: createKVNamespace(platformContext?.KV),
      cache: createEdgeCache(),
      env: createEnvAccessor(platformContext?.env as Record<string, unknown>),
    }

    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS' && config.cors) {
        let response = new Response(null, { status: 204 })
        response = applyCorsHeaders(response, config.cors, request.headers.get('Origin') || undefined)
        return response
      }

      // Check cache
      if (config.cache?.enabled && request.method === 'GET' && context.cache) {
        const shouldCache = shouldCacheRequest(request, config.cache)
        if (shouldCache) {
          const cached = await context.cache.match(request)
          if (cached) {
            const response = new Response(cached.body, cached)
            response.headers.set('X-Cache', 'HIT')
            response.headers.set('X-Request-Id', requestId)
            return config.cors
              ? applyCorsHeaders(response, config.cors, request.headers.get('Origin') || undefined)
              : response
          }
        }
      }

      // Execute middleware chain
      let response: Response

      if (config.middleware && config.middleware.length > 0) {
        response = await executeMiddleware(request, context, config.middleware, async () => {
          const result = await config.render(request, context)
          return typeof result === 'string'
            ? new Response(result, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
            : result
        })
      }
      else {
        const result = await config.render(request, context)
        response = typeof result === 'string'
          ? new Response(result, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
          : result
      }

      // Add standard headers
      response.headers.set('X-Request-Id', requestId)
      response.headers.set('X-Response-Time', `${context.timing.getElapsed().toFixed(2)}ms`)

      // Cache response
      if (config.cache?.enabled && request.method === 'GET' && context.cache) {
        const shouldCache = shouldCacheRequest(request, config.cache)
        if (shouldCache && response.status === 200) {
          const ttl = config.cache.ttl || 60
          const cacheResponse = response.clone()
          cacheResponse.headers.set('Cache-Control', `public, max-age=${ttl}`)
          await context.cache.put(request, cacheResponse)
          response.headers.set('X-Cache', 'MISS')
        }
      }

      // Apply CORS
      if (config.cors) {
        response = applyCorsHeaders(response, config.cors, request.headers.get('Origin') || undefined)
      }

      return response
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      if (config.onError) {
        return config.onError(err, request)
      }

      return new Response(`Internal Server Error: ${err.message}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'X-Request-Id': requestId,
        },
      })
    }
  }
}

/**
 * Check if request should be cached.
 */
function shouldCacheRequest(request: Request, config: EdgeCacheConfig): boolean {
  const url = new URL(request.url)
  const path = url.pathname

  // Check exclude paths
  if (config.excludePaths) {
    for (const pattern of config.excludePaths) {
      if (pattern.test(path))
        return false
    }
  }

  // Check include paths
  if (config.includePaths) {
    for (const pattern of config.includePaths) {
      if (pattern.test(path))
        return true
    }
    return false
  }

  return true
}

/**
 * Execute middleware chain.
 */
async function executeMiddleware(
  request: Request,
  context: EdgeContext,
  middleware: EdgeMiddleware[],
  final: () => Promise<Response>,
): Promise<Response> {
  let index = 0

  const next = async (): Promise<Response> => {
    if (index >= middleware.length) {
      return final()
    }

    const mw = middleware[index]
    index++
    return mw(request, context, next)
  }

  return next()
}

// =============================================================================
// Streaming Utilities
// =============================================================================

/**
 * Create a streaming response for edge platforms.
 */
export function createStreamingResponse(
  stream: ReadableStream<Uint8Array>,
  options?: ResponseInit,
): Response {
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Transfer-Encoding', 'chunked')

  return new Response(stream, {
    ...options,
    headers,
  })
}

/**
 * Create a text encoder stream.
 */
export function createTextEncoderStream(): TransformStream<string, Uint8Array> {
  const encoder = new TextEncoder()
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(chunk))
    },
  })
}

/**
 * Pipe strings to a streaming response.
 */
export function stringToStream(strings: AsyncIterable<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      for await (const str of strings) {
        controller.enqueue(encoder.encode(str))
      }
      controller.close()
    },
  })
}

// =============================================================================
// Platform-Specific Exports
// =============================================================================

/**
 * Create a Cloudflare Workers handler.
 */
export function createCloudflareHandler(config: EdgeHandlerConfig): {
  fetch: (request: Request, env: Record<string, unknown>, ctx: { waitUntil: (p: Promise<unknown>) => void }) => Promise<Response>
} {
  const handler = createEdgeHandler(config)

  return {
    async fetch(request: Request, env: Record<string, unknown>, ctx: { waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
      return handler(request, { env, ctx, KV: env.KV })
    },
  }
}

/**
 * Create a Deno Deploy handler.
 */
export function createDenoHandler(config: EdgeHandlerConfig): (request: Request) => Promise<Response> {
  const handler = createEdgeHandler(config)
  return (request: Request): Promise<Response> => handler(request, {})
}

/**
 * Create a Vercel Edge handler.
 */
export function createVercelHandler(config: EdgeHandlerConfig): (request: Request) => Promise<Response> {
  const handler = createEdgeHandler(config)
  return (request: Request): Promise<Response> => handler(request, {})
}

/**
 * Create a Netlify Edge handler.
 */
export function createNetlifyHandler(config: EdgeHandlerConfig): (request: Request, context: { geo?: GeoInfo }) => Promise<Response> {
  const handler = createEdgeHandler(config)

  return (request: Request, context: { geo?: GeoInfo }): Promise<Response> => {
    return handler(request, { netlifyContext: context })
  }
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Parse cookies from request.
 */
export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader)
    return {}

  const cookies: Record<string, string> = {}

  for (const pair of cookieHeader.split(';')) {
    const [key, value] = pair.split('=').map(s => s.trim())
    if (key && value) {
      cookies[key] = decodeURIComponent(value)
    }
  }

  return cookies
}

/**
 * Create a Set-Cookie header value.
 */
export function createCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number
    expires?: Date
    path?: string
    domain?: string
    secure?: boolean
    httpOnly?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  },
): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (options?.maxAge !== undefined)
    cookie += `; Max-Age=${options.maxAge}`
  if (options?.expires)
    cookie += `; Expires=${options.expires.toUTCString()}`
  if (options?.path)
    cookie += `; Path=${options.path}`
  if (options?.domain)
    cookie += `; Domain=${options.domain}`
  if (options?.secure)
    cookie += '; Secure'
  if (options?.httpOnly)
    cookie += '; HttpOnly'
  if (options?.sameSite)
    cookie += `; SameSite=${options.sameSite}`

  return cookie
}

/**
 * JSON response helper.
 */
export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  })
}

/**
 * Redirect response helper.
 */
export function redirect(url: string, status: 301 | 302 | 303 | 307 | 308 = 302): Response {
  return new Response(null, {
    status,
    headers: { Location: url },
  })
}

/**
 * Not found response helper.
 */
export function notFound(message = 'Not Found'): Response {
  return new Response(message, {
    status: 404,
    headers: { 'Content-Type': 'text/plain' },
  })
}
