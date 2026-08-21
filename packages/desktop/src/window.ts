/* eslint-disable no-console */
import type { SidebarConfig, WindowInstance, WindowOptions } from './types'
import process from 'node:process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { craftBinaryNotFoundMessage, resolveCraftBinary } from 'craft-native'

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

function prepareSidebarConfig(options: WindowOptions): SidebarConfig | undefined {
  if (!options.sidebarConfig) return undefined

  const config: SidebarConfig = { ...options.sidebarConfig }
  if (config.variant === 'desktop') {
    config.material = config.material ?? 'sidebar'
    config.backgroundEffect = config.backgroundEffect ?? 'shimmer'
    config.allowsVibrancy = config.allowsVibrancy ?? true
  }

  return config
}

// =============================================================================
// Binary Resolution
// =============================================================================

/**
 * Find the craft binary.
 *
 * Craft ships through the pantry registry, so the canonical answer is "whatever
 * `craft` resolves to on PATH" — `resolveCraftBinary` in craft-native owns that
 * contract, including the `CRAFT_BIN` escape hatch for local builds. This
 * function only layers on the overrides that are part of the desktop package's
 * own API, plus the one location craft cannot know about: inside a packaged app
 * bundle, where `packageApp` puts the binary next to the app's executable.
 *
 * Resolution order:
 * 1. `CRAFT_BINARY_PATH` environment variable
 * 2. `config.craftBinaryPath` (set via `setDesktopConfig`)
 * 3. `config.additionalSearchPaths`
 * 4. Beside the running executable (a packaged `.app`)
 * 5. `craft`'s own contract — `CRAFT_BIN`, else PATH
 *
 * @returns The string to spawn. Never undefined: a bare `'craft'` defers to PATH,
 *   and an ENOENT from the spawn produces craft's pantry-aware guidance.
 */
function getCraftBinaryPath(): string {
  const overrides = [
    process.env.CRAFT_BINARY_PATH,
    currentConfig.craftBinaryPath,
    ...(currentConfig.additionalSearchPaths || []),
    // A packaged app bundles craft into Contents/MacOS/ beside its own binary
    // (see packageApp's macos.additionalExecutables), so a shipped app resolves
    // its own copy rather than depending on the user having pantry.
    join(dirname(process.execPath), 'craft'),
  ]

  for (const candidate of overrides) {
    if (candidate && existsSync(candidate))
      return candidate
  }

  return resolveCraftBinary()
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
  /** Host-side close subscribers — see `WindowInstance.onClosed`. */
  closeListeners?: Set<() => void>
  /** Set once the window has gone, so a late subscriber still fires. */
  closed?: boolean
}>()

/**
 * Announce that a window has gone away, exactly once.
 *
 * Called from both close paths — the user closing the window (the child
 * process exits) and the app calling `close()` — so a host that shuts itself
 * down on close behaves the same either way.
 */
function markWindowClosed(id: string): void {
  const windowData = activeWindows.get(id)
  if (!windowData || windowData.closed)
    return

  windowData.closed = true
  for (const listener of windowData.closeListeners ?? []) {
    try {
      listener()
    }
    catch (e) {
      // One bad subscriber must not stop the others, and must not throw out
      // of a process-exit handler.
      console.warn(`[stx/desktop] window ${id} close listener threw:`, e)
    }
  }
  windowData.closeListeners?.clear()
}

/**
 * How long a craft window gets to prove it started.
 *
 * `CraftApp.show()` returns ONE promise for two different events: it rejects
 * if the process could not be started, and it resolves when the process
 * exits. Nothing in its result distinguishes "the binary is missing" from
 * "the user closed the window an hour later" — so the only thing that
 * separates them is when it settles.
 *
 * A failure to launch settles almost immediately (an ENOENT arrives on the
 * child's `error` event a tick or two after spawn). A window that actually
 * opened cannot have been closed again within this window. 50ms is far below
 * the threshold of noticing at app start and comfortably above the former.
 */
const LAUNCH_GRACE_MS = 50

/**
 * Start a craft-native app and wire its lifetime to the window entry.
 *
 * The promise is deliberately not awaited to completion. `show()` resolves
 * when the child process EXITS, not when the window appears — so
 * `await app.show()` did not mean "the window is open", it meant "the window
 * has been closed again". Every caller that awaited it blocked for the entire
 * life of the window: `createWindow` never returned a `WindowInstance` its
 * caller could use, and `openDevWindow` logged "Native window opened" at the
 * moment it stopped being open.
 *
 * Instead, only the launch is awaited (see `LAUNCH_GRACE_MS`), and the later
 * settlement becomes the close signal `onClosed` needs.
 *
 * @throws whatever `show()` rejected with, when it failed to launch — callers
 * catch this to fall back to spawning the binary directly.
 */
