import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearComponents,
  registerClientComponent,
  registerServerComponent,
  renderClientComponent,
  renderComponent,
  renderServerComponent,
} from '../../src/server-components'

describe('renderServerComponent', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should render a simple server component', async () => {
    registerServerComponent({
      name: 'greeting',
      template: '<h1>Hello World</h1>',
    })

    const result = await renderServerComponent('greeting')
    expect(result.html).toBe('<h1>Hello World</h1>')
    expect(result.cached).toBe(false)
    expect(result.renderTime).toBeGreaterThanOrEqual(0)
  })

  it('should render with props', async () => {
    registerServerComponent({
      name: 'personalized',
      template: '<h1>Hello {{name}}</h1>',
    })

    const result = await renderServerComponent('personalized', {
      props: { name: 'Alice' },
    })
    expect(result.html).toContain('Alice')
  })

  it('should render with nested props', async () => {
    registerServerComponent({
      name: 'nested-props',
      template: '<p>{{user.name}} - {{user.email}}</p>',
    })

    const result = await renderServerComponent('nested-props', {
      props: { user: { name: 'Bob', email: 'bob@example.com' } },
    })
    expect(result.html).toContain('Bob')
    expect(result.html).toContain('bob@example.com')
  })

  it('should use loader data', async () => {
    registerServerComponent({
      name: 'with-loader',
      template: '<div>{{data}}</div>',
      loader: async () => ({ data: 'loaded from API' }),
    })

    const result = await renderServerComponent('with-loader')
    expect(result.data).toEqual({ data: 'loaded from API' })
  })

  it('should escape HTML by default', async () => {
    registerServerComponent({
      name: 'escape-html',
      template: '<div>{{content}}</div>',
    })

    const result = await renderServerComponent('escape-html', {
      props: { content: '<script>alert("xss")</script>' },
    })
    expect(result.html).toContain('&lt;script&gt;')
    expect(result.html).not.toContain('<script>')
  })

  it('should throw for non-existent component', async () => {
    await expect(renderServerComponent('not-found')).rejects.toThrow(
      'Server component "not-found" not found',
    )
  })

  it('should throw when rendering client component as server', async () => {
    registerClientComponent({
      name: 'client-only',
      template: '<button>Click</button>',
    })

    await expect(renderServerComponent('client-only')).rejects.toThrow(
      'Component "client-only" is not a server component',
    )
  })

  it('should use error boundary on error', async () => {
    registerServerComponent({
      name: 'error-prone',
      template: '<div>{{data}}</div>',
      loader: async () => {
        throw new Error('API failed')
      },
      errorBoundary: '<p class="error">Error: {{error}}</p>',
    })

    const result = await renderServerComponent('error-prone')
    expect(result.html).toContain('Error:')
    expect(result.html).toContain('API failed')
  })

  it('should track dependencies', async () => {
    registerServerComponent({
      name: 'with-deps',
      template: '<div>Content</div>',
      dependencies: ['dep-a', 'dep-b'],
    })

    const result = await renderServerComponent('with-deps')
    expect(result.dependencies).toContain('dep-a')
    expect(result.dependencies).toContain('dep-b')
  })

  it('should process @if directives', async () => {
    registerServerComponent({
      name: 'conditional',
      template: '@if(showIt)Visible@endif',
    })

    const visible = await renderServerComponent('conditional', {
      props: { showIt: true },
    })
    expect(visible.html).toContain('Visible')

    const hidden = await renderServerComponent('conditional', {
      props: { showIt: false },
    })
    expect(hidden.html).not.toContain('Visible')
  })

  it('should process @foreach directives', async () => {
    registerServerComponent({
      name: 'list',
      template: '<ul>@foreach(items as item)<li>{{item}}</li>@endforeach</ul>',
    })

    const result = await renderServerComponent('list', {
      props: { items: ['a', 'b', 'c'] },
    })
    expect(result.html).toContain('<li>a</li>')
    expect(result.html).toContain('<li>b</li>')
    expect(result.html).toContain('<li>c</li>')
  })
})

describe('renderClientComponent', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should render with hydration wrapper', async () => {
    registerClientComponent({
      name: 'button',
      template: '<button>Click me</button>',
    })

    const result = await renderClientComponent('button')
    expect(result.html).toContain('data-client-component="button"')
    expect(result.html).toContain('data-component-id=')
    expect(result.html).toContain('Click me')
  })

  it('should include client props JSON', async () => {
    registerClientComponent({
      name: 'counter',
      template: '<span>{{count}}</span>',
      clientProps: ['count'],
    })

    const result = await renderClientComponent('counter', {
      props: { count: 10 },
    })
    expect(result.html).toContain('type="application/json"')
    expect(result.html).toContain('data-component-props=')
  })

  it('should generate hydration script', async () => {
    registerClientComponent({
      name: 'interactive',
      template: '<div id="app"></div>',
      clientScript: 'console.log("hydrated")',
    })

    const result = await renderClientComponent('interactive')
    expect(result.hydrationScript).toContain('type="module"')
    expect(result.hydrationScript).toContain('console.log("hydrated")')
  })

  it('should respect priority setting', async () => {
    registerClientComponent({
      name: 'eager',
      template: '<div></div>',
      priority: 'eager',
    })

    const result = await renderClientComponent('eager')
    expect(result.html).toContain('data-priority="eager"')
  })

  it('should throw for non-existent component', async () => {
    await expect(renderClientComponent('missing')).rejects.toThrow(
      'Client component "missing" not found',
    )
  })

  it('should throw when rendering server component as client', async () => {
    registerServerComponent({
      name: 'server-only',
      template: '<div>Server</div>',
    })

    await expect(renderClientComponent('server-only')).rejects.toThrow(
      'Component "server-only" is not a client component',
    )
  })
})

describe('renderComponent', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should render server component', async () => {
    registerServerComponent({
      name: 'auto-server',
      template: '<p>Server rendered</p>',
    })

    const result = await renderComponent('auto-server')
    expect(result.html).toBe('<p>Server rendered</p>')
  })

  it('should render client component', async () => {
    registerClientComponent({
      name: 'auto-client',
      template: '<p>Client rendered</p>',
    })

    const result = await renderComponent('auto-client')
    expect(result.html).toContain('data-client-component="auto-client"')
    expect(result.html).toContain('Client rendered')
  })

  it('should throw for non-existent component', async () => {
    await expect(renderComponent('none')).rejects.toThrow(
      'Component "none" not found',
    )
  })
})
