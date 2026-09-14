import { describe, expect, it } from 'bun:test'
import { processReactiveBindings } from '../src/reactive-bindings'

describe('processReactiveBindings fast path', () => {
  it('leaves ordinary markup unchanged', () => {
    const html = `<main>${'<div class="card">content</div>'.repeat(100)}</main>`
    const result = processReactiveBindings(html)

    expect(result).toEqual({ html, bindings: [], stores: new Set() })
  })

  it('leaves non-store interpolation unchanged', () => {
    const html = '<div title="{{ page.title }}">content</div>'
    const result = processReactiveBindings(html)

    expect(result).toEqual({ html, bindings: [], stores: new Set() })
  })

  it('preserves the existing whole-attribute store detection contract', () => {
    const html = '<div id="target" class="$foo.bar {{ $baz }}">content</div>'
    const result = processReactiveBindings(html)

    expect(result.html).toBe('<div id="target" class="">content</div>')
    expect(result.bindings).toEqual([{
      elementId: 'target',
      attribute: 'class',
      expression: '$baz',
      stores: [],
    }])
  })
})
