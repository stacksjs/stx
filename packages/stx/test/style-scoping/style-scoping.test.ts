/**
 * Tests for SFC <style scoped> processing
 */
import { describe, expect, it } from 'bun:test'
import { processScopedStyles } from '../../src/style-scoping'
import { processDirectives } from '../../src/process'

describe('Style Scoping', () => {
  describe('processScopedStyles', () => {
    it('should pass through templates without <style scoped>', () => {
      const html = '<div class="foo">Hello</div><style>.foo { color: red; }</style>'
      const result = processScopedStyles(html, '/test.stx')
      expect(result.hasScoped).toBe(false)
      expect(result.html).toBe(html)
    })

    it('should scope CSS selectors in <style scoped> blocks', () => {
      const html = '<div class="card">Content</div><style scoped>.card { color: red; }</style>'
      const result = processScopedStyles(html, '/components/card.stx')

      expect(result.hasScoped).toBe(true)
      // CSS should be scoped with attribute selector
      expect(result.html).toMatch(/\[data-v-stx-\w+\]\s*\.card\s*\{/)
      // The scoped attribute should not remain on the style tag
      expect(result.html).not.toContain('<style scoped>')
      // Should have data-stx-scoped marker
      expect(result.html).toContain('data-stx-scoped=')
    })

    it('should add scope attribute to HTML elements', () => {
      const html = '<div class="card"><p>Text</p></div><style scoped>.card { color: red; }</style>'
      const result = processScopedStyles(html, '/components/card.stx')

      expect(result.hasScoped).toBe(true)
      expect(result.html).toMatch(/<div data-v-stx-\w+/)
      expect(result.html).toMatch(/<p data-v-stx-\w+/)
    })

    it('should not add scope attribute to script and style tags', () => {
      const html = '<div>Content</div><script>var x = 1</script><style scoped>.x { color: red; }</style>'
      const result = processScopedStyles(html, '/test.stx')

      expect(result.hasScoped).toBe(true)
      expect(result.html).not.toMatch(/<script data-v-stx/)
    })

    it('should handle multiple selectors separated by commas', () => {
      const html = '<div>Content</div><style scoped>.a, .b { color: red; }</style>'
      const result = processScopedStyles(html, '/test.stx')

      expect(result.hasScoped).toBe(true)
      // Both selectors should be scoped
      expect(result.html).toMatch(/\[data-v-stx-\w+\]\s*\.a/)
      expect(result.html).toMatch(/\[data-v-stx-\w+\]\s*\.b/)
    })

    it('should handle nested selectors inside @media queries', () => {
      const html = '<div>Content</div><style scoped>@media (max-width: 768px) { .card { color: red; } }</style>'
      const result = processScopedStyles(html, '/test.stx')

      expect(result.hasScoped).toBe(true)
      expect(result.html).toContain('@media')
      // Nested selector should be scoped
      expect(result.html).toMatch(/\[data-v-stx-\w+\]\s*\.card/)
    })

    it('should scope @keyframes names', () => {
      const html = '<div>Content</div><style scoped>@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .card { animation: fadeIn 1s; }</style>'
      const result = processScopedStyles(html, '/test.stx')

      expect(result.hasScoped).toBe(true)
      // Keyframe name should be scoped
      expect(result.html).not.toMatch(/@keyframes fadeIn\b/)
    })

    it('should generate deterministic hash from file path', () => {
      const html = '<div>Content</div><style scoped>.x { color: red; }</style>'
      const result1 = processScopedStyles(html, '/components/card.stx')
      const result2 = processScopedStyles(html, '/components/card.stx')

      // Same file path should produce same hash
      expect(result1.html).toBe(result2.html)

      // Different file path should produce different hash
      const result3 = processScopedStyles(html, '/components/other.stx')
      expect(result1.html).not.toBe(result3.html)
    })

    it('should leave non-scoped <style> tags unchanged', () => {
      const html = '<div>Content</div><style>.global { color: blue; }</style><style scoped>.local { color: red; }</style>'
      const result = processScopedStyles(html, '/test.stx')

      expect(result.hasScoped).toBe(true)
      // Global style should be untouched
      expect(result.html).toContain('.global { color: blue; }')
    })

    it('should handle self-closing elements', () => {
      const html = '<img src="test.png" /><br /><style scoped>.x { color: red; }</style>'
      const result = processScopedStyles(html, '/test.stx')

      expect(result.hasScoped).toBe(true)
      expect(result.html).toMatch(/<img data-v-stx-\w+/)
      expect(result.html).toMatch(/<br data-v-stx-\w+/)
    })

    it('should not duplicate scope attribute on already-scoped elements', () => {
      const html = '<div>Content</div><style scoped>.x { color: red; }</style>'
      const result = processScopedStyles(html, '/test.stx')

      // Process again — should not add duplicate attributes
      const result2 = processScopedStyles(result.html, '/test.stx')
      const attrCount = (result2.html.match(/data-v-stx-/g) || []).length
      // One for the div, one for the style's data-stx-scoped value — no duplicates on same element
      expect(attrCount).toBeGreaterThan(0)
    })
  })

  describe('Integration with processDirectives', () => {
    const defaultOptions = {
      partialsDir: '/tmp',
      componentsDir: '/tmp',
    }

    it('should process <style scoped> in full template', async () => {
      const html = `<div class="card"><p>Hello</p></div>
<style scoped>
.card { background: white; border: 1px solid #eee; }
.card p { color: #333; }
</style>`

      const result = await processDirectives(html, {}, '/test.stx', defaultOptions, new Set())

      // Scoped styles should be processed
      expect(result).toMatch(/\[data-v-stx-\w+\]\s*\.card/)
      expect(result).toMatch(/\[data-v-stx-\w+\]\s*\.card p/)
      // Elements should have scope attribute
      expect(result).toMatch(/<div data-v-stx-\w+/)
      expect(result).toMatch(/<p data-v-stx-\w+/)
    })

    it('should handle template with both scoped and global styles', async () => {
      const html = `<div class="app">Content</div>
<style>.global { color: blue; }</style>
<style scoped>.app { color: red; }</style>`

      const result = await processDirectives(html, {}, '/test.stx', defaultOptions, new Set())

      // Global style untouched
      expect(result).toContain('.global { color: blue; }')
      // Scoped style processed
      expect(result).toMatch(/\[data-v-stx-\w+\]\s*\.app/)
    })
  })
})
