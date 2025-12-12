/**
 * PWA Auto-Precaching
 *
 * Automatically discovers and precaches build output files.
 * Scans the output directory and generates a precache manifest.
 */

import type { PwaPrecacheConfig, StxOptions } from '../types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Precache manifest entry
 */
export interface PrecacheEntry {
  url: string
  revision: string
  size: number
}

/**
 * Precache manifest result
 */
export interface PrecacheManifest {
  entries: PrecacheEntry[]
  totalSize: number
  fileCount: number
}

/**
 * File extension to category mapping
 */
const FILE_CATEGORIES: Record<string, keyof PwaPrecacheConfig> = {
  '.html': 'includeHtml',
  '.htm': 'includeHtml',
  '.js': 'includeJs',
  '.mjs': 'includeJs',
  '.css': 'includeCss',
  '.png': 'includeImages',
  '.jpg': 'includeImages',
  '.jpeg': 'includeImages',
  '.gif': 'includeImages',
  '.webp': 'includeImages',
  '.svg': 'includeImages',
  '.ico': 'includeImages',
  '.woff': 'includeFonts',
  '.woff2': 'includeFonts',
  '.ttf': 'includeFonts',
  '.eot': 'includeFonts',
  '.otf': 'includeFonts',
}

/**
 * Generate a simple hash for cache busting
 */
function generateRevision(content: Buffer): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Check if a file matches any exclude pattern
 */
function matchesExcludePattern(filePath: string, patterns: string[]): boolean {
  const fileName = path.basename(filePath)

  for (const pattern of patterns) {
    // Simple glob matching
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1)
      if (fileName.endsWith(ext))
        return true
    }
    else if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
      if (regex.test(fileName) || regex.test(filePath))
        return true
    }
    else if (fileName === pattern || filePath.includes(pattern)) {
      return true
    }
  }

  return false
}

/**
 * Check if a file should be included based on config
 */
function shouldIncludeFile(
  filePath: string,
  fileSize: number,
  config: PwaPrecacheConfig,
): boolean {
  const ext = path.extname(filePath).toLowerCase()
  const category = FILE_CATEGORIES[ext]

  // Check file size limit
  const maxSizeBytes = (config.maxFileSizeKB || 500) * 1024
  if (fileSize > maxSizeBytes) {
    return false
  }

  // Check exclude patterns
  if (config.exclude && matchesExcludePattern(filePath, config.exclude)) {
    return false
  }

  // Check include patterns (takes precedence)
  if (config.include && config.include.length > 0) {
    for (const pattern of config.include) {
      if (pattern.startsWith('*.')) {
        if (filePath.endsWith(pattern.slice(1)))
          return true
      }
      else if (filePath.includes(pattern)) {
        return true
      }
    }
  }

  // Check category-based inclusion
  if (category && config[category] === true) {
    return true
  }

  // If no category match but include patterns exist, don't include
  if (!category) {
    return false
  }

  return false
}

/**
 * Recursively scan directory for files
 */
function scanDirectory(
  dir: string,
  baseDir: string,
  config: PwaPrecacheConfig,
  entries: PrecacheEntry[],
): void {
  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)

    if (item.isDirectory()) {
      // Skip common directories that shouldn't be precached
      if (['node_modules', '.git', '.stx'].includes(item.name)) {
        continue
      }
      scanDirectory(fullPath, baseDir, config, entries)
    }
    else if (item.isFile()) {
      const stats = fs.statSync(fullPath)
      const relativePath = path.relative(baseDir, fullPath)

      if (shouldIncludeFile(relativePath, stats.size, config)) {
        const content = fs.readFileSync(fullPath)
        const revision = generateRevision(content)
        const url = `/${relativePath.replace(/\\/g, '/')}`

        entries.push({
          url,
          revision,
          size: stats.size,
        })
      }
    }
  }
}

/**
 * Generate precache manifest from build output directory
 */
export function generatePrecacheManifest(
  outputDir: string,
  options: StxOptions,
): PrecacheManifest {
  const config = options.pwa?.precache
  const entries: PrecacheEntry[] = []

  if (!config?.enabled) {
    return { entries: [], totalSize: 0, fileCount: 0 }
  }

  if (!fs.existsSync(outputDir)) {
    return { entries: [], totalSize: 0, fileCount: 0 }
  }

  scanDirectory(outputDir, outputDir, config, entries)

  // Sort by URL for consistent ordering
  entries.sort((a, b) => a.url.localeCompare(b.url))

  const totalSize = entries.reduce((sum, e) => sum + e.size, 0)

  return {
    entries,
    totalSize,
    fileCount: entries.length,
  }
}

/**
 * Generate precache manifest as JavaScript array for service worker
 */
export function generatePrecacheManifestJs(manifest: PrecacheManifest): string {
  if (manifest.entries.length === 0) {
    return '[]'
  }

  const entries = manifest.entries.map(e =>
    `  { url: '${e.url}', revision: '${e.revision}' }`,
  )

  return `[\n${entries.join(',\n')}\n]`
}

/**
 * Get human-readable size
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
