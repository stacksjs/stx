/**
 * Build Manifest
 *
 * Tracks all routes, assets, and dependencies for a production build.
 * Used by the production server to serve pre-built pages.
 *
 * @module manifest
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * A route entry in the build manifest.
 */
export interface ManifestRoute {
  /** URL pattern (e.g. '/jobs', '/player/:id') */
  pattern: string
  /** Path to the compiled template JSON */
  compiledPath: string
  /** Path to the SPA fragment HTML */
  fragmentPath: string
  /** Whether this route has dynamic content (server scripts) */
  isDynamic: boolean
  /** Whether this is a dynamic route with params (e.g. [id].stx) */
  hasParams: boolean
}

/**
 * Asset entries in the build manifest.
 */
export interface ManifestAssets {
  /** Signals runtime filename */
  runtime: string
  /** Router script filename */
  router: string
  /** CSS bundle filename */
  css?: string
}

/**
 * The complete build manifest.
 */
export interface BuildManifest {
  /** Manifest version for compatibility checks */
  version: 1
  /** Build timestamp */
  buildTime: string
  /** All routes */
  routes: ManifestRoute[]
  /** Fingerprinted asset filenames */
  assets: ManifestAssets
  /** Output directory (relative to project root) */
  outputDir: string
}

/**
 * Generate a build manifest from compiled pages and assets.
 */
export function generateManifest(
  routes: ManifestRoute[],
  assets: ManifestAssets,
  outputDir: string,
): BuildManifest {
  return {
    version: 1,
    buildTime: new Date().toISOString(),
    routes,
    assets,
    outputDir,
  }
}

/**
 * Write the manifest to disk.
 */
export function writeManifest(manifest: BuildManifest, outputDir: string): void {
  const manifestPath = path.join(outputDir, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
}

/**
 * Load and validate a build manifest from disk.
 * Returns null if the manifest doesn't exist or is invalid.
 */
export function loadManifest(outputDir: string): BuildManifest | null {
  const manifestPath = path.join(outputDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(content) as BuildManifest

    if (manifest.version !== 1) {
      console.warn(`[stx] Manifest version mismatch: expected 1, got ${manifest.version}`)
      return null
    }

    return manifest
  }
  catch (error) {
    console.warn('[stx] Failed to load manifest:', error)
    return null
  }
}
