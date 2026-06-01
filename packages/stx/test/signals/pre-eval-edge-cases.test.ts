import { describe, expect, it, mock } from 'bun:test'

mock.module('@stacksjs/ts-i18n', () => ({ loadLocale: async () => ({}) }))

const { preEvalLiteralReactiveIfs } = await import('../../src/signal-processing')

describe('preEvalLiteralReactiveIfs — potential edge cases', () => {
  it('should skip :if inside <script> with > in attribute value', () => {
    const html = '<script data-config="size>x">\nconst code = `<div :if="false">hidden</div>`\n</script>\n<div :if="false">should be dropped</div>'
    const result = preEvalLiteralReactiveIfs(html)
    expect(result).toContain('script')
    expect(result).toContain('const code')
    expect(result).not.toContain('<div :if="false">should be dropped</div>')
  })

  it('should skip :if inside <style> with > in selector', () => {
    const html = '<style>body > * { color: red; }</style>\n<div :if="false">should be dropped</div>'
    const result = preEvalLiteralReactiveIfs(html)
    expect(result).toContain('style')
    expect(result).toContain('body > *')
    expect(result).not.toContain(':if="false"')
  })

  it('should correctly find end of hyphenated custom element tags', () => {
    const html = '<my-custom-element :if="false">content here</my-custom-element><p>after</p>'
    const result = preEvalLiteralReactiveIfs(html)
    expect(result).toBe('<p>after</p>')
  })

  it('should handle tag names with multiple hyphens', () => {
    const html = '<x-my-very-custom-element :if="false">x</x-my-very-custom-element>after'
    const result = preEvalLiteralReactiveIfs(html)
    expect(result).toBe('after')
  })

  it('empty :if="" is an empty expression, not a decidable literal — deferred to the runtime', () => {
    // `''` is an empty condition (likely an author mistake), not one of the
    // pure literals we decide. Per "only decide pure literals", defer it.
    const html = '<div :if="">x</div><p>after</p>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('whitespace-only :if="   " is likewise an empty expression — deferred', () => {
    const html = '<div :if="   ">x</div><p>after</p>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('should handle negative numbers correctly', () => {
    const html = '<div :if="-1">truthy</div><div :if="-0">falsy</div>'
    const result = preEvalLiteralReactiveIfs(html)
    expect(result).toContain('<div>truthy</div>')
    expect(result).not.toContain(':if="-0"')
  })

  it('decimal numbers: 0.0 is falsy (dropped), 0.1 is truthy (attr stripped)', () => {
    const html = '<div :if="0.0">zero</div><div :if="0.1">nonzero</div>'
    // 0.0 -> falsy -> whole element dropped; 0.1 -> truthy -> attribute stripped.
    expect(preEvalLiteralReactiveIfs(html)).toBe('<div>nonzero</div>')
  })

  it('should not match uppercase attribute names', () => {
    const html = '<div :IF="false">x</div>'
    const result = preEvalLiteralReactiveIfs(html)
    expect(result).toBe(html)
  })

  it('should correctly handle </script> inside a string literal', () => {
    const html = '<script>\nconst x = "content</script>more";\ncode\n</script>\n<div :if="false">outside</div>'
    const result = preEvalLiteralReactiveIfs(html)
    expect(result).not.toContain(':if="false">')
  })

  it('does NOT drop :show when it heads an :else (show has no else partner)', () => {
    const html = '<div :show="false">A</div><div :else>B</div>'
    const result = preEvalLiteralReactiveIfs(html)
    // :show is exempt from chain guard, so :show="false" should be dropped
    // The orphaned :else stays as a plain element
    expect(result).not.toContain(':show="false"')
    expect(result).toContain(':else')
  })

  it('correctly identifies next sibling with :else-if prefix', () => {
    const html = '<div :if="1">A</div><div :else-if="x">B</div>'
    const result = preEvalLiteralReactiveIfs(html)
    // The truthy :if heads a chain, so it's deferred
    expect(result).toBe(html)
  })

  it('correctly identifies next sibling with @else prefix', () => {
    const html = '<div @if="1">A</div><div @else>B</div>'
    const result = preEvalLiteralReactiveIfs(html)
    // @if is in the :if family, so it's deferred
    expect(result).toBe(html)
  })

  it('correctly identifies next sibling with x-else prefix', () => {
    const html = '<div x-if="0">A</div><div x-else>B</div>'
    const result = preEvalLiteralReactiveIfs(html)
    // x-if heads a chain, deferred
    expect(result).toBe(html)
  })

  it('correctly distinguishes :else from unrelated attribute starting with :else', () => {
    const html = '<div :if="false">A</div><div :else-and-something="x">B</div>'
    const result = preEvalLiteralReactiveIfs(html)
    // :else-and-something doesn't match the regex /\s(?::else-if|x-else-if|@else-if|:else|x-else|@else)(?=[=\s/>])/
    // because it requires word boundary after :else, not :else-and-
    // So it should pre-eval the :if and drop it
    expect(result).not.toContain(':if="false">')
  })

  it('correctly tracks depth of nested div tags for non-void closing', () => {
    const html = '<div :if="false"><div class="inner"></div></div>after'
    const result = preEvalLiteralReactiveIfs(html)
    expect(result).toBe('after')
  })
})
