import type { WindowInstance, WindowOptions } from './types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

// =============================================================================
// Configuration
// =============================================================================

/**
 * Desktop window configuration.
 * Can be set via environment variables or setDesktopConfig().
 */
export interface DesktopConfig {
  /**
   * Custom path to craft binary.
   * Set via CRAFT_BINARY_PATH env var or setDesktopConfig().
   */
  craftBinaryPath?: string
  /**
   * Additional search paths for craft binary.
   * Searched after craftBinaryPath if set.
   */
  additionalSearchPaths?: string[]
  /**
   * Maximum retries when opening native window fails.
   * Default: 1 (no retries)
   */
  maxRetries?: number
  /**
   * Delay between retries in milliseconds.
   * Default: 1000
   */
  retryDelay?: number
}

/**
 * Current desktop configuration
 */
let currentConfig: DesktopConfig = {}

/**
 * Configure desktop window settings
 *
 * @example
 * ```typescript
 * setDesktopConfig({
 *   craftBinaryPath: '/custom/path/to/craft',
 *   maxRetries: 3,
 *   retryDelay: 2000
 * })
 * ```
 */
export function setDesktopConfig(config: Partial<DesktopConfig>): void {
  currentConfig = { ...currentConfig, ...config }
}

/**
 * Get current desktop configuration
 */
export function getDesktopConfig(): DesktopConfig {
  return { ...currentConfig }
}

/**
 * Reset desktop configuration to defaults
 */
export function resetDesktopConfig(): void {
  currentConfig = {}
}

// =============================================================================
// Binary Resolution
// =============================================================================

/**
 * Default paths to search for craft binary.
 * Used when CRAFT_BINARY_PATH is not set.
 */
const DEFAULT_SEARCH_PATHS = [
  // From linked ts-craft in monorepo
  join(process.cwd(), '../../craft/packages/zig/zig-out/bin/craft-minimal'),
  join(process.cwd(), '../../../craft/packages/zig/zig-out/bin/craft-minimal'),
  // If running from stx repo root
  join(process.cwd(), '../craft/packages/zig/zig-out/bin/craft-minimal'),
]

/**
 * Find craft binary in configured locations.
 *
 * Resolution order:
 * 1. CRAFT_BINARY_PATH environment variable
 * 2. config.craftBinaryPath (set via setDesktopConfig)
 * 3. config.additionalSearchPaths
 * 4. DEFAULT_SEARCH_PATHS (monorepo locations)
 *
 * @returns Path to craft binary or undefined if not found
 */
function getCraftBinaryPath(): string | undefined {
  // 1. Check environment variable first (highest priority)
  const envPath = process.env.CRAFT_BINARY_PATH
  if (envPath && existsSync(envPath)) {
    return envPath
  }

  // 2. Check configured path
  if (currentConfig.craftBinaryPath && existsSync(currentConfig.craftBinaryPath)) {
    return currentConfig.craftBinaryPath
  }

  // 3. Check additional configured paths
  const additionalPaths = currentConfig.additionalSearchPaths || []
  for (const searchPath of additionalPaths) {
    if (existsSync(searchPath)) {
      return searchPath
    }
  }

  // 4. Check default paths
  for (const searchPath of DEFAULT_SEARCH_PATHS) {
    if (existsSync(searchPath)) {
      return searchPath
    }
  }

  return undefined
}

// =============================================================================
// Window Creation
// =============================================================================

/**
 * Create a native window with URL
 *
 * Uses ts-craft to create native desktop windows. Falls back to returning null
 * if ts-craft is not available.
 *
 * ## WindowInstance Methods
 *
 * The returned WindowInstance provides limited functionality due to ts-craft's
 * architecture. Currently supported:
 *
 * - `show()` - Shows the window (logged only)
 *
 * The following methods are stubs that log warnings (awaiting ts-craft support):
 * - `hide()` - Hide the window
 * - `close()` - Close the window
 * - `focus()` - Focus the window
 * - `minimize()` / `maximize()` / `restore()` - Window state management
 * - `setTitle()` - Change window title
 * - `loadURL()` - Navigate to different URL
 * - `reload()` - Reload current page
 *
 * These will be implemented when ts-craft exposes window handle APIs.
 *
 * @param url - URL to load in the window
 * @param options - Window configuration options
 * @returns WindowInstance if successful, null if ts-craft unavailable
 */
