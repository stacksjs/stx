import { describe, expect, it } from 'bun:test'
import { interpolateScriptAttributes, processExpressions } from '../../src/expressions'

describe('context-aware escaped interpolation (#2079)', () => {
  it('keeps spaces and equals signs inside an unquoted attribute value', () => {
    const output = processExpressions(
      '<div class={{ value }}>x</div>',
      { value: 'a onmouseover=alert(1)' },
      'page.stx',
    )

    expect(output).toBe('<div class=a&#32;onmouseover&#61;alert(1)>x</div>')
    expect(output).not.toContain(' onmouseover=')
  })

  it('protects unquoted URL attributes without changing safe URLs', () => {
    const output = processExpressions(
      '<a href={{ value }}>x</a>',
      { value: 'https://ok.example/ onmouseover=alert(1)' },
      'page.stx',
    )
    expect(output).toContain('href=https://ok.example/&#32;onmouseover&#61;alert(1)')
    expect(output).not.toContain(' onmouseover=')
  })

  it('applies the URL scheme guard to unquoted attributes', () => {
    expect(processExpressions(
      '<a href={{ value }}>x</a>',
      { value: 'javascript:alert(1)' },
      'page.stx',
    )).toContain('href=unsafe:javascript:alert(1)')
  })

  it('refuses interpolation into native event-handler attributes', () => {
    expect(() => processExpressions(
      '<div onclick="{{ handler }}">x</div>',
      { handler: 'alert(1)' },
      'page.stx',
    )).toThrow('Unsafe interpolation in onclick')
  })

  it('refuses native handlers in script tag attributes too', () => {
    expect(() => interpolateScriptAttributes(
      ' onload="{{ handler }}"',
      { handler: 'alert(1)' },
    )).toThrow('Unsafe interpolation in onload')
  })

  it('does not confuse stx @event bindings with native on* handlers', () => {
    expect(processExpressions(
      '<button @click="choose(\'{{ id }}\')">x</button>',
      { id: 'row-1' },
      'page.stx',
    )).toContain('@click="choose(\'row-1\')"')
  })

  it('double-escapes srcdoc so the inner document receives inert text', () => {
    const output = processExpressions(
      '<iframe srcdoc="{{ source }}"></iframe>',
      { source: '<script>alert(1)</script>' },
      'page.stx',
    )
    expect(output).toContain('srcdoc="&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;"')
    expect(output).not.toContain('srcdoc="&lt;script')
  })

  it('allows ordinary style values but rejects network-capable CSS', () => {
    expect(processExpressions(
      '<div style="width: {{ width }}px"></div>',
      { width: 42 },
      'page.stx',
    )).toContain('style="width: 42px"')

    expect(processExpressions(
      '<div style="{{ style }}"></div>',
      { style: 'background:url("/preview.png")' },
      'page.stx',
    )).toContain('background:url(&quot;/preview.png&quot;)')

    expect(() => processExpressions(
      '<div style="{{ style }}"></div>',
      { style: 'background:url(https://attacker.example/collect)' },
      'page.stx',
    )).toThrow('Unsafe interpolation in style')
  })

  it('refuses interpolation into tag structure or an attribute name', () => {
    expect(() => processExpressions(
      '<div {{ attributes }}>x</div>',
      { attributes: 'id=x onmouseover=alert(1)' },
      'page.stx',
    )).toThrow('Unsafe interpolation in tag structure')

    expect(() => processExpressions(
      '<div {{ attribute }}="x">x</div>',
      { attribute: 'onclick' },
      'page.stx',
    )).toThrow('Unsafe interpolation in tag structure')
  })

  it('preserves conditional boolean attributes without allowing assignments', () => {
    expect(processExpressions(
      '<option {{ selected ? "selected" : "" }}>x</option>',
      { selected: true },
      'page.stx',
    )).toBe('<option selected>x</option>')
  })

  it('preserves validated dynamic tag names used by polymorphic components', () => {
    expect(processExpressions(
      '<{{ tag }}>x</{{ tag }}>',
      { tag: 'a' },
      'page.stx',
    )).toBe('<a>x</a>')

    expect(() => processExpressions(
      '<{{ tag }}>x</{{ tag }}>',
      { tag: 'div onmouseover=alert(1)' },
      'page.stx',
    )).toThrow('Unsafe interpolation in tag name')
  })

  it('leaves text and quoted attribute interpolation semantics intact', () => {
    expect(processExpressions(
      '<p title="{{ value }}">{{ value }}</p>',
      { value: 'a < b & c' },
      'page.stx',
    )).toBe('<p title="a &lt; b &amp; c">a &lt; b &amp; c</p>')
  })
})
