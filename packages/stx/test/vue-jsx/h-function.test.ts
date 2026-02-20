/**
 * Vue h() Function and VNode Comprehensive Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/runtime-core/__tests__/h.spec.ts
 * - vue-core/packages/runtime-core/__tests__/vnode.spec.ts
 * - vue-core/packages/runtime-core/__tests__/helpers/renderList.spec.ts
 * - vue-core/packages/runtime-core/__tests__/helpers/renderSlot.spec.ts
 * - vue-core/packages/shared/__tests__/escapeHtml.spec.ts
 * - vue-core/packages/shared/__tests__/toDisplayString.spec.ts
 * - vue-core/packages/shared/__tests__/normalizeProp.spec.ts
 *
 * Tests the h() function, VNode creation, Fragment, and utility components.
 */

import { describe, expect, it } from 'bun:test'
import { jsx, jsxs, Fragment, renderToString, h, Show, For, Portal } from '../../src/jsx-runtime'
import type { VNode } from '../../src/jsx-runtime'

// =============================================================================
// h() Function — adapted from h.spec.ts
// =============================================================================

describe('h(): type only', () => {
  it('should create VNode with just type', () => {
    const vnode = h('div', null)
    expect(vnode.type).toBe('div')
    expect(vnode.props).toEqual({})
    expect(vnode.children).toEqual([])
  })

  it('should support all standard HTML elements', () => {
    const tags = ['div', 'span', 'p', 'a', 'ul', 'li', 'h1', 'h2', 'h3', 'button',
      'form', 'input', 'textarea', 'select', 'table', 'tr', 'td', 'th',
      'main', 'section', 'article', 'nav', 'header', 'footer', 'aside']

    for (const tag of tags) {
      const vnode = h(tag, null)
      expect(vnode.type).toBe(tag)
    }
  })
})

describe('h(): type + props', () => {
  it('should create VNode with props', () => {
    const vnode = h('div', { id: 'foo' })
    expect(vnode.type).toBe('div')
    expect(vnode.props).toEqual({ id: 'foo' })
  })

  it('should handle multiple props', () => {
    const vnode = h('div', { id: 'test', class: 'main', role: 'region' })
    expect(vnode.props).toEqual({ id: 'test', class: 'main', role: 'region' })
  })

  it('should handle null props', () => {
    const vnode = h('div', null)
    expect(vnode.props).toEqual({})
  })

  it('should handle empty props', () => {
    const vnode = h('div', {})
    expect(vnode.props).toEqual({})
  })
})

describe('h(): type + children', () => {
  it('should handle text children', () => {
    const vnode = h('div', null, 'hello')
    expect(vnode.children).toEqual(['hello'])
    expect(renderToString(vnode)).toBe('<div>hello</div>')
  })

  it('should handle number children', () => {
    const vnode = h('div', null, '42')
    expect(renderToString(vnode)).toBe('<div>42</div>')
  })

  it('should handle element children', () => {
    const child = h('span', null, 'inner')
    const vnode = h('div', null, child)
    expect(vnode.children).toHaveLength(1)
    expect(renderToString(vnode)).toBe('<div><span>inner</span></div>')
  })

  it('should handle multiple variadic children', () => {
    const vnode = h('div', null, h('span', null, 'a'), h('span', null, 'b'))
    expect(vnode.children).toHaveLength(2)
    expect(renderToString(vnode)).toBe('<div><span>a</span><span>b</span></div>')
  })
})

describe('h(): type + props + children', () => {
  it('should handle all three args', () => {
    const vnode = h('div', { class: 'container' }, 'content')
    expect(renderToString(vnode)).toBe('<div class="container">content</div>')
  })

  it('should handle props + element children', () => {
    const vnode = h('div', { id: 'parent' }, h('span', null, 'child'))
    expect(renderToString(vnode)).toBe('<div id="parent"><span>child</span></div>')
  })

  it('should handle props + multiple children', () => {
    const vnode = h('ul', { class: 'list' },
      h('li', null, 'one'),
      h('li', null, 'two'),
      h('li', null, 'three'),
    )
    expect(renderToString(vnode)).toBe('<ul class="list"><li>one</li><li>two</li><li>three</li></ul>')
  })
})

