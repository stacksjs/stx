/* eslint-disable import/first */
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

// Mock ts-craft before importing window module
// Note: mock.module() MUST be called before importing the module being mocked
mock.module('ts-craft', () => ({
  createApp: () => ({
    show: async () => {
      // Simulate craft error (since binary path issues in test environment)
      throw new Error('craft binary not found in test environment')
    },
    close: () => {},
  }),
  show: async () => {
    throw new Error('craft binary not found in test environment')
  },
  loadURL: async () => {
    throw new Error('craft binary not found in test environment')
  },
}))

// The binary fallback spawns a real Craft window when a binary is present on
// the machine, so stub `spawn` and record what would have been launched.
const spawned: Array<{ command: string, args: string[] }> = []
mock.module('node:child_process', () => ({
  spawn: (command: string, args: string[]) => {
    spawned.push({ command, args })
    return { on: () => {}, kill: () => {}, unref: () => {} }
  },
}))

import { craftWindowArguments, createWindow, createWindowWithHTML, isWebviewAvailable, openDevWindow } from '../src/window'

describe('Window Management', () => {
  let consoleLogSpy: any
  let consoleWarnSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
    spawned.length = 0
    consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('isWebviewAvailable', () => {
    it('should check if ts-craft is available', () => {
      const result = isWebviewAvailable()
      expect(typeof result).toBe('boolean')
    })

    it('should be a function', () => {
      expect(typeof isWebviewAvailable).toBe('function')
    })
  })

  describe('craftWindowArguments', () => {
    it('describes a plain window with defaults and no opt-in flags', () => {
      expect(craftWindowArguments('http://localhost:3000')).toEqual([
        '--url', 'http://localhost:3000',
        '--title', 'stx Desktop',
        '--width', '1200',
        '--height', '800',
      ])
    })

    it('describes a menu bar window', () => {
      const args = craftWindowArguments('http://127.0.0.1:4000', {
        title: 'Barista',
        width: 320,
        height: 740,
        systemTray: true,
        hideDockIcon: true,
        titlebarHidden: true,
        alwaysOnTop: true,
        resizable: false,
        darkMode: true,
      })

      expect(args).toContain('--system-tray')
      expect(args).toContain('--hide-dock-icon')
      expect(args).toContain('--titlebar-hidden')
      expect(args).toContain('--always-on-top')
      expect(args).toContain('--no-resize')
      expect(args).toContain('--dark')
      expect(args.slice(0, 8)).toEqual([
        '--url', 'http://127.0.0.1:4000',
        '--title', 'Barista',
        '--width', '320',
        '--height', '740',
      ])
    })

    it('omits devtools only when they are explicitly disabled', () => {
      expect(craftWindowArguments('http://localhost:3000', {})).not.toContain('--no-devtools')
      expect(craftWindowArguments('http://localhost:3000', { devTools: false })).toContain('--no-devtools')
    })
  })

  describe('createWindow', () => {
    it('falls back to the craft binary when ts-craft cannot open the window', async () => {
      const window = await createWindow('http://localhost:3000')

      expect(window).not.toBeNull()
      expect(spawned).toHaveLength(1)
      expect(spawned[0].args).toEqual(craftWindowArguments('http://localhost:3000'))
    })

    it('passes window options through to the binary', async () => {
      await createWindow('http://localhost:8080', {
        title: 'Custom Title',
        width: 1920,
        height: 1080,
      })

      expect(spawned[0].args).toEqual([
        '--url', 'http://localhost:8080',
        '--title', 'Custom Title',
        '--width', '1920',
        '--height', '1080',
      ])
    })

    it('should be an async function', () => {
      const result = createWindow('http://localhost:3000')
      expect(result instanceof Promise).toBe(true)
    })
  })

  describe('createWindowWithHTML', () => {
    it('should attempt to create window with HTML content', async () => {
      const html = '<h1>Test</h1>'
      const window = await createWindowWithHTML(html, {
        title: 'HTML Window',
      })

      expect(window).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle empty HTML', async () => {
      const window = await createWindowWithHTML('')
      expect(window).toBeNull()
    })

    it('should accept window options', async () => {
      await createWindowWithHTML('<p>Content</p>', {
        width: 600,
        height: 400,
      })

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('openDevWindow', () => {
    it('should attempt to open native window and skip browser fallback in tests', async () => {
      const result = await openDevWindow(3000)

      // In test environment, browser fallback is skipped to avoid opening browsers
      expect(result).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith('(Skipping browser fallback in test environment)')
    })

    it('should construct correct URL from port', async () => {
      const result = await openDevWindow(8080)

      // In test environment, returns false (browser fallback skipped)
      expect(result).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should accept window options', async () => {
      const result = await openDevWindow(3000, {
        title: 'Custom Dev Window',
        width: 1600,
        height: 1000,
      })

      // In test environment, returns false (browser fallback skipped)
      expect(result).toBe(false)
    })

    it('should return false in test environment (browser fallback skipped)', async () => {
      const result = await openDevWindow(3000)
      // In test environment, browser fallback is skipped to avoid opening browsers
      expect(result).toBe(false)
    })

    it('should be an async function', () => {
      const result = openDevWindow(3000)
      expect(result instanceof Promise).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid port numbers', async () => {
      const result = await openDevWindow(-1)
      // In test environment, browser fallback is skipped
      expect(result).toBe(false)
    })
  })
})
