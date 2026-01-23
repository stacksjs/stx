/**
 * PWA Workbox Service Worker Generator
 *
 * Generates service worker code using Google's Workbox library.
 * Provides robust caching with less custom code than the native implementation.
 *
 * @module pwa/workbox
 *
 * Features:
 * - Automatic precaching with revision hashing
 * - Runtime caching with multiple strategies
 * - ExpirationPlugin for cache limits
 * - NavigationRoute for offline fallback
 * - Background sync support
 * - Push notification handling
 */

import type { StxOptions } from '../types'
import {
  generateRuntimeCachingCode,
  getWorkboxStrategyName,
  type StxCacheStrategy,
} from './workbox-strategies'
import { generatePrecacheManifest, generatePrecacheManifestJs } from './precache'

// ============================================================================
// Types
// ============================================================================

export interface WorkboxConfig {
  /** Use InjectManifest or GenerateSW mode */
  mode: 'inject' | 'generate'
  /** Workbox modules to import */
  modules: WorkboxModule[]
  /** Files to precache */
  precacheManifest?: PrecacheEntry[]
  /** Runtime caching rules */
  runtimeCaching?: RuntimeCacheRule[]
  /** Skip waiting on install */
  skipWaiting?: boolean
  /** Claim clients immediately */
  clientsClaim?: boolean
  /** Offline fallback page */
  offlineFallback?: string
  /** Enable navigation preload */
  navigationPreload?: boolean
  /** Cache version */
  cacheVersion?: string
}

export interface WorkboxModule {
  name: string
  exports: string[]
}

export interface PrecacheEntry {
  url: string
  revision?: string | null
}

export interface RuntimeCacheRule {
  urlPattern: string | RegExp
  handler: string
  options?: {
    cacheName?: string
    expiration?: {
      maxEntries?: number
      maxAgeSeconds?: number
    }
    networkTimeoutSeconds?: number
  }
}

// ============================================================================
// Workbox Generator
// ============================================================================

/**
 * Generate Workbox configuration from stx options
 */
export function generateWorkboxConfig(options: StxOptions, outputDir?: string): WorkboxConfig {
  const pwa = options.pwa
  if (!pwa?.enabled) {
    return {
      mode: 'generate',
      modules: [],
      skipWaiting: true,
      clientsClaim: true,
    }
  }

  const swConfig = pwa.serviceWorker || {}
  const routes = pwa.routes || []

  // Determine required modules based on features
  const modules: WorkboxModule[] = [
    {
      name: 'workbox-precaching',
      exports: ['precacheAndRoute', 'cleanupOutdatedCaches'],
    },
    {
      name: 'workbox-routing',
      exports: ['registerRoute', 'NavigationRoute', 'setDefaultHandler'],
    },
  ]

  // Add strategy imports based on routes
  const strategies = new Set<string>()
  for (const route of routes) {
    strategies.add(getWorkboxStrategyName(route.strategy as StxCacheStrategy))
  }
  if (strategies.size > 0) {
    modules.push({
      name: 'workbox-strategies',
      exports: Array.from(strategies),
    })
  }

  // Add expiration if any route has limits
  const hasExpiration = routes.some(r => r.maxAgeSeconds || r.maxEntries) || pwa.cacheStorage
  if (hasExpiration) {
    modules.push({
      name: 'workbox-expiration',
      exports: ['ExpirationPlugin'],
    })
  }

  // Add cacheable response plugin
  if (routes.some(r => r.strategy === 'network-first' || r.strategy === 'stale-while-revalidate')) {
    modules.push({
      name: 'workbox-cacheable-response',
      exports: ['CacheableResponsePlugin'],
    })
  }

  // Add background sync if enabled
  if (pwa.backgroundSync?.enabled) {
    modules.push({
      name: 'workbox-background-sync',
      exports: ['BackgroundSyncPlugin', 'Queue'],
    })
  }

  // Add navigation preload if enabled
  if (swConfig.navigationPreload) {
    modules.push({
      name: 'workbox-navigation-preload',
      exports: ['enable'],
    })
  }

  // Generate precache manifest
  const precacheManifest = outputDir ? generatePrecacheManifest(outputDir, options) : undefined

  return {
    mode: 'generate',
    modules,
    precacheManifest,
    skipWaiting: swConfig.skipWaiting ?? true,
    clientsClaim: swConfig.clientsClaim ?? true,
    offlineFallback: pwa.offline?.enabled ? '/offline.html' : undefined,
    navigationPreload: swConfig.navigationPreload ?? false,
    cacheVersion: swConfig.cacheVersion || '1.0.0',
  }
}

