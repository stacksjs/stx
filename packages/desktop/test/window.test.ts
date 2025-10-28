import { describe, expect, it, spyOn } from 'bun:test'
import { createWindow, createWindowWithHTML, isWebviewAvailable, openDevWindow } from '../src/window'

describe('Window Management', () => {
  describe('isWebviewAvailable', () => {
    it('should return false when no webview implementation is configured', () => {
      const result = isWebviewAvailable()

      expect(result).toBe(false)
    })

    it('should be a function', () => {
      expect(typeof isWebviewAvailable).toBe('function')
    })
  })

  describe('createWindow', () => {
    it('should return null when no webview implementation is configured', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const window = await createWindow('http://localhost:3000')

      expect(window).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should log appropriate warning messages', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await createWindow('http://localhost:3000', {
        title: 'Test Window',
        width: 800,
        height: 600,
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith('createWindow: Webview implementation not configured')
      expect(consoleWarnSpy).toHaveBeenCalledWith('To use native windows, please integrate ts-zyte or another webview library')

      consoleWarnSpy.mockRestore()
    })

    it('should accept window options', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await createWindow('http://localhost:8080', {
        title: 'Custom Title',
        width: 1920,
        height: 1080,
      })

      const lastCall = consoleWarnSpy.mock.calls[consoleWarnSpy.mock.calls.length - 1]
      expect(lastCall[0]).toContain('Custom Title')
      expect(lastCall[0]).toContain('1920x1080')

      consoleWarnSpy.mockRestore()
    })

    it('should use default options when none provided', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await createWindow('http://localhost:3000')

      const lastCall = consoleWarnSpy.mock.calls[consoleWarnSpy.mock.calls.length - 1]
      expect(lastCall[0]).toContain('stx Desktop')
      expect(lastCall[0]).toContain('1200x800')

      consoleWarnSpy.mockRestore()
    })

    it('should be an async function', () => {
      const result = createWindow('http://localhost:3000')
      expect(result instanceof Promise).toBe(true)
    })
  })

  describe('openDevWindow', () => {
    it('should return false when no webview implementation is configured', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const result = await openDevWindow(3000)

      expect(result).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should log instructions for enabling native windows', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await openDevWindow(3000)

      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠  Native window support not configured')
      expect(consoleWarnSpy).toHaveBeenCalledWith('   To enable native windows:')
      expect(consoleWarnSpy).toHaveBeenCalledWith('   1. Install ts-zyte: bun add ts-zyte')
      expect(consoleWarnSpy).toHaveBeenCalledWith('   2. Update window.ts to use ts-zyte API')

      consoleWarnSpy.mockRestore()
    })

    it('should construct correct localhost URL', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await openDevWindow(8080)

      const calls = consoleWarnSpy.mock.calls.map(call => call.join(' '))
      const urlCall = calls.find(call => call.includes('http://localhost'))

      expect(urlCall).toContain('http://localhost:8080/')

      consoleWarnSpy.mockRestore()
    })

    it('should accept window options', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await openDevWindow(3000, {
        title: 'Dev Server',
        width: 1400,
        height: 900,
      })

      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should be an async function', () => {
      const result = openDevWindow(3000)
      expect(result instanceof Promise).toBe(true)
    })
  })

  describe('createWindowWithHTML', () => {
    it('should return null when no webview implementation is configured', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const window = await createWindowWithHTML('<h1>Test</h1>')

      expect(window).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should log HTML content length', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const html = '<html><body><h1>Test Content</h1></body></html>'
      await createWindowWithHTML(html)

      expect(consoleWarnSpy).toHaveBeenCalledWith('createWindowWithHTML not yet implemented')
      expect(consoleWarnSpy).toHaveBeenCalledWith('HTML content length:', html.length, 'characters')
      expect(consoleWarnSpy).toHaveBeenCalledWith('Waiting for ts-zyte integration')

      consoleWarnSpy.mockRestore()
    })

    it('should accept window options', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await createWindowWithHTML('<h1>Test</h1>', {
        title: 'HTML Window',
        width: 800,
        height: 600,
      })

      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should be an async function', () => {
      const result = createWindowWithHTML('<h1>Test</h1>')
      expect(result instanceof Promise).toBe(true)
    })
  })

  describe('Integration readiness', () => {
    it('should export all required functions', () => {
      expect(typeof createWindow).toBe('function')
      expect(typeof openDevWindow).toBe('function')
      expect(typeof createWindowWithHTML).toBe('function')
      expect(typeof isWebviewAvailable).toBe('function')
    })

    it('should maintain backward compatible API', async () => {
      // These should all work without throwing errors
      await createWindow('http://localhost:3000')
      await openDevWindow(3000)
      await createWindowWithHTML('<h1>Test</h1>')
      isWebviewAvailable()

      // All return expected types
      expect(await createWindow('http://localhost:3000')).toBeNull()
      expect(await openDevWindow(3000)).toBe(false)
      expect(await createWindowWithHTML('<h1>Test</h1>')).toBeNull()
      expect(isWebviewAvailable()).toBe(false)
    })
  })
})
