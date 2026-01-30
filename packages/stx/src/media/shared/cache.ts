/**
 * STX Media - Shared Cache Implementation
 *
 * Provides disk and memory caching for processed media assets.
 *
 * @module media/shared/cache
 */

import { mkdir, readFile, writeFile, readdir, rm, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { generateCacheKey, hashFile, getFileMtime, fileExists } from './hash'

/**
 * Cache entry metadata
 */
export interface CacheEntry<T = unknown> {
  /** Cache key */
  key: string
  /** Source file path */
  src: string
  /** Source file hash */
  srcHash: string
  /** Source file mtime */
  srcMtime: number
  /** Options hash */
  optionsHash: string
  /** Cached data */
  data: T
  /** When this entry was created */
  createdAt: number
  /** When this entry was last accessed */
  lastAccessedAt: number
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Enable caching */
  enabled: boolean
  /** Cache directory */
  directory: string
  /** Max cache age in days */
  maxAge: number
  /** Max cache size in MB */
  maxSize: number
}

/**
 * In-memory cache for fast lookups
 */
const memoryCache = new Map<string, CacheEntry>()

/**
 * Default cache configuration
 */
export const defaultCacheConfig: CacheConfig = {
  enabled: true,
  directory: '.stx/media-cache',
  maxAge: 30,
  maxSize: 500,
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(cacheDir: string): Promise<void> {
  try {
    await mkdir(cacheDir, { recursive: true })
  } catch {
    // Directory might already exist
  }
}

/**
 * Get cache file path for a key
 */
function getCacheFilePath(cacheDir: string, key: string, type: 'image' | 'video'): string {
  return join(cacheDir, type, `${key}.json`)
}

/**
 * Check if cache entry is valid
 */
async function isCacheValid(entry: CacheEntry, srcPath: string, maxAge: number): Promise<boolean> {
  // Check if max age exceeded
  const ageInDays = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24)
  if (ageInDays > maxAge) {
    return false
  }

  // Check if source file changed
  const currentMtime = await getFileMtime(srcPath)
  if (currentMtime !== entry.srcMtime) {
    return false
  }

  return true
}

/**
 * Get item from cache
 */
export async function getCached<T>(
  src: string,
  options: Record<string, unknown>,
  type: 'image' | 'video',
  config: CacheConfig = defaultCacheConfig,
): Promise<T | null> {
  if (!config.enabled) {
    return null
  }

  const key = generateCacheKey(src, options)

  // Check memory cache first
  const memEntry = memoryCache.get(key)
  if (memEntry) {
    const valid = await isCacheValid(memEntry, src, config.maxAge)
    if (valid) {
      memEntry.lastAccessedAt = Date.now()
      return memEntry.data as T
    }
    memoryCache.delete(key)
  }

  // Check disk cache
  const cachePath = getCacheFilePath(config.directory, key, type)
  if (await fileExists(cachePath)) {
    try {
      const content = await readFile(cachePath, 'utf-8')
      const entry = JSON.parse(content) as CacheEntry<T>

      const valid = await isCacheValid(entry, src, config.maxAge)
      if (valid) {
        // Update memory cache
        entry.lastAccessedAt = Date.now()
        memoryCache.set(key, entry)
        return entry.data
      }
    } catch {
      // Cache file corrupted, ignore
    }
  }

  return null
}

/**
 * Set item in cache
 */
export async function setCached<T>(
  src: string,
  options: Record<string, unknown>,
  data: T,
  type: 'image' | 'video',
  config: CacheConfig = defaultCacheConfig,
): Promise<void> {
  if (!config.enabled) {
    return
  }

  const key = generateCacheKey(src, options)
  const srcHash = await hashFile(src)
  const srcMtime = await getFileMtime(src)

  const entry: CacheEntry<T> = {
    key,
    src,
    srcHash,
    srcMtime,
    optionsHash: generateCacheKey('', options),
    data,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  }

  // Update memory cache
  memoryCache.set(key, entry)

  // Write to disk cache
  const cachePath = getCacheFilePath(config.directory, key, type)
  try {
    await ensureCacheDir(dirname(cachePath))
    await writeFile(cachePath, JSON.stringify(entry, null, 2))
  } catch (error) {
    console.warn(`[stx-media] Failed to write cache: ${error}`)
  }
}

/**
 * Clear cache for a specific source
 */
export async function clearCacheForSource(
  src: string,
  type: 'image' | 'video',
  config: CacheConfig = defaultCacheConfig,
): Promise<void> {
  // Clear from memory cache
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.src === src) {
      memoryCache.delete(key)
    }
  }

  // Note: Clearing specific entries from disk cache would require
  // maintaining an index. For simplicity, we rely on cache validation.
}

/**
 * Clear entire cache
 */
export async function clearCache(
  type: 'image' | 'video' | 'all',
  config: CacheConfig = defaultCacheConfig,
): Promise<void> {
  // Clear memory cache
  if (type === 'all') {
    memoryCache.clear()
  } else {
    // Clear entries of specific type (would need type tracking)
    memoryCache.clear()
  }

  // Clear disk cache
  const typeDirs = type === 'all' ? ['image', 'video'] : [type]
  for (const typeDir of typeDirs) {
    const cacheDir = join(config.directory, typeDir)
    try {
      await rm(cacheDir, { recursive: true, force: true })
    } catch {
      // Directory might not exist
    }
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(
  config: CacheConfig = defaultCacheConfig,
): Promise<{
  memoryEntries: number
  diskEntries: { image: number; video: number }
  totalSizeMB: number
}> {
  const stats = {
    memoryEntries: memoryCache.size,
    diskEntries: { image: 0, video: 0 },
    totalSizeMB: 0,
  }

  for (const type of ['image', 'video'] as const) {
    const cacheDir = join(config.directory, type)
    try {
      const files = await readdir(cacheDir)
      stats.diskEntries[type] = files.length

      for (const file of files) {
        const filePath = join(cacheDir, file)
        const fileStat = await stat(filePath)
        stats.totalSizeMB += fileStat.size / (1024 * 1024)
      }
    } catch {
      // Directory might not exist
    }
  }

  return stats
}

/**
 * Prune old cache entries
 */
export async function pruneCache(
  config: CacheConfig = defaultCacheConfig,
): Promise<number> {
  let prunedCount = 0
  const maxAgeMs = config.maxAge * 24 * 60 * 60 * 1000

  for (const type of ['image', 'video'] as const) {
    const cacheDir = join(config.directory, type)
    try {
      const files = await readdir(cacheDir)

      for (const file of files) {
        const filePath = join(cacheDir, file)
        try {
          const content = await readFile(filePath, 'utf-8')
          const entry = JSON.parse(content) as CacheEntry

          if (Date.now() - entry.createdAt > maxAgeMs) {
            await rm(filePath)
            memoryCache.delete(entry.key)
            prunedCount++
          }
        } catch {
          // File corrupted, remove it
          await rm(filePath).catch(() => {})
          prunedCount++
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  return prunedCount
}
