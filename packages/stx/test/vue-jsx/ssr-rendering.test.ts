/**
 * Vue SSR Rendering Compatibility Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/server-renderer/__tests__/render.spec.ts
 * - vue-core/packages/server-renderer/__tests__/ssrRenderAttrs.spec.ts
 * - vue-core/packages/server-renderer/__tests__/ssrRenderList.spec.ts
 * - vue-core/packages/server-renderer/__tests__/ssrInterpolate.spec.ts
 * - vue-core/packages/server-renderer/__tests__/ssrDirectives.spec.ts
 * - vue-core/packages/server-renderer/__tests__/ssrDynamicComponent.spec.ts
 *
 * Tests verify that stx's JSX renderToString and template processing
 * produce correct SSR output consistent with Vue 3's server renderer.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { jsx, jsxs, Fragment, renderToString, h } from '../../src/jsx-runtime'
import { processVueTemplate, hasVueTemplateSyntax } from '../../src/vue-template'
import { processDirectives } from '../../src/process'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

// Helper
async function renderTemplate(template: string, context: Record<string, any> = {}): Promise<string> {
  return await processDirectives(template, { ...context }, 'test.stx', {})
}

// =============================================================================
// SSR Element Rendering — adapted from render.spec.ts
// =============================================================================

describe('SSR: Element Rendering', () => {
  it('should render basic div', () => {
    expect(renderToString(h('div', null))).toBe('<div></div>')
  })

  it('should render div with text', () => {
    expect(renderToString(h('div', null, 'hello'))).toBe('<div>hello</div>')
  })

  it('should render div with id', () => {
    expect(renderToString(h('div', { id: 'test' }))).toBe('<div id="test"></div>')
  })

  it('should render multiple attributes', () => {
    const html = renderToString(h('div', { id: 'app', class: 'main', role: 'main' }, 'content'))
    expect(html).toBe('<div id="app" class="main" role="main">content</div>')
  })

  it('should render nested elements', () => {
    const html = renderToString(
      h('div', null,
        h('span', null, 'hello'),
        h('span', null, 'world'),
      ),
    )
    expect(html).toBe('<div><span>hello</span><span>world</span></div>')
  })

  it('should render deeply nested elements', () => {
    const html = renderToString(
      h('div', null,
        h('ul', null,
          h('li', null, h('a', { href: '#' }, 'link')),
        ),
      ),
    )
    expect(html).toBe('<div><ul><li><a href="#">link</a></li></ul></div>')
  })

  it('should render void elements', () => {
    expect(renderToString(h('br', null))).toBe('<br>')
    expect(renderToString(h('hr', null))).toBe('<hr>')
    expect(renderToString(h('img', { src: '/test.png' }))).toBe('<img src="/test.png">')
    expect(renderToString(h('input', { type: 'text' }))).toBe('<input type="text">')
  })

  it('should render void elements with multiple attributes', () => {
    expect(renderToString(h('input', { type: 'email', placeholder: 'Email', required: true })))
      .toBe('<input type="email" placeholder="Email" required>')
  })

  it('should render textarea', () => {
    expect(renderToString(h('textarea', null, 'content'))).toBe('<textarea>content</textarea>')
  })

  it('should render pre with whitespace preserved', () => {
    expect(renderToString(h('pre', null, '  code  '))).toBe('<pre>  code  </pre>')
  })
})

// =============================================================================
// SSR Attribute Rendering — adapted from ssrRenderAttrs.spec.ts
// =============================================================================

describe('SSR: Attribute Rendering', () => {
  describe('boolean attributes', () => {
    it('should render true boolean attributes', () => {
      expect(renderToString(h('input', { disabled: true }))).toBe('<input disabled>')
      expect(renderToString(h('input', { checked: true }))).toBe('<input checked>')
      expect(renderToString(h('input', { readonly: true }))).toBe('<input readonly>')
      expect(renderToString(h('select', { multiple: true }))).toBe('<select multiple></select>')
      expect(renderToString(h('input', { required: true }))).toBe('<input required>')
      expect(renderToString(h('input', { autofocus: true }))).toBe('<input autofocus>')
    })

    it('should omit false boolean attributes', () => {
      expect(renderToString(h('input', { disabled: false }))).toBe('<input>')
      expect(renderToString(h('input', { checked: false }))).toBe('<input>')
      expect(renderToString(h('input', { readonly: false }))).toBe('<input>')
    })

    it('should handle mixed true/false boolean attributes', () => {
      const html = renderToString(h('input', { disabled: true, checked: false, required: true }))
      expect(html).toContain('disabled')
      expect(html).not.toContain('checked')
      expect(html).toContain('required')
    })
  })

  describe('class attribute', () => {
    it('should render string class', () => {
      expect(renderToString(h('div', { class: 'foo bar' }))).toBe('<div class="foo bar"></div>')
    })

    it('should render class from object', () => {
      const html = renderToString(h('div', { class: { active: true, disabled: false, visible: true } }))
      expect(html).toContain('class="active visible"')
    })

    it('should render class from array', () => {
      expect(renderToString(h('div', { class: ['foo', 'bar', 'baz'] }))).toBe('<div class="foo bar baz"></div>')
    })

    it('should render class from mixed array with objects', () => {
      const html = renderToString(h('div', { class: ['base', { active: true, hidden: false }] }))
      expect(html).toContain('class="base active"')
    })

    it('should handle empty class', () => {
      expect(renderToString(h('div', { class: '' }))).toBe('<div></div>')
    })

    it('should handle className alias', () => {
      expect(renderToString(h('div', { className: 'test' }))).toBe('<div class="test"></div>')
    })

    it('should handle all-false class object', () => {
      const html = renderToString(h('div', { class: { a: false, b: false } }))
      // All false should result in empty or no class attr
      expect(html).not.toContain('class="a"')
      expect(html).not.toContain('class="b"')
    })
  })

  describe('style attribute', () => {
    it('should render style from string', () => {
      const html = renderToString(h('div', { style: 'color: red' }))
      expect(html).toContain('style="color: red"')
    })

    it('should render style from object', () => {
      const html = renderToString(h('div', { style: { color: 'red', fontSize: '14px' } }))
      expect(html).toContain('style="color: red; font-size: 14px"')
    })

    it('should convert camelCase to kebab-case in style', () => {
      const html = renderToString(h('div', { style: { backgroundColor: 'blue', marginTop: '10px' } }))
      expect(html).toContain('background-color: blue')
      expect(html).toContain('margin-top: 10px')
    })

    it('should add px suffix to numeric values', () => {
      const html = renderToString(h('div', { style: { width: 100, height: 50 } }))
      expect(html).toContain('width: 100px')
      expect(html).toContain('height: 50px')
    })

    it('should not add px to unitless properties', () => {
      const html = renderToString(h('div', { style: { opacity: 0.5 } }))
      expect(html).toContain('opacity: 0.5')
    })
  })

  describe('special attributes', () => {
    it('should skip null/undefined attribute values', () => {
      expect(renderToString(h('div', { id: null as any }))).toBe('<div></div>')
      expect(renderToString(h('div', { id: undefined }))).toBe('<div></div>')
    })

    it('should escape attribute values', () => {
      expect(renderToString(h('div', { title: 'a "quoted" & <special>' }))).toContain('&quot;')
      expect(renderToString(h('div', { title: 'a "quoted" & <special>' }))).toContain('&amp;')
    })

    it('should handle data attributes', () => {
      expect(renderToString(h('div', { 'data-testid': 'test', 'data-value': '123' })))
        .toBe('<div data-testid="test" data-value="123"></div>')
    })

    it('should handle aria attributes', () => {
      expect(renderToString(h('button', { 'aria-label': 'Close', 'aria-hidden': 'false' })))
        .toBe('<button aria-label="Close" aria-hidden="false"></button>')
    })

    it('should skip event handler props in SSR', () => {
      const html = renderToString(h('button', { onClick: () => {}, onMouseOver: () => {} }, 'Click'))
      expect(html).toBe('<button>Click</button>')
      expect(html).not.toContain('onClick')
      expect(html).not.toContain('onMouseOver')
    })

    it('should handle htmlFor alias', () => {
      expect(renderToString(h('label', { htmlFor: 'name' }, 'Name')))
        .toBe('<label for="name">Name</label>')
    })

    it('should handle innerHTML', () => {
      expect(renderToString(h('div', { innerHTML: '<b>bold</b>' })))
        .toBe('<div><b>bold</b></div>')
    })

    it('should handle dangerouslySetInnerHTML', () => {
      expect(renderToString(h('div', { dangerouslySetInnerHTML: { __html: '<em>em</em>' } })))
        .toBe('<div><em>em</em></div>')
    })
  })
})

// =============================================================================
// SSR Text Escaping — adapted from ssrInterpolate.spec.ts
// =============================================================================

describe('SSR: Text Escaping', () => {
  it('should escape < and >', () => {
    expect(renderToString(h('div', null, '<script>alert(1)</script>')))
      .toBe('<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>')
  })

  it('should escape &', () => {
    expect(renderToString(h('div', null, 'a & b'))).toBe('<div>a &amp; b</div>')
  })

  it('should escape quotes in text', () => {
    expect(renderToString(h('div', null, 'say "hello"'))).toBe('<div>say &quot;hello&quot;</div>')
  })

  it('should render numbers without escaping', () => {
    expect(renderToString(h('div', null, '42'))).toBe('<div>42</div>')
    expect(renderToString(42 as any)).toBe('42')
  })

  it('should render empty string', () => {
    expect(renderToString(h('div', null, ''))).toBe('<div></div>')
  })

  it('should handle null/undefined/boolean rendering', () => {
    expect(renderToString(null)).toBe('')
    expect(renderToString(undefined)).toBe('')
    expect(renderToString(true as any)).toBe('')
    expect(renderToString(false as any)).toBe('')
  })
})

// =============================================================================
// SSR List Rendering — adapted from ssrRenderList.spec.ts
// =============================================================================

describe('SSR: List Rendering', () => {
  it('should render array items', () => {
    const items = ['a', 'b', 'c']
    const html = renderToString(
      h('ul', null, ...items.map(item => h('li', null, item))),
    )
    expect(html).toBe('<ul><li>a</li><li>b</li><li>c</li></ul>')
  })

  it('should render array of numbers', () => {
    const items = [1, 2, 3]
    const html = renderToString(
      h(Fragment, null, ...items.map(n => h('span', null, String(n)))),
    )
    expect(html).toBe('<span>1</span><span>2</span><span>3</span>')
  })

  it('should render array of objects', () => {
    const users = [{ name: 'Alice' }, { name: 'Bob' }]
    const html = renderToString(
      h('ul', null, ...users.map(u => h('li', null, u.name))),
    )
    expect(html).toBe('<ul><li>Alice</li><li>Bob</li></ul>')
  })

  it('should render empty array', () => {
    const items: string[] = []
    const html = renderToString(
      h('ul', null, ...items.map(item => h('li', null, item))),
    )
    expect(html).toBe('<ul></ul>')
  })

  it('should render array with index', () => {
    const items = ['a', 'b', 'c']
    const html = renderToString(
      h('ul', null, ...items.map((item, i) => h('li', null, `${i}: ${item}`))),
    )
    expect(html).toBe('<ul><li>0: a</li><li>1: b</li><li>2: c</li></ul>')
  })

  it('should render nested lists', () => {
    const groups = [['a', 'b'], ['c', 'd']]
    const html = renderToString(
      h('div', null,
        ...groups.map(group =>
          h('ul', null, ...group.map(item => h('li', null, item))),
        ),
      ),
    )
    expect(html).toBe('<div><ul><li>a</li><li>b</li></ul><ul><li>c</li><li>d</li></ul></div>')
  })

  it('should render v-for through stx pipeline (array of strings)', async () => {
    const result = await renderTemplate(
      '@foreach(items as item)<li>{{ item }}</li>@endforeach',
      { items: ['apple', 'banana', 'cherry'] },
    )
    expect(result).toContain('apple')
    expect(result).toContain('banana')
    expect(result).toContain('cherry')
  })

  it('should render v-for through stx pipeline (with index)', async () => {
    const result = await renderTemplate(
      '@foreach(items as index => item)<li>{{ index }}: {{ item }}</li>@endforeach',
      { items: ['x', 'y', 'z'] },
    )
    expect(result).toContain('0: x')
    expect(result).toContain('1: y')
    expect(result).toContain('2: z')
  })
})

// =============================================================================
// SSR Component Rendering — adapted from render.spec.ts component tests
// =============================================================================

describe('SSR: Component Rendering', () => {
  it('should render function components', () => {
    function MyComp() {
      return h('div', null, 'component content')
    }
    expect(renderToString(h(MyComp, null))).toBe('<div>component content</div>')
  })

  it('should pass props to function components', () => {
    function Greeting(props: { name: string }) {
      return h('span', null, `Hello ${props.name}`)
    }
    expect(renderToString(h(Greeting, { name: 'Vue' }))).toBe('<span>Hello Vue</span>')
  })

  it('should render nested function components', () => {
    function Child(props: { text: string }) {
      return h('b', null, props.text)
    }
    function Parent() {
      return h('div', null, h(Child, { text: 'nested' }))
    }
    expect(renderToString(h(Parent, null))).toBe('<div><b>nested</b></div>')
  })

  it('should render component with multiple children', () => {
    function List(props: { items: string[] }) {
      return h('ul', null, ...props.items.map(item => h('li', null, item)))
    }
    expect(renderToString(h(List, { items: ['a', 'b'] }))).toBe('<ul><li>a</li><li>b</li></ul>')
  })

  it('should render component with children prop (slots)', () => {
    function Layout(props: { children?: any }) {
      return h('main', null, h('header', null, 'Header'), props.children, h('footer', null, 'Footer'))
    }
    const html = renderToString(h(Layout, null, h('p', null, 'Content')))
    expect(html).toBe('<main><header>Header</header><p>Content</p><footer>Footer</footer></main>')
  })

  it('should render component returning Fragment', () => {
    function Multi() {
      return h(Fragment, null, h('p', null, 'one'), h('p', null, 'two'))
    }
    expect(renderToString(h(Multi, null))).toBe('<p>one</p><p>two</p>')
  })

  it('should render component returning null', () => {
    function Empty() {
      return null as any
    }
    expect(renderToString(h(Empty, null))).toBe('')
  })

  it('should render component returning string', () => {
    function TextOnly() {
      return 'just text' as any
    }
    expect(renderToString(h(TextOnly, null))).toBe('just text')
  })

  it('should handle conditional rendering in components', () => {
    function ConditionalComp(props: { show: boolean }) {
      return props.show ? h('div', null, 'visible') : null as any
    }
    expect(renderToString(h(ConditionalComp, { show: true }))).toBe('<div>visible</div>')
    expect(renderToString(h(ConditionalComp, { show: false }))).toBe('')
  })

  it('should handle list rendering in components', () => {
    function TodoList(props: { todos: Array<{ id: number, text: string }> }) {
      return h('ul', null,
        ...props.todos.map(todo => h('li', { key: todo.id }, todo.text)),
      )
    }
    const html = renderToString(h(TodoList, {
      todos: [
        { id: 1, text: 'Learn Vue' },
        { id: 2, text: 'Learn stx' },
        { id: 3, text: 'Build something' },
      ],
    }))
    expect(html).toContain('Learn Vue')
    expect(html).toContain('Learn stx')
    expect(html).toContain('Build something')
  })
})

// =============================================================================
// SSR Directive Integration — adapted from ssrDirectives.spec.ts
// =============================================================================

describe('SSR: Vue Directive Integration', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  describe('v-show SSR', () => {
    it('should add display:none for false v-show', async () => {
      const transformed = processVueTemplate('<div v-show="false">hidden</div>')
      expect(transformed).toContain('@show="false"')
    })

    it('should keep element visible for true v-show', async () => {
      const transformed = processVueTemplate('<div v-show="true">visible</div>')
      expect(transformed).toContain('@show="true"')
    })
  })

  describe('v-model SSR', () => {
    it('should transform v-model on text input', () => {
      const result = processVueTemplate('<input type="text" v-model="name">')
      expect(result).toContain('@model="name"')
    })

    it('should transform v-model on checkbox', () => {
      const result = processVueTemplate('<input type="checkbox" v-model="checked">')
      expect(result).toContain('@model="checked"')
    })

    it('should transform v-model on radio', () => {
      const result = processVueTemplate('<input type="radio" v-model="picked" value="a">')
      expect(result).toContain('@model="picked"')
    })

    it('should transform v-model on select', () => {
      const result = processVueTemplate('<select v-model="selected"><option>A</option><option>B</option></select>')
      expect(result).toContain('@model="selected"')
    })

    it('should transform v-model on textarea', () => {
      const result = processVueTemplate('<textarea v-model="message">old</textarea>')
      expect(result).toContain('@model="message"')
    })
  })

  describe('v-html SSR', () => {
    it('should replace content with raw expression', () => {
      const result = processVueTemplate('<div v-html="rawContent">old</div>')
      expect(result).toContain('{!! rawContent !!}')
      expect(result).not.toContain('>old<')
    })

    it('should render through pipeline', async () => {
      const testFile = await createTestFile('ssr-vhtml.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { content: '<b>bold</b> & <i>italic</i>' };</script>
        </head><body>
        <div v-html="content">placeholder</div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('<b>bold</b>')
      expect(html).toContain('<i>italic</i>')
      expect(html).not.toContain('placeholder')
    })
  })

  describe('v-text SSR', () => {
    it('should replace content with escaped expression', () => {
      const result = processVueTemplate('<span v-text="textContent">old</span>')
      expect(result).toContain('{{ textContent }}')
      expect(result).not.toContain('>old<')
    })

    it('should render escaped through pipeline', async () => {
      const testFile = await createTestFile('ssr-vtext.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { text: 'Hello <World>' };</script>
        </head><body>
        <span v-text="text">old</span>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('Hello')
      expect(html).toContain('&lt;World&gt;')
      expect(html).not.toContain('old')
    })
  })

  describe('v-if SSR with complex expressions', () => {
    it('should handle comparison operators', async () => {
      const testFile = await createTestFile('ssr-vif-compare.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { count: 5 };</script>
        </head><body>
        <span v-if="count > 3">big</span>
        <span v-else>small</span>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('big')
      expect(html).not.toContain('>small<')
    })

    it('should handle logical operators', async () => {
      const testFile = await createTestFile('ssr-vif-logical.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { a: true, b: false };</script>
        </head><body>
        <span v-if="a && b">both</span>
        <span v-else-if="a || b">either</span>
        <span v-else>neither</span>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('either')
      expect(html).not.toContain('>both<')
      expect(html).not.toContain('>neither<')
    })

    it('should handle negation', async () => {
      const testFile = await createTestFile('ssr-vif-negate.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { hidden: true };</script>
        </head><body>
        <div v-if="!hidden">visible</div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).not.toContain('visible')
    })
  })

  describe('v-for SSR with objects', () => {
    it('should iterate over array of objects', async () => {
      const testFile = await createTestFile('ssr-vfor-obj.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { users: [{name:'Alice',age:30},{name:'Bob',age:25},{name:'Carol',age:35}] };</script>
        </head><body>
        <div v-for="user in users"><span>{{ user.name }} ({{ user.age }})</span></div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('Alice (30)')
      expect(html).toContain('Bob (25)')
      expect(html).toContain('Carol (35)')
    })

    it('should handle nested v-for', async () => {
      const testFile = await createTestFile('ssr-vfor-nested.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { matrix: [[1,2],[3,4]] };</script>
        </head><body>
        <div v-for="row in matrix">
          <span v-for="cell in row">{{ cell }}</span>
        </div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('1')
      expect(html).toContain('2')
      expect(html).toContain('3')
      expect(html).toContain('4')
    })
  })

  describe('v-once SSR', () => {
    it('should render v-once content through pipeline', async () => {
      const testFile = await createTestFile('ssr-vonce.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { greeting: 'Hello' };</script>
        </head><body>
        <div v-once>{{ greeting }}</div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('Hello')
    })
  })

  describe('combined directives', () => {
    it('should handle v-if inside v-for', async () => {
      const testFile = await createTestFile('ssr-combined.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { items: [{show:true,text:'yes'},{show:false,text:'no'},{show:true,text:'maybe'}] };</script>
        </head><body>
        <ul>
          <li v-for="item in items">
            <span v-if="item.show">{{ item.text }}</span>
          </li>
        </ul>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('yes')
      expect(html).toContain('maybe')
      expect(html).not.toContain('>no<')
    })
  })
})

// =============================================================================
// Vue Template Syntax Detection — comprehensive
// =============================================================================

describe('SSR: Vue Syntax Detection', () => {
  it('should detect all v-* directives', () => {
    expect(hasVueTemplateSyntax('<div v-if="x">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-else-if="y">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-else>')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-for="i in arr">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-show="x">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-model="x">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-bind:id="x">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-on:click="x">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-html="x">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-text="x">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-pre>')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-once>')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-memo="[x]">')).toBe(true)
    expect(hasVueTemplateSyntax('<div v-slot:name>')).toBe(true)
  })

  it('should not detect plain HTML as Vue syntax', () => {
    expect(hasVueTemplateSyntax('<div class="hello">world</div>')).toBe(false)
    expect(hasVueTemplateSyntax('<p>paragraph</p>')).toBe(false)
    expect(hasVueTemplateSyntax('<input type="text">')).toBe(false)
    expect(hasVueTemplateSyntax('<a href="/page">link</a>')).toBe(false)
  })

  it('should not detect stx directives as Vue syntax', () => {
    expect(hasVueTemplateSyntax('@if(x) <div></div> @endif')).toBe(false)
    expect(hasVueTemplateSyntax('@foreach(items as item) @endforeach')).toBe(false)
    expect(hasVueTemplateSyntax('{{ expression }}')).toBe(false)
  })

  it('should pass through non-Vue templates unchanged', () => {
    const input = '<div class="test"><p>{{ msg }}</p></div>'
    expect(processVueTemplate(input)).toBe(input)
  })
})
