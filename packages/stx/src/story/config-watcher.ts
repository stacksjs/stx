/**
 * STX Story - Config file watcher
 * Watches stx.config.ts for changes and triggers restart
 */

import type { StoryContext } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { printInfo, printWarning } from './output'

/**
 * Config watcher options
 */
export interface ConfigWatcherOptions {
  /** Callback when config changes */
  onChange: () => void | Promise<void>
  /** Debounce delay in ms */
  debounceMs?: number
}

/**
 * Config watcher instance
 */
export interface ConfigWatcher {
  /** Stop watching */
  stop: () => void
}

/**
 * Watch the config file for changes
 */
export function watchConfigFile(
  ctx: StoryContext,
  options: ConfigWatcherOptions,
): ConfigWatcher {
  const configPaths = [
    path.join(ctx.root, 'stx.config.ts'),
    path.join(ctx.root, 'stx.config.js'),
    path.join(ctx.root, 'stx.config.mjs'),
  ]

  const debounceMs = options.debounceMs ?? 300
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const watchers: fs.FSWatcher[] = []

  // Watch each potential config file
  for (const configPath of configPaths) {
    try {
      // Check if file exists
      if (!fs.existsSync(configPath)) continue

      const watcher = fs.watch(configPath, (eventType) => {
        if (eventType === 'change') {
          // Debounce the callback
          if (debounceTimer) {
            clearTimeout(debounceTimer)
          }

          debounceTimer = setTimeout(async () => {
            printInfo('Config file changed, restarting...')
            try {
              await options.onChange()
            }
            catch (error) {
              printWarning(`Failed to restart: ${error}`)
            }
          }, debounceMs)
        }
      })

      watchers.push(watcher)
    }
    catch {
      // File doesn't exist or can't be watched, skip
    }
  }

  return {
    stop() {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      for (const watcher of watchers) {
        watcher.close()
      }
    },
  }
}

/**
 * Get the config file path if it exists
 */
export function findConfigFile(root: string): string | null {
  const configPaths = [
    path.join(root, 'stx.config.ts'),
    path.join(root, 'stx.config.js'),
    path.join(root, 'stx.config.mjs'),
  ]

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      return configPath
    }
  }

  return null
}

/**
 * Get the last modified time of the config file
 */
export async function getConfigModifiedTime(root: string): Promise<number | null> {
  const configPath = findConfigFile(root)
  if (!configPath) return null

  try {
    const stats = await fs.promises.stat(configPath)
    return stats.mtimeMs
  }
  catch {
    return null
  }
}
