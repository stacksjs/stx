/**
 * Bundle Analyzer - Collector
 *
 * Collects and analyzes bundle statistics from build output.
 */

import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'

// ============================================================================
// Types
// ============================================================================

export interface ModuleInfo {
  /** Unique module identifier */
  id: string
  /** Relative file path */
  path: string
  /** Raw file size in bytes */
  size: number
  /** Gzipped size in bytes */
  gzipSize: number
  /** Parsed/minified size estimate */
  parsedSize: number
  /** File extension */
  extension: string
  /** Module type */
  type: ModuleType
  /** Files this module imports */
  imports: string[]
  /** Files that import this module */
  importedBy: string[]
  /** Content hash for deduplication */
  hash: string
}

export type ModuleType = 'js' | 'css' | 'html' | 'image' | 'font' | 'other'

export interface ChunkInfo {
  /** Chunk name */
  name: string
  /** Output files in this chunk */
  files: string[]
  /** Modules in this chunk */
  modules: ModuleInfo[]
  /** Total size in bytes */
  size: number
  /** Total gzipped size */
  gzipSize: number
  /** Is entry point */
  isEntry: boolean
  /** Is vendor chunk */
  isVendor: boolean
}

export interface DuplicateModule {
  /** Module path pattern */
  path: string
  /** Number of duplicates */
  count: number
  /** Total wasted bytes */
  wastedBytes: number
  /** Locations where duplicated */
  locations: string[]
}

export interface BundleStats {
  /** Build timestamp */
  timestamp: number
  /** Build directory analyzed */
  buildDir: string
  /** All chunks */
  chunks: ChunkInfo[]
  /** Total size in bytes */
  totalSize: number
  /** Total gzipped size */
  totalGzipSize: number
  /** Total module count */
  moduleCount: number
  /** Duplicate modules detected */
  duplicates: DuplicateModule[]
  /** Files by type */
  byType: Record<ModuleType, { count: number; size: number; gzipSize: number }>
  /** Largest modules */
  largestModules: ModuleInfo[]
  /** Build warnings */
  warnings: string[]
}

export interface CollectorOptions {
  /** Include source maps */
  includeSourceMaps?: boolean
  /** Parse imports from JS/TS files */
  parseImports?: boolean
  /** Detect duplicates */
  detectDuplicates?: boolean
  /** Max modules to include in largestModules */
  topModulesCount?: number
}

// ============================================================================
// Constants
// ============================================================================

const FILE_TYPE_MAP: Record<string, ModuleType> = {
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.ts': 'js',
  '.jsx': 'js',
  '.tsx': 'js',
  '.css': 'css',
  '.scss': 'css',
  '.sass': 'css',
  '.less': 'css',
  '.html': 'html',
  '.htm': 'html',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.svg': 'image',
  '.webp': 'image',
  '.avif': 'image',
  '.ico': 'image',
  '.woff': 'font',
  '.woff2': 'font',
  '.ttf': 'font',
  '.eot': 'font',
  '.otf': 'font',
}

const VENDOR_PATTERNS = [
  /node_modules/,
  /vendor/,
  /bower_components/,
  /\.min\./,
]

const ENTRY_PATTERNS = [
  /index\.(js|ts|html)$/,
  /main\.(js|ts)$/,
  /app\.(js|ts)$/,
  /entry\.(js|ts)$/,
]

// ============================================================================
// Collector
// ============================================================================

/**
 * Collect bundle statistics from a build directory
 */
