import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test'
import {
  extractState,
  generateEventBindings,
  generateHydrationCSS,
  generateHydrationScript,
  generateStateScript,
  getHydrationRuntime,
  HydrationRuntime,
  serializeState,
  type HydrationState,
} from '../../src/hydration'

describe('hydration - serializeState()', () => {
  it('should serialize empty state', () => {
    const serialized = serializeState({})

    expect(serialized).toContain('refs')
    expect(serialized).toContain('reactive')
    expect(serialized).toContain('props')
    expect(serialized).toContain('timestamp')
  })

  it('should serialize refs', () => {
    const serialized = serializeState({
      refs: { count: 5, name: 'test' },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.count).toBe(5)
    expect(parsed.refs.name).toBe('test')
  })

  it('should serialize reactive objects', () => {
    const serialized = serializeState({
      reactive: {
        user: { id: 1, name: 'Alice' },
      },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.reactive.user.id).toBe(1)
    expect(parsed.reactive.user.name).toBe('Alice')
  })

  it('should serialize props', () => {
    const serialized = serializeState({
      props: { title: 'Hello', count: 42 },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.props.title).toBe('Hello')
    expect(parsed.props.count).toBe(42)
  })

  it('should serialize route params', () => {
    const serialized = serializeState({
      routeParams: { id: '123', slug: 'my-post' },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.routeParams.id).toBe('123')
    expect(parsed.routeParams.slug).toBe('my-post')
  })

  it('should serialize stores', () => {
    const serialized = serializeState({
      stores: {
        counter: { count: 10 },
        user: { name: 'Bob' },
      },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.stores.counter.count).toBe(10)
    expect(parsed.stores.user.name).toBe('Bob')
  })

  it('should include timestamp', () => {
    const before = Date.now()
    const serialized = serializeState({})
    const after = Date.now()

    const parsed = JSON.parse(serialized)
    expect(parsed.timestamp).toBeGreaterThanOrEqual(before)
    expect(parsed.timestamp).toBeLessThanOrEqual(after)
  })

  it('should include checksum', () => {
    const serialized = serializeState({ refs: { a: 1 } })

    const parsed = JSON.parse(serialized)
    expect(parsed.checksum).toBeDefined()
    expect(typeof parsed.checksum).toBe('string')
  })

  it('should escape HTML special characters', () => {
    const serialized = serializeState({
      refs: { html: '<script>alert("xss")</script>' },
    })

    expect(serialized).not.toContain('<script>')
    expect(serialized).toContain('\\u003cscript\\u003e')
  })

  it('should escape ampersands', () => {
    const serialized = serializeState({
      refs: { text: 'a & b' },
    })

    expect(serialized).not.toContain(' & ')
    expect(serialized).toContain('\\u0026')
  })

  it('should handle nested objects', () => {
    const serialized = serializeState({
      refs: {
        deep: {
          level1: {
            level2: {
              value: 'nested',
            },
          },
        },
      },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.deep.level1.level2.value).toBe('nested')
  })

  it('should handle arrays', () => {
    const serialized = serializeState({
      refs: { items: [1, 2, 3] },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.items).toEqual([1, 2, 3])
  })

  it('should handle null values', () => {
    const serialized = serializeState({
      refs: { nullable: null },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.nullable).toBeNull()
  })

  it('should handle boolean values', () => {
    const serialized = serializeState({
      refs: { active: true, disabled: false },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.active).toBe(true)
    expect(parsed.refs.disabled).toBe(false)
  })
})

describe('hydration - generateStateScript()', () => {
  it('should generate script tag with state', () => {
    const script = generateStateScript({ refs: { count: 5 } })

    expect(script).toContain('<script')
    expect(script).toContain('id="__STX_STATE__"')
    expect(script).toContain('type="application/json"')
    expect(script).toContain('</script>')
  })

  it('should embed serialized state', () => {
    const script = generateStateScript({ refs: { name: 'test' } })

    expect(script).toContain('"name":"test"')
  })

  it('should be valid HTML', () => {
    const script = generateStateScript({
      refs: { html: '<div>test</div>' },
    })

    // Should not break HTML parsing
    expect(script).not.toContain('<div>test</div>')
  })
})

describe('hydration - generateEventBindings()', () => {
  it('should generate empty string for no events', () => {
    const result = generateEventBindings([])
    expect(result).toBe('')
  })

  it('should generate data attribute with events', () => {
    const result = generateEventBindings([
      { type: 'click', handler: 'handleClick' },
    ])

    expect(result).toContain('data-stx-events')
    expect(result).toContain('click')
    expect(result).toContain('handleClick')
  })

  it('should include modifiers', () => {
    const result = generateEventBindings([
      { type: 'click', handler: 'handleClick', modifiers: ['prevent', 'stop'] },
    ])

    expect(result).toContain('prevent')
    expect(result).toContain('stop')
  })

  it('should handle multiple events', () => {
    const result = generateEventBindings([
      { type: 'click', handler: 'onClick' },
      { type: 'submit', handler: 'onSubmit' },
      { type: 'input', handler: 'onInput' },
    ])

    expect(result).toContain('click')
    expect(result).toContain('submit')
    expect(result).toContain('input')
  })
})

describe('hydration - generateHydrationScript()', () => {
  it('should generate hydration runtime script', () => {
    const script = generateHydrationScript()

    expect(script).toContain('<script')
    expect(script).toContain('data-stx-hydration-runtime')
    expect(script).toContain('</script>')
  })

  it('should include state script when state provided', () => {
    const script = generateHydrationScript({ refs: { count: 5 } })

    expect(script).toContain('__STX_STATE__')
    expect(script).toContain('"count":5')
  })

  it('should include DOM ready initialization', () => {
    const script = generateHydrationScript()

    expect(script).toContain('DOMContentLoaded')
  })

  it('should include component hydration logic', () => {
    const script = generateHydrationScript()

    expect(script).toContain('data-stx-component')
    expect(script).toContain('hydrate')
  })

  it('should support different hydration strategies', () => {
    const script = generateHydrationScript()

    expect(script).toContain('eager')
    expect(script).toContain('idle')
    expect(script).toContain('visible')
    expect(script).toContain('interaction')
  })

  it('should dispatch hydration events', () => {
    const script = generateHydrationScript()

    expect(script).toContain('stx:hydrated')
  })
})

describe('hydration - generateHydrationCSS()', () => {
  it('should generate CSS with style tag', () => {
    const css = generateHydrationCSS()

    expect(css).toContain('<style')
    expect(css).toContain('data-stx-hydration-styles')
    expect(css).toContain('</style>')
  })

  it('should include hydrating state styles', () => {
    const css = generateHydrationCSS()

    expect(css).toContain('.stx-hydrating')
  })

  it('should include hydrated state styles', () => {
    const css = generateHydrationCSS()

    expect(css).toContain('.stx-hydrated')
  })

  it('should include error state styles', () => {
    const css = generateHydrationCSS()

    expect(css).toContain('.stx-hydration-error')
  })

  it('should include component pre-hydration styles', () => {
    const css = generateHydrationCSS()

    expect(css).toContain('[data-stx-component]')
  })
})

describe('hydration - HydrationRuntime', () => {
  it('should create runtime with default options', () => {
    const runtime = new HydrationRuntime()

    expect(runtime).toBeDefined()
    expect(runtime.hydrated).toBe(false)
  })

  it('should accept custom options', () => {
    const runtime = new HydrationRuntime({
      root: '#custom-root',
      strict: true,
      timeout: 5000,
    })

    expect(runtime).toBeDefined()
  })

  it('should track hydration state', () => {
    const runtime = new HydrationRuntime()

    expect(runtime.hydrated).toBe(false)
  })

  it('should return null state before hydration', () => {
    const runtime = new HydrationRuntime()

    expect(runtime.getState()).toBeNull()
  })

  it('should support custom callbacks', () => {
    let hydrating = false
    let hydrated = false
    let errorOccurred = false

    new HydrationRuntime({
      onHydrating: () => {
        hydrating = true
      },
      onHydrated: () => {
        hydrated = true
      },
      onError: () => {
        errorOccurred = true
      },
    })

    // Callbacks are set but not yet called
    expect(hydrating).toBe(false)
    expect(hydrated).toBe(false)
    expect(errorOccurred).toBe(false)
  })
})

describe('hydration - getHydrationRuntime()', () => {
  it('should return singleton instance', () => {
    // Note: This test verifies the function exists and returns a runtime
    // In browser environment, it would return the same instance
    const runtime = getHydrationRuntime()
    expect(runtime).toBeDefined()
    expect(runtime instanceof HydrationRuntime).toBe(true)
  })
})

describe('hydration - extractState() server-side', () => {
  it('should return null in server environment', () => {
    // In Node/Bun environment without window/document
    // This simulates server-side behavior
    const state = extractState()

    // Should return null since no DOM
    expect(state).toBeNull()
  })
})

describe('hydration - edge cases', () => {
  it('should handle very large state', () => {
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `item-${i}`,
      data: 'x'.repeat(100),
    }))

    const serialized = serializeState({
      refs: { items: largeArray },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.items.length).toBe(10000)
  })

  it('should handle unicode characters', () => {
    const serialized = serializeState({
      refs: {
        emoji: '🎉🚀💯',
        japanese: 'こんにちは',
        chinese: '你好',
        arabic: 'مرحبا',
      },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.emoji).toBe('🎉🚀💯')
    expect(parsed.refs.japanese).toBe('こんにちは')
  })

  it('should handle special numbers', () => {
    const serialized = serializeState({
      refs: {
        infinity: Number.POSITIVE_INFINITY,
        negInfinity: Number.NEGATIVE_INFINITY,
        maxSafe: Number.MAX_SAFE_INTEGER,
        minSafe: Number.MIN_SAFE_INTEGER,
      },
    })

    // Infinity becomes null in JSON
    const parsed = JSON.parse(serialized)
    expect(parsed.refs.maxSafe).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('should handle Date objects in state', () => {
    const now = new Date()
    const serialized = serializeState({
      refs: { date: now.toISOString() },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.date).toBe(now.toISOString())
  })

  it('should handle empty strings', () => {
    const serialized = serializeState({
      refs: { empty: '' },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.empty).toBe('')
  })

  it('should handle deeply nested structures', () => {
    const deep: any = { level: 0 }
    let current = deep

    for (let i = 1; i <= 50; i++) {
      current.child = { level: i }
      current = current.child
    }

    const serialized = serializeState({
      refs: { deep },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.refs.deep.level).toBe(0)
  })

  it('should generate consistent checksums for same input', () => {
    const state = { refs: { a: 1, b: 2 } }

    const serialized1 = serializeState(state)
    const serialized2 = serializeState(state)

    const parsed1 = JSON.parse(serialized1)
    const parsed2 = JSON.parse(serialized2)

    expect(parsed1.checksum).toBe(parsed2.checksum)
  })

  it('should generate different checksums for different input', () => {
    const serialized1 = serializeState({ refs: { a: 1 } })
    const serialized2 = serializeState({ refs: { b: 2 } })

    const parsed1 = JSON.parse(serialized1)
    const parsed2 = JSON.parse(serialized2)

    expect(parsed1.checksum).not.toBe(parsed2.checksum)
  })
})

describe('hydration - state restoration patterns', () => {
  it('should preserve object references structure', () => {
    const serialized = serializeState({
      refs: {
        user: { id: 1, profile: { name: 'Alice' } },
      },
      reactive: {
        settings: { theme: 'dark' },
      },
    })

    const parsed = JSON.parse(serialized)

    expect(parsed.refs.user.profile.name).toBe('Alice')
    expect(parsed.reactive.settings.theme).toBe('dark')
  })

  it('should handle mixed data types', () => {
    const serialized = serializeState({
      refs: {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 'two', { three: 3 }],
        object: { nested: { value: 'deep' } },
      },
    })

    const parsed = JSON.parse(serialized)

    expect(typeof parsed.refs.string).toBe('string')
    expect(typeof parsed.refs.number).toBe('number')
    expect(typeof parsed.refs.boolean).toBe('boolean')
    expect(parsed.refs.null).toBeNull()
    expect(Array.isArray(parsed.refs.array)).toBe(true)
    expect(typeof parsed.refs.object).toBe('object')
  })

  it('should handle store states with actions', () => {
    // Store state should only include serializable data
    const serialized = serializeState({
      stores: {
        counter: {
          count: 0,
          history: [0],
          // Functions would not serialize
        },
      },
    })

    const parsed = JSON.parse(serialized)
    expect(parsed.stores.counter.count).toBe(0)
    expect(parsed.stores.counter.history).toEqual([0])
  })
})

describe('hydration - security', () => {
  it('should escape potential XSS in script content', () => {
    const malicious = '</script><script>alert("xss")</script>'
    const serialized = serializeState({
      refs: { content: malicious },
    })

    // Should be escaped to prevent XSS
    expect(serialized).not.toContain('</script>')
  })

  it('should escape HTML entities', () => {
    const html = '<img src="x" onerror="alert(1)">'
    const serialized = serializeState({
      refs: { content: html },
    })

    expect(serialized).not.toContain('<img')
  })

  it('should handle event handler injection attempts', () => {
    const malicious = '" onclick="alert(1)" data-x="'
    const serialized = serializeState({
      refs: { content: malicious },
    })

    // JSON encoding should escape the quotes
    const parsed = JSON.parse(serialized)
    expect(parsed.refs.content).toBe(malicious)
  })
})

describe('hydration - performance', () => {
  it('should serialize large state efficiently', () => {
    const largeState = {
      refs: {} as Record<string, any>,
    }

    // Create 1000 refs
    for (let i = 0; i < 1000; i++) {
      largeState.refs[`key${i}`] = { value: i, data: `item-${i}` }
    }

    const start = performance.now()
    serializeState(largeState)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100) // Should complete in under 100ms
  })

  it('should handle repeated serialization', () => {
    const state = { refs: { count: 0 } }

    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      serializeState(state)
    }
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
  })
})
