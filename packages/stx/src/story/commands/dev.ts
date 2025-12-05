/**
 * STX Story - Dev command
 * Start the story development server
 */

import process from 'node:process'
import { createContext } from '../context'
import { createStoryServer } from '../server'

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
  console.log('\n📖 Starting STX Story...\n')

  // Create context
  const ctx = await createContext({ mode: 'dev' })

  if (!ctx.config.enabled) {
    console.log('Story feature is disabled in config.')
    return
  }

  // Override port if specified
  const port = options.port ?? ctx.config.port

  // Start server
  const { server, close } = await createStoryServer(ctx, {
    port,
    open: options.open,
    host: options.host,
  })

  // Print URLs
  const urls = server.url
  console.log(`  📚 Story server running at:`)
  console.log(`     ${urls}\n`)

  if (options.open) {
    console.log('  Opening browser...\n')
  }

  // Handle shutdown
  const shutdown = async () => {
    console.log('\n  Shutting down...')
    await close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Keep process alive
  await new Promise(() => {})
}

/**
 * Run dev command (alias for devCommand)
 */
export const dev: typeof devCommand = devCommand
