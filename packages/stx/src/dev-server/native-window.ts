/**
 * Native Window Module
 * Handles opening development windows using the desktop package
 */

import type { SidebarConfig } from '@stacksjs/desktop'
import { openDevWindow } from '@stacksjs/desktop'
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

  try {
    // Use the desktop package to open the window
    const success = await openDevWindow(port, {
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
  try {
    // Try to import the desktop package
    await import('@stacksjs/desktop')
    return true
  }
  catch {
    return false
  }
}

/**
 * Extract sidebar configuration from template content
 * Looks for:
 * 1. <Sidebar variant="tahoe"> component with props
 * 2. @nativeSidebar directive
 * 3. <script native-sidebar> (deprecated)
 */
export function extractSidebarConfig(templateContent: string): SidebarConfig | undefined {
  // Look for <Sidebar> component with variant="tahoe"
  // Use [\s\S] instead of [^>] to match newlines in multi-line component tags
  const sidebarMatch = templateContent.match(/<Sidebar[\s\S]*?variant=["']tahoe["'][\s\S]*?\/>/i)
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
