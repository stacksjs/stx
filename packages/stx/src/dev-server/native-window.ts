/**
 * Native Window Module
 * Handles opening development windows using the desktop package
 */

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
}

/**
 * Default configuration for the native window
 */
export const DEFAULT_NATIVE_WINDOW_CONFIG: Required<NativeWindowConfig> = {
  title: 'stx Development',
  width: 1400,
  height: 900,
  darkMode: true,
  hotReload: true,
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
    })

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
