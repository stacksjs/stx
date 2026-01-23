/**
 * PWA Workbox Strategy Mapping
 *
 * Maps stx caching strategies to Workbox equivalents and generates
 * runtime caching configuration.
 */

import type { StxOptions } from '../types'

// ============================================================================
// Types
// ============================================================================

export type StxCacheStrategy =
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only'

export interface WorkboxStrategy {
  /** Workbox strategy class name */
  className: string
  /** Import path */
  importFrom: 'workbox-strategies'
  /** Default plugin options */
  defaultPlugins?: WorkboxPlugin[]
}

export interface WorkboxPlugin {
  /** Plugin class name */
  className: string
  /** Import path */
  importFrom: string
  /** Plugin configuration */
  options?: Record<string, unknown>
}

export interface WorkboxRoute {
  /** URL pattern or callback */
  pattern: string
  /** How to match (url, request, or callback) */
  matchType: 'pathname' | 'destination' | 'custom'
  /** Workbox strategy to use */
  strategy: WorkboxStrategy
  /** Plugins to apply */
  plugins?: WorkboxPlugin[]
  /** Cache name */
  cacheName?: string
}

export interface RuntimeCachingConfig {
  /** URL pattern to match */
  urlPattern: string | RegExp
  /** Strategy handler */
  handler: string
  /** Strategy options */
  options?: {
    cacheName?: string
    plugins?: WorkboxPlugin[]
    networkTimeoutSeconds?: number
    matchOptions?: {
      ignoreSearch?: boolean
      ignoreMethod?: boolean
      ignoreVary?: boolean
    }
  }
  /** HTTP methods to match */
  method?: string
}

// ============================================================================
// Strategy Mapping
// ============================================================================

/**
 * Map stx strategy name to Workbox strategy
 */
export function mapStrategyToWorkbox(strategy: StxCacheStrategy): WorkboxStrategy {
  const strategyMap: Record<StxCacheStrategy, WorkboxStrategy> = {
    'cache-first': {
      className: 'CacheFirst',
      importFrom: 'workbox-strategies',
    },
    'network-first': {
      className: 'NetworkFirst',
      importFrom: 'workbox-strategies',
    },
    'stale-while-revalidate': {
      className: 'StaleWhileRevalidate',
      importFrom: 'workbox-strategies',
    },
    'network-only': {
      className: 'NetworkOnly',
      importFrom: 'workbox-strategies',
    },
    'cache-only': {
      className: 'CacheOnly',
      importFrom: 'workbox-strategies',
    },
  }

  return strategyMap[strategy] || strategyMap['network-first']
}

/**
 * Get Workbox strategy class name
 */
export function getWorkboxStrategyName(strategy: StxCacheStrategy): string {
  return mapStrategyToWorkbox(strategy).className
}

// ============================================================================
// Plugin Generation
// ============================================================================

/**
 * Generate ExpirationPlugin config
 */
export function createExpirationPlugin(options: {
  maxEntries?: number
  maxAgeSeconds?: number
  purgeOnQuotaError?: boolean
}): WorkboxPlugin {
  return {
    className: 'ExpirationPlugin',
    importFrom: 'workbox-expiration',
    options: {
      ...(options.maxEntries && { maxEntries: options.maxEntries }),
      ...(options.maxAgeSeconds && { maxAgeSeconds: options.maxAgeSeconds }),
      ...(options.purgeOnQuotaError !== undefined && { purgeOnQuotaError: options.purgeOnQuotaError }),
    },
  }
}

/**
 * Generate CacheableResponsePlugin config
 */
export function createCacheableResponsePlugin(options: {
  statuses?: number[]
  headers?: Record<string, string>
}): WorkboxPlugin {
  return {
    className: 'CacheableResponsePlugin',
    importFrom: 'workbox-cacheable-response',
    options: {
      ...(options.statuses && { statuses: options.statuses }),
      ...(options.headers && { headers: options.headers }),
    },
  }
}

/**
 * Generate BackgroundSyncPlugin config
 */
export function createBackgroundSyncPlugin(options: {
  name: string
  maxRetentionTime?: number
  forceSyncFallback?: boolean
}): WorkboxPlugin {
  return {
    className: 'BackgroundSyncPlugin',
    importFrom: 'workbox-background-sync',
    options: {
      name: options.name,
      ...(options.maxRetentionTime && { maxRetentionTime: options.maxRetentionTime }),
      ...(options.forceSyncFallback !== undefined && { forceSyncFallback: options.forceSyncFallback }),
    },
  }
}

// ============================================================================
// Runtime Caching Generation
// ============================================================================

/**
 * Convert stx route config to Workbox runtime caching config
 */
