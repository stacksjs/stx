/**
 * `stripDocumentWrapper` only strips things that actually ARE documents
 * (stacksjs/stx#1787).
 *
 * It decided with two regexes, and only one was anchored:
 *
 *   if (!/<!DOCTYPE\b/i.test(trimmed) && !/^<html[\s>]/i.test(trimmed))
 *
 * so the literal text `<!DOCTYPE` anywhere — inside a comment, a `<pre><code>`
 * sample, a JS string — made a fragment look like a full document and sent it
 * through wrapper-stripping. Easy to hit on any page that documents HTML.
 *
 * The `<html>` half was already anchored, which is what made the asymmetry read
 * as accidental rather than deliberate. Anchoring both is not quite enough
 * though: stx prepends `<script>` blocks (signals runtime, scoped setup, theme
 * guards) and layout comments ahead of real documents, so the leading run has
 * to be stepped over first.
 */
import { describe, expect, it } from 'bun:test'
import { stripDocumentWrapper } from '../../src/app-shell'

describe('stripDocumentWrapper — document detection', () => {
  describe('fragments that merely mention a doctype are left alone', () => {
    it('inside an HTML comment', () => {
      const frag = '<div class="docs">\n  <!-- every page starts with <!DOCTYPE html> -->\n  <p>hello</p>\n</div>'
      expect(stripDocumentWrapper(frag)).toBe(frag)
    })

    it('inside a code sample', () => {
      const frag = '<pre><code>&lt;!DOCTYPE html&gt;\n<!DOCTYPE html></code></pre>'
      expect(stripDocumentWrapper(frag)).toBe(frag)
    })

    it('inside a script string', () => {
      const frag = `<div><script>var tpl = '<!DOCTYPE html><html></html>'<\/script></div>`
      expect(stripDocumentWrapper(frag)).toBe(frag)
    })

    it('in visible prose', () => {
      const frag = '<p>Templates never write <!DOCTYPE>, <html>, <head>, or <body>.</p>'
      expect(stripDocumentWrapper(frag)).toBe(frag)
    })

    it('when the mention is the changelog entry itself', () => {
      const frag = '<li>Fixed: pages emitted a duplicate <!DOCTYPE html></li>'
      expect(stripDocumentWrapper(frag)).toBe(frag)
    })
  })

  describe('real documents are still stripped', () => {
    const doc = '<!DOCTYPE html>\n<html lang="en">\n<head><title>T</title></head>\n<body><main>Body</main></body>\n</html>'

    it('a plain document', () => {
      const out = stripDocumentWrapper(doc)
      expect(out).not.toContain('<!DOCTYPE')
      expect(out).not.toContain('<body')
      expect(out).toContain('<main>Body</main>')
    })

    it('a document behind a prepended scoped script', () => {
      // The signals runtime, setup functions and theme guards all render ahead
      // of the layout's markup. A hard `^` anchor would misread these as
      // fragments and ship the whole document as SPA fragment content.
      const out = stripDocumentWrapper(`<script data-stx-scoped>console.log(1)<\/script>\n${doc}`)
      expect(out).not.toContain('<!DOCTYPE')
      expect(out).toContain('<main>Body</main>')
    })

    it('a document behind a layout marker comment', () => {
      const out = stripDocumentWrapper(`<!-- stx-layout: layouts/app.stx -->\n${doc}`)
      expect(out).not.toContain('<!DOCTYPE')
      expect(out).toContain('<main>Body</main>')
    })

    it('a document with no doctype at all', () => {
      const out = stripDocumentWrapper('<html><body><main>Body</main></body></html>')
      expect(out).not.toContain('<body')
      expect(out).toContain('<main>Body</main>')
    })

    it('leading whitespace does not hide the doctype', () => {
      const out = stripDocumentWrapper(`\n\n  ${doc}`)
      expect(out).toContain('<main>Body</main>')
      expect(out).not.toContain('<!DOCTYPE')
    })
  })

  describe('malformed input degrades to "fragment"', () => {
    it('an unterminated comment', () => {
      const frag = '<!-- <!DOCTYPE html>'
      expect(stripDocumentWrapper(frag)).toBe(frag)
    })

    it('an unterminated script', () => {
      const frag = '<script>var a = "<!DOCTYPE html>"'
      expect(stripDocumentWrapper(frag)).toBe(frag)
    })

    it('an empty string', () => {
      expect(stripDocumentWrapper('')).toBe('')
    })
  })
})
