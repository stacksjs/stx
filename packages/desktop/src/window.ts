import type { WindowInstance, WindowOptions } from './types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

/**
 * Find craft binary in common locations
 */
function getCraftBinaryPath(): string | undefined {
  // Common paths where craft binary might be located
  const possiblePaths = [
    // From linked ts-craft in monorepo
    join(process.cwd(), '../../craft/packages/zig/zig-out/bin/craft-minimal'),
    join(process.cwd(), '../../../craft/packages/zig/zig-out/bin/craft-minimal'),
    // If running from stx repo root
    join(process.cwd(), '../craft/packages/zig/zig-out/bin/craft-minimal'),
    // Common system locations
    '/Users/mac/repos/stacks-org/craft/packages/zig/zig-out/bin/craft-minimal',
  ]

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path
    }
  }

  return undefined
}

/**
 * Create a native window with URL
 *
 * Uses Craft to create native desktop windows.
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

    // Return a WindowInstance stub (ts-craft doesn't return a handle)
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