export async function collectBundleStats(
  buildDir: string,
  options: CollectorOptions = {},
): Promise<BundleStats> {
  const {
    includeSourceMaps = false,
    parseImports = true,
    detectDuplicates = true,
    topModulesCount = 20,
  } = options

  // Validate directory
  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory not found: ${buildDir}`)
  }

  const stats = fs.statSync(buildDir)
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${buildDir}`)
  }

  // Collect all files
  const files = await collectFiles(buildDir, includeSourceMaps)

  // Process files into modules
  const modules: ModuleInfo[] = []
  const warnings: string[] = []

  for (const filePath of files) {
    try {
      const module = await processFile(filePath, buildDir, parseImports)
      modules.push(module)
    }
    catch (error) {
      warnings.push(`Failed to process ${filePath}: ${error}`)
    }
  }

  // Group into chunks
  const chunks = groupIntoChunks(modules, buildDir)

  // Calculate totals
  const totalSize = modules.reduce((sum, m) => sum + m.size, 0)
  const totalGzipSize = modules.reduce((sum, m) => sum + m.gzipSize, 0)

  // Group by type
  const byType = groupByType(modules)

  // Find duplicates
  const duplicates = detectDuplicates ? findDuplicates(modules) : []

  // Get largest modules
  const largestModules = [...modules]
    .sort((a, b) => b.size - a.size)
    .slice(0, topModulesCount)

  return {
    timestamp: Date.now(),
    buildDir: path.resolve(buildDir),
    chunks,
    totalSize,
    totalGzipSize,
    moduleCount: modules.length,
    duplicates,
    byType,
    largestModules,
    warnings,
  }
}

/**
 * Collect all files in directory recursively
 */
async function collectFiles(dir: string, includeSourceMaps: boolean): Promise<string[]> {
  const files: string[] = []

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        // Skip hidden directories and common non-output dirs
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath)
        }
      }
      else if (entry.isFile()) {
        // Skip source maps unless requested
        if (!includeSourceMaps && entry.name.endsWith('.map')) {
          continue
        }
        files.push(fullPath)
      }
    }
  }

  await walk(dir)
  return files
}

/**
 * Process a single file into module info
 */
async function processFile(
  filePath: string,
  buildDir: string,
  parseImports: boolean,
): Promise<ModuleInfo> {
  const content = await fs.promises.readFile(filePath)
  const relativePath = path.relative(buildDir, filePath)
  const ext = path.extname(filePath).toLowerCase()

  // Calculate sizes
  const size = content.length
  const gzipSize = calculateGzipSize(content)
  const parsedSize = estimateParsedSize(content, ext)

  // Calculate hash
  const hash = createHash('md5').update(content).digest('hex').slice(0, 8)

  // Determine type
  const type = FILE_TYPE_MAP[ext] || 'other'

  // Parse imports if JS/TS
  const imports: string[] = []
  if (parseImports && type === 'js') {
    imports.push(...parseJsImports(content.toString('utf-8')))
  }

  return {
    id: relativePath,
    path: relativePath,
    size,
    gzipSize,
    parsedSize,
    extension: ext,
    type,
    imports,
    importedBy: [], // Filled in later
    hash,
  }
}

/**
 * Calculate gzip size
 * Returns the smaller of gzip or raw size (gzip can be larger for tiny files)
 */
function calculateGzipSize(content: Buffer): number {
  try {
    const gzipLength = gzipSync(content, { level: 9 }).length
    // Return smaller of the two - gzip can be larger for very small files
    return Math.min(gzipLength, content.length)
  }
  catch {
    return content.length
  }
}

/**
 * Estimate parsed/minified size
 */
function estimateParsedSize(content: Buffer, ext: string): number {
  // For already minified files, parsed size is close to raw size
  // For source files, estimate reduction
  const isMinified = ext.includes('.min.') || content.length < 1000

  if (isMinified) {
    return content.length
  }

  // Rough estimation: minification typically reduces by 30-50%
  const type = FILE_TYPE_MAP[ext]
  if (type === 'js') {
    return Math.round(content.length * 0.6)
  }
  if (type === 'css') {
    return Math.round(content.length * 0.7)
  }

  return content.length
}

/**
 * Parse imports from JavaScript content
 */
