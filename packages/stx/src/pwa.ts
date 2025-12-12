/**
 * PWA (Progressive Web App) Module
 *
 * Provides comprehensive Progressive Web App functionality for stx:
 * - Web App Manifest generation
 * - Service Worker with configurable caching strategies
 * - Automatic icon generation from source image
 * - Offline fallback page support
 * - Auto-injection of PWA meta tags and scripts
 *
 * ## Quick Start
 *
 * Enable PWA in your `stx.config.ts`:
 *
 * ```typescript
 * export default {
 *   pwa: {
 *     enabled: true,
 *     manifest: {
 *       name: 'My App',
 *       shortName: 'App',
 *       themeColor: '#4f46e5',
 *     },
 *     icons: {
 *       src: 'public/icon-512.png',
 *     },
 *   },
 * }
 * ```
 *
 * ## Caching Strategies
 *
 * Configure route-based caching strategies:
 *
 * ```typescript
 * pwa: {
 *   routes: [
 *     { pattern: '/', strategy: 'network-first' },
 *     { pattern: '/static/*', strategy: 'cache-first' },
 *     { pattern: '/api/*', strategy: 'network-only' },
 *     { pattern: '*.js', strategy: 'stale-while-revalidate' },
 *   ],
 * }
 * ```
 *
 * Available strategies:
 * - `cache-first`: Serve from cache, fall back to network
 * - `network-first`: Try network, fall back to cache
 * - `stale-while-revalidate`: Serve cached, update in background
 * - `network-only`: Always fetch from network
 * - `cache-only`: Only serve from cache
 *
 * ## Icon Generation
 *
 * Provide a single 512x512 PNG and icons are auto-generated:
 *
 * ```typescript
 * pwa: {
 *   icons: {
 *     src: 'public/icon.png',
 *     sizes: [72, 96, 128, 144, 152, 192, 384, 512],
 *     generateWebP: true,
 *     generateAppleIcons: true,
 *   },
 * }
 * ```
 *
 * ## Offline Support
 *
 * Configure offline fallback behavior:
 *
 * ```typescript
 * pwa: {
 *   offline: {
 *     enabled: true,
 *     page: 'offline.stx',  // Custom offline page
 *     fallbackTitle: 'Offline',
 *     fallbackMessage: 'Check your connection',
 *   },
 * }
 * ```
 *
 * @module pwa
 */

// Re-export all PWA submodules
// Import for convenience functions
import type { StxOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { generatePwaIcons, isSharpAvailable } from './pwa/icons'
import { injectPwaTags } from './pwa/inject'
import { generateManifestJson } from './pwa/manifest'
import { generateOfflinePage } from './pwa/offline'
import { generateServiceWorker, getServiceWorkerFileName } from './pwa/service-worker'

export * from './pwa/icons'
export * from './pwa/inject'
export * from './pwa/manifest'
export * from './pwa/offline'
export * from './pwa/service-worker'

/**
 * PWA build result
 */
export interface PwaBuildResult {
  success: boolean
  files: {
    manifest?: string
    serviceWorker?: string
    offlinePage?: string
    icons: string[]
  }
  errors: string[]
  warnings: string[]
}

/**
 * Build all PWA assets
 *
 * Generates manifest.json, service worker, icons, and offline page.
 *
 * @param options - stx configuration options
 * @param outputDir - Directory to write PWA assets
 * @returns Build result with file paths and status
 */
export async function buildPwaAssets(
  options: StxOptions,
  outputDir: string,
): Promise<PwaBuildResult> {
  const result: PwaBuildResult = {
    success: true,
    files: {
      icons: [],
    },
    errors: [],
    warnings: [],
  }

  const pwa = options.pwa
  if (!pwa?.enabled) {
    return result
  }

  // Ensure output directory exists
  try {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  catch {
    result.errors.push(`Failed to create output directory: ${outputDir}`)
    result.success = false
    return result
  }

  // Generate manifest.json
  try {
    const manifestJson = generateManifestJson(options)
    if (manifestJson) {
      const manifestPath = path.join(outputDir, 'manifest.json')
      await Bun.write(manifestPath, manifestJson)
      result.files.manifest = manifestPath
    }
  }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    result.errors.push(`Failed to generate manifest.json: ${msg}`)
    result.success = false
  }

  // Generate service worker
  try {
    const swCode = generateServiceWorker(options)
    if (swCode) {
      const swFileName = getServiceWorkerFileName(options)
      const swPath = path.join(outputDir, swFileName)
      await Bun.write(swPath, swCode)
      result.files.serviceWorker = swPath
    }
  }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    result.errors.push(`Failed to generate service worker: ${msg}`)
    result.success = false
  }

  // Generate icons (if sharp is available)
  if (pwa.icons?.src) {
    const sharpAvailable = await isSharpAvailable()
    if (sharpAvailable) {
      const iconResult = await generatePwaIcons(options, outputDir)
      result.files.icons = iconResult.generatedFiles
      result.warnings.push(...iconResult.warnings)
      if (!iconResult.success) {
        result.errors.push(...iconResult.errors)
        result.success = false
      }
    }
    else {
      result.warnings.push(
        'sharp is not installed. Skipping icon generation. '
        + 'Install with: bun add sharp',
      )
    }
  }

  // Generate offline page
  if (pwa.offline?.enabled) {
    try {
      const offlineHtml = await generateOfflinePage(options)
      if (offlineHtml) {
        const offlinePath = path.join(outputDir, 'offline.html')
        await Bun.write(offlinePath, offlineHtml)
        result.files.offlinePage = offlinePath
      }
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      result.errors.push(`Failed to generate offline page: ${msg}`)
      result.success = false
    }
  }

  return result
}

/**
 * Process HTML to inject PWA tags
 *
 * Convenience function that wraps injectPwaTags.
 *
 * @param html - HTML content to process
 * @param options - stx configuration options
 * @returns HTML with PWA tags injected
 */
export function processPwaHtml(html: string, options: StxOptions): string {
  return injectPwaTags(html, options)
}

/**
 * Check if PWA is enabled in options
 */
export function isPwaEnabled(options: StxOptions): boolean {
  return options.pwa?.enabled === true
}
