/**
 * Vue Compatibility Tests
 *
 * Adapted from vue-core test suite to verify stx's Vue drop-in replacement capabilities.
 * These tests verify that Vue template syntax produces correct output when processed
 * through the stx pipeline.
 *
 * Source references:
 * - vue-core/packages/server-renderer/__tests__/render.spec.ts
 * - vue-core/packages/server-renderer/__tests__/ssrDirectives.spec.ts
 * - vue-core/packages/server-renderer/__tests__/ssrInterpolate.spec.ts
 * - vue-core/packages/runtime-core/__tests__/apiInject.spec.ts
 * - vue-core/packages/runtime-core/__tests__/h.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vIf.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vFor.spec.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { processVueTemplate } from '../../src/vue-template'
import { processDirectives } from '../../src/process'
import { jsx, jsxs, Fragment, renderToString, h, Show, For } from '../../src/jsx-runtime'
import {
  provide, inject, nextTick, defineEmits, defineExpose,
  getCurrentInstance, createComponentInstance, setCurrentInstance,
  createProvideContext,
} from '../../src/composition-api'
import { createApp } from '../../src/app'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

// =============================================================================
// Helper: process a template string through stx pipeline
// =============================================================================
async function renderTemplate(template: string, context: Record<string, any> = {}): Promise<string> {
  return await processDirectives(template, { ...context }, 'test.stx', {})
}

// =============================================================================
// Vue SSR Render Equivalents (from render.spec.ts)
// =============================================================================

describe('Vue Compat: SSR Rendering', () => {
  describe('elements', () => {
    it('should render basic element with text', async () => {
      const result = await renderTemplate('<div>hello</div>')
      expect(result).toContain('<div>hello</div>')
    })

    it('should render nested elements', async () => {
      const result = await renderTemplate('<div><span>nested</span></div>')
      expect(result).toContain('<div><span>nested</span></div>')
    })

    it('should render void elements', async () => {
      const result = await renderTemplate('<input type="text">')
      expect(result).toContain('<input type="text">')
    })

    it('should render self-closing elements', async () => {
      const result = await renderTemplate('<br>')
      expect(result).toContain('<br>')
    })
  })

  describe('expressions {{ }}', () => {
    it('should interpolate string values', async () => {
      const result = await renderTemplate('{{ msg }}', { msg: 'hello' })
      expect(result).toContain('hello')
    })

    it('should interpolate number values', async () => {
      const result = await renderTemplate('{{ count }}', { count: 42 })
      expect(result).toContain('42')
    })

    it('should escape HTML in interpolations', async () => {
      const result = await renderTemplate('{{ html }}', { html: '<script>alert("xss")</script>' })
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('should evaluate expressions', async () => {
      const result = await renderTemplate('{{ a + b }}', { a: 1, b: 2 })
      expect(result).toContain('3')
    })

    it('should evaluate ternary expressions', async () => {
      const result = await renderTemplate('{{ ok ? "yes" : "no" }}', { ok: true })
      expect(result).toContain('yes')
    })

    it('should handle method calls in expressions', async () => {
      const result = await renderTemplate('{{ items.join(", ") }}', { items: ['a', 'b', 'c'] })
      expect(result).toContain('a, b, c')
    })
  })

  describe('raw output {!! !!}', () => {
    it('should output unescaped HTML', async () => {
      const result = await renderTemplate('{!! html !!}', { html: '<strong>bold</strong>' })
      expect(result).toContain('<strong>bold</strong>')
    })
  })
})

// =============================================================================
// Vue Template Directive Tests (from ssrDirectives.spec.ts, vIf.spec.ts, etc.)
// =============================================================================

describe('Vue Compat: Template Directives', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  describe('v-if / v-else-if / v-else', () => {
    it('should conditionally render with v-if (true)', async () => {
      const testFile = await createTestFile('compat-vif-true.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { show: true };</script>
        </head><body>
        <div v-if="show">visible</div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('visible')
    })

    it('should conditionally render with v-if (false)', async () => {
      const testFile = await createTestFile('compat-vif-false.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { show: false };</script>
        </head><body>
        <div v-if="show">hidden</div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).not.toContain('hidden')
    })

    it('should handle v-if with v-else', async () => {
      const testFile = await createTestFile('compat-vif-else.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { ok: false };</script>
        </head><body>
        <div v-if="ok">yes</div>
        <div v-else>no</div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('no')
      expect(html).not.toContain('>yes<')
    })

    it('should handle v-if / v-else-if / v-else chain', async () => {
      const testFile = await createTestFile('compat-vif-chain.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { type: 'B' };</script>
        </head><body>
        <span v-if="type === 'A'">A</span>
        <span v-else-if="type === 'B'">B</span>
        <span v-else>C</span>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('>B<')
      expect(html).not.toContain('>A<')
      expect(html).not.toContain('>C<')
    })

    it('should handle nested v-if inside v-for', async () => {
      const testFile = await createTestFile('compat-vif-nested.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { items: [{ show: true, text: 'yes' }, { show: false, text: 'no' }] };</script>
        </head><body>
        <div v-for="item in items">
          <span v-if="item.show">{{ item.text }}</span>
        </div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('yes')
      expect(html).not.toContain('>no<')
    })
  })

  describe('v-for', () => {
    it('should render list with v-for (array)', async () => {
      const testFile = await createTestFile('compat-vfor-array.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { items: ['foo', 'bar', 'baz'] };</script>
        </head><body>
        <ul><li v-for="item in items">{{ item }}</li></ul>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('foo')
      expect(html).toContain('bar')
      expect(html).toContain('baz')
    })

    it('should render list with v-for (item, index)', async () => {
      const testFile = await createTestFile('compat-vfor-index.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { items: ['a', 'b', 'c'] };</script>
        </head><body>
        <ul><li v-for="(item, index) in items">{{ index }}-{{ item }}</li></ul>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('0-a')
      expect(html).toContain('1-b')
      expect(html).toContain('2-c')
    })

    it('should render list of objects', async () => {
      const testFile = await createTestFile('compat-vfor-objects.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { users: [{name:'Alice'},{name:'Bob'}] };</script>
        </head><body>
        <div v-for="user in users"><span>{{ user.name }}</span></div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('Alice')
      expect(html).toContain('Bob')
    })

    it('should handle empty list', async () => {
      const testFile = await createTestFile('compat-vfor-empty.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { items: [] };</script>
        </head><body>
        <ul><li v-for="item in items">{{ item }}</li></ul>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('<ul>')
      expect(html).not.toContain('<li>')
    })
  })

  describe('v-html', () => {
    it('should render raw HTML content', async () => {
      const testFile = await createTestFile('compat-vhtml.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { rawHtml: '<em>emphasis</em>' };</script>
        </head><body>
        <div v-html="rawHtml">placeholder</div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('<em>emphasis</em>')
      expect(html).not.toContain('placeholder')
    })
  })

  describe('v-text', () => {
    it('should render escaped text content', async () => {
      const testFile = await createTestFile('compat-vtext.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { message: 'Hello World' };</script>
        </head><body>
        <span v-text="message">placeholder</span>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('Hello World')
      expect(html).not.toContain('placeholder')
    })
  })

  describe('v-once', () => {
    it('should render content once (static)', async () => {
      const testFile = await createTestFile('compat-vonce.stx', `
        <!DOCTYPE html><html><head><title>Test</title>
        <script>module.exports = { msg: 'static' };</script>
        </head><body>
        <div v-once>{{ msg }}</div>
        </body></html>
      `)
      const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
      const html = await getHtmlOutput(result)
      expect(html).toContain('static')
    })
  })

  describe('v-pre', () => {
    it('should skip directive processing for v-pre elements', async () => {
      // v-pre converts to data-stx-skip which should preserve raw template syntax
      const transformed = processVueTemplate('<div v-pre>{{ raw }}</div>')
      expect(transformed).toContain('data-stx-skip')
      expect(transformed).toContain('{{ raw }}')
    })
  })

  describe('v-bind (explicit)', () => {
    it('should transform v-bind:attr to @bind:attr', () => {
      const result = processVueTemplate('<div v-bind:id="dynamicId">content</div>')
      expect(result).toContain('@bind:id="dynamicId"')
    })

    it('should transform v-bind:class', () => {
      const result = processVueTemplate('<div v-bind:class="classes">content</div>')
      expect(result).toContain('@bind:class="classes"')
    })
  })

  describe('v-on (explicit)', () => {
    it('should transform v-on:click to @click', () => {
      const result = processVueTemplate('<button v-on:click="handleClick">Go</button>')
      expect(result).toContain('@click="handleClick"')
    })

    it('should transform v-on:submit to @submit', () => {
      const result = processVueTemplate('<form v-on:submit="handleSubmit">...</form>')
      expect(result).toContain('@submit="handleSubmit"')
    })

    it('should transform v-on with modifiers', () => {
      const result = processVueTemplate('<form v-on:submit.prevent="handleSubmit">...</form>')
      expect(result).toContain('@submit.prevent="handleSubmit"')
    })
  })

  describe('v-model', () => {
    it('should transform v-model on native input', () => {
      const result = processVueTemplate('<input v-model="text">')
      expect(result).toContain('@model="text"')
    })

    it('should transform v-model on textarea', () => {
      const result = processVueTemplate('<textarea v-model="content">old</textarea>')
      expect(result).toContain('@model="content"')
    })

    it('should transform v-model on select', () => {
      const result = processVueTemplate('<select v-model="selected"><option>A</option></select>')
      expect(result).toContain('@model="selected"')
    })

    it('should transform v-model on component to modelValue prop + event', () => {
      const result = processVueTemplate('<CustomInput v-model="search">x</CustomInput>')
      expect(result).toContain(':modelValue="search"')
      expect(result).toContain('@update:modelValue="search = $event"')
    })

    it('should transform named v-model on component', () => {
      const result = processVueTemplate('<CustomInput v-model:title="pageTitle">x</CustomInput>')
      expect(result).toContain(':title="pageTitle"')
      expect(result).toContain('@update:title="pageTitle = $event"')
    })
  })

  describe('v-slot', () => {
    it('should transform v-slot: to # shorthand', () => {
      const result = processVueTemplate('<template v-slot:header>Header</template>')
      expect(result).toContain('#header')
    })

    it('should transform v-slot with scope', () => {
      const result = processVueTemplate('<template v-slot:item="slotProps">{{ slotProps }}</template>')
      expect(result).toContain('#item="slotProps"')
    })
  })

  describe('v-memo', () => {
    it('should transform v-memo to data-stx-memo', () => {
      const result = processVueTemplate('<div v-memo="[valueA, valueB]">content</div>')
      expect(result).toContain('data-stx-memo="[valueA, valueB]"')
    })
  })
})

// =============================================================================
// JSX h() Function Tests (from h.spec.ts)
// =============================================================================

describe('Vue Compat: h() Function', () => {
  it('type only', () => {
    const vnode = h('div', null)
    expect(vnode.type).toBe('div')
    expect(renderToString(vnode)).toBe('<div></div>')
  })

  it('type + props', () => {
    const vnode = h('div', { id: 'foo' })
    expect(renderToString(vnode)).toBe('<div id="foo"></div>')
  })

  it('type + text children', () => {
    const vnode = h('div', null, 'hello')
    expect(renderToString(vnode)).toBe('<div>hello</div>')
  })

  it('type + props + text children', () => {
    const vnode = h('div', { id: 'foo' }, 'hello')
    expect(renderToString(vnode)).toBe('<div id="foo">hello</div>')
  })

  it('type + props + element children', () => {
    const vnode = h('div', { class: 'parent' }, h('span', null, 'child'))
    expect(renderToString(vnode)).toBe('<div class="parent"><span>child</span></div>')
  })

  it('type + props + multiple children (variadic)', () => {
    const vnode = h('div', null, h('span', null, 'a'), h('span', null, 'b'))
    expect(renderToString(vnode)).toBe('<div><span>a</span><span>b</span></div>')
  })

  it('fragment', () => {
    const vnode = h(Fragment, null, h('li', null, '1'), h('li', null, '2'))
    expect(renderToString(vnode)).toBe('<li>1</li><li>2</li>')
  })

  it('function component', () => {
    function Greeting(props: { name: string }) {
      return h('div', null, `Hello ${props.name}`)
    }
    const vnode = h(Greeting, { name: 'World' })
    expect(renderToString(vnode)).toBe('<div>Hello World</div>')
  })

  it('nested function components', () => {
    function Child(props: { msg: string }) {
      return h('div', null, props.msg)
    }
    function Parent() {
      return h('div', null, h(Child, { msg: 'hello' }))
    }
    expect(renderToString(h(Parent, null))).toBe('<div><div>hello</div></div>')
  })

  it('component with multiple children via slot', () => {
    function Layout(props: { children?: any }) {
      return h('main', null, props.children)
    }
    const vnode = h(Layout, null, h('p', null, 'content'))
    expect(renderToString(vnode)).toBe('<main><p>content</p></main>')
  })
})

// =============================================================================
// SSR renderToString Tests (from render.spec.ts)
// =============================================================================

describe('Vue Compat: renderToString', () => {
  it('should render basic element', () => {
    expect(renderToString(h('div', null, 'hello'))).toBe('<div>hello</div>')
  })

  it('should render with attributes', () => {
    expect(renderToString(h('div', { id: 'app', class: 'main' }, 'content'))).toBe(
      '<div id="app" class="main">content</div>',
    )
  })

  it('should render nested components', () => {
    function Child(props: { msg: string }) {
      return h('span', null, props.msg)
    }
    function App() {
      return h('div', null, 'parent', h(Child, { msg: 'hello' }))
    }
    expect(renderToString(h(App, null))).toBe('<div>parent<span>hello</span></div>')
  })

  it('should handle boolean attributes', () => {
    expect(renderToString(h('input', { disabled: true, readonly: true }))).toBe(
      '<input disabled readonly>',
    )
  })

  it('should omit false boolean attributes', () => {
    expect(renderToString(h('input', { disabled: false }))).toBe('<input>')
  })

  it('should render style objects', () => {
    const html = renderToString(h('div', { style: { color: 'red', fontSize: 14 } }, 'styled'))
    expect(html).toContain('style="color: red; font-size: 14px"')
  })

  it('should render class objects', () => {
    const html = renderToString(h('div', { class: { active: true, hidden: false } }, 'classed'))
    expect(html).toContain('class="active"')
  })

  it('should render class arrays', () => {
    const html = renderToString(h('div', { class: ['foo', 'bar'] }))
    expect(html).toContain('class="foo bar"')
  })

  it('should render mixed class arrays with objects', () => {
    const html = renderToString(h('div', { class: ['base', { active: true }] }))
    expect(html).toContain('class="base active"')
  })

  it('should skip null/undefined attribute values', () => {
    expect(renderToString(h('div', { id: null as any, class: undefined }))).toBe('<div></div>')
  })

  it('should escape attribute values', () => {
    const html = renderToString(h('div', { title: 'a "quoted" value' }))
    expect(html).toContain('title="a &quot;quoted&quot; value"')
  })

  it('should escape text content', () => {
    expect(renderToString(h('div', null, '<script>alert(1)</script>'))).toBe(
      '<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>',
    )
  })

  it('should render innerHTML without escaping', () => {
    expect(renderToString(h('div', { innerHTML: '<b>bold</b>' }))).toBe('<div><b>bold</b></div>')
  })
})

// =============================================================================
// Interpolation Tests (from ssrInterpolate.spec.ts)
// =============================================================================

describe('Vue Compat: Interpolation', () => {
  it('should interpolate numbers', async () => {
    const result = await renderTemplate('{{ count }}', { count: 0 })
    expect(result).toContain('0')
  })

  it('should interpolate strings', async () => {
    const result = await renderTemplate('{{ msg }}', { msg: 'foo' })
    expect(result).toContain('foo')
  })

  it('should escape HTML in interpolation', async () => {
    const result = await renderTemplate('{{ html }}', { html: '<div>' })
    expect(result).toContain('&lt;div&gt;')
  })

  it('should handle array interpolation', async () => {
    const result = await renderTemplate('{{ items }}', { items: [1, 2, 3] })
    expect(result).toContain('1')
    expect(result).toContain('2')
    expect(result).toContain('3')
  })

  it('should handle object property access', async () => {
    const result = await renderTemplate('{{ user.name }}', { user: { name: 'Alice' } })
    expect(result).toContain('Alice')
  })

  it('should handle nested property access', async () => {
    const result = await renderTemplate('{{ a.b.c }}', { a: { b: { c: 'deep' } } })
    expect(result).toContain('deep')
  })
})

// =============================================================================
// Composition API Tests (from apiInject.spec.ts)
// =============================================================================

describe('Vue Compat: provide/inject', () => {
  it('string keys', () => {
    const parent = createComponentInstance()
    setCurrentInstance(parent)
    provide('foo', 1)

    const child = createComponentInstance(parent)
    setCurrentInstance(child)
    const foo = inject('foo')
    expect(foo).toBe(1)

    setCurrentInstance(null)
  })

  it('symbol keys', () => {
    const key = Symbol('test')
    const parent = createComponentInstance()
    setCurrentInstance(parent)
    provide(key, 42)

    const child = createComponentInstance(parent)
    setCurrentInstance(child)
    const value = inject(key)
    expect(value).toBe(42)

    setCurrentInstance(null)
  })

  it('default values', () => {
    const parent = createComponentInstance()
    setCurrentInstance(parent)
    provide('foo', 'foo')

    const child = createComponentInstance(parent)
    setCurrentInstance(child)
    const foo = inject('foo', 'fooDefault')
    const bar = inject('bar', 'bar')
    expect(foo).toBe('foo')  // provided value used
    expect(bar).toBe('bar')  // default value used

    setCurrentInstance(null)
  })

  it('nested providers', () => {
    const root = createComponentInstance()
    setCurrentInstance(root)
    provide('foo', 'foo')
    provide('bar', 'bar')

    const mid = createComponentInstance(root)
    setCurrentInstance(mid)
    provide('foo', 'fooOverride')
    provide('baz', 'baz')

    const leaf = createComponentInstance(mid)
    setCurrentInstance(leaf)
    const foo = inject('foo')
    const bar = inject('bar')
    const baz = inject('baz')
    expect(foo).toBe('fooOverride')  // overridden by mid
    expect(bar).toBe('bar')          // inherited from root
    expect(baz).toBe('baz')          // from mid

    setCurrentInstance(null)
  })

  it('reactivity with objects', () => {
    const parent = createComponentInstance()
    setCurrentInstance(parent)
    const state = { count: 0 }
    provide('state', state)

    const child = createComponentInstance(parent)
    setCurrentInstance(child)
    const injected = inject<{ count: number }>('state')
    expect(injected?.count).toBe(0)

    // Mutating the provided object should be visible
    state.count = 1
    expect(injected?.count).toBe(1)

    setCurrentInstance(null)
  })
})

// =============================================================================
// createApp Tests (from apiCreateApp.spec.ts)
// =============================================================================

describe('Vue Compat: createApp', () => {
  it('should create an app instance', () => {
    const app = createApp()
    expect(app).toBeDefined()
    expect(typeof app.use).toBe('function')
    expect(typeof app.provide).toBe('function')
    expect(typeof app.component).toBe('function')
    expect(typeof app.directive).toBe('function')
    expect(typeof app.mount).toBe('function')
    expect(typeof app.unmount).toBe('function')
  })

  it('should support chaining', () => {
    const app = createApp()
    const result = app.use(() => {}).provide('key', 'value').component('Foo', {})
    expect(result).toBe(app)
  })

  it('should install plugins', () => {
    const app = createApp()
    let installed = false
    const plugin = {
      install() { installed = true },
    }
    app.use(plugin)
    expect(installed).toBe(true)
  })

  it('should not install same plugin twice', () => {
    const app = createApp()
    let count = 0
    const plugin = {
      install() { count++ },
    }
    app.use(plugin)
    app.use(plugin)
    expect(count).toBe(1)
  })

  it('should support function plugins', () => {
    const app = createApp()
    let received: any = null
    app.use((a) => { received = a })
    expect(received).toBe(app)
  })

  it('should register and retrieve components', () => {
    const app = createApp()
    const MyComp = { template: '<div />' }
    app.component('MyComp', MyComp)
    expect(app.component('MyComp')).toBe(MyComp)
  })

  it('should register and retrieve directives', () => {
    const app = createApp()
    const myDir = { mounted() {} }
    app.directive('my-dir', myDir)
    expect(app.directive('my-dir')).toBe(myDir)
  })

  it('should have config with globalProperties', () => {
    const app = createApp()
    expect(app.config.globalProperties).toBeDefined()
    app.config.globalProperties.$myGlobal = 'test'
    expect(app.config.globalProperties.$myGlobal).toBe('test')
  })

  it('should cleanup on unmount', () => {
    const app = createApp()
    app.component('Foo', {})
    app.unmount()
    expect(app.component('Foo')).toBeUndefined()
  })
})

// =============================================================================
// nextTick Tests
// =============================================================================

describe('Vue Compat: nextTick', () => {
  it('should execute callback after microtask', async () => {
    let value = 'before'
    await nextTick(() => { value = 'after' })
    expect(value).toBe('after')
  })

  it('should resolve promise', async () => {
    let value = 'before'
    await nextTick()
    value = 'after'
    expect(value).toBe('after')
  })

  it('should execute in order', async () => {
    const order: number[] = []
    await nextTick(() => order.push(1))
    await nextTick(() => order.push(2))
    expect(order).toEqual([1, 2])
  })
})

// =============================================================================
// JSX Utility Components (Show, For) - SolidJS-inspired additions
// =============================================================================

describe('Vue Compat: JSX Utilities', () => {
  describe('Show', () => {
    it('renders children when condition is truthy', () => {
      const html = renderToString(Show({ when: true, children: h('div', null, 'yes') }) as any)
      expect(html).toContain('yes')
    })

    it('renders fallback when condition is falsy', () => {
      const html = renderToString(Show({
        when: false,
        fallback: h('div', null, 'no'),
        children: h('div', null, 'yes'),
      }) as any)
      expect(html).toContain('no')
      expect(html).not.toContain('yes')
    })

    it('renders nothing when falsy and no fallback', () => {
      const html = renderToString(Show({ when: false, children: h('div', null, 'yes') }) as any)
      expect(html).toBe('')
    })

    it('handles 0 as falsy', () => {
      const html = renderToString(Show({ when: 0, children: h('div', null, 'shown') }) as any)
      expect(html).toBe('')
    })

    it('handles non-empty string as truthy', () => {
      const html = renderToString(Show({ when: 'hello', children: h('div', null, 'shown') }) as any)
      expect(html).toContain('shown')
    })
  })

  describe('For', () => {
    it('renders items with render function', () => {
      const html = renderToString(For({
        each: ['a', 'b', 'c'],
        children: (item: string) => h('span', null, item),
      }) as any)
      expect(html).toBe('<span>a</span><span>b</span><span>c</span>')
    })

    it('provides index to render function', () => {
      const html = renderToString(For({
        each: ['x', 'y'],
        children: (item: string, i: number) => h('span', null, `${i}:${item}`),
      }) as any)
      expect(html).toBe('<span>0:x</span><span>1:y</span>')
    })

    it('renders fallback for empty array', () => {
      const html = renderToString(For({
        each: [],
        fallback: h('p', null, 'empty'),
        children: (item: string) => h('span', null, item),
      }) as any)
      expect(html).toBe('<p>empty</p>')
    })

    it('renders fallback for null', () => {
      const html = renderToString(For({
        each: null,
        fallback: h('p', null, 'none'),
        children: (item: string) => h('span', null, item),
      }) as any)
      expect(html).toBe('<p>none</p>')
    })

    it('handles complex objects', () => {
      const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
      const html = renderToString(For({
        each: users,
        children: (user: { id: number, name: string }) => h('div', { key: user.id }, user.name),
      }) as any)
      expect(html).toContain('Alice')
      expect(html).toContain('Bob')
    })
  })
})

// =============================================================================
// Server-side provide/inject context integration
// =============================================================================

describe('Vue Compat: Server-side provide/inject context', () => {
  it('should create child context with provides from parent', () => {
    const parent = { __provides: { theme: 'dark', lang: 'en' } }
    const child = createProvideContext(parent)

    expect(child.__inject('theme')).toBe('dark')
    expect(child.__inject('lang')).toBe('en')
  })

  it('should allow child to add new provides', () => {
    const parent = { __provides: { theme: 'dark' } }
    const child = createProvideContext(parent)

    child.__provide('color', 'blue')
    expect(child.__inject('color')).toBe('blue')
    expect(child.__inject('theme')).toBe('dark')
  })

  it('should allow child to override parent provides', () => {
    const parent = { __provides: { theme: 'dark' } }
    const child = createProvideContext(parent)

    child.__provide('theme', 'light')
    expect(child.__inject('theme')).toBe('light')
  })

  it('should return default when key not found anywhere', () => {
    const ctx = createProvideContext({})
    expect(ctx.__inject('missing', 'default')).toBe('default')
  })
})