async function trackWindowLifetime(id: string, app: { show: () => Promise<unknown> }): Promise<void> {
  const launch = app.show().then(
    () => ({ failed: false as const }),
    (error: unknown) => ({ failed: true as const, error }),
  )

  const early = await Promise.race([
    launch,
    new Promise<null>(resolve => setTimeout(() => resolve(null), LAUNCH_GRACE_MS)),
  ])

  // Settled within the grace period AND unhappy: it never started. Rethrow so
  // the caller's existing fallback path runs.
  if (early?.failed)
    throw early.error

  // Either still running, or it exited cleanly and instantly. Both mean the
  // launch itself succeeded, so from here the settlement means "closed".
  void launch.then(() => markWindowClosed(id))
}

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
      // This is a no-op since craft-native auto-shows windows
      console.log(`[stx/desktop] Window ${id} shown`)
    },

    hide: () => {
      // craft-native doesn't expose hide directly from the process side
      // This would need to be called from inside the webview via window.craft.window.hide()
      console.log(`[stx/desktop] To hide window, use window.craft.window.hide() from inside the webview`)
    },

    close: () => {
      const windowData = activeWindows.get(id)
      if (windowData?.app) {
        windowData.app.close()
        // Announced BEFORE the entry is dropped, or there would be nothing
        // left to read the subscriber list from.
        markWindowClosed(id)
        activeWindows.delete(id)
        console.log(`[stx/desktop] Window ${id} closed`)
      }
    },

    onClosed: (callback: () => void) => {
      const windowData = activeWindows.get(id)

      // Already gone — either closed before this ran, or never registered.
      // Fire on a microtask rather than synchronously so the caller always
      // observes the same ordering regardless of when it subscribed.
      if (!windowData || windowData.closed) {
        queueMicrotask(callback)
        return () => {}
      }

      windowData.closeListeners ??= new Set()
      windowData.closeListeners.add(callback)
      return () => windowData.closeListeners?.delete(callback)
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
 * Translate window options into Craft binary arguments.
 *
 * craft-native is a thin wrapper around this command line, so the same options
 * describe a window whether the JS package is installed or not.
 */
export function craftWindowArguments(url: string, options: WindowOptions = {}): string[] {
  const args = [
    '--url', url,
    '--title', options.title || 'stx Desktop',
    '--width', String(options.width ?? 1200),
    '--height', String(options.height ?? 800),
  ]

  if (options.darkMode) args.push('--dark')
  if (options.hotReload) args.push('--hot-reload')
  if (options.resizable === false) args.push('--no-resize')
  if (options.frameless) args.push('--frameless')
  if (options.alwaysOnTop) args.push('--always-on-top')
  if (options.titlebarHidden) args.push('--titlebar-hidden')
  if (options.systemTray) args.push('--system-tray')
  if (options.hideDockIcon) args.push('--hide-dock-icon')
  if (options.devTools === false) args.push('--no-devtools')
  if (options.nativeSidebar) args.push('--native-sidebar')
  if (options.sidebarWidth !== undefined) args.push('--sidebar-width', String(options.sidebarWidth))

  const sidebarConfig = prepareSidebarConfig(options)
  if (sidebarConfig) args.push('--sidebar-config', JSON.stringify(sidebarConfig))

  return args
}

/**
 * Create a native window with URL
 *
 * Prefers the craft-native package for its richer typings, and falls back to
 * spawning the Craft binary directly when it isn't installed — the binary is
 * what craft-native drives anyway, so an app needs only one of the two.
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
 * @returns WindowInstance if successful, null if no Craft runtime is available
 */
export async function createWindow(url: string, options: WindowOptions = {}): Promise<WindowInstance | null> {
  const id = `craft-window-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const craftPath = getCraftBinaryPath()

  try {
    const { createApp } = await import('craft-native')

    const app = createApp({
      url,
      craftPath,
      // craft-native's WindowOptions doesn't type every field the binary honors
      // (titlebarHidden, hideDockIcon, sidebar config), so cast to its own
      // window type to pass them through.
      window: {
        title: options.title || 'stx Desktop',
        width: options.width ?? 1200,
        height: options.height ?? 800,
        darkMode: options.darkMode ?? false,
        hotReload: options.hotReload ?? false,
        resizable: options.resizable ?? true,
        frameless: options.frameless ?? false,
        alwaysOnTop: options.alwaysOnTop ?? false,
        titlebarHidden: options.titlebarHidden ?? false,
        systemTray: options.systemTray ?? false,
        hideDockIcon: options.hideDockIcon ?? false,
        devTools: options.devTools ?? false,
        nativeSidebar: options.nativeSidebar ?? false,
        sidebarWidth: options.sidebarWidth,
        sidebarConfig: prepareSidebarConfig(options) as Record<string, unknown> | undefined,
      } as NonNullable<Parameters<typeof createApp>[0]>['window'],
    })

    activeWindows.set(id, { app, url, options })
    await trackWindowLifetime(id, app)

    return createWindowInstance(id, app)
  }
  catch {
    // createApp couldn't drive the window (most often the binary isn't
    // installed). Spawn it ourselves — craft-native is a thin wrapper over this
    // same command line — and let an ENOENT report craft's pantry-aware guidance
    // rather than a bare spawn error.
    try {
      const { spawn } = await import('node:child_process')
      const child = spawn(craftPath, craftWindowArguments(url, options), { stdio: 'inherit' })
      child.on('error', (err: NodeJS.ErrnoException) => {
        console.error(err.code === 'ENOENT' ? craftBinaryNotFoundMessage(craftPath) : `craft child error: ${err.message}`)
      })

      const app = { close: () => child.kill() }
      activeWindows.set(id, { app, url, options })

      // The child process ending is what "the user closed the window" looks
      // like from out here. Without this the host never learns, and an app
      // that started a server before opening its window keeps running with
      // nothing on screen.
      child.on('exit', () => markWindowClosed(id))

      return createWindowInstance(id, app)
    }
    catch (binaryError) {
      console.error('Failed to spawn craft binary:', (binaryError as Error).message)
      return null
    }
  }
}

/**
 * Open a development server window
 * This is specifically for the stx dev server --native flag
 *
 * Uses craft-native to create a native window, falls back to browser if unavailable.
 */
export async function openDevWindow(port: number, options: WindowOptions = {}): Promise<boolean> {
  const url = `http://localhost:${port}/`

  // Bail out of native paths under bun:test to avoid spawning real
  // webview processes from unit tests. Tests assert that the function
  // returns false in this environment.
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.BUN_TEST
  if (isTestEnv) {
    console.warn('⚠  Skipping native window in test environment')
    console.log('(Skipping browser fallback in test environment)')
    return false
  }

  // Path 1 — `craft-native` package, when it's actually installed in the host
  // workspace. This is the original path; we keep it for projects that
  // depend on `craft-native` for richer typings / sidebar config.
  try {
    const { createApp } = await import('craft-native')

    console.log('⚡ Opening native window via craft-native…')
    const useSystemTray = !options.nativeSidebar
    const sidebarConfig = prepareSidebarConfig(options)
    const app = createApp({
      url,
      craftPath: getCraftBinaryPath(),
      // craft-native's WindowOptions doesn't type `titlebarHidden` yet, but the
      // Craft binary honors it (see the `--titlebar-hidden` arg on the binary
      // fallback path below). Cast to craft-native's own window type so this
      // forward-compat field passes through without a fresh-literal excess error.
      window: {
        title: options.title || 'stx Development',
        width: options.width || 1400,
        height: options.height || 900,
        resizable: true,
        systemTray: useSystemTray,
        darkMode: options.darkMode ?? true,
        hotReload: options.hotReload ?? true,
        devTools: true,
        titlebarHidden: options.titlebarHidden ?? false,
        nativeSidebar: options.nativeSidebar ?? false,
        sidebarWidth: options.sidebarWidth ?? 260,
        sidebarConfig: sidebarConfig as Record<string, unknown> | undefined,
      } as NonNullable<Parameters<typeof createApp>[0]>['window'],
    })

    const id = `dev-window-${port}`
    activeWindows.set(id, { app, url, options })
    await trackWindowLifetime(id, app)
    console.log(`✓ Native window opened at ${url}`)
    return true
  }
  catch {
    // Path 2 — spawn the binary directly. craft-native is a thin wrapper over
    // this same command line, so a machine with craft installed but no JS
    // package still gets a native window.
    const craftPath = getCraftBinaryPath()
    try {
      console.log(`⚡ Opening native window via craft binary (${craftPath})…`)
      const { spawn } = await import('node:child_process')
      const child = spawn(craftPath, craftWindowArguments(url, {
        title: 'stx Development',
        width: 1400,
        height: 900,
        // Hot reload is the point of a dev window, so it defaults on here.
        hotReload: true,
        ...options,
      }), { stdio: 'inherit' })

      // Bridge the child's lifetime to the host process so closing the
      // window cleanly exits the dev server (matches `bun --bun … --native`
      // expectations).
      child.on('exit', () => process.exit(0))
      child.on('error', (err: NodeJS.ErrnoException) => {
        console.warn(err.code === 'ENOENT' ? craftBinaryNotFoundMessage(craftPath) : `craft child error: ${err.message}`)
      })

      const id = `dev-window-${port}`
      activeWindows.set(id, { app: { close: () => child.kill() }, url, options })
      console.log(`✓ Native window opened at ${url}`)
      return true
    }
    catch (binaryErr) {
      console.warn('⚠  Could not spawn craft binary:', (binaryErr as Error).message)
    }

    // Path 3 — give up on native, open the system browser. Skipped in test.
    if (process.env.NODE_ENV === 'test' || process.env.BUN_TEST) {
      console.log('(Skipping browser fallback in test environment)')
      return false
    }
    console.log('📱 Opening in browser instead…')
    try {
      const { spawn } = await import('node:child_process')
      const platform = process.platform
      const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open'
      const args = platform === 'win32' ? ['/c', 'start', url] : [url]
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
 * Uses craft-native to display HTML content in a native window.
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
    // Dynamically import craft-native
    const { createApp } = await import('craft-native')

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

    await trackWindowLifetime(id, app)

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
    // Try to require craft-native to check if it's available
    require.resolve('craft-native')
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
