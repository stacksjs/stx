// @ts-nocheck - Skip type checking due to Bun/Node.js type differences
/**
 * Watch Mode for stx Templates
 *
 * Provides file watching capabilities for development:
 * - Watches .stx and .md files for changes
 * - Automatically rebuilds on file changes
 * - Supports debouncing to avoid excessive rebuilds
 * - Integrates with the Bun plugin system
 *
 * ## Usage
 *
 * ```typescript
 * import { createWatcher, watchAndBuild } from 'bun-plugin-stx/watch'
 *
 * // Simple usage - watch and rebuild
 * const watcher = await watchAndBuild({
 *   entrypoints: ['./src/index.stx'],
 *   outdir: './dist',
 *   onRebuild: (result) => console.log('Rebuilt!', result),
 * })
 *
 * // Stop watching
 * watcher.close()
 * ```
 */

import type { StxOptions } from '@stacksjs/stx'
import type { BuildConfig } from 'bun'
import type { FSWatcher, WatchEventType } from 'node:fs'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { stxPlugin } from './index'

// =============================================================================
// Types
// =============================================================================

/**
 * Watch mode options
 */
export interface WatchOptions {
  /** Directories to watch (default: current directory) */
  paths?: string[]
  /** File patterns to watch (default: ['**\/*.stx', '**\/*.md']) */
  patterns?: string[]
  /** Extensions to watch (default: ['.stx', '.md']) */
  extensions?: string[]
  /** Directories to ignore (default: ['node_modules', '.git', 'dist']) */
  ignore?: string[]
  /** Debounce delay in milliseconds (default: 100) */
  debounce?: number
  /** Callback when a file changes */
  onChange?: (event: WatchEvent) => void
  /** Callback when an error occurs */
  onError?: (error: Error) => void
  /** Enable verbose logging */
  verbose?: boolean
}

/**
 * Watch and build options
 */
export interface WatchAndBuildOptions extends WatchOptions {
  /** Build entrypoints */
  entrypoints: string[]
  /** Output directory */
  outdir?: string
  /** Additional build config */
  buildConfig?: Partial<BuildConfig>
  /** stx plugin options */
  stxOptions?: StxOptions
  /** Callback after each rebuild */
  onRebuild?: (result: WatchBuildResult) => void
}

/**
 * Watch event details
 */
export interface WatchEvent {
  /** Type of event */
  type: WatchEventType
  /** Path of the changed file */
  path: string
  /** Timestamp of the event */
  timestamp: number
}

/**
 * Watch build result
 */
export interface WatchBuildResult {
  /** Whether the build succeeded */
  success: boolean
  /** Build outputs */
  outputs?: string[]
  /** Build errors */
  errors?: Error[]
  /** Build duration in milliseconds */
  duration: number
  /** Files that triggered the rebuild */
  triggeredBy: string[]
}

/**
 * Watcher instance
 */
export interface WatcherInstance {
  /** Stop watching */
  close: () => void
  /** Get watched paths */
  getWatchedPaths: () => string[]
  /** Add a path to watch */
  addPath: (path: string) => void
  /** Remove a path from watching */
  removePath: (path: string) => void
  /** Whether the watcher is active */
  isWatching: () => boolean
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Debounce a function
 */
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Check if a file should be watched based on options
 */
function shouldWatch(filePath: string, options: WatchOptions): boolean {
  const ext = path.extname(filePath)
  const extensions = options.extensions || ['.stx', '.md']
  const ignore = options.ignore || ['node_modules', '.git', 'dist', '.stx']

  // Check if extension matches
  if (!extensions.includes(ext)) {
    return false
  }

  // Check if path should be ignored
  for (const ignorePath of ignore) {
    if (filePath.includes(ignorePath)) {
      return false
    }
  }

  return true
}

/**
 * Recursively get all files in a directory
 */
function _getAllFiles(dir: string, options: WatchOptions): string[] {
  const files: string[] = []
  const ignore = options.ignore || ['node_modules', '.git', 'dist', '.stx']

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      // Skip ignored directories
      if (ignore.some(i => entry.name === i || fullPath.includes(i))) {
        continue
      }

      if (entry.isDirectory()) {
        files.push(..._getAllFiles(fullPath, options))
      }
      else if (entry.isFile() && shouldWatch(fullPath, options)) {
        files.push(fullPath)
      }
    }
  }
  catch {
    // Directory doesn't exist or can't be read
  }

  return files
}

