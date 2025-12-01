import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearComponents,
  clearSuspenseState,
  clientComponentDirective,
  generateServerComponentsRuntime,
  getComponent,
  registerServerComponentDirectives,
  serverComponentDirective,
  suspenseDirective,
} from '../../src/server-components'

describe('serverComponentDirective', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should have correct name', () => {
    expect(serverComponentDirective.name).toBe('serverComponent')
  })

  it('should have end tag', () => {
    expect(serverComponentDirective.hasEndTag).toBe(true)
  })

  it('should register component and return wrapper', () => {
    const result = serverComponentDirective.handler(
      '<div>Content</div>',
      ['user-card'],
      {},
      'test.stx',
    )

    expect(result).toContain('data-server-component="user-card"')
    expect(result).toContain('<div>Content</div>')
    expect(getComponent('user-card')).toBeDefined()
  })

  it('should throw without name parameter', () => {
    expect(() => {
      serverComponentDirective.handler('<div></div>', [], {}, 'test.stx')
    }).toThrow('@serverComponent requires a name parameter')
  })

  it('should strip quotes from name', () => {
    serverComponentDirective.handler('<div></div>', ['"my-component"'], {}, 'test.stx')
    expect(getComponent('my-component')).toBeDefined()

    serverComponentDirective.handler('<div></div>', ["'another'"], {}, 'test.stx')
    expect(getComponent('another')).toBeDefined()
  })

  it('should generate unique IDs', () => {
    const result1 = serverComponentDirective.handler('<div></div>', ['comp'], {}, 'test.stx')
    clearComponents()
    const result2 = serverComponentDirective.handler('<div></div>', ['comp'], {}, 'test.stx')

    const id1 = result1.match(/data-component-id="([^"]+)"/)?.[1]
    const id2 = result2.match(/data-component-id="([^"]+)"/)?.[1]

    expect(id1).toBeDefined()
    expect(id2).toBeDefined()
    expect(id1).not.toBe(id2)
  })
})

describe('clientComponentDirective', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should have correct name', () => {
    expect(clientComponentDirective.name).toBe('clientComponent')
  })

  it('should have end tag', () => {
    expect(clientComponentDirective.hasEndTag).toBe(true)
  })

  it('should register component and return wrapper', () => {
    const result = clientComponentDirective.handler(
      '<button>Click</button>',
      ['counter'],
      {},
      'test.stx',
    )

    expect(result).toContain('data-client-component="counter"')
    expect(result).toContain('<button>Click</button>')
    expect(getComponent('counter')).toBeDefined()
    expect(getComponent('counter')?.type).toBe('client')
  })

  it('should throw without name parameter', () => {
    expect(() => {
      clientComponentDirective.handler('<div></div>', [], {}, 'test.stx')
    }).toThrow('@clientComponent requires a name parameter')
  })

  it('should extract client script', () => {
    const content = `<button>Click</button>
<script>console.log('hello')</script>`

    clientComponentDirective.handler(content, ['with-script'], {}, 'test.stx')

    const entry = getComponent('with-script')
    expect((entry?.component as any).clientScript).toContain("console.log('hello')")
    expect((entry?.component as any).template).not.toContain('<script>')
  })

  it('should accept priority parameter', () => {
    const result = clientComponentDirective.handler(
      '<div></div>',
      ['eager-comp', 'eager'],
      {},
      'test.stx',
    )

    expect(result).toContain('data-priority="eager"')
    expect((getComponent('eager-comp')?.component as any).priority).toBe('eager')
  })

  it('should default to lazy priority', () => {
    const result = clientComponentDirective.handler(
      '<div></div>',
      ['lazy-comp'],
      {},
      'test.stx',
    )

    expect(result).toContain('data-priority="lazy"')
  })
})

describe('suspenseDirective', () => {
  afterEach(() => {
    clearSuspenseState()
  })

  it('should have correct name', () => {
    expect(suspenseDirective.name).toBe('suspense')
  })

  it('should have end tag', () => {
    expect(suspenseDirective.hasEndTag).toBe(true)
  })

  it('should wrap content with suspense marker', () => {
    const result = suspenseDirective.handler(
      '<div>Async content</div>',
      ['Loading...'],
      {},
      'test.stx',
    )

    expect(result).toContain('data-suspense=')
    expect(result).toContain('data-fallback="Loading..."')
    expect(result).toContain('<div>Async content</div>')
  })

  it('should use default fallback', () => {
    const result = suspenseDirective.handler(
      '<div>Content</div>',
      [],
      {},
      'test.stx',
    )

    expect(result).toContain('data-fallback="Loading..."')
  })

  it('should escape HTML in fallback', () => {
    const result = suspenseDirective.handler(
      '<div>Content</div>',
      ['<script>bad</script>'],
      {},
      'test.stx',
    )

    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should generate unique IDs', () => {
    const result1 = suspenseDirective.handler('<div></div>', [], {}, 'test.stx')
    const result2 = suspenseDirective.handler('<div></div>', [], {}, 'test.stx')

    const id1 = result1.match(/data-suspense="([^"]+)"/)?.[1]
    const id2 = result2.match(/data-suspense="([^"]+)"/)?.[1]

    expect(id1).not.toBe(id2)
  })
})

describe('registerServerComponentDirectives', () => {
  it('should return all three directives', () => {
    const directives = registerServerComponentDirectives()

    expect(directives).toHaveLength(3)
    expect(directives.map(d => d.name)).toContain('serverComponent')
    expect(directives.map(d => d.name)).toContain('clientComponent')
    expect(directives.map(d => d.name)).toContain('suspense')
  })
})

describe('generateServerComponentsRuntime', () => {
  it('should generate client-side runtime', () => {
    const runtime = generateServerComponentsRuntime()

    expect(runtime).toContain('stxServerComponents')
    expect(runtime).toContain('registerComponent')
    expect(runtime).toContain('hydrateComponent')
    expect(runtime).toContain('hydrateAll')
  })

  it('should include priority-based hydration', () => {
    const runtime = generateServerComponentsRuntime()

    expect(runtime).toContain('eager')
    expect(runtime).toContain('lazy')
    expect(runtime).toContain('idle')
  })

  it('should use IntersectionObserver for lazy hydration', () => {
    const runtime = generateServerComponentsRuntime()

    expect(runtime).toContain('IntersectionObserver')
  })

  it('should use requestIdleCallback for idle hydration', () => {
    const runtime = generateServerComponentsRuntime()

    expect(runtime).toContain('requestIdleCallback')
  })

  it('should expose global __stxServerComponents', () => {
    const runtime = generateServerComponentsRuntime()

    expect(runtime).toContain('window.__stxServerComponents')
  })

  it('should handle DOMContentLoaded', () => {
    const runtime = generateServerComponentsRuntime()

    expect(runtime).toContain('DOMContentLoaded')
  })

  it('should parse props from JSON', () => {
    const runtime = generateServerComponentsRuntime()

    expect(runtime).toContain('JSON.parse')
    expect(runtime).toContain('data-component-props')
  })

  it('should mark hydrated components', () => {
    const runtime = generateServerComponentsRuntime()

    expect(runtime).toContain("dataset.hydrated = 'true'")
  })
})