export async function createWindow(url: string, options: WindowOptions = {}): Promise<WindowInstance | null> {
  const {
    title = 'stx Desktop',
    width = 1200,
    height = 800,
    darkMode = false,
    hotReload = false,
  } = options

  try {
    // Dynamically import ts-craft
    const { loadURL } = await import('ts-craft')

    // Create the window using ts-craft
    await loadURL(url, {
      title,
      width,
      height,
      darkMode,
      hotReload,
    })

    // Return a WindowInstance with stub methods
    // Note: ts-craft doesn't return a window handle, so most methods are stubs
    // that log warnings until ts-craft exposes these APIs
    return {
      id: `craft-window-${Date.now()}`,
      show: () => {
        console.log('Window shown')
      },
      // Stub methods - awaiting ts-craft window handle support
      hide: () => {
        console.warn('[stx/desktop] hide() not yet supported by ts-craft')
      },
      close: () => {
        console.warn('[stx/desktop] close() not yet supported by ts-craft')
      },
      focus: () => {
        console.warn('[stx/desktop] focus() not yet supported by ts-craft')
      },
      minimize: () => {
        console.warn('[stx/desktop] minimize() not yet supported by ts-craft')
      },
      maximize: () => {
        console.warn('[stx/desktop] maximize() not yet supported by ts-craft')
      },
      restore: () => {
        console.warn('[stx/desktop] restore() not yet supported by ts-craft')
      },
      setTitle: (_title: string) => {
        console.warn('[stx/desktop] setTitle() not yet supported by ts-craft')
      },
      loadURL: (_url: string) => {
        console.warn('[stx/desktop] loadURL() not yet supported by ts-craft')
      },
      reload: () => {
        console.warn('[stx/desktop] reload() not yet supported by ts-craft')
      },
    }
  }
  catch (error) {
    console.error('Failed to create native window:', error)
    console.warn('Falling back to browser...')
    return null
  }
}

/**
 * Open a development server window
 * This is specifically for the stx dev server --native flag
 *
 * Uses ts-craft to create a native window, falls back to browser if unavailable.
 */
export async function openDevWindow(port: number, options: WindowOptions = {}): Promise<boolean> {
  const url = `http://localhost:${port}/`

  // Try to open with ts-craft first
  try {
    const { createApp } = await import('ts-craft')

    console.log('⚡ Opening native window...')

    // Try to find craft binary in common locations
    const craftPath = getCraftBinaryPath()

    const app = createApp({
      url,
      craftPath,
      window: {
        title: options.title || 'stx Development',
        width: options.width || 1400,
        height: options.height || 900,
        resizable: true,
        systemTray: true, // craft requires system tray to function properly
        darkMode: true,
        hotReload: options.hotReload ?? true,
        devTools: true,
      },
    })

    await app.show()
    console.log(`✓ Native window opened at ${url}`)
    console.log(`📌 Look for the "stx Development" icon in your menubar`)
    return true
  }
  catch (error) {
    console.warn('⚠  Could not open native window:', (error as Error).message)
    console.log('📱 Opening in browser instead...')

    // Fallback: Open in default browser
    try {
      const { spawn } = await import('node:child_process')
      const platform = process.platform

      let command: string
      let args: string[]

      if (platform === 'darwin') {
        command = 'open'
        args = [url]
      }
      else if (platform === 'win32') {
        command = 'cmd'
        args = ['/c', 'start', url]
      }
      else {
        // Linux
        command = 'xdg-open'
        args = [url]
      }

      spawn(command, args, { detached: true, stdio: 'ignore' }).unref()
      console.log(`✓ Browser opened at ${url}`)
      return true
    }
    catch (browserError) {
      console.error('Could not open browser:', browserError)
      console.log(`Please open manually: ${url}`)
      return false
    }
  }
}

/**
 * Create a window with HTML content
 *
 * Uses ts-craft to display HTML content in a native window.
 */
export async function createWindowWithHTML(html: string, options: WindowOptions = {}): Promise<WindowInstance | null> {
  const {
    title = 'stx Desktop',
    width = 1200,
    height = 800,
    darkMode = false,
    hotReload = false,
  } = options

  try {
    // Dynamically import ts-craft
    const { show } = await import('ts-craft')

    // Create the window using ts-craft
    await show(html, {
      title,
      width,
      height,
      darkMode,
      hotReload,
    })

    // Return a WindowInstance stub
    return {
      id: `craft-window-${Date.now()}`,
      show: () => {
        console.log('Window shown')
      },
      hide: () => {
        console.warn('Hide not implemented')
      },
      close: () => {
        console.warn('Close not implemented')
      },
      focus: () => {
        console.warn('Focus not implemented')
      },
      minimize: () => {
        console.warn('Minimize not implemented')
      },
      maximize: () => {
        console.warn('Maximize not implemented')
      },
      restore: () => {
        console.warn('Restore not implemented')
      },
      setTitle: (_title: string) => {
        console.warn('SetTitle not implemented')
      },
      loadURL: (_url: string) => {
        console.warn('LoadURL not implemented')
      },
      reload: () => {
        console.warn('Reload not implemented')
      },
    }
  }
  catch (error) {
    console.error('Failed to create window with HTML:', error)
    return null
  }
}

/**
 * Helper to check if webview implementation is available
 */
export function isWebviewAvailable(): boolean {
  try {
    // Try to require ts-craft to check if it's available
    require.resolve('ts-craft')
    return true
  }
  catch {
    return false
  }
}