// =============================================================================
// Core Watcher
// =============================================================================

/**
 * Create a file watcher for stx templates
 *
 * @param options - Watch options
 * @returns Watcher instance
 *
 * @example
 * ```typescript
 * const watcher = createWatcher({
 *   paths: ['./src'],
 *   onChange: (event) => console.log('Changed:', event.path),
 * })
 *
 * // Later, stop watching
 * watcher.close()
 * ```
 */
export function createWatcher(options: WatchOptions = {}): WatcherInstance {
  const watchedPaths = new Set<string>()
  const watchers = new Map<string, FSWatcher>()
  let isActive = true

  const paths = options.paths || [process.cwd()]
  const debounceDelay = options.debounce ?? 100

  // Track pending changes for debouncing
  const pendingChanges: WatchEvent[] = []

  // Debounced change handler
  const handleChanges = debounce(() => {
    if (pendingChanges.length > 0 && options.onChange) {
      // Process all pending changes
      for (const event of pendingChanges) {
        options.onChange(event)
      }
      pendingChanges.length = 0
    }
  }, debounceDelay)

  // Watch a single directory
  function watchDirectory(dirPath: string): void {
    if (watchers.has(dirPath)) {
      return
    }

    try {
      const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (!isActive || !filename) {
          return
        }

        const fullPath = path.join(dirPath, filename)

        if (!shouldWatch(fullPath, options)) {
          return
        }

        const event: WatchEvent = {
          type: eventType,
          path: fullPath,
          timestamp: Date.now(),
        }

        if (options.verbose) {
          console.log(`[stx-watch] ${eventType}: ${fullPath}`)
        }

        pendingChanges.push(event)
        handleChanges()
      })

      watcher.on('error', (error) => {
        if (options.onError) {
          options.onError(error)
        }
        else {
          console.error(`[stx-watch] Error watching ${dirPath}:`, error)
        }
      })

      watchers.set(dirPath, watcher)
      watchedPaths.add(dirPath)

      if (options.verbose) {
        console.log(`[stx-watch] Watching: ${dirPath}`)
      }
    }
    catch (error) {
      if (options.onError) {
        options.onError(error as Error)
      }
    }
  }

  // Start watching all paths
  for (const watchPath of paths) {
    const absolutePath = path.resolve(watchPath)
    if (fs.existsSync(absolutePath)) {
      watchDirectory(absolutePath)
    }
  }

  return {
    close: () => {
      isActive = false
      for (const watcher of watchers.values()) {
        watcher.close()
      }
      watchers.clear()
      watchedPaths.clear()
      if (options.verbose) {
        console.log('[stx-watch] Stopped watching')
      }
    },
    getWatchedPaths: () => Array.from(watchedPaths),
    addPath: (newPath: string) => {
      const absolutePath = path.resolve(newPath)
      if (fs.existsSync(absolutePath) && !watchers.has(absolutePath)) {
        watchDirectory(absolutePath)
      }
    },
    removePath: (pathToRemove: string) => {
      const absolutePath = path.resolve(pathToRemove)
      const watcher = watchers.get(absolutePath)
      if (watcher) {
        watcher.close()
        watchers.delete(absolutePath)
        watchedPaths.delete(absolutePath)
      }
    },
    isWatching: () => isActive && watchers.size > 0,
  }
}

// =============================================================================
// Watch and Build
// =============================================================================

/**
 * Watch files and automatically rebuild on changes
 *
 * @param options - Watch and build options
 * @returns Watcher instance
 *
 * @example
 * ```typescript
 * const watcher = await watchAndBuild({
 *   entrypoints: ['./src/index.stx'],
 *   outdir: './dist',
 *   onRebuild: (result) => {
 *     if (result.success) {
 *       console.log(`Rebuilt in ${result.duration}ms`)
 *     } else {
 *       console.error('Build failed:', result.errors)
 *     }
 *   },
 * })
 * ```
 */