/**
 * Generate Workbox service worker JavaScript code
 */
export function generateWorkboxServiceWorker(options: StxOptions, outputDir?: string): string {
  const pwa = options.pwa
  if (!pwa?.enabled) {
    return ''
  }

  const config = generateWorkboxConfig(options, outputDir)
  const swConfig = pwa.serviceWorker || {}
  const pushConfig = pwa.push
  const syncConfig = pwa.backgroundSync

  // Generate precache manifest
  const precacheManifest = outputDir ? generatePrecacheManifest(outputDir, options) : null
  const precacheManifestJs = precacheManifest ? generatePrecacheManifestJs(precacheManifest) : '[]'

  // Build imports
  const imports = generateWorkboxImports(config.modules)

  // Build runtime caching
  const runtimeCaching = generateRuntimeCachingCode(options)

  return `/**
 * Service Worker - Generated by stx with Workbox
 * Cache Version: ${config.cacheVersion}
 *
 * This service worker uses Google's Workbox library for robust caching.
 * https://developers.google.com/web/tools/workbox
 *
 * Features:
 * - Precaching with automatic revision management
 * - Runtime caching with multiple strategies
 * - Offline fallback support
 * - Push notifications: ${pushConfig?.enabled ? 'enabled' : 'disabled'}
 * - Background sync: ${syncConfig?.enabled ? 'enabled' : 'disabled'}
 */

// Import Workbox modules from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Disable Workbox logging in production
workbox.setConfig({ debug: ${process.env.NODE_ENV !== 'production'} });

// Extract modules from workbox global
${imports}

const CACHE_VERSION = '${config.cacheVersion}';
const OFFLINE_PAGE = '${config.offlineFallback || '/offline.html'}';

// ============================================================================
// Precaching
// ============================================================================

// Clean up outdated caches from previous versions
cleanupOutdatedCaches();

// Precache static assets
// The manifest is injected during build or defined below
const PRECACHE_MANIFEST = ${precacheManifestJs};

// Add essential assets
PRECACHE_MANIFEST.push(
  { url: '/', revision: CACHE_VERSION },
  { url: '/manifest.json', revision: CACHE_VERSION },
  ${config.offlineFallback ? `{ url: '${config.offlineFallback}', revision: CACHE_VERSION },` : ''}
);

// Precache and route all manifest entries
precacheAndRoute(PRECACHE_MANIFEST);

// ============================================================================
// Navigation Preload
// ============================================================================

${config.navigationPreload ? `// Enable navigation preload for faster page loads
enable();` : '// Navigation preload disabled'}

// ============================================================================
// Runtime Caching
// ============================================================================

${runtimeCaching}

// ============================================================================
// Offline Fallback
// ============================================================================

${config.offlineFallback ? `
// Set up offline fallback for navigation requests
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'stx-pages-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  {
    // Return offline page when navigation fails
    async allowedHandler(request) {
      try {
        const response = await this.handle(request);
        return response;
      } catch (error) {
        const cache = await caches.open('stx-offline-cache');
        return cache.match(OFFLINE_PAGE) || new Response('You are offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
    },
  }
);
registerRoute(navigationRoute);
` : '// No offline fallback configured'}

// Default handler for unmatched requests
setDefaultHandler(new NetworkFirst({
  cacheName: 'stx-default-cache',
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }), // 1 day
  ],
}));

// ============================================================================
// Service Worker Lifecycle
// ============================================================================

${config.skipWaiting ? `// Skip waiting - activate immediately
self.skipWaiting();` : '// Manual skipWaiting - user must trigger update'}

${config.clientsClaim ? `// Claim clients - take control immediately
self.addEventListener('activate', () => {
  self.clients.claim();
});` : '// Manual clients claim'}

// ============================================================================
// Message Handling
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.source?.postMessage({ type: 'VERSION', payload: CACHE_VERSION });
      break;

    case 'CACHE_URLS':
      if (Array.isArray(payload)) {
        event.waitUntil(
          caches.open('stx-dynamic-cache').then(cache => cache.addAll(payload))
        );
      }
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(names =>
          Promise.all(names.map(name => caches.delete(name)))
        )
      );
      break;
  }
});

${pushConfig?.enabled ? generateWorkboxPushHandlers(pushConfig) : '// Push notifications disabled'}

${syncConfig?.enabled ? generateWorkboxSyncHandlers(syncConfig) : '// Background sync disabled'}

console.log('[Workbox SW] Service Worker loaded - Version:', CACHE_VERSION);
`
}

