/**
 * STX Media - Content Hashing Utilities
 *
 * Provides content hashing for cache invalidation.
 *
 * @module media/shared/hash
 */

import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'

/**
 * Generate SHA-256 hash of file content
 */
export async function hashFile(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath)
    return createHash('sha256').update(content).digest('hex').slice(0, 16)
  } catch {
    return ''
  }
}

/**
 * Generate hash from buffer
 */
export function hashBuffer(buffer: Buffer | Uint8Array): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 16)
}

/**
 * Generate hash from string
 */
export function hashString(str: string): string {
  return createHash('sha256').update(str).digest('hex').slice(0, 16)
}

/**
 * Generate cache key from source path and options
 */
export function generateCacheKey(
  src: string,
  options: Record<string, unknown>,
): string {
  const optionsStr = JSON.stringify(options, Object.keys(options).sort())
  return `${hashString(src)}-${hashString(optionsStr)}`
}

/**
 * Get file modification time for cache validation
 */
export async function getFileMtime(filePath: string): Promise<number> {
  try {
    const stats = await stat(filePath)
    return stats.mtimeMs
  } catch {
    return 0
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}
