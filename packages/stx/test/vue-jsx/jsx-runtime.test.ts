import { describe, expect, it } from 'bun:test'
import { jsx, jsxs, Fragment, renderToString, h, Show, For } from '../../src/jsx-runtime'

describe('JSX Runtime - VNode Creation', () => {
  it('should create a simple element VNode', () => {
    const vnode = jsx('div', { class: 'hello' })
    expect(vnode.type).toBe('div')
    expect(vnode.props).toEqual({ class: 'hello' })
    expect(vnode.children).toEqual([])
  })

  it('should create a VNode with children', () => {
    const vnode = jsx('div', { children: 'Hello World' })
    expect(vnode.type).toBe('div')
    expect(vnode.children).toEqual(['Hello World'])
  })

  it('should create a VNode with multiple children via jsxs', () => {
    const vnode = jsxs('div', {
      children: [
        jsx('span', { children: 'A' }),
        jsx('span', { children: 'B' }),
      ],
    })
    expect(vnode.children).toHaveLength(2)
    expect(vnode.children[0]).toHaveProperty('type', 'span')
    expect(vnode.children[1]).toHaveProperty('type', 'span')
  })

  it('should handle null/undefined/boolean children', () => {
    const vnode = jsx('div', { children: [null, undefined, false, true, 'visible'] })
    // null, undefined, false, true should be filtered or empty strings
    const nonEmpty = vnode.children.filter(c => c !== '')
    expect(nonEmpty).toContain('visible')
  })

  it('should handle numeric children', () => {
    const vnode = jsx('span', { children: 42 })
    expect(vnode.children).toEqual(['42'])
  })

  it('should separate key and ref from props', () => {
    const vnode = jsx('div', { id: 'test', key: 'mykey', ref: 'myref' }, 'mykey')
    expect(vnode.key).toBe('mykey')
    expect(vnode.ref).toBe('myref')
    expect(vnode.props).toEqual({ id: 'test' })
  })

  it('should create a Fragment VNode', () => {
    const vnode = jsx(Fragment, { children: ['A', 'B'] })
    expect(vnode.type).toBe(Fragment)
    expect(vnode.children).toEqual(['A', 'B'])
  })
})

describe('JSX Runtime - renderToString', () => {
  it('should render a simple div', () => {
    const vnode = jsx('div', { class: 'test', children: 'Hello' })
    expect(renderToString(vnode)).toBe('<div class="test">Hello</div>')
  })

  it('should render nested elements', () => {
    const vnode = jsx('div', {
      children: jsx('span', { children: 'inner' }),
    })
    expect(renderToString(vnode)).toBe('<div><span>inner</span></div>')
  })

  it('should escape HTML in text content', () => {
    const vnode = jsx('div', { children: '<script>alert("xss")</script>' })
    expect(renderToString(vnode)).toBe('<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>')
  })

  it('should render void elements without closing tag', () => {
    const vnode = jsx('br', null)
    expect(renderToString(vnode)).toBe('<br>')
  })

  it('should render void elements with attributes', () => {
    const vnode = jsx('img', { src: '/img.png', alt: 'test' })
    expect(renderToString(vnode)).toBe('<img src="/img.png" alt="test">')
  })

  it('should render boolean attributes', () => {
    const vnode = jsx('input', { type: 'checkbox', checked: true, disabled: false })
    const html = renderToString(vnode)
    expect(html).toContain('checked')
    expect(html).not.toContain('disabled')
  })

  it('should render Fragment children without wrapper', () => {
    const vnode = jsx(Fragment, {
      children: [
        jsx('div', { children: 'A' }),
        jsx('div', { children: 'B' }),
      ],
    })
    expect(renderToString(vnode)).toBe('<div>A</div><div>B</div>')
  })

  it('should render function components', () => {
    function Greeting(props: { name: string }) {
      return jsx('h1', { children: `Hello, ${props.name}!` })
    }
    const vnode = jsx(Greeting, { name: 'World' })
    expect(renderToString(vnode)).toBe('<h1>Hello, World!</h1>')
  })

  it('should render nested function components', () => {
    function Inner(props: { text: string }) {
      return jsx('span', { children: props.text })
    }
    function Outer(props: { children?: any }) {
      return jsx('div', { class: 'outer', children: props.children })
    }
    const vnode = jsx(Outer, {
      children: jsx(Inner, { text: 'nested' }),
    })
    expect(renderToString(vnode)).toBe('<div class="outer"><span>nested</span></div>')
  })

  it('should handle innerHTML prop', () => {
    const vnode = jsx('div', { innerHTML: '<b>bold</b>' })
    expect(renderToString(vnode)).toBe('<div><b>bold</b></div>')
  })

  it('should handle dangerouslySetInnerHTML', () => {
    const vnode = jsx('div', { dangerouslySetInnerHTML: { __html: '<em>italic</em>' } })
    expect(renderToString(vnode)).toBe('<div><em>italic</em></div>')
  })

  it('should skip event handler attributes in SSR', () => {
    const vnode = jsx('button', { onClick: () => {}, children: 'Click' })
    const html = renderToString(vnode)
    expect(html).toBe('<button>Click</button>')
    expect(html).not.toContain('onClick')
  })

  it('should render style objects', () => {
    const vnode = jsx('div', { style: { color: 'red', fontSize: 16 }, children: 'styled' })
    const html = renderToString(vnode)
    expect(html).toContain('style="color: red; font-size: 16px"')
  })

  it('should render class objects', () => {
    const vnode = jsx('div', { class: { active: true, disabled: false }, children: 'classed' })
    const html = renderToString(vnode)
    expect(html).toContain('class="active"')
    expect(html).not.toContain('disabled')
  })

  it('should render class arrays', () => {
    const vnode = jsx('div', { class: ['foo', 'bar'], children: 'multi' })
    const html = renderToString(vnode)
    expect(html).toContain('class="foo bar"')
  })

  it('should handle null/undefined/boolean return from renderToString', () => {
    expect(renderToString(null)).toBe('')
    expect(renderToString(undefined)).toBe('')
    expect(renderToString(true as any)).toBe('')
    expect(renderToString(false as any)).toBe('')
  })

  it('should render numbers', () => {
    expect(renderToString(42 as any)).toBe('42')
  })

  it('should map className to class attribute', () => {
    const vnode = jsx('div', { className: 'test', children: 'hello' })
    expect(renderToString(vnode)).toBe('<div class="test">hello</div>')
  })

  it('should map htmlFor to for attribute', () => {
    const vnode = jsx('label', { htmlFor: 'input-id', children: 'Name' })
    expect(renderToString(vnode)).toBe('<label for="input-id">Name</label>')
  })
})

