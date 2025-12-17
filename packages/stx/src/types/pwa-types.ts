/**
 * Progressive Web App (PWA) Types
 */

/**
 * PWA caching strategy for service worker routes
 */
export type PwaCacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only'

/**
 * PWA route cache configuration
 * Defines how specific routes should be cached by the service worker
 */
export interface PwaRouteCache {
  /** Route pattern (glob-style, e.g., '/api/*', '*.{js,css}') */
  pattern: string
  /** Caching strategy for this route */
  strategy: PwaCacheStrategy
  /** Custom cache name for this route group */
  cacheName?: string
  /** Cache expiration in seconds */
  maxAgeSeconds?: number
  /** Maximum number of entries in cache */
  maxEntries?: number
}

/**
 * PWA icon configuration for automatic generation
 */
export interface PwaIconConfig {
  /** Source icon path (512x512 PNG recommended) */
  src: string
  /** Sizes to generate (default: [72, 96, 128, 144, 152, 192, 384, 512]) */
  sizes?: number[]
  /** Generate WebP variants alongside PNG */
  generateWebP?: boolean
  /** Generate Apple touch icon variants */
  generateAppleIcons?: boolean
  /** Output directory for generated icons (relative to output dir) */
  outputDir?: string
  /** Icon purpose for manifest ('any', 'maskable', 'monochrome') */
  purpose?: ('any' | 'maskable' | 'monochrome')[]
}

/**
 * PWA shortcut definition for app shortcuts menu
 */
export interface PwaShortcut {
  /** Shortcut name */
  name: string
  /** Short name (optional) */
  shortName?: string
  /** Description of the shortcut */
  description?: string
  /** URL to navigate to */
  url: string
  /** Icons for the shortcut */
  icons?: Array<{ src: string, sizes: string, type?: string }>
}

/**
 * PWA screenshot definition for app store listings
 */
export interface PwaScreenshot {
  /** Screenshot image path */
  src: string
  /** Image dimensions (e.g., '1280x720') */
  sizes: string
  /** Image MIME type */
  type?: string
  /** Screenshot label/description */
  label?: string
  /** Platform: 'wide' for desktop, 'narrow' for mobile */
  platform?: 'wide' | 'narrow'
}

/**
 * PWA Web App Manifest configuration
 */
export interface PwaManifestConfig {
  /** Full application name */
  name: string
  /** Short name (displayed on home screen) */
  shortName?: string
  /** Application description */
  description?: string
  /** Start URL when app is launched */
  startUrl?: string
  /** Display mode for the app */
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  /** Display mode override order */
  displayOverride?: string[]
  /** Preferred orientation */
  orientation?: 'portrait' | 'landscape' | 'any' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary'
  /** Theme color (affects browser UI) */
  themeColor?: string
  /** Background color (splash screen) */
  backgroundColor?: string
  /** Scope of the PWA */
  scope?: string
  /** Primary language */
  lang?: string
  /** Text direction */
  dir?: 'ltr' | 'rtl' | 'auto'
  /** Unique app ID */
  id?: string
  /** App categories for store listings */
  categories?: string[]
  /** App shortcuts for quick actions */
  shortcuts?: PwaShortcut[]
  /** Screenshots for app store listings */
  screenshots?: PwaScreenshot[]
  /** Launch handler behavior */
  launchHandler?: 'auto' | 'focus-existing' | 'navigate-new' | 'navigate-existing'
  /** How to handle links */
  handleLinks?: 'auto' | 'preferred' | 'not-preferred'
  /** Edge side panel configuration */
  edgeSidePanel?: {
    enabled: boolean
    preferredWidth?: number
  }
}

/**
 * PWA offline fallback page configuration
 */
export interface PwaOfflineConfig {
  /** Enable offline support */
  enabled: boolean
  /** Path to custom offline page (.stx file) */
  page?: string
  /** Fallback title when offline */
  fallbackTitle?: string
  /** Fallback message when offline */
  fallbackMessage?: string
  /** Additional assets to precache for offline access */
  precacheAssets?: string[]
}

/**
 * Service worker configuration
 */
export interface PwaServiceWorkerConfig {
  /** Service worker file name (default: 'sw.js') */
  fileName?: string
  /** Cache version for cache busting */
  cacheVersion?: string
  /** Skip waiting and activate immediately */
  skipWaiting?: boolean
  /** Claim all clients immediately */
  clientsClaim?: boolean
  /** Enable navigation preload */
  navigationPreload?: boolean
  /** Routes to exclude from caching (glob patterns) */
  excludeRoutes?: string[]
  /** File types to cache (extensions without dot) */
  cacheFileTypes?: string[]
  /** Use Workbox library instead of custom SW (requires workbox-* packages) */
  useWorkbox?: boolean
}

/**
 * Push notification configuration
 */
