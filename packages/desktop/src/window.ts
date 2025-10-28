import type { WindowInstance, WindowOptions } from './types'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Get the path to the Zyte binary
 */
function getZyteBinaryPath(): string {
  // Look for zyte-minimal in the zyte package
  const zyteDir = path.resolve(__dirname, '../../zyte')
  const binaryPath = path.join(zyteDir, 'zig-out/bin/zyte-minimal')

  return binaryPath
}

/**
 * Check if Zyte is built
 */
export function isZyteBuilt(): boolean {
  const binaryPath = getZyteBinaryPath()
  return fs.existsSync(binaryPath)
}

/**
 * Build Zyte if not already built
 */
export async function buildZyte(): Promise<boolean> {
  const zyteDir = path.resolve(__dirname, '../../zyte')

  try {
    const { execSync } = await import('node:child_process')
    console.log('Building Zyte...')
    execSync(`cd ${zyteDir} && zig build`, { stdio: 'inherit' })
    console.log('Zyte built successfully!')
    return true
  }
  catch (error) {
    console.error('Failed to build Zyte:', error)
    return false
  }
}

/**
 * Create a native window with URL
 * This is the main function that replaces the old openNativeWindow
 */
export async function createWindow(url: string, options: WindowOptions = {}): Promise<WindowInstance | null> {
  const {
    title = 'stx Desktop',
    width = 1200,
    height = 800,
  } = options

  try {
    // Check if zyte is built, build if necessary
    if (!isZyteBuilt()) {
      console.log('Zyte not built, building now...')
      const built = await buildZyte()
      if (!built) {
        throw new Error('Failed to build Zyte')
      }
    }

    const binaryPath = getZyteBinaryPath()

    // Spawn the Zyte process
    const zyteProcess = spawn(
      binaryPath,
      [url],
      {
        detached: true,
        stdio: 'ignore',
      },
    )
    zyteProcess.unref()

    // Create window instance with unique ID
    const windowInstance: WindowInstance = {
      id: `window-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      show: () => {
        // Zyte windows are shown by default
        console.log('Window shown')
      },
      hide: () => {
        console.warn('Hide not implemented for Zyte windows')
      },
      close: () => {
        zyteProcess.kill()
      },
      focus: () => {
        console.warn('Focus not implemented for Zyte windows')
      },
      minimize: () => {
        console.warn('Minimize not implemented for Zyte windows')
      },
      maximize: () => {
        console.warn('Maximize not implemented for Zyte windows')
      },
      restore: () => {
        console.warn('Restore not implemented for Zyte windows')
      },
      setTitle: (newTitle: string) => {
        console.warn('SetTitle not implemented for Zyte windows', newTitle)
      },
      loadURL: (newUrl: string) => {
        console.warn('LoadURL not implemented for Zyte windows', newUrl)
      },
      reload: () => {
        console.warn('Reload not implemented for Zyte windows')
      },
    }

    return windowInstance
  }
  catch (error) {
    console.error('Failed to create window:', error)
    return null
  }
}

/**
 * Open a development server window
 * This is specifically for the stx dev server --native flag
 */
export async function openDevWindow(port: number, options: WindowOptions = {}): Promise<boolean> {
  const url = `http://localhost:${port}/`

  try {
    // Check if zyte is built
    if (!isZyteBuilt()) {
      console.log('⚠  Zyte not built. Building now...')
      const built = await buildZyte()
      if (!built) {
        return false
      }
    }

    // Create the window
    console.log('⚡ Opening native window...')
    const window = await createWindow(url, options)

    if (window) {
      console.log(`✓ Native window opened with URL: ${url}`)
      return true
    }
    else {
      return false
    }
  }
  catch (error) {
    console.error('✗ Could not open native window:', error)
    const zyteDir = path.resolve(__dirname, '../../zyte')
    console.log(`  You can manually run: cd ${zyteDir} && ./zig-out/bin/zyte-minimal ${url}`)
    return false
  }
}

/**
 * Create a window with HTML content
 */
export async function createWindowWithHTML(html: string, options: WindowOptions = {}): Promise<WindowInstance | null> {
  // For now, this would require creating a temporary HTML file and serving it
  // Or using a data URL (if Zyte supports it)
  console.warn('createWindowWithHTML not yet implemented')
  console.warn('HTML content:', html.substring(0, 100))
  return null
}
