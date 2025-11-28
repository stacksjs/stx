/**
 * Buddy - Voice AI Code Assistant Desktop Launcher
 *
 * Launches the Buddy UI as a native desktop application
 * using Craft (ts-craft) as the UI engine.
 *
 * Usage:
 *   bun examples/buddy.ts
 *
 * Or with the stx CLI:
 *   stx dev examples/voice-buddy.stx --native
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Dynamic import for Craft
async function launchWithCraft() {
  try {
    const { createApp } = await import('ts-craft')

    const stxPath = join(import.meta.dir, 'voice-buddy.stx')
    const html = readFileSync(stxPath, 'utf-8')

    const app = createApp({
      html,
      window: {
        title: 'Buddy - Voice AI Code Assistant',
        width: 1200,
        height: 800,
        resizable: true,
        darkMode: true,
        devTools: process.env.NODE_ENV === 'development',
        titlebarHidden: true,
        systemTray: true, // Enable system tray for native notifications
      },
    })

    console.log('Launching Buddy...')
    await app.show()
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      console.log('Craft (ts-craft) not found. Running in browser mode...')
      await launchInBrowser()
    }
    else {
      throw error
    }
  }
}

// Fallback to browser-based server
async function launchInBrowser() {
  const stxPath = join(import.meta.dir, 'voice-buddy.stx')
  const html = readFileSync(stxPath, 'utf-8')

  const server = Bun.serve({
    port: 3456,
    fetch() {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  console.log(`Buddy running at http://localhost:${server.port}`)
  console.log('Press Ctrl+C to stop')

  const { exec } = await import('node:child_process')
  const platform = process.platform

  if (platform === 'darwin') {
    exec(`open http://localhost:${server.port}`)
  }
  else if (platform === 'win32') {
    exec(`start http://localhost:${server.port}`)
  }
  else {
    exec(`xdg-open http://localhost:${server.port}`)
  }
}

launchWithCraft().catch(console.error)