/**
 * Generate Workbox module imports
 */
function generateWorkboxImports(modules: WorkboxModule[]): string {
  const lines: string[] = []

  for (const module of modules) {
    const moduleName = module.name.replace('workbox-', '')
    lines.push(`const { ${module.exports.join(', ')} } = workbox.${toCamelCase(moduleName)};`)
  }

  return lines.join('\n')
}

/**
 * Convert kebab-case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Generate push notification handlers for Workbox SW
 */
function generateWorkboxPushHandlers(pushConfig: NonNullable<StxOptions['pwa']>['push']): string {
  return `
// ============================================================================
// Push Notifications
// ============================================================================

const PUSH_CONFIG = {
  defaultIcon: '${pushConfig?.defaultIcon || '/pwa-icons/icon-192x192.png'}',
  defaultBadge: '${pushConfig?.defaultBadge || '/pwa-icons/icon-72x72.png'}',
};

self.addEventListener('push', (event) => {
  console.log('[Workbox SW] Push notification received');

  let data = {
    title: 'Notification',
    body: 'You have a new notification',
    icon: PUSH_CONFIG.defaultIcon,
    badge: PUSH_CONFIG.defaultBadge,
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || PUSH_CONFIG.defaultIcon,
    badge: data.badge || PUSH_CONFIG.defaultBadge,
    vibrate: data.vibrate || [100, 50, 100],
    data: {
      url: data.url || '/',
      ...data.data,
    },
    actions: data.actions || [],
    tag: data.tag,
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Workbox SW] Notification clicked');
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
`
}

/**
 * Generate background sync handlers for Workbox SW
 */
function generateWorkboxSyncHandlers(syncConfig: NonNullable<StxOptions['pwa']>['backgroundSync']): string {
  return `
// ============================================================================
// Background Sync
// ============================================================================

const syncQueue = new Queue('${syncConfig?.queueName || 'stx-sync-queue'}', {
  maxRetentionTime: ${syncConfig?.maxRetentionMinutes || 60 * 24}, // minutes
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        console.log('[Workbox SW] Sync succeeded:', entry.request.url);

        // Notify clients
        const allClients = await self.clients.matchAll();
        allClients.forEach(client => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            url: entry.request.url,
            success: true,
          });
        });
      } catch (error) {
        console.log('[Workbox SW] Sync failed, re-queuing:', entry.request.url);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Register routes that should use background sync
${syncConfig?.endpoints?.map(endpoint => `
registerRoute(
  ({ url }) => url.pathname.startsWith('${endpoint}'),
  new NetworkOnly({
    plugins: [
      new BackgroundSyncPlugin('${syncConfig?.queueName || 'stx-sync-queue'}', {
        maxRetentionTime: ${syncConfig?.maxRetentionMinutes || 60 * 24},
      }),
    ],
  }),
  'POST'
);`).join('\n') || '// No background sync endpoints configured'}

// Handle form sync messages
self.addEventListener('message', (event) => {
  if (event.data?.type === 'REGISTER_FORM_SYNC') {
    const { action, method, data } = event.data.payload;

    const request = new Request(action, {
      method: method || 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString(),
    });

    event.waitUntil(syncQueue.pushRequest({ request }));
  }
});
`
}

/**
 * Check if Workbox mode is enabled in config
 */
export function isWorkboxEnabled(options: StxOptions): boolean {
  return options.pwa?.enabled === true && options.pwa?.serviceWorker?.useWorkbox === true
}

/**
 * Get the appropriate service worker generator based on config
 */
export function getServiceWorkerGenerator(options: StxOptions): (options: StxOptions, outputDir?: string) => string {
  if (isWorkboxEnabled(options)) {
    return generateWorkboxServiceWorker
  }

  // Import native generator dynamically to avoid circular dependency
  const { generateServiceWorker } = require('./service-worker')
  return generateServiceWorker
}
