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

// A binding is a `{{ … $store … }}` in an attribute. A page's client scripts
// carry `{{` and `$name.` too, and the pass ran its attribute pattern over
// every tag of HQ's 400 KB home page on every render, a fifth of the render.
describe('pages without an attribute binding', () => {
  it('leaves a page untouched when its expressions are not in attributes', () => {
    const html = `<main class="a"><p>{{ text }}</p></main><script>const s = $cart.items; const t = '{{ x }}'</script>`
    const result = processReactiveBindings(html)
    expect(result.html).toBe(html)
    expect(result.bindings).toEqual([])
  })

  it('still binds the attribute that has one, beside tags that do not', () => {
    const html = `<main class="a"><p class="b">text</p><span title="{{ $cart.count }}">x</span></main>`
    const result = processReactiveBindings(html)
    expect(result.bindings).toHaveLength(1)
    expect(result.bindings[0]).toMatchObject({ attribute: 'title', expression: '$cart.count' })
    expect([...result.stores]).toEqual(['cart'])
  })
})
