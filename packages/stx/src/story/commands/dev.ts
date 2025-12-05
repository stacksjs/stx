/**
 * STX Story - Dev command
 * Start the story development server
 */

import process from 'node:process'
import { watchConfigFile } from '../config-watcher'
import { createContext } from '../context'
import { printBanner, printError, printHelp, printServerUrls, printStoryCount, printWarning } from '../output'
import { createStoryServer } from '../server'
import { loadSetupFile } from '../setup'

/**
 * Options for the dev command
 */
export interface DevOptions {
  /** Server port (default: 6006) */
  port?: number
  /** Open browser automatically */
  open?: boolean
  /** Host to bind to */
  host?: string | boolean
}

/**
 * Start the story development server
 */
export async function devCommand(options: DevOptions = {}): Promise<void> {
  printBanner()

  // Create context
  const ctx = await createContext({ mode: 'dev' })

  if (!ctx.config.enabled) {
    printWarning('Story feature is disabled in config.')
    return
  }

  // Load setup file
  await loadSetupFile(ctx)

  // Override port if specified
  const port = options.port ?? ctx.config.port

  // Start server
  let serverInstance: Awaited<ReturnType<typeof createStoryServer>>

  const startServer = async (): Promise<void> => {
    serverInstance = await createStoryServer(ctx, {
      port,
      open: options.open,
      host: options.host,
    })

    // Print info
    printStoryCount(ctx.storyFiles.length)
    printServerUrls(serverInstance.url)
    printHelp()
  }

  await startServer()

  // Watch config file for changes
  const configWatcher = watchConfigFile(ctx, {
    onChange: async () => {
      // Restart server
      await serverInstance.close()
      const newCtx = await createContext({ mode: 'dev' })
      Object.assign(ctx, newCtx)
      await startServer()
    },
  })

  // Handle shutdown
  const shutdown = async (): Promise<void> => {
    console.log('\n')
    configWatcher.stop()
    await serverInstance.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Handle keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', async (data) => {
      const key = data.toString()

      switch (key) {
        case 'h':
          printHelp()
          break
        case 'o':
          // Open in browser
          try {
            const { exec } = await import('node:child_process')
            const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
            exec(`${cmd} ${serverInstance.url}`)
          }
          catch {
            printError('Failed to open browser')
          }
          break
        case 'r':
          // Restart
          await serverInstance.close()
          await startServer()
          break
        case 'c':
          // Clear console
          console.clear()
          printBanner()
          printStoryCount(ctx.storyFiles.length)
          printServerUrls(serverInstance.url)
          break
        case 'q':
        case '\u0003': // Ctrl+C
          await shutdown()
          break
      }
    })
  }

  // Keep process alive
  await new Promise(() => {})
}

/**
 * Run dev command (alias for devCommand)
 */
export const dev: typeof devCommand = devCommand
