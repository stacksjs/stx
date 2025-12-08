/**
 * STX Story - Preview command
 * Preview the built story site locally
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createContext } from '../context'

/**
 * Options for the preview command
 */
export interface PreviewOptions {
  /** Server port (default: 4173) */
  port?: number
  /** Open browser automatically */
  open?: boolean
}

/**
 * Preview the built story site
 */
export async function previewCommand(options: PreviewOptions = {}): Promise<void> {
  console.log('\n📖 Previewing STX Story build...\n')

  // Create context to get config
  const ctx = await createContext({ mode: 'build' })

  // Determine output directory
  const outDir = path.resolve(ctx.root, ctx.config.outDir)

  // Check if build exists
  const indexPath = path.join(outDir, 'index.html')
  try {
    await fs.promises.access(indexPath)
  }
  catch {
    console.log(`  ❌ No build found at ${ctx.config.outDir}`)
    console.log('  Run "stx story build" first.\n')
    return
  }

  const port = options.port ?? 4173

  // Start static file server
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)
      let pathname = url.pathname

      // Default to index.html
      if (pathname === '/') {
        pathname = '/index.html'
      }

      // Try to serve file
      const filePath = path.join(outDir, pathname)

      try {
        const file = Bun.file(filePath)
        const exists = await file.exists()

        if (!exists) {
          // Try with .html extension
          const htmlPath = `${filePath}.html`
          const htmlFile = Bun.file(htmlPath)
          if (await htmlFile.exists()) {
            return new Response(htmlFile)
          }

          // 404
          return new Response('Not found', { status: 404 })
        }

        return new Response(file)
      }
      catch {
        return new Response('Error', { status: 500 })
      }
    },
  })

  console.log(`  📚 Preview server running at:`)
  console.log(`     http://localhost:${port}\n`)

  // Open browser if requested
  if (options.open) {
    try {
      const { exec } = await import('node:child_process')
      const platform = process.platform
      const cmd = platform === 'darwin'
        ? 'open'
        : platform === 'win32'
          ? 'start'
          : 'xdg-open'
      exec(`${cmd} http://localhost:${port}`)
    }
    catch {
      // Ignore errors
    }
  }

  // Handle shutdown
  const shutdown = () => {
    console.log('\n  Shutting down...')
    server.stop()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Keep process alive
  await new Promise(() => {})
}

/**
 * Run preview command (alias)
 */
export const preview: typeof previewCommand = previewCommand
