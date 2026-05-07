/**
 * Tests for auto-generated document shell
 */
import { describe, expect, it } from 'bun:test'
import { generateDocumentShell, hasDocumentShell, ensureDocumentShell } from '../../src/document-shell'
import { processDirectives, defaultConfig } from '../../src/index'

describe('Document Shell', () => {
  describe('hasDocumentShell', () => {
    it('should detect <!DOCTYPE>', () => {
      expect(hasDocumentShell('<!DOCTYPE html><html><body></body></html>')).toBe(true)
    })

    it('should detect <html>', () => {
      expect(hasDocumentShell('<html><body></body></html>')).toBe(true)
    })

    it('should return false for fragments', () => {
      expect(hasDocumentShell('<div>Hello</div>')).toBe(false)
      expect(hasDocumentShell('<h1>Title</h1><p>Text</p>')).toBe(false)
    })

    it('should handle whitespace', () => {
      expect(hasDocumentShell('  <!DOCTYPE html>')).toBe(true)
      expect(hasDocumentShell('\n<html>')).toBe(true)
    })

    it('should detect <!DOCTYPE> after a prepended scoped script', () => {
      // The signals runtime, theme guard, and other one-shot setup
      // scripts can render before the user's layout markup. The check
      // used to look only at the leading bytes (after stripping
      // comments) and missed this case, which produced double-wrapped
      // documents with two <html>, two <body>, and the auto-shell's
      // "stx App" <title> winning over the user's layout title.
      const html = `<script data-stx-scoped>console.log("setup")</script>\n<!DOCTYPE html><html><head><title>Real Title</title></head><body></body></html>`
      expect(hasDocumentShell(html)).toBe(true)
    })

    it('should detect <html> later in the document', () => {
      const html = `<style>body{margin:0}</style><html><body></body></html>`
      expect(hasDocumentShell(html)).toBe(true)
    })
  })

  describe('generateDocumentShell', () => {
    it('should wrap content in a full HTML document', () => {
      const result = generateDocumentShell('<h1>Hello</h1>')
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html lang="en">')
      expect(result).toContain('<meta charset="UTF-8">')
      expect(result).toContain('<title>stx App</title>')
      expect(result).toContain('<h1>Hello</h1>')
      expect(result).toContain('</body>')
      expect(result).toContain('</html>')
    })

    it('should use config title', () => {
      const result = generateDocumentShell('<h1>Hello</h1>', { title: 'My App' })
      expect(result).toContain('<title>My App</title>')
    })

    it('should override config title with page title', () => {
      const result = generateDocumentShell('<h1>Hello</h1>', { title: 'Config Title' }, { title: 'Page Title' })
      expect(result).toContain('<title>Page Title</title>')
    })

    it('should set lang attribute', () => {
      const result = generateDocumentShell('<p>Hola</p>', { lang: 'es' })
      expect(result).toContain('<html lang="es">')
    })

    it('should inject meta tags', () => {
      const result = generateDocumentShell('<p>Hello</p>', {
        meta: [{ name: 'description', content: 'Test page' }],
      })
      expect(result).toContain('name="description"')
      expect(result).toContain('content="Test page"')
    })

    it('should inject link tags', () => {
      const result = generateDocumentShell('<p>Hello</p>', {
        link: [{ rel: 'icon', href: '/favicon.ico' }],
      })
      expect(result).toContain('rel="icon"')
      expect(result).toContain('href="/favicon.ico"')
    })

    it('should set body class', () => {
      const result = generateDocumentShell('<p>Hello</p>', { bodyClass: 'dark min-h-screen' })
      expect(result).toContain('class="dark min-h-screen"')
    })

    it('should inject styles in head', () => {
      const result = generateDocumentShell('<p>Hello</p>', {}, {
        styles: ['<style>.card { color: red; }</style>'],
      })
      expect(result).toContain('<style>.card { color: red; }</style>')
    })

    it('should inject scripts before </body>', () => {
      const result = generateDocumentShell('<p>Hello</p>', {}, {
        bodyScripts: ['<script>console.log("hello")</script>'],
      })
      expect(result).toContain('<script>console.log("hello")</script>')
      // Script should be before </body>
      const scriptIdx = result.indexOf('console.log')
      const bodyEndIdx = result.indexOf('</body>')
      expect(scriptIdx).toBeLessThan(bodyEndIdx)
    })
  })

  describe('ensureDocumentShell', () => {
    it('should wrap fragments', () => {
      const result = ensureDocumentShell('<h1>Hello</h1>')
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<h1>Hello</h1>')
    })

    it('should not double-wrap documents', () => {
      const doc = '<!DOCTYPE html><html><head></head><body><h1>Hello</h1></body></html>'
      const result = ensureDocumentShell(doc)
      expect(result).toBe(doc)
    })
  })

  describe('Integration with processDirectives', () => {
    it('should not auto-wrap when autoShell is not set', async () => {
      const result = await processDirectives('<h1>Hello</h1>', {}, '/test.stx', {
        ...defaultConfig,
        partialsDir: '/tmp',
        componentsDir: '/tmp',
      }, new Set())
      expect(result).not.toContain('<!DOCTYPE')
    })

    it('should auto-wrap when autoShell is true', async () => {
      const result = await processDirectives('<h1>Hello</h1>', {}, '/test.stx', {
        ...defaultConfig,
        partialsDir: '/tmp',
        componentsDir: '/tmp',
        autoShell: true,
      }, new Set())
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<h1>Hello</h1>')
      expect(result).toContain('</body>')
    })

    it('should use app.head config for shell', async () => {
      const result = await processDirectives('<h1>Hello</h1>', {}, '/test.stx', {
        ...defaultConfig,
        partialsDir: '/tmp',
        componentsDir: '/tmp',
        autoShell: true,
        app: { head: { title: 'Custom Title', lang: 'fr' } },
      } as any, new Set())
      expect(result).toContain('<title>Custom Title</title>')
      expect(result).toContain('lang="fr"')
    })

    it('should not double-wrap layouts that already have document shell', async () => {
      const template = '<!DOCTYPE html><html><head><title>Layout</title></head><body><h1>Hello</h1></body></html>'
      const result = await processDirectives(template, {}, '/test.stx', {
        ...defaultConfig,
        partialsDir: '/tmp',
        componentsDir: '/tmp',
        autoShell: true,
      }, new Set())
      // Should NOT have double DOCTYPE
      const doctypeCount = (result.match(/<!DOCTYPE/gi) || []).length
      expect(doctypeCount).toBe(1)
    })
  })
})
