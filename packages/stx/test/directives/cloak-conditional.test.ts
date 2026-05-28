/**
 * Tests for the conditional-directive FOUC fix (stacksjs/stx#1736).
 *
 * Part A: the inline x-cloak <style> ships in the SSR <head> (parsed before
 *         first paint) rather than injected by the runtime (after paint).
 * Part B: x-cloak is auto-stamped on every element carrying a reactive
 *         conditional/visibility directive, so dev never opts in per element.
 */
import { describe, expect, it } from 'bun:test'
import { generateDocumentShell, injectCloakStyle } from '../../src/document-shell'
import { addCloakToConditionalDirectives } from '../../src/misc-directives'

describe('addCloakToConditionalDirectives — auto-stamp (#1736)', () => {
  it('stamps x-cloak on :if elements', () => {
    const out = addCloakToConditionalDirectives(`<div :if="ok()">A</div>`)
    expect(out).toContain('x-cloak')
    expect(out).toMatch(/<div :if="ok\(\)" x-cloak>/)
  })

  it('stamps x-cloak on every prefix/form of conditional + visibility directive', () => {
    const cases = [
      `<div :if="a">x</div>`,
      `<div :else-if="b">x</div>`,
      `<div :else>x</div>`,
      `<div :show="c">x</div>`,
      `<div x-if="a">x</div>`,
      `<div x-else-if="b">x</div>`,
      `<div x-else>x</div>`,
      `<div x-show="c">x</div>`,
      `<div @if="a">x</div>`,
      `<div @show="c">x</div>`,
    ]
    for (const c of cases)
      expect(addCloakToConditionalDirectives(c)).toContain('x-cloak')
  })

  it('does NOT confuse :else-if with :else (longer token wins)', () => {
    const out = addCloakToConditionalDirectives(`<div :else-if="b">x</div>`)
    // Single x-cloak, attribute intact.
    expect(out).toContain(':else-if="b"')
    expect((out.match(/x-cloak/g) || []).length).toBe(1)
  })

  it('does not double-stamp when x-cloak is already present', () => {
    const out = addCloakToConditionalDirectives(`<div :if="a" x-cloak>x</div>`)
    expect((out.match(/x-cloak/g) || []).length).toBe(1)
  })

  it('leaves non-conditional elements untouched', () => {
    const html = `<div class="card"><span>hi</span></div>`
    expect(addCloakToConditionalDirectives(html)).toBe(html)
  })

  it('handles self-closing tags', () => {
    const out = addCloakToConditionalDirectives(`<input :show="visible" />`)
    expect(out).toContain('x-cloak')
    // Still self-closing, attribute intact, x-cloak before the slash
    // (whitespace tolerant — the simple slicer may leave a harmless extra space).
    expect(out).toMatch(/<input :show="visible"\s+x-cloak\s*\/>/)
  })

  it('does not stamp inside <script> bodies (no #1730-style false positive)', () => {
    // `a < b` and a string containing `x-if=` inside a script must not trip
    // the scanner.
    const html = `<script>const f = (a, b) => { if (a < b) return '<b x-if="z">'; }</script>`
    const out = addCloakToConditionalDirectives(html)
    expect(out).toBe(html)
    expect(out).not.toContain('x-cloak')
  })

  it('does not stamp inside <style> bodies', () => {
    const html = `<style>.a{}/* x-if= */ .b > .c { color: red }</style>`
    expect(addCloakToConditionalDirectives(html)).toBe(html)
  })

  it('stamps conditional elements that sit AFTER a script block', () => {
    const html = `<script>let x = 1 < 2</script><div :if="ready()">R</div>`
    const out = addCloakToConditionalDirectives(html)
    // script untouched, the real :if element cloaked
    expect(out).toContain('<script>let x = 1 < 2</script>')
    expect(out).toMatch(/<div :if="ready\(\)" x-cloak>/)
  })

  it('preserves attribute values containing ">" (quoted)', () => {
    const out = addCloakToConditionalDirectives(`<div :if="a > 0" data-x="b">x</div>`)
    expect(out).toContain(':if="a > 0"')
    expect(out).toContain('x-cloak')
  })
})

describe('inline cloak <style> in SSR head (#1736)', () => {
  it('generateDocumentShell emits the cloak style in <head>', () => {
    const html = generateDocumentShell('<main>hi</main>', { title: 'T' })
    expect(html).toContain('data-stx-cloak')
    expect(html).toContain('[x-cloak]{display:none !important}')
    // It must be inside <head>, before </head>.
    const headOpen = html.indexOf('<head>')
    const headClose = html.indexOf('</head>')
    const cloakIdx = html.indexOf('data-stx-cloak')
    expect(cloakIdx).toBeGreaterThan(headOpen)
    expect(cloakIdx).toBeLessThan(headClose)
  })

  describe('injectCloakStyle', () => {
    it('inserts the cloak style before </head> for layout-supplied heads', () => {
      const html = `<!DOCTYPE html><html><head><title>x</title></head><body><div :if="a">x</div></body></html>`
      const out = injectCloakStyle(html)
      expect(out).toContain('data-stx-cloak')
      expect(out.indexOf('data-stx-cloak')).toBeLessThan(out.indexOf('</head>'))
    })

    it('is idempotent — does not double-inject', () => {
      const html = `<html><head><title>x</title></head><body></body></html>`
      const once = injectCloakStyle(html)
      const twice = injectCloakStyle(once)
      expect((twice.match(/data-stx-cloak/g) || []).length).toBe(1)
    })

    it('is a no-op when there is no </head>', () => {
      const html = `<div :if="a">x</div>`
      expect(injectCloakStyle(html)).toBe(html)
    })
  })
})
