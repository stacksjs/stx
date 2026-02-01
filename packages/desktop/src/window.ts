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
  // Global bun installation
  join(process.env.HOME || '', '.bun/bin/craft'),
  // Absolute path to craft in standard location
  join(process.env.HOME || '', 'Code/Tools/craft/packages/zig/zig-out/bin/craft'),
  join(process.env.HOME || '', 'Code/craft/packages/zig/zig-out/bin/craft'),
  // From linked ts-craft in monorepo (both craft and craft-minimal)
  join(process.cwd(), '../../craft/packages/zig/zig-out/bin/craft'),
  join(process.cwd(), '../../craft/packages/zig/zig-out/bin/craft-minimal'),
  join(process.cwd(), '../../../craft/packages/zig/zig-out/bin/craft'),
  join(process.cwd(), '../../../craft/packages/zig/zig-out/bin/craft-minimal'),
  // If running from stx repo root
  join(process.cwd(), '../craft/packages/zig/zig-out/bin/craft'),
  join(process.cwd(), '../craft/packages/zig/zig-out/bin/craft-minimal'),
  // Local craft installation
  join(process.cwd(), 'node_modules/.bin/craft'),
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
// Window Instance Management
// =============================================================================

/**
 * Active window instances managed by this module
 */
const activeWindows = new Map<string, {
  app: any
  url: string
  options: WindowOptions
}>()

/**
 * Get all active window IDs
 */
export function getActiveWindowIds(): string[] {
  return Array.from(activeWindows.keys())
}

/**
 * Get a window by ID
 */
export function getWindow(id: string): WindowInstance | null {
  const windowData = activeWindows.get(id)
  if (!windowData) return null
  return createWindowInstance(id, windowData.app)
}

/**
 * Close all active windows
 */
export function closeAllWindows(): void {
  for (const [id, windowData] of activeWindows) {
    try {
      windowData.app?.close?.()
    }
    catch (e) {
      console.warn(`Failed to close window ${id}:`, e)
    }
  }
  activeWindows.clear()
}

/**
 * Create a WindowInstance object with control methods
 */
