/**
 * Build Assets
 *
 * Generates and fingerprints shared static assets for production builds.
 * These assets are identical across all pages and can be cached aggressively.
 *
 * @module build-assets
 */

import { createHash } from 'node:crypto'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from './signals'
import { getRouterScript } from 'stx-router'

/**
 * A built asset with content and fingerprinted filename.
 */
export interface BuiltAsset {
  /** The asset content (JS or CSS) */
  content: string
  /** Fingerprinted filename (e.g. 'runtime.a1b2c3d4.js') */
  filename: string
  /** Content hash for cache busting */
  hash: string
}

/**
 * Generate a fingerprint hash from content.
 * Uses SHA-256 truncated to 8 hex chars.
 */
export function fingerprint(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 8)
}

/**
 * Build the signals runtime as an external asset.
 * This is identical for every page — no need to inline 20-40KB per page.
 */
export function buildRuntimeAsset(debug = false): BuiltAsset {
  const content = debug ? generateSignalsRuntimeDev() : generateSignalsRuntime()
  const hash = fingerprint(content)
  return {
    content,
    filename: `runtime.${hash}.js`,
    hash,
  }
}

/**
 * Build the SPA router script as an external asset.
 * Identical for every page — ~5-8KB.
 */
export function buildRouterAsset(): BuiltAsset {
  const content = getRouterScript()
  const hash = fingerprint(content)
  return {
    content,
    filename: `router.${hash}.js`,
    hash,
  }
}

/**
 * Generates `<script src>` and `<link href>` tags for externalized assets.
 * Used in build mode to replace inline scripts with references.
 */
export function assetTags(assets: { runtime?: BuiltAsset, router?: BuiltAsset, css?: BuiltAsset }): {
  runtimeTag: string
  routerTag: string
  cssTag: string
} {
  return {
    runtimeTag: assets.runtime
      ? `<script src="/__stx/${assets.runtime.filename}"></script>`
      : '',
    routerTag: assets.router
      ? `<script src="/__stx/${assets.router.filename}"></script>`
      : '',
    cssTag: assets.css
      ? `<link rel="stylesheet" href="/__stx/${assets.css.filename}">`
      : '',
  }
}
