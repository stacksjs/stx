import { describe, expect, it } from 'bun:test'
import { processMemoDirective } from '../../src/misc-directives'

// =============================================================================
// @memo directive — both the attribute form and the Blade-style block form.
//
// Regression context: drivly's pages use `@memo([]) ... @endmemo` to wrap
// static marketing content. Previously only the attribute form was handled,
// so the block directive leaked into the DOM as literal `@memo([])` and
// `@endmemo` text — visible to users on every page.
// =============================================================================

describe('@memo directive', () => {
  describe('attribute form', () => {
    it('transforms @memo="[a, b]" to data-stx-memo="[a, b]"', () => {
      const result = processMemoDirective('<div @memo="[a, b]">content</div>')
      expect(result).toContain('data-stx-memo="[a, b]"')
      expect(result).not.toContain('@memo=')
    })

    it('preserves complex dependency expressions', () => {
      const result = processMemoDirective('<div @memo="[user.name, items.length]">content</div>')
      expect(result).toContain('data-stx-memo="[user.name, items.length]"')
    })

    it('works with empty deps array', () => {
      const result = processMemoDirective('<div @memo="[]">static</div>')
      expect(result).toContain('data-stx-memo="[]"')
    })
  })

  describe('block form (regression)', () => {
    it('strips @memo([]) / @endmemo and adds data-stx-memo to the inner element', () => {
      const input = `@memo([])\n<section class="py-16">\n  <h2>Marketing</h2>\n</section>\n@endmemo`
      const output = processMemoDirective(input)

      expect(output).not.toContain('@memo(')
      expect(output).not.toContain('@endmemo')
      expect(output).toContain('<section')
      expect(output).toContain('data-stx-memo="[]"')
      expect(output).toContain('<h2>Marketing</h2>')
    })

    it('preserves the deps expression from @memo(deps)', () => {
      const input = `@memo([user.id, count])\n<div class="card">cached by id+count</div>\n@endmemo`
      const output = processMemoDirective(input)

      expect(output).toContain('data-stx-memo="[user.id, count]"')
      expect(output).not.toContain('@memo(')
      expect(output).not.toContain('@endmemo')
    })

    it('handles parens inside the deps expression (balanced scanning)', () => {
      // Deps with function calls — the open-paren counter must balance.
      const input = `@memo([count(), fmt(price)])\n<p>memoized</p>\n@endmemo`
      const output = processMemoDirective(input)

      expect(output).toContain('data-stx-memo="[count(), fmt(price)]"')
      expect(output).toContain('<p data-stx-memo="[count(), fmt(price)]">memoized</p>')
    })

    it('wraps in <div> when contents do not start with a single element', () => {
      // Mixed text+element — we can't pick an existing root, so wrap.
      const input = `@memo([])\nHello <span>world</span>\n@endmemo`
      const output = processMemoDirective(input)

      expect(output).toContain('data-stx-memo="[]"')
      expect(output).toMatch(/<div data-stx-memo/)
      expect(output).toContain('Hello <span>world</span>')
    })

    it('leaves HTML comments before the element intact', () => {
      // The block often has a source comment explaining the memoization.
      // The comment is layout for the author; the attribute still lands on
      // the real element beneath it.
      const input = `@memo([])\n<!-- marketing section -->\n<section>body</section>\n@endmemo`
      const output = processMemoDirective(input)

      expect(output).toContain('<!-- marketing section -->')
      expect(output).toContain('<section data-stx-memo="[]">')
    })

    it('processes multiple block-memo regions independently', () => {
      const input = [
        `@memo([])`,
        `<section id="a">A</section>`,
        `@endmemo`,
        ``,
        `<p>between</p>`,
        ``,
        `@memo([n])`,
        `<section id="b">B</section>`,
        `@endmemo`,
      ].join('\n')
      const output = processMemoDirective(input)

      expect(output.match(/data-stx-memo=/g)?.length).toBe(2)
      expect(output).toContain('<section id="a" data-stx-memo="[]">A</section>')
      expect(output).toContain('<section id="b" data-stx-memo="[n]">B</section>')
      expect(output).toContain('<p>between</p>')
    })

    it('leaves a bare `@memo` word in prose untouched', () => {
      // Only `@memo(...)` with parens is treated as a directive — a passing
      // mention in text content (e.g. an explainer) must survive.
      const input = 'See the @memo documentation for details.'
      expect(processMemoDirective(input)).toBe(input)
    })

    it('leaves attribute-form alone when block-form is not present', () => {
      const input = '<div @memo="[count]">attr form</div>'
      const output = processMemoDirective(input)
      expect(output).toContain('data-stx-memo="[count]"')
      expect(output).not.toContain('@memo=')
    })
  })
})
