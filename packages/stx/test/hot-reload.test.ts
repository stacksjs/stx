import { describe, expect, it } from 'bun:test'
import {
  generateHotReloadScript,
  HotReloadServer,
  injectHotReload,
  isCssOnlyChange,
  shouldIgnoreFile,
  shouldReloadOnChange,
} from '../src/hot-reload'

describe('Hot Reload Module', () => {
  describe('HotReloadServer', () => {
    it('creates a server instance', () => {
      const server = new HotReloadServer({ wsPort: 9999 })
      expect(server).toBeTruthy()
      expect(server.port).toBe(9999)
      expect(server.clientCount).toBe(0)
    })

    it('can start and stop server', () => {
      const server = new HotReloadServer({ wsPort: 9998 })
      const port = server.start()
      expect(port).toBe(9998)
      server.stop()
      // Should not throw after stopping
      expect(server.clientCount).toBe(0)
    })
  })

  describe('generateHotReloadScript', () => {
    it('generates script with correct WebSocket port', () => {
      const script = generateHotReloadScript(3001)
      expect(script).toContain(':3001')
      expect(script).toContain('<script>')
      expect(script).toContain('</script>')
      expect(script).toContain('WebSocket')
    })

    it('includes reconnection logic', () => {
      const script = generateHotReloadScript(3001, {
        maxReconnectAttempts: 5,
        reconnectInterval: 2000,
      })
      expect(script).toContain('5')
      expect(script).toContain('2000')
    })

    it('includes overlay when enabled', () => {
      const script = generateHotReloadScript(3001, { showOverlay: true })
      expect(script).toContain('createOverlay')
      expect(script).toContain('stx-hmr-overlay')
    })

    it('excludes overlay when disabled', () => {
      const script = generateHotReloadScript(3001, { showOverlay: false })
      expect(script).not.toContain('createOverlay')
      expect(script).toContain('function showOverlay() {}')
    })
  })

  describe('injectHotReload', () => {
    it('injects script before </body>', () => {
      const html = '<html><head></head><body><p>Hello</p></body></html>'
      const result = injectHotReload(html, 3001)
      expect(result).toContain('<script>')
      expect(result.indexOf('<script>')).toBeLessThan(result.indexOf('</body>'))
    })

    it('injects before </html> if no </body>', () => {
      const html = '<html><head></head><p>Hello</p></html>'
      const result = injectHotReload(html, 3001)
      expect(result).toContain('<script>')
      expect(result.indexOf('<script>')).toBeLessThan(result.indexOf('</html>'))
    })

    it('appends to end if no closing tags', () => {
      const html = '<div>Hello</div>'
      const result = injectHotReload(html, 3001)
      expect(result).toContain('<script>')
      expect(result.endsWith('</script>\n')).toBe(true)
    })
  })

  describe('isCssOnlyChange', () => {
    it('returns true for CSS files', () => {
      expect(isCssOnlyChange('styles.css')).toBe(true)
      expect(isCssOnlyChange('path/to/app.CSS')).toBe(true)
    })

    it('returns true for SCSS/SASS files', () => {
      expect(isCssOnlyChange('styles.scss')).toBe(true)
      expect(isCssOnlyChange('styles.sass')).toBe(true)
    })

    it('returns true for LESS files', () => {
      expect(isCssOnlyChange('styles.less')).toBe(true)
    })

    it('returns false for non-CSS files', () => {
      expect(isCssOnlyChange('app.js')).toBe(false)
      expect(isCssOnlyChange('index.html')).toBe(false)
      expect(isCssOnlyChange('page.stx')).toBe(false)
    })
  })

  describe('shouldReloadOnChange', () => {
    it('returns true for stx files', () => {
      expect(shouldReloadOnChange('page.stx')).toBe(true)
    })

    it('returns true for HTML files', () => {
      expect(shouldReloadOnChange('index.html')).toBe(true)
      expect(shouldReloadOnChange('page.htm')).toBe(true)
    })

    it('returns true for JS/TS files', () => {
      expect(shouldReloadOnChange('app.js')).toBe(true)
      expect(shouldReloadOnChange('app.ts')).toBe(true)
      expect(shouldReloadOnChange('component.jsx')).toBe(true)
      expect(shouldReloadOnChange('component.tsx')).toBe(true)
    })

    it('returns true for JSON files', () => {
      expect(shouldReloadOnChange('config.json')).toBe(true)
    })

    it('returns true for Markdown files', () => {
      expect(shouldReloadOnChange('readme.md')).toBe(true)
    })

    it('returns false for CSS files', () => {
      // CSS should trigger CSS-only update, not full reload
      expect(shouldReloadOnChange('styles.css')).toBe(false)
    })

    it('returns false for images', () => {
      expect(shouldReloadOnChange('image.png')).toBe(false)
      expect(shouldReloadOnChange('photo.jpg')).toBe(false)
    })
  })

  describe('shouldIgnoreFile', () => {
    it('ignores hidden files', () => {
      expect(shouldIgnoreFile('.gitignore')).toBe(true)
      expect(shouldIgnoreFile('.env')).toBe(true)
    })

    it('ignores node_modules', () => {
      expect(shouldIgnoreFile('node_modules/package/index.js')).toBe(true)
    })

    it('ignores stx output directory', () => {
      expect(shouldIgnoreFile('.stx-output/file.html')).toBe(true)
    })

    it('ignores stx cache', () => {
      expect(shouldIgnoreFile('.stx/cache/hash123')).toBe(true)
    })

    it('ignores vim swap files', () => {
      expect(shouldIgnoreFile('file.swp')).toBe(true)
      expect(shouldIgnoreFile('file.swo')).toBe(true)
    })

    it('ignores temp files', () => {
      expect(shouldIgnoreFile('file~')).toBe(true)
    })

    it('does not ignore normal files', () => {
      expect(shouldIgnoreFile('app.js')).toBe(false)
      expect(shouldIgnoreFile('index.stx')).toBe(false)
      expect(shouldIgnoreFile('styles.css')).toBe(false)
    })
  })
})