// =============================================================================
// Fragment — adapted from rendererFragment tests
// =============================================================================

describe('h(): Fragment', () => {
  it('should create Fragment VNode', () => {
    const vnode = h(Fragment, null, h('div', null, 'a'), h('div', null, 'b'))
    expect(vnode.type).toBe(Fragment)
  })

  it('should render Fragment without wrapper', () => {
    const html = renderToString(h(Fragment, null,
      h('li', null, '1'),
      h('li', null, '2'),
      h('li', null, '3'),
    ))
    expect(html).toBe('<li>1</li><li>2</li><li>3</li>')
  })

  it('should render nested Fragments', () => {
    const html = renderToString(h(Fragment, null,
      h(Fragment, null, h('span', null, 'a'), h('span', null, 'b')),
      h(Fragment, null, h('span', null, 'c')),
    ))
    expect(html).toBe('<span>a</span><span>b</span><span>c</span>')
  })

  it('should render Fragment with mixed content', () => {
    const html = renderToString(h(Fragment, null,
      'text',
      h('span', null, 'element'),
      'more text',
    ))
    expect(html).toBe('text<span>element</span>more text')
  })

  it('should render empty Fragment', () => {
    const html = renderToString(h(Fragment, null))
    expect(html).toBe('')
  })
})

// =============================================================================
// Function Components
// =============================================================================

describe('h(): Function Components', () => {
  it('should render basic function component', () => {
    function Comp() {
      return h('div', null, 'hello')
    }
    expect(renderToString(h(Comp, null))).toBe('<div>hello</div>')
  })

  it('should pass props to function component', () => {
    function Comp(props: { msg: string }) {
      return h('span', null, props.msg)
    }
    expect(renderToString(h(Comp, { msg: 'world' }))).toBe('<span>world</span>')
  })

  it('should pass children via props.children', () => {
    function Wrapper(props: { children?: any }) {
      return h('div', { class: 'wrapper' }, props.children)
    }
    expect(renderToString(h(Wrapper, null, h('p', null, 'content')))).toBe(
      '<div class="wrapper"><p>content</p></div>',
    )
  })

  it('should handle component returning Fragment', () => {
    function Multi() {
      return h(Fragment, null, h('a', null, '1'), h('a', null, '2'))
    }
    expect(renderToString(h(Multi, null))).toBe('<a>1</a><a>2</a>')
  })

  it('should handle component returning null', () => {
    function Empty() { return null as any }
    expect(renderToString(h(Empty, null))).toBe('')
  })

  it('should handle component returning string', () => {
    function TextComp() { return 'just text' as any }
    expect(renderToString(h(TextComp, null))).toBe('just text')
  })

  it('should handle component returning number', () => {
    function NumComp() { return 42 as any }
    expect(renderToString(h(NumComp, null))).toBe('42')
  })

  it('should handle nested component tree', () => {
    function GrandChild(props: { text: string }) {
      return h('b', null, props.text)
    }
    function Child(props: { text: string }) {
      return h('span', null, h(GrandChild, { text: props.text }))
    }
    function Parent() {
      return h('div', null, h(Child, { text: 'deep' }))
    }
    expect(renderToString(h(Parent, null))).toBe('<div><span><b>deep</b></span></div>')
  })

  it('should handle component with conditional rendering', () => {
    function Conditional(props: { show: boolean }) {
      return props.show ? h('div', null, 'visible') : h(Fragment, null)
    }
    expect(renderToString(h(Conditional, { show: true }))).toBe('<div>visible</div>')
    expect(renderToString(h(Conditional, { show: false }))).toBe('')
  })

  it('should handle component with list rendering', () => {
    function List(props: { items: string[] }) {
      return h('ul', null, ...props.items.map((item, i) =>
        h('li', { key: i }, item),
      ))
    }
    expect(renderToString(h(List, { items: ['a', 'b', 'c'] }))).toBe(
      '<ul><li>a</li><li>b</li><li>c</li></ul>',
    )
  })
})

// =============================================================================
// VNode Creation via jsx() — adapted from vnode.spec.ts
// =============================================================================

