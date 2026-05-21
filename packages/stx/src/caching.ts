import type { StxOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { fileExists } from './utils'

/**
 * Cache entry structure
 */
interface CacheEntry {
  output: string
  mtime: number
  dependencies: Set<string>
}

// Memory cache for compiled templates
export const templateCache: Map<string, CacheEntry> = new Map()

// ── Dev Mode In-Memory Caches ──
// These caches persist across requests in the dev server process.
// They're invalidated by mtime checks, not by full cache clears.

/**
 * File content cache — avoids re-reading unchanged files from disk.
 * Key: absolute file path, Value: { content, mtime }
 */
const fileContentCache = new Map<string, { content: string, mtime: number }>()

/**
 * Read a file with mtime-based caching.
 * Returns cached content if file hasn't been modified since last read.
 *
 * Race-safe: stats → reads → re-stats. If the mtime moved between the
 * initial stat and the read, the content we just got may not match the
 * mtime we'd cache it under, so we retry up to 3 times. Without this,
 * a writer flushing the file between our stat() and our read() would
 * have us cache the *new* content under the *old* mtime — and the
 * subsequent invalidation never fires because the cached mtime already
 * "matches" the new file mtime on the next cache-hit check.
 */
export async function readFileCached(filePath: string): Promise<string> {
  const MAX_ATTEMPTS = 3
  let lastErr: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const stats1 = await fs.promises.stat(filePath)
      const mtime1 = stats1.mtime.getTime()

      const cached = fileContentCache.get(filePath)
      if (cached && cached.mtime === mtime1) {
        return cached.content
      }

      const content = await Bun.file(filePath).text()

      // Re-stat after read; if the file was rewritten in between, the
      // content we just read may correspond to a *newer* mtime than the
      // one we observed first. Cache under the post-read mtime so the
      // next mtime-changed write actually invalidates us.
      const stats2 = await fs.promises.stat(filePath)
      const mtime2 = stats2.mtime.getTime()

      if (mtime2 !== mtime1) {
        // The file moved under us — we can't be sure `content` and
        // `mtime2` correspond. Retry to get a consistent snapshot.
        continue
      }

      fileContentCache.set(filePath, { content, mtime: mtime2 })
      return content
    }
    catch (err) {
      lastErr = err
      // ENOENT / permission errors aren't worth retrying
      break
    }
  }

  fileContentCache.delete(filePath)
  throw new Error(`File not found: ${filePath}${lastErr ? ` (${(lastErr as Error).message})` : ''}`)
}

/**
 * Invalidate a specific file from the content cache.
 * Called by HMR when a file changes.
 */
export function invalidateFileCache(filePath: string): void {
  fileContentCache.delete(filePath)
}

/**
 * Invalidate all files matching a pattern from the content cache.
 */
export function invalidateFileCacheByDir(dirPath: string): void {
  for (const key of fileContentCache.keys()) {
    if (key.startsWith(dirPath)) {
      fileContentCache.delete(key)
    }
  }
}

/**
 * Cached signals runtime string.
 * This never changes between edits — only regenerated on stx package update.
 */
let _cachedSignalsRuntime: string | null = null
let _cachedSignalsRuntimeDev: string | null = null

/**
 * Get the signals runtime with module-level caching.
 * The runtime is identical for every page and never changes during a dev session.
 */
export async function getCachedSignalsRuntime(debug = false): Promise<string> {
  if (debug) {
    // In debug mode, always regenerate to avoid stale runtime issues
    const { generateSignalsRuntimeDev } = await import('./signals')
    return generateSignalsRuntimeDev()
  }
  if (_cachedSignalsRuntime === null) {
    const { generateSignalsRuntime } = await import('./signals')
    _cachedSignalsRuntime = generateSignalsRuntime()
  }
  return _cachedSignalsRuntime!
}

/**
 * Cached router script string.
 */
let _cachedRouterScript: string | null = null

/**
 * Get the router script with module-level caching.
 */
export async function getCachedRouterScript(): Promise<string> {
  if (_cachedRouterScript === null) {
    const { getRouterScript } = await import('stx-router')
    _cachedRouterScript = getRouterScript()
  }
  return _cachedRouterScript!
}

/**
 * Clear all dev caches. Called during full rebuild or HMR reset.
 */
export function clearDevCaches(): void {
  fileContentCache.clear()
  _cachedSignalsRuntime = null
  _cachedSignalsRuntimeDev = null
  _cachedRouterScript = null
}