function parseJsImports(content: string): string[] {
  const imports: string[] = []

  // ES module imports
  const esImportRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = esImportRegex.exec(content)) !== null) {
    imports.push(match[1])
  }

  // Dynamic imports
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1])
  }

  // CommonJS require
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1])
  }

  return [...new Set(imports)]
}

/**
 * Group modules into chunks
 */
function groupIntoChunks(modules: ModuleInfo[], buildDir: string): ChunkInfo[] {
  // Group by directory or entry point
  const chunkMap = new Map<string, ModuleInfo[]>()

  for (const module of modules) {
    // Determine chunk name from path
    const parts = module.path.split(path.sep)
    let chunkName: string

    if (parts.length === 1) {
      // Root level file - use filename without extension
      chunkName = path.basename(module.path, module.extension)
    }
    else {
      // Use first directory as chunk name
      chunkName = parts[0]
    }

    const existing = chunkMap.get(chunkName) || []
    existing.push(module)
    chunkMap.set(chunkName, existing)
  }

  // Convert to ChunkInfo
  const chunks: ChunkInfo[] = []

  for (const [name, chunkModules] of chunkMap) {
    const size = chunkModules.reduce((sum, m) => sum + m.size, 0)
    const gzipSize = chunkModules.reduce((sum, m) => sum + m.gzipSize, 0)

    const isEntry = chunkModules.some(m =>
      ENTRY_PATTERNS.some(p => p.test(m.path)),
    )

    const isVendor = chunkModules.some(m =>
      VENDOR_PATTERNS.some(p => p.test(m.path)),
    )

    chunks.push({
      name,
      files: chunkModules.map(m => m.path),
      modules: chunkModules,
      size,
      gzipSize,
      isEntry,
      isVendor,
    })
  }

  // Sort by size descending
  return chunks.sort((a, b) => b.size - a.size)
}

/**
 * Group modules by type
 */
function groupByType(
  modules: ModuleInfo[],
): Record<ModuleType, { count: number; size: number; gzipSize: number }> {
  const byType: Record<ModuleType, { count: number; size: number; gzipSize: number }> = {
    js: { count: 0, size: 0, gzipSize: 0 },
    css: { count: 0, size: 0, gzipSize: 0 },
    html: { count: 0, size: 0, gzipSize: 0 },
    image: { count: 0, size: 0, gzipSize: 0 },
    font: { count: 0, size: 0, gzipSize: 0 },
    other: { count: 0, size: 0, gzipSize: 0 },
  }

  for (const module of modules) {
    byType[module.type].count++
    byType[module.type].size += module.size
    byType[module.type].gzipSize += module.gzipSize
  }

  return byType
}

/**
 * Find duplicate modules by content hash
 */
function findDuplicates(modules: ModuleInfo[]): DuplicateModule[] {
  const hashMap = new Map<string, ModuleInfo[]>()

  // Group by hash
  for (const module of modules) {
    const existing = hashMap.get(module.hash) || []
    existing.push(module)
    hashMap.set(module.hash, existing)
  }

  // Find duplicates (same hash, different paths)
  const duplicates: DuplicateModule[] = []

  for (const [, sameHash] of hashMap) {
    if (sameHash.length > 1) {
      const first = sameHash[0]
      duplicates.push({
        path: first.path,
        count: sameHash.length,
        wastedBytes: first.size * (sameHash.length - 1),
        locations: sameHash.map(m => m.path),
      })
    }
  }

  return duplicates.sort((a, b) => b.wastedBytes - a.wastedBytes)
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Parse size string to bytes
 */
export function parseSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i)
  if (!match) return 0

  const value = Number.parseFloat(match[1])
  const unit = (match[2] || 'B').toUpperCase()

  switch (unit) {
    case 'KB': return value * 1024
    case 'MB': return value * 1024 * 1024
    case 'GB': return value * 1024 * 1024 * 1024
    default: return value
  }
}

/**
 * Calculate percentage
 */
export function percentage(part: number, total: number): string {
  if (total === 0) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}
