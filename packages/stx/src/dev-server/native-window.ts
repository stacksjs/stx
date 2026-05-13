/**
 * Native Window Module
 * Handles opening development windows using the desktop package.
 *
 * All `@stacksjs/desktop` imports are lazy: the package is only loaded when
 * the user actually asks for a native window (`--native`). This keeps the
 * CLI runnable even if `@stacksjs/desktop` isn't built or installed —
 * previously a failed import crashed every `stx dev` invocation with
 * "Cannot find module '@stacksjs/desktop'".
 */

// Local type-only mirror of the one exported by @stacksjs/desktop.
// Kept minimal — stx only reads these fields. If the real type grows, the
// resolved value is still passed through verbatim to openDevWindow().
export interface SidebarConfig {
  sections: Array<{
    title?: string
    items?: Array<{ id: string, label: string, icon?: string, badge?: string | number }>
  }>
}

import { colors } from './terminal-colors'

/**
 * Configuration for the native development window
 */
export interface NativeWindowConfig {
  title?: string
  width?: number
  height?: number
  darkMode?: boolean
  hotReload?: boolean
  /** Enable native macOS sidebar (Finder-style with vibrancy) */
  nativeSidebar?: boolean
  /** Width of the native sidebar in pixels */
  sidebarWidth?: number
  /** Sidebar configuration (sections and items) */
  sidebarConfig?: SidebarConfig
}

/**
 * Default configuration for the native window
 */
export const DEFAULT_NATIVE_WINDOW_CONFIG: Required<Omit<NativeWindowConfig, 'sidebarConfig'>> & { sidebarConfig?: SidebarConfig } = {
  title: 'stx Development',
  width: 1400,
  height: 900,
  darkMode: true,
  hotReload: true,
  nativeSidebar: false,
  sidebarWidth: 260,
  sidebarConfig: undefined,
}

/**
 * Lazily resolve `openDevWindow` from the optional desktop package.
 * Returns `null` if the package isn't available — the caller handles fallback.
 */
async function loadDesktop(): Promise<
  | { openDevWindow: (port: number, opts: Record<string, unknown>) => Promise<boolean> }
  | null
> {
  try {
    const mod = await import('@stacksjs/desktop')
    if (typeof (mod as any).openDevWindow !== 'function') return null
    return mod as any
  }
  catch {
    return null
  }
}

/**
 * Open a native window for development
 * Uses the desktop package to create a webview window
 *
 * @param port - The port the dev server is running on
 * @param config - Optional configuration overrides
 * @returns true if window opened successfully, false otherwise
 */
export async function openNativeWindow(
  port: number,
  config: NativeWindowConfig = {},
): Promise<boolean> {
  const mergedConfig = {
    ...DEFAULT_NATIVE_WINDOW_CONFIG,
    ...config,
  }

  const desktop = await loadDesktop()
  if (!desktop) {
    console.log(
      `${colors.yellow}⚠${colors.reset} Native window requested, but @stacksjs/desktop is not available.`,
    )
    console.log(`  Install & build the desktop package to enable --native.`)
    return false
  }

  try {
    const success = await desktop.openDevWindow(port, {
      title: mergedConfig.title,
      width: mergedConfig.width,
      height: mergedConfig.height,
      darkMode: mergedConfig.darkMode,
      hotReload: mergedConfig.hotReload,
      nativeSidebar: mergedConfig.nativeSidebar,
      sidebarWidth: mergedConfig.sidebarWidth,
      sidebarConfig: mergedConfig.sidebarConfig,
    })

    if (success && mergedConfig.nativeSidebar) {
      console.log(`${colors.green}✓${colors.reset} Native sidebar enabled (macOS Tahoe style)`)
    }

    return success
  }
  catch (error) {
    console.log(`${colors.red}✗${colors.reset} Could not open native window:`, error)
    return false
  }
}

/**
 * Check if native window support is available
 * Returns true if the desktop package can be used
 */
export async function isNativeWindowSupported(): Promise<boolean> {
  return (await loadDesktop()) !== null
}

/**
 * Extract sidebar configuration from template content
 * Looks for:
 * 1. <Sidebar> component with a native-capable variant
 * 2. @nativeSidebar directive
 * 3. <script native-sidebar> (deprecated)
 */
export function extractSidebarConfig(templateContent: string): SidebarConfig | undefined {
  // Look for <Sidebar> component with a native-capable variant.
  // Use [\s\S] instead of [^>] to match newlines in multi-line component tags
  const sidebarMatch = templateContent.match(/<Sidebar[\s\S]*?variant=["'](?:tahoe|vibrancy|desktop)["'][\s\S]*?\/>/i)
  if (sidebarMatch) {
    // Find the server script to evaluate the full context
    const scriptMatch = templateContent.match(/<script\s+server[^>]*>([\s\S]*?)<\/script>/i)
    if (scriptMatch) {
      const scriptContent = scriptMatch[1]

      try {
        // Evaluate the entire script to get all variables in context
        // Then extract sidebarConfig
        const evalScript = `
          ${scriptContent}
          return typeof sidebarConfig !== 'undefined' ? sidebarConfig : null;
        `
        const fn = new Function(evalScript)
        const config = fn()
        if (config) {
          return config
        }
      }
      catch (e) {
        console.warn('Invalid sidebarConfig:', e)
      }
    }

    // Return a minimal config indicating native sidebar is enabled
    return { sections: [] }
  }

  // Look for @nativeSidebar directive with JSON config
  const directiveMatch = templateContent.match(/@nativeSidebar\s*\(\s*(\{[\s\S]*?\})\s*\)/m)
  if (directiveMatch) {
    try {
      return JSON.parse(directiveMatch[1])
    }
    catch {
      console.warn('Invalid @nativeSidebar configuration')
    }
  }

  // Look for <script native-sidebar> with exported config (deprecated)
  const nativeSidebarScriptMatch = templateContent.match(/<script\s+native-sidebar[^>]*>([\s\S]*?)<\/script>/i)
  if (nativeSidebarScriptMatch) {
    try {
      // Extract the config object from the script
      const configObjMatch = nativeSidebarScriptMatch[1].match(/(?:export\s+(?:default\s+)?|const\s+\w+\s*=\s*)(\{[\s\S]*\})/m)
      if (configObjMatch) {
        // Use Function constructor to safely evaluate the config
        const fn = new Function(`return ${configObjMatch[1]}`)
        return fn()
      }
    }
    catch (e) {
      console.warn('Invalid native-sidebar script configuration:', e)
    }
  }

  return undefined
}
