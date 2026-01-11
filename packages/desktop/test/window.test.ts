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

import { createWindow, createWindowWithHTML, isWebviewAvailable, openDevWindow } from '../src/window'

describe('Window Management', () => {
  let consoleLogSpy: any
  let consoleWarnSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
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

  describe('createWindow', () => {
    it('should attempt to create a window and fall back on error', async () => {
      const window = await createWindow('http://localhost:3000')

      // craft will attempt to create window and fall back to null on error
      expect(window).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const result = await createWindow('http://localhost:3000', {
        title: 'Test Window',
        width: 800,
        height: 600,
      })

      expect(result).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalledWith('Falling back to browser...')
    })

    it('should accept window options', async () => {
      await createWindow('http://localhost:8080', {
        title: 'Custom Title',
        width: 1920,
        height: 1080,
      })

      // Should have tried to create window with these options
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should use default options when none provided', async () => {
      await createWindow('http://localhost:3000')

      // Should use defaults: title: 'stx Desktop', 1200x800
      expect(consoleErrorSpy).toHaveBeenCalled()
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
    it('should handle invalid URLs gracefully', async () => {
      const window = await createWindow('not-a-valid-url')
      expect(window).toBeNull()
    })

    it('should handle empty URLs', async () => {
      const window = await createWindow('')
      expect(window).toBeNull()
    })

    it('should handle invalid port numbers', async () => {
      const result = await openDevWindow(-1)
      // In test environment, browser fallback is skipped
      expect(result).toBe(false)
    })
  })
})