function createWindowInstance(id: string, app: any): WindowInstance {
  return {
    id,

    show: () => {
      // The window is shown when created via app.show()
      // This is a no-op since ts-craft auto-shows windows
      console.log(`[stx/desktop] Window ${id} shown`)
    },

    hide: () => {
      // ts-craft doesn't expose hide directly from the process side
      // This would need to be called from inside the webview via window.craft.window.hide()
      console.log(`[stx/desktop] To hide window, use window.craft.window.hide() from inside the webview`)
    },

    close: () => {
      const windowData = activeWindows.get(id)
      if (windowData?.app) {
        windowData.app.close()
        activeWindows.delete(id)
        console.log(`[stx/desktop] Window ${id} closed`)
      }
    },

    focus: () => {
      console.log(`[stx/desktop] To focus window, use window.craft.window.focus() from inside the webview`)
    },

    minimize: () => {
      console.log(`[stx/desktop] To minimize window, use window.craft.window.minimize() from inside the webview`)
    },

    maximize: () => {
      console.log(`[stx/desktop] To maximize window, use window.craft.window.maximize() from inside the webview`)
    },

    restore: () => {
      console.log(`[stx/desktop] To restore window, use window.craft.window.show() from inside the webview`)
    },

    setTitle: (title: string) => {
      console.log(`[stx/desktop] To set title, use window.craft.window.setTitle({ title: "${title}" }) from inside the webview`)
    },

    loadURL: (url: string) => {
      // Re-create the window with the new URL
      console.log(`[stx/desktop] To navigate, use window.location.href = "${url}" from inside the webview`)
    },

    reload: () => {
      console.log(`[stx/desktop] To reload, use window.craft.window.reload() from inside the webview`)
    },
  }
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
 * ## Window Control
 *
 * The CraftApp spawns a native webview process. Window control methods like
 * hide(), minimize(), setTitle() etc. are available via the `window.craft`
 * bridge **inside** the webview context:
 *
 * ```javascript
 * // Inside your HTML/JS running in the webview:
 * window.craft.window.hide()
 * window.craft.window.minimize()
 * window.craft.window.setTitle({ title: 'New Title' })
 * window.craft.window.center()
 * ```
 *
 * The returned WindowInstance provides the `close()` method which terminates
 * the native process from the Node.js side.
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
    resizable = true,
    frameless = false,
    alwaysOnTop = false,
  } = options

  try {
    // Dynamically import ts-craft
    const { createApp } = await import('ts-craft')

    const craftPath = getCraftBinaryPath()

    const app = createApp({
      url,
      craftPath,
      window: {
        title,
        width,
        height,
        darkMode,
        hotReload,
        resizable,
        frameless,
        alwaysOnTop,
      },
    })

    // Generate unique ID
    const id = `craft-window-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Store the window instance
    activeWindows.set(id, { app, url, options })

    // Show the window
    await app.show()

    return createWindowInstance(id, app)
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

    // When native sidebar is enabled, don't use system tray (they're mutually exclusive in Craft)
    const useSystemTray = !options.nativeSidebar

    const app = createApp({
      url,
      craftPath,
      window: {
        title: options.title || 'stx Development',
        width: options.width || 1400,
        height: options.height || 900,
        resizable: true,
        systemTray: useSystemTray,
        darkMode: options.darkMode ?? true,
        hotReload: options.hotReload ?? true,
        devTools: true,
        // Native sidebar support (macOS Tahoe style)
        nativeSidebar: options.nativeSidebar ?? false,
        sidebarWidth: options.sidebarWidth ?? 260,
        sidebarConfig: options.sidebarConfig,
      },
    })

    const id = `dev-window-${port}`
    activeWindows.set(id, { app, url, options })

    await app.show()
    console.log(`✓ Native window opened at ${url}`)
    console.log(`📌 Look for the "stx Development" icon in your menubar`)
    return true
  }
  catch (error) {
    console.warn('⚠  Could not open native window:', (error as Error).message)

    // Skip browser fallback in test environment
    if (process.env.NODE_ENV === 'test' || process.env.BUN_TEST) {
      console.log('(Skipping browser fallback in test environment)')
      return false
    }

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
    resizable = true,
    frameless = false,
    alwaysOnTop = false,
  } = options

  try {
    // Dynamically import ts-craft
    const { createApp } = await import('ts-craft')

    const craftPath = getCraftBinaryPath()

    const app = createApp({
      html,
      craftPath,
      window: {
        title,
        width,
        height,
        darkMode,
        hotReload,
        resizable,
        frameless,
        alwaysOnTop,
      },
    })

    const id = `craft-window-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    activeWindows.set(id, { app, url: 'html-content', options })

    await app.show()

    return createWindowInstance(id, app)
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

// =============================================================================
// Bridge Script Generator
// =============================================================================

/**
 * Generate a JavaScript snippet to inject into HTML that provides
 * helper functions for common window operations.
 *
 * This can be injected into your HTML to provide easier access to Craft APIs.
 *
 * @example
 * ```typescript
 * const html = `
 *   <html>
 *     <head>
 *       <script>${getWindowBridgeScript()}</script>
 *     </head>
 *     <body>
 *       <button onclick="stxWindow.minimize()">Minimize</button>
 *     </body>
 *   </html>
 * `
 * await createWindowWithHTML(html)
 * ```
 */
export function getWindowBridgeScript(): string {
  return `
// STX Desktop Window Bridge
// Provides convenient wrappers around window.craft APIs
window.stxWindow = {
  // Window control
  hide: () => window.craft?.window?.hide(),
  show: () => window.craft?.window?.show(),
  toggle: () => window.craft?.window?.toggle(),
  close: () => window.craft?.window?.close(),
  minimize: () => window.craft?.window?.minimize(),
  maximize: () => window.craft?.window?.maximize(),
  focus: () => window.craft?.window?.focus(),
  center: () => window.craft?.window?.center(),
  reload: () => window.craft?.window?.reload(),
  toggleFullscreen: () => window.craft?.window?.toggleFullscreen(),

  // Window properties
  setTitle: (title) => window.craft?.window?.setTitle({ title }),
  setSize: (width, height) => window.craft?.window?.setSize({ width, height }),
  setPosition: (x, y) => window.craft?.window?.setPosition({ x, y }),
  setAlwaysOnTop: (alwaysOnTop) => window.craft?.window?.setAlwaysOnTop({ alwaysOnTop }),
  setResizable: (resizable) => window.craft?.window?.setResizable({ resizable }),
  setOpacity: (opacity) => window.craft?.window?.setOpacity({ opacity }),

  // macOS-specific
  setVibrancy: (vibrancy) => window.craft?.window?.setVibrancy({ vibrancy }),

  // App control
  quit: () => window.craft?.app?.quit(),
  isDarkMode: () => window.craft?.app?.isDarkMode(),
  getLocale: () => window.craft?.app?.getLocale(),

  // Notifications
  notify: (options) => window.craft?.app?.notify(options),

  // Check if running in Craft
  isCraftAvailable: () => typeof window.craft !== 'undefined',
};

// Expose as global for backwards compatibility
window.desktop = window.stxWindow;
`
}