describe('jsx(): VNode Creation', () => {
  it('should create element VNode', () => {
    const vnode = jsx('div', { class: 'test' })
    expect(vnode.type).toBe('div')
    expect(vnode.props).toEqual({ class: 'test' })
    expect(vnode.children).toEqual([])
  })

  it('should create VNode with single child', () => {
    const vnode = jsx('div', { children: 'hello' })
    expect(vnode.children).toEqual(['hello'])
  })

  it('should create VNode with array children via jsxs', () => {
    const vnode = jsxs('div', {
      children: [
        jsx('span', { children: '1' }),
        jsx('span', { children: '2' }),
      ],
    })
    expect(vnode.children).toHaveLength(2)
  })

  it('should extract key from props', () => {
    const vnode = jsx('div', { key: 'mykey', id: 'test' }, 'mykey')
    expect(vnode.key).toBe('mykey')
    expect(vnode.props).not.toHaveProperty('key')
  })

  it('should extract ref from props', () => {
    const vnode = jsx('div', { ref: 'myref', id: 'test' })
    expect(vnode.ref).toBe('myref')
    expect(vnode.props).not.toHaveProperty('ref')
  })

  it('should handle null/undefined children', () => {
    const vnode = jsx('div', { children: [null, undefined, 'visible'] })
    const html = renderToString(vnode)
    expect(html).toContain('visible')
  })

  it('should convert boolean children to empty strings', () => {
    const vnode = jsx('div', { children: [true, false, 'text'] })
    const html = renderToString(vnode)
    expect(html).toContain('text')
    expect(html).not.toContain('true')
    expect(html).not.toContain('false')
  })

  it('should convert number children to strings', () => {
    const vnode = jsx('span', { children: 42 })
    expect(vnode.children).toEqual(['42'])
  })

  it('should handle Fragment via jsx', () => {
    const vnode = jsx(Fragment, { children: [jsx('a', { children: '1' }), jsx('a', { children: '2' })] })
    expect(vnode.type).toBe(Fragment)
    expect(renderToString(vnode)).toBe('<a>1</a><a>2</a>')
  })

  it('should handle function component via jsx', () => {
    function Greeting(props: { name: string }) {
      return jsx('h1', { children: `Hello ${props.name}` })
    }
    const vnode = jsx(Greeting, { name: 'stx' })
    expect(renderToString(vnode)).toBe('<h1>Hello stx</h1>')
  })
})

// =============================================================================
// renderToString: HTML Escaping — adapted from escapeHtml.spec.ts
// =============================================================================