function createCacheOptionsSignature(options: StxOptions): string {
  const signature = {
    debug: options.debug === true,
    middleware: (options.middleware ?? []).map(middleware => ({
      name: middleware.name,
      timing: middleware.timing,
      handler: String(middleware.handler),
    })),
    customDirectives: (options.customDirectives ?? []).map(directive => ({
      name: directive.name,
      hasEndTag: directive.hasEndTag === true,
      handler: String(directive.handler),
    })),
  }

  return new Bun.CryptoHasher('sha1')
    .update(JSON.stringify(signature))
    .digest('hex')
}

/**
 * Check if a cached version of the template is available and valid
 */
export async function checkCache(filePath: string, options: StxOptions): Promise<string | null> {
  try {
    // Ensure cache directory exists
    if (!options.cachePath) return null
    const cachePath = path.resolve(options.cachePath)
    const cacheFile = path.join(cachePath, `${hashFilePath(filePath)}.html`)
    const metaFile = path.join(cachePath, `${hashFilePath(filePath)}.meta.json`)

    // Check if cache files exist
    if (!await fileExists(cacheFile) || !await fileExists(metaFile))
      return null

    // Read metadata
    const metaContent = await Bun.file(metaFile).text()
    const meta = JSON.parse(metaContent)

    // Check if cache version matches
    if (meta.cacheVersion !== options.cacheVersion)
      return null

    if (meta.optionsSignature !== createCacheOptionsSignature(options))
      return null

    // Check if source file has been modified
    const stats = await fs.promises.stat(filePath)
    if (stats.mtime.getTime() > meta.mtime)
      return null

    // Check if any dependencies have been modified
    for (const dep of meta.dependencies) {
      if (await fileExists(dep)) {
        const depStats = await fs.promises.stat(dep)
        if (depStats.mtime.getTime() > meta.mtime)
          return null
      }
      else {
        // Dependency doesn't exist anymore, invalidate cache
        return null
      }
    }

    // Cache is valid, return the cached output
    return await Bun.file(cacheFile).text()
  }
  catch (err) {
    // On any error, just return null to regenerate the template
    console.warn(`Cache error for ${filePath}:`, err)
    return null
  }
}

/**
 * Cache the processed template
 */
export async function cacheTemplate(
  filePath: string,
  output: string,
  dependencies: Set<string>,
  options: StxOptions,
): Promise<void> {
  try {
    // Ensure cache directory exists
    if (!options.cachePath) return
    const cachePath = path.resolve(options.cachePath)
    await fs.promises.mkdir(cachePath, { recursive: true })

    const cacheFile = path.join(cachePath, `${hashFilePath(filePath)}.html`)
    const metaFile = path.join(cachePath, `${hashFilePath(filePath)}.meta.json`)

    // Get file stats
    const stats = await fs.promises.stat(filePath)

    // Write the processed template
    await Bun.write(cacheFile, output)

    // Write metadata
    const meta = {
      sourcePath: filePath,
      mtime: stats.mtime.getTime(),
      dependencies: Array.from(dependencies),
      cacheVersion: options.cacheVersion,
      optionsSignature: createCacheOptionsSignature(options),
      generatedAt: Date.now(),
    }

    await Bun.write(metaFile, JSON.stringify(meta, null, 2))

    // Also store in memory cache
    templateCache.set(filePath, {
      output,
      mtime: stats.mtime.getTime(),
      dependencies,
    })
  }
  catch (err) {
    console.warn(`Failed to cache template ${filePath}:`, err)
  }
}

/**
 * Hash length for cache filenames.
 * 16 hex characters = 64 bits of entropy, providing:
 * - Sufficient collision resistance for typical project sizes (millions of files)
 * - Short enough for readable cache filenames
 * - Fast lookup in filesystem
 */
const CACHE_HASH_LENGTH = 16

/**
 * Create a hash of the file path for cache filenames
 *
 * Uses SHA-1 (fast, collision-resistant enough for cache keys) truncated to
 * CACHE_HASH_LENGTH characters. The truncated hash still provides strong
 * uniqueness guarantees for cache file identification.
 *
 * @param filePath - Absolute path to the template file
 * @returns A 16-character hex string suitable for use as a filename
 */
export function hashFilePath(filePath: string): string {
  const hash = new Bun.CryptoHasher('sha1').update(filePath).digest('hex')
  return hash.substring(0, CACHE_HASH_LENGTH)
}