export async function watchAndBuild(options: WatchAndBuildOptions): Promise<WatcherInstance> {
  const {
    entrypoints,
    outdir = './dist',
    buildConfig = {},
    stxOptions,
    onRebuild,
    ...watchOptions
  } = options

  // Track files that triggered rebuilds
  let triggeredBy: string[] = []

  // Perform a build
  async function build(): Promise<WatchBuildResult> {
    const startTime = Date.now()
    const currentTriggers = [...triggeredBy]
    triggeredBy = []

    try {
      const result = await Bun.build({
        entrypoints,
        outdir,
        plugins: [stxPlugin(stxOptions)],
        ...buildConfig,
      })

      const duration = Date.now() - startTime
      const outputs = result.outputs.map(o => o.path)

      if (!result.success) {
        const errors = result.logs
          .filter(log => log.level === 'error')
          .map(log => new Error(log.message))

        return {
          success: false,
          errors,
          duration,
          triggeredBy: currentTriggers,
        }
      }

      return {
        success: true,
        outputs,
        duration,
        triggeredBy: currentTriggers,
      }
    }
    catch (error) {
      return {
        success: false,
        errors: [error as Error],
        duration: Date.now() - startTime,
        triggeredBy: currentTriggers,
      }
    }
  }

  // Initial build
  if (options.verbose) {
    console.log('[stx-watch] Performing initial build...')
  }

  const initialResult = await build()
  if (onRebuild) {
    onRebuild(initialResult)
  }

  // Determine directories to watch from entrypoints
  const dirsToWatch = new Set<string>()
  for (const entrypoint of entrypoints) {
    const dir = path.dirname(path.resolve(entrypoint))
    dirsToWatch.add(dir)
  }

  // Also watch common directories if they exist
  const commonDirs = ['src', 'pages', 'components', 'layouts', 'partials']
  for (const dir of commonDirs) {
    const fullPath = path.resolve(dir)
    if (fs.existsSync(fullPath)) {
      dirsToWatch.add(fullPath)
    }
  }

  // Create watcher with rebuild on change
  const watcher = createWatcher({
    ...watchOptions,
    paths: watchOptions.paths || Array.from(dirsToWatch),
    onChange: async (event) => {
      triggeredBy.push(event.path)

      // Call user's onChange if provided
      if (watchOptions.onChange) {
        watchOptions.onChange(event)
      }

      // Rebuild
      if (options.verbose) {
        console.log(`[stx-watch] Rebuilding due to change in ${event.path}...`)
      }

      const result = await build()
      if (onRebuild) {
        onRebuild(result)
      }
    },
  })

  if (options.verbose) {
    console.log(`[stx-watch] Watching for changes in: ${watcher.getWatchedPaths().join(', ')}`)
  }

  return watcher
}

// =============================================================================
// CLI Helper
// =============================================================================

/**
 * Start watch mode from CLI
 * This is used internally by the stx CLI
 */
export async function startWatchMode(args: {
  entrypoints: string[]
  outdir: string
  verbose?: boolean
  stxOptions?: StxOptions
}): Promise<WatcherInstance> {
  console.log('\x1B[36m[stx]\x1B[0m Starting watch mode...')

  const watcher = await watchAndBuild({
    entrypoints: args.entrypoints,
    outdir: args.outdir,
    verbose: args.verbose,
    stxOptions: args.stxOptions,
    onRebuild: (result) => {
      if (result.success) {
        const files = result.triggeredBy.length > 0
          ? ` (${result.triggeredBy.map(f => path.basename(f)).join(', ')})`
          : ''
        console.log(`\x1B[32m[stx]\x1B[0m Built in ${result.duration}ms${files}`)
      }
      else {
        console.error('\x1B[31m[stx]\x1B[0m Build failed:')
        for (const error of result.errors || []) {
          console.error(`  ${error.message}`)
        }
      }
    },
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\x1B[36m[stx]\x1B[0m Stopping watch mode...')
    watcher.close()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    watcher.close()
    process.exit(0)
  })

  return watcher
}

export default createWatcher
