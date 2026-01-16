/**
 * STX PWA Module
 *
 * Progressive Web App support including service worker generation,
 * manifest generation, icon processing, and Workbox integration.
 *
 * @module pwa
 *
 * @example
 * ```typescript
 * import {
 *   generateServiceWorkerAuto,
 *   generateManifest,
 *   generateWorkboxServiceWorker,
 *   isWorkboxEnabled,
 * } from 'stx/pwa'
 * ```
 */

// ============================================================================
// Service Worker
// ============================================================================

export {
  generateServiceWorker,
  generateServiceWorkerAuto,
  getServiceWorkerFileName,
  isWorkboxEnabled,
} from './service-worker'

// ============================================================================
// Workbox Integration
// ============================================================================

export {
  generateWorkboxConfig,
  generateWorkboxServiceWorker,
  isWorkboxEnabled as checkWorkboxEnabled,
  getServiceWorkerGenerator,
  type WorkboxConfig,
  type WorkboxModule,
  type PrecacheEntry,
  type RuntimeCacheRule,
} from './workbox'

export {
  mapStrategyToWorkbox,
  getWorkboxStrategyName,
  generateRuntimeCachingCode,
  generatePatternMatcher,
  convertRouteToWorkbox,
  generateRuntimeCaching,
  createExpirationPlugin,
  createCacheableResponsePlugin,
  createBackgroundSyncPlugin,
  type StxCacheStrategy,
  type WorkboxStrategy,
  type WorkboxPlugin,
  type WorkboxRoute,
  type RuntimeCachingConfig,
} from './workbox-strategies'

// ============================================================================
// Manifest
// ============================================================================

export {
  generateManifest,
  generateManifestFile,
} from './manifest'

// ============================================================================
// Icons
// ============================================================================

export {
  generatePwaIcons,
  type IconGenerationResult,
} from './icons'

// ============================================================================
// Precache
// ============================================================================

export {
  generatePrecacheManifest,
  generatePrecacheManifestJs,
  formatSize,
  type PrecacheManifestEntry,
} from './precache'

// ============================================================================
// Offline
// ============================================================================

export {
  generateOfflinePage,
} from './offline'

// ============================================================================
// Injection
// ============================================================================

export {
  injectPwaAssets,
  generatePwaRegistrationScript,
} from './inject'

// ============================================================================
// Audit
// ============================================================================

export {
  auditPwa,
  type PwaAuditResult,
  type PwaAuditCheck,
} from './audit'

// ============================================================================
// Directives
// ============================================================================

export {
  pwaDirectives,
} from './directives'
