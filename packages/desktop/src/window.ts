import type { WindowInstance, WindowOptions } from './types'

/**
 * Create a native window with URL
 *
 * Note: This is a placeholder implementation. The actual webview implementation
 * should be provided by ts-zyte or another webview library.
 *
 * To integrate ts-zyte:
 * 1. Install ts-zyte: `bun add ts-zyte`
 * 2. Import and use ts-zyte's window creation API
 * 3. Map ts-zyte's API to the WindowInstance interface
 */
export async function createWindow(url: string, options: WindowOptions = {}): Promise<WindowInstance | null> {
  const {
    title = 'stx Desktop',
    width = 1200,
    height = 800,
  } = options

  console.warn('createWindow: Webview implementation not configured')
  console.warn('To use native windows, please integrate ts-zyte or another webview library')
  console.warn(`Requested window: ${title} (${width}x${height}) - ${url}`)

  // Return null to indicate no window was created
  // When ts-zyte is integrated, this should create an actual window
  return null
}

/**
 * Open a development server window
 * This is specifically for the stx dev server --native flag
 *
 * Note: This is a placeholder implementation waiting for ts-zyte integration.
 */
export async function openDevWindow(port: number, options: WindowOptions = {}): Promise<boolean> {
  const url = `http://localhost:${port}/`

  console.warn('⚠  Native window support not configured')
  console.warn('   To enable native windows:')
  console.warn('   1. Install ts-zyte: bun add ts-zyte')
  console.warn('   2. Update window.ts to use ts-zyte API')
  console.warn(`   Requested URL: ${url}`)

  return false
}

/**
 * Create a window with HTML content
 *
 * Note: This is a placeholder implementation waiting for ts-zyte integration.
 */
export async function createWindowWithHTML(html: string, options: WindowOptions = {}): Promise<WindowInstance | null> {
  console.warn('createWindowWithHTML not yet implemented')
  console.warn('HTML content length:', html.length, 'characters')
  console.warn('Waiting for ts-zyte integration')

  return null
}

/**
 * Helper to check if webview implementation is available
 */
export function isWebviewAvailable(): boolean {
  // This should check if ts-zyte or another webview library is available
  // For now, always return false
  return false
}