describe('JSX Runtime - h() function', () => {
  it('should create VNodes like jsx()', () => {
    const vnode = h('div', { class: 'test' }, 'Hello')
    expect(renderToString(vnode)).toBe('<div class="test">Hello</div>')
  })

  it('should handle multiple children arguments', () => {
    const vnode = h('div', null, h('span', null, 'A'), h('span', null, 'B'))
    expect(renderToString(vnode)).toBe('<div><span>A</span><span>B</span></div>')
  })

  it('should handle Fragment', () => {
    const vnode = h(Fragment, null, h('li', null, '1'), h('li', null, '2'))
    expect(renderToString(vnode)).toBe('<li>1</li><li>2</li>')
  })
})

describe('JSX Runtime - Utility Components', () => {
  it('Show should render children when condition is true', () => {
    const vnode = Show({ when: true, children: jsx('div', { children: 'visible' }) })
    expect(renderToString(vnode as any)).toContain('visible')
  })

  it('Show should render fallback when condition is false', () => {
    const vnode = Show({
      when: false,
      fallback: jsx('div', { children: 'fallback' }),
      children: jsx('div', { children: 'visible' }),
    })
    expect(renderToString(vnode as any)).toContain('fallback')
    expect(renderToString(vnode as any)).not.toContain('visible')
  })

  it('Show should render nothing when condition is false and no fallback', () => {
    const vnode = Show({ when: false, children: jsx('div', { children: 'visible' }) })
    expect(renderToString(vnode as any)).toBe('')
  })

  it('For should render items', () => {
    const items = ['apple', 'banana', 'cherry']
    const vnode = For({
      each: items,
      children: (item: string) => jsx('li', { children: item }),
    })
    const html = renderToString(vnode as any)
    expect(html).toContain('<li>apple</li>')
    expect(html).toContain('<li>banana</li>')
    expect(html).toContain('<li>cherry</li>')
  })

  it('For should render fallback for empty array', () => {
    const vnode = For({
      each: [],
      fallback: jsx('p', { children: 'No items' }),
      children: (item: string) => jsx('li', { children: item }),
    })
    expect(renderToString(vnode as any)).toContain('No items')
  })

  it('For should render nothing for null/undefined array with no fallback', () => {
    const vnode = For({
      each: null,
      children: (item: string) => jsx('li', { children: item }),
    })
    expect(renderToString(vnode as any)).toBe('')
  })
})
