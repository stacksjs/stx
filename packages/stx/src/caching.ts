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

/**
 * Check if a cached version of the template is available and valid
 */
export async function checkCache(filePath: string, options: StxOptions): Promise<string | null> {
  try {
    // Ensure cache directory exists
    const cachePath = path.resolve(options.cachePath!)
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
    const cachePath = path.resolve(options.cachePath!)
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