describe('renderToString: HTML Escaping', () => {
  it('should escape <', () => {
    expect(renderToString(h('div', null, '<tag>'))).toContain('&lt;tag&gt;')
  })

  it('should escape >', () => {
    expect(renderToString(h('div', null, 'a > b'))).toContain('a &gt; b')
  })

  it('should escape &', () => {
    expect(renderToString(h('div', null, 'a & b'))).toContain('a &amp; b')
  })

  it('should escape "', () => {
    expect(renderToString(h('div', null, 'say "hello"'))).toContain('say &quot;hello&quot;')
  })

  it('should escape multiple special chars', () => {
    const html = renderToString(h('div', null, '<script>alert("xss")</script>'))
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('should not escape in innerHTML', () => {
    const html = renderToString(h('div', { innerHTML: '<b>bold</b>' }))
    expect(html).toBe('<div><b>bold</b></div>')
  })

  it('should escape attribute values', () => {
    const html = renderToString(h('div', { title: 'a "quoted" value' }))
    expect(html).toContain('title="a &quot;quoted&quot; value"')
  })

  it('should escape & in attribute values', () => {
    const html = renderToString(h('a', { href: '/search?a=1&b=2' }))
    expect(html).toContain('href="/search?a=1&amp;b=2"')
  })
})

// =============================================================================
// renderToString: Prop Normalization — adapted from normalizeProp.spec.ts
// =============================================================================

describe('renderToString: Prop Normalization', () => {
  describe('class normalization', () => {
    it('should handle string class', () => {
      expect(renderToString(h('div', { class: 'foo' }))).toContain('class="foo"')
    })

    it('should handle object class', () => {
      const html = renderToString(h('div', { class: { a: true, b: false, c: true } }))
      expect(html).toContain('class="a c"')
    })

    it('should handle array class', () => {
      expect(renderToString(h('div', { class: ['a', 'b', 'c'] }))).toContain('class="a b c"')
    })

    it('should handle mixed array with objects', () => {
      const html = renderToString(h('div', { class: ['base', { active: true, hidden: false }, 'extra'] }))
      expect(html).toContain('base')
      expect(html).toContain('active')
      expect(html).toContain('extra')
      expect(html).not.toContain('hidden')
    })

    it('should handle nested arrays', () => {
      const html = renderToString(h('div', { class: ['a', ['b', 'c']] }))
      expect(html).toContain('a')
      expect(html).toContain('b')
    })

    it('should filter falsy values from array', () => {
      const html = renderToString(h('div', { class: [null, undefined, false, 'valid'] as any }))
      expect(html).toContain('valid')
    })
  })

  describe('style normalization', () => {
    it('should handle string style', () => {
      expect(renderToString(h('div', { style: 'color: red' }))).toContain('style="color: red"')
    })

    it('should handle object style', () => {
      const html = renderToString(h('div', { style: { color: 'blue', fontSize: '14px' } }))
      expect(html).toContain('color: blue')
      expect(html).toContain('font-size: 14px')
    })

    it('should convert camelCase to kebab-case', () => {
      const html = renderToString(h('div', { style: {
        backgroundColor: 'red',
        borderTopWidth: '1px',
        marginLeft: '10px',
        paddingRight: '5px',
        zIndex: 10,
      } }))
      expect(html).toContain('background-color: red')
      expect(html).toContain('border-top-width: 1px')
      expect(html).toContain('margin-left: 10px')
      expect(html).toContain('padding-right: 5px')
    })

    it('should add px to numeric values (except unitless)', () => {
      const html = renderToString(h('div', { style: {
        width: 100,
        height: 50,
        opacity: 0.5,
        zIndex: 10,
        lineHeight: 1.5,
      } }))
      expect(html).toContain('width: 100px')
      expect(html).toContain('height: 50px')
      expect(html).toContain('opacity: 0.5')
    })
  })
})

// =============================================================================
// Show Utility Component
// =============================================================================

describe('Show Component', () => {
  it('should render children when truthy', () => {
    expect(renderToString(Show({ when: true, children: h('div', null, 'yes') }) as any)).toContain('yes')
  })

  it('should render nothing when falsy', () => {
    expect(renderToString(Show({ when: false, children: h('div', null, 'no') }) as any)).toBe('')
  })

  it('should render fallback when falsy', () => {
    const html = renderToString(Show({
      when: false,
      fallback: h('div', null, 'fallback'),
      children: h('div', null, 'main'),
    }) as any)
    expect(html).toContain('fallback')
    expect(html).not.toContain('main')
  })

  it('should treat 0 as falsy', () => {
    expect(renderToString(Show({ when: 0, children: h('div', null, 'x') }) as any)).toBe('')
  })

  it('should treat empty string as falsy', () => {
    expect(renderToString(Show({ when: '', children: h('div', null, 'x') }) as any)).toBe('')
  })

  it('should treat null as falsy', () => {
    expect(renderToString(Show({ when: null, children: h('div', null, 'x') }) as any)).toBe('')
  })

  it('should treat non-empty string as truthy', () => {
    expect(renderToString(Show({ when: 'yes', children: h('div', null, 'shown') }) as any)).toContain('shown')
  })

  it('should treat positive number as truthy', () => {
    expect(renderToString(Show({ when: 42, children: h('div', null, 'shown') }) as any)).toContain('shown')
  })

  it('should treat object as truthy', () => {
    expect(renderToString(Show({ when: {}, children: h('div', null, 'shown') }) as any)).toContain('shown')
  })

  it('should treat array as truthy', () => {
    expect(renderToString(Show({ when: [], children: h('div', null, 'shown') }) as any)).toContain('shown')
  })
})

// =============================================================================
// For Utility Component
// =============================================================================

describe('For Component', () => {
  it('should render items', () => {
    const html = renderToString(For({
      each: ['a', 'b', 'c'],
      children: (item: string) => h('span', null, item),
    }) as any)
    expect(html).toBe('<span>a</span><span>b</span><span>c</span>')
  })

  it('should provide index', () => {
    const html = renderToString(For({
      each: ['x', 'y'],
      children: (item: string, i: number) => h('span', null, `${i}:${item}`),
    }) as any)
    expect(html).toBe('<span>0:x</span><span>1:y</span>')
  })

  it('should render fallback for empty array', () => {
    const html = renderToString(For({
      each: [],
      fallback: h('p', null, 'empty'),
      children: (item: string) => h('span', null, item),
    }) as any)
    expect(html).toBe('<p>empty</p>')
  })

  it('should render fallback for null', () => {
    const html = renderToString(For({
      each: null,
      fallback: h('p', null, 'none'),
      children: (item: string) => h('span', null, item),
    }) as any)
    expect(html).toBe('<p>none</p>')
  })

  it('should render nothing for null with no fallback', () => {
    const html = renderToString(For({
      each: null,
      children: (item: string) => h('span', null, item),
    }) as any)
    expect(html).toBe('')
  })

  it('should handle objects in array', () => {
    const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
    const html = renderToString(For({
      each: users,
      children: (user: { id: number, name: string }) => h('div', { key: user.id }, user.name),
    }) as any)
    expect(html).toContain('Alice')
    expect(html).toContain('Bob')
  })

  it('should handle single item array', () => {
    const html = renderToString(For({
      each: ['only'],
      children: (item: string) => h('span', null, item),
    }) as any)
    expect(html).toBe('<span>only</span>')
  })

  it('should handle large arrays', () => {
    const items = Array.from({ length: 100 }, (_, i) => i)
    const html = renderToString(For({
      each: items,
      children: (n: number) => h('span', null, String(n)),
    }) as any)
    expect(html).toContain('<span>0</span>')
    expect(html).toContain('<span>99</span>')
  })
})

// =============================================================================
// Render List Helper (v-for equivalent in JSX)
// =============================================================================

describe('renderList (Array.map pattern)', () => {
  it('should render array of strings', () => {
    const items = ['a', 'b', 'c']
    const html = renderToString(h('ul', null, ...items.map(i => h('li', null, i))))
    expect(html).toBe('<ul><li>a</li><li>b</li><li>c</li></ul>')
  })

  it('should render array of numbers', () => {
    const items = [1, 2, 3]
    const html = renderToString(h('ol', null, ...items.map(n => h('li', null, String(n)))))
    expect(html).toBe('<ol><li>1</li><li>2</li><li>3</li></ol>')
  })

  it('should render range (number)', () => {
    const n = 5
    const items = Array.from({ length: n }, (_, i) => i + 1)
    const html = renderToString(h(Fragment, null, ...items.map(i => h('span', null, String(i)))))
    expect(html).toBe('<span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>')
  })

  it('should render object entries', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const html = renderToString(h('dl', null,
      ...Object.entries(obj).map(([key, val]) =>
        h(Fragment, null, h('dt', null, key), h('dd', null, String(val))),
      ),
    ))
    expect(html).toContain('<dt>a</dt><dd>1</dd>')
    expect(html).toContain('<dt>b</dt><dd>2</dd>')
    expect(html).toContain('<dt>c</dt><dd>3</dd>')
  })

  it('should handle empty array', () => {
    const items: string[] = []
    const html = renderToString(h('ul', null, ...items.map(i => h('li', null, i))))
    expect(html).toBe('<ul></ul>')
  })

  it('should handle nested arrays (matrix)', () => {
    const matrix = [[1, 2], [3, 4]]
    const html = renderToString(h('div', null,
      ...matrix.map(row =>
        h('div', { class: 'row' }, ...row.map(cell => h('span', null, String(cell)))),
      ),
    ))
    expect(html).toContain('<span>1</span>')
    expect(html).toContain('<span>4</span>')
  })
})