export interface PwaPushConfig {
  /** Enable push notifications */
  enabled: boolean
  /** VAPID public key for push subscriptions */
  vapidPublicKey?: string
  /** Server endpoint for push subscription registration */
  subscriptionEndpoint?: string
  /** Default notification icon path */
  defaultIcon?: string
  /** Default notification badge path */
  defaultBadge?: string
  /** Default notification options */
  defaultOptions?: {
    /** Enable vibration */
    vibrate?: number[]
    /** Require interaction to dismiss */
    requireInteraction?: boolean
  }
}

/**
 * Background sync configuration
 */
export interface PwaBackgroundSyncConfig {
  /** Enable background sync */
  enabled: boolean
  /** Queue name for sync operations */
  queueName?: string
  /** Maximum retention time in minutes */
  maxRetentionMinutes?: number
  /** Maximum retry attempts */
  maxRetries?: number
  /** Minimum interval between retries in ms */
  minInterval?: number
  /** Forms to enable background sync for (CSS selectors) */
  forms?: string[]
  /** API endpoints to queue when offline */
  endpoints?: string[]
}

/**
 * Share target configuration for receiving shared content
 */
export interface PwaShareTargetConfig {
  /** Enable share target */
  enabled: boolean
  /** Action URL to handle shared content */
  action: string
  /** HTTP method for share action */
  method?: 'GET' | 'POST'
  /** Encoding type for POST */
  enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data'
  /** Parameter configuration */
  params?: {
    /** Parameter name for shared title */
    title?: string
    /** Parameter name for shared text */
    text?: string
    /** Parameter name for shared URL */
    url?: string
  }
  /** Accept file types for sharing */
  acceptFiles?: Array<{
    name: string
    accept: string[]
  }>
}

/**
 * File handler configuration for handling specific file types
 */
export interface PwaFileHandlerConfig {
  /** Enable file handling */
  enabled: boolean
  /** Action URL to handle files */
  action?: string
  /** Accepted MIME types and extensions (e.g., { 'text/markdown': ['.md'] }) */
  accept?: Record<string, string[]>
  /** Launch type */
  launchType?: 'single-client' | 'multiple-clients'
  /** Icons for file handler */
  icons?: Array<{ src: string, sizes: string, type: string }>
}

/**
 * Protocol handler configuration
 */
export interface PwaProtocolHandlerConfig {
  /** Protocol scheme (e.g., 'web+myapp') */
  protocol: string
  /** URL to handle the protocol */
  url: string
}

/**
 * Cache storage limits configuration
 */
export interface PwaCacheStorageConfig {
  /** Maximum cache size in MB */
  maxSize?: number
  /** Maximum number of cached entries */
  maxEntries?: number
  /** Maximum age of cached items in days */
  maxAge?: number
  /** Purge strategy when limits exceeded */
  purgeStrategy?: 'lru' | 'fifo' | 'lfu'
}

/**
 * Update notification configuration
 */
export interface PwaUpdateConfig {
  /** Enable update notifications */
  enabled: boolean
  /** Show prompt when update available */
  promptUser?: boolean
  /** Auto-reload after update */
  autoReload?: boolean
  /** Custom update notification message */
  message?: string
  /** Selector for custom update UI element */
  uiSelector?: string
}

/**
 * Auto-precaching configuration
 */
export interface PwaPrecacheConfig {
  /** Enable auto-precaching of build output */
  enabled: boolean
  /** Include HTML files */
  includeHtml?: boolean
  /** Include JS files */
  includeJs?: boolean
  /** Include CSS files */
  includeCss?: boolean
  /** Include images */
  includeImages?: boolean
  /** Include fonts */
  includeFonts?: boolean
  /** Additional glob patterns to include */
  include?: string[]
  /** Glob patterns to exclude */
  exclude?: string[]
  /** Maximum file size to precache (in KB) */
  maxFileSizeKB?: number
}

/**
 * Complete PWA configuration
 */
export interface PwaConfig {
  /** Enable PWA features */
  enabled: boolean
  /** Web App Manifest configuration */
  manifest: PwaManifestConfig
  /** Icon generation configuration */
  icons?: PwaIconConfig
  /** Route-based caching strategies */
  routes?: PwaRouteCache[]
  /** Offline fallback configuration */
  offline?: PwaOfflineConfig
  /** Service worker configuration */
  serviceWorker?: PwaServiceWorkerConfig
  /** Auto-inject PWA meta tags and service worker registration */
  autoInject?: boolean
  /** Push notification configuration */
  push?: PwaPushConfig
  /** Background sync configuration */
  backgroundSync?: PwaBackgroundSyncConfig
  /** Share target configuration */
  shareTarget?: PwaShareTargetConfig
  /** File handler configuration */
  fileHandlers?: PwaFileHandlerConfig
  /** Protocol handlers */
  protocolHandlers?: PwaProtocolHandlerConfig[]
  /** Cache storage limits */
  cacheStorage?: PwaCacheStorageConfig
  /** Update notification configuration */
  updates?: PwaUpdateConfig
  /** Auto-precaching configuration */
  precache?: PwaPrecacheConfig
}