export function convertRouteToWorkbox(route: {
  pattern: string
  strategy: StxCacheStrategy
  cacheName?: string
  maxAgeSeconds?: number
  maxEntries?: number
}): RuntimeCachingConfig {
  const workboxStrategy = mapStrategyToWorkbox(route.strategy)
  const plugins: WorkboxPlugin[] = []

  // Add expiration plugin if limits are set
  if (route.maxAgeSeconds || route.maxEntries) {
    plugins.push(createExpirationPlugin({
      maxAgeSeconds: route.maxAgeSeconds,
      maxEntries: route.maxEntries,
      purgeOnQuotaError: true,
    }))
  }

  // Add cacheable response plugin for network strategies
  if (route.strategy === 'network-first' || route.strategy === 'stale-while-revalidate') {
    plugins.push(createCacheableResponsePlugin({
      statuses: [0, 200],
    }))
  }

  return {
    urlPattern: route.pattern,
    handler: workboxStrategy.className,
    options: {
      cacheName: route.cacheName,
      ...(plugins.length > 0 && { plugins }),
    },
  }
}

/**
 * Generate runtime caching configuration from stx routes
 */
export function generateRuntimeCaching(
  routes: Array<{
    pattern: string
    strategy: StxCacheStrategy
    cacheName?: string
    maxAgeSeconds?: number
    maxEntries?: number
  }>,
): RuntimeCachingConfig[] {
  return routes.map(route => convertRouteToWorkbox(route))
}

/**
 * Generate runtime caching JavaScript code
 */
export function generateRuntimeCachingCode(options: StxOptions): string {
  const pwa = options.pwa
  if (!pwa?.enabled) {
    return ''
  }

  const routes = pwa.routes || []
  const cacheStorage = pwa.cacheStorage

  const cacheConfigs: string[] = []

  for (const route of routes) {
    const strategy = getWorkboxStrategyName(route.strategy as StxCacheStrategy)
    const plugins: string[] = []

    // Add expiration plugin
    if (route.maxAgeSeconds || route.maxEntries || cacheStorage?.maxEntries) {
      const maxEntries = route.maxEntries || cacheStorage?.maxEntries || 100
      const maxAgeSeconds = route.maxAgeSeconds || (cacheStorage?.maxAge ? cacheStorage.maxAge * 24 * 60 * 60 : undefined)

      plugins.push(`new ExpirationPlugin({
      maxEntries: ${maxEntries},
      ${maxAgeSeconds ? `maxAgeSeconds: ${maxAgeSeconds},` : ''}
      purgeOnQuotaError: true,
    })`)
    }

    // Add cacheable response for network strategies
    if (route.strategy === 'network-first' || route.strategy === 'stale-while-revalidate') {
      plugins.push(`new CacheableResponsePlugin({
      statuses: [0, 200],
    })`)
    }

    // Generate pattern matcher
    const patternMatcher = generatePatternMatcher(route.pattern)

    cacheConfigs.push(`
// ${route.pattern}
registerRoute(
  ${patternMatcher},
  new ${strategy}({
    cacheName: '${route.cacheName || generateCacheName(route.pattern)}',
    ${plugins.length > 0 ? `plugins: [\n      ${plugins.join(',\n      ')}\n    ],` : ''}
  })
);`)
  }

  return cacheConfigs.join('\n')
}

/**
 * Generate pattern matcher for Workbox registerRoute
 */
export function generatePatternMatcher(pattern: string): string {
  // Handle file extension patterns like *.js, *.css
  if (pattern.startsWith('*.')) {
    const ext = pattern.slice(2)
    return `({ request }) => request.destination === '${getDestinationForExtension(ext)}'`
  }

  // Handle glob patterns with /**
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3)
    return `({ url }) => url.pathname.startsWith('${prefix}')`
  }

  // Handle glob patterns with /*
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2)
    return `({ url }) => url.pathname.startsWith('${prefix}') && !url.pathname.slice(${prefix.length + 1}).includes('/')`
  }

  // Handle patterns with * in the middle
  if (pattern.includes('*') && !pattern.startsWith('*')) {
    const [prefix, suffix] = pattern.split('*')
    return `({ url }) => url.pathname.startsWith('${prefix}') && url.pathname.endsWith('${suffix}')`
  }

  // Exact match or simple path
  if (pattern === '/' || !pattern.includes('*')) {
    return `({ url }) => url.pathname === '${pattern}'`
  }

  // Default to regex
  return `new RegExp('${escapeRegex(pattern).replace(/\\\*/g, '.*')}')`
}

/**
 * Map file extension to request destination
 */
function getDestinationForExtension(ext: string): string {
  const destinationMap: Record<string, string> = {
    js: 'script',
    mjs: 'script',
    css: 'style',
    html: 'document',
    htm: 'document',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',
    avif: 'image',
    ico: 'image',
    woff: 'font',
    woff2: 'font',
    ttf: 'font',
    eot: 'font',
    otf: 'font',
  }

  return destinationMap[ext.toLowerCase()] || 'empty'
}

/**
 * Generate cache name from pattern
 */
function generateCacheName(pattern: string): string {
  // Remove special characters and create a readable name
  return 'stx-'
    + pattern
      .replace(/[^\w]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 30)
    + '-cache'
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
