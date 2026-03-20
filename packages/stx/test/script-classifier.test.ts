/**
 * Tests for unified script classification
 */
import { describe, expect, it } from 'bun:test'
import { classifyScript, classifyAllScripts } from '../src/script-classifier'

describe('Script Classifier', () => {
  describe('classifyScript', () => {
    it('should classify explicit server scripts', () => {
      const result = classifyScript(' server', 'const x = 1', '<script server>const x = 1</script>')
      expect(result.type).toBe('server')
    })

    it('should classify signals scripts', () => {
      const result = classifyScript('', 'const count = state(0)', '<script>const count = state(0)</script>')
      expect(result.type).toBe('signals')
    })

    it('should classify signals with generics', () => {
      const result = classifyScript('', 'const items = state<Item[]>([])', '<script>const items = state<Item[]>([])</script>')
      expect(result.type).toBe('signals')
    })

    it('should classify derived as signals', () => {
      const result = classifyScript('', 'const total = derived(() => count())', '<script>const total = derived(() => count())</script>')
      expect(result.type).toBe('signals')
    })

    it('should classify effect as signals', () => {
      const result = classifyScript('', 'effect(() => console.log(count()))', '<script>effect(() => console.log(count()))</script>')
      expect(result.type).toBe('signals')
    })

    it('should classify explicit client scripts', () => {
      const result = classifyScript(' client', 'console.log("hi")', '<script client>console.log("hi")</script>')
      expect(result.type).toBe('client')
    })

    it('should classify type="module" as client', () => {
      const result = classifyScript(' type="module"', 'export const x = 1', '<script type="module">export const x = 1</script>')
      expect(result.type).toBe('client')
    })

    it('should classify src= as client', () => {
      const result = classifyScript(' src="app.js"', '', '<script src="app.js"></script>')
      expect(result.type).toBe('client')
    })

    it('should classify data-stx-scoped as client', () => {
      const result = classifyScript(' data-stx-scoped', 'var x = 1', '<script data-stx-scoped>var x = 1</script>')
      expect(result.type).toBe('client')
    })

    it('should classify plain scripts as server', () => {
      const result = classifyScript('', 'const title = "Hello"', '<script>const title = "Hello"</script>')
      expect(result.type).toBe('server')
    })

    it('should classify scripts with document/window as server (no heuristics)', () => {
      // Unified classifier does NOT use browser API heuristics — explicit attrs only
      const result = classifyScript('', 'document.getElementById("x")', '<script>document.getElementById("x")</script>')
      expect(result.type).toBe('server')
    })

    it('should prioritize server attribute over signals', () => {
      const result = classifyScript(' server', 'const x = state(0)', '<script server>const x = state(0)</script>')
      expect(result.type).toBe('server')
    })
  })

  describe('classifyAllScripts', () => {
    it('should classify mixed script types', () => {
      const html = `
<script server>const data = await fetch('/api')</script>
<script>const count = state(0)</script>
<script client>console.log('loaded')</script>
<p>Content</p>`

      const result = classifyAllScripts(html)
      expect(result.server.length).toBe(1)
      expect(result.signals.length).toBe(1)
      expect(result.client.length).toBe(1)
    })

    it('should return empty arrays for no scripts', () => {
      const result = classifyAllScripts('<div>No scripts</div>')
      expect(result.server.length).toBe(0)
      expect(result.signals.length).toBe(0)
      expect(result.client.length).toBe(0)
    })

    it('should preserve full tag and content', () => {
      const html = '<script server>const x = 1</script>'
      const result = classifyAllScripts(html)
      expect(result.server[0].fullTag).toBe(html)
      expect(result.server[0].content).toBe('const x = 1')
      expect(result.server[0].attrs).toBe(' server')
    })
  })
})
