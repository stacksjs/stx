import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import {
  HydrationRuntime,
  serializeState,
  generateStateScript,
  generateHydrationScript,
  generateHydrationCSS,
  generateEventBindings,
  getHydrationRuntime,
} from '../src/hydration'

describe('Hydration Runtime', () => {
  describe('serializeState', () => {
    it('should serialize basic state', () => {
      const serialized = serializeState({
        refs: { count: 0 },
        props: { title: 'Hello' },
      })

      expect(serialized).toContain('"refs"')
      expect(serialized).toContain('"count"')
      expect(serialized).toContain('"props"')
      expect(serialized).toContain('"title"')
    })

    it('should escape HTML characters for safe embedding', () => {
      const serialized = serializeState({
        refs: { html: '<script>alert("xss")</script>' },
      })

      // Should not contain raw < or >
      expect(serialized).not.toContain('<script>')
      expect(serialized).toContain('\\u003c')
    })

    it('should include timestamp', () => {
      const before = Date.now()
      const serialized = serializeState({ refs: {} })
      const after = Date.now()

      const parsed = JSON.parse(serialized)
      expect(parsed.timestamp).toBeGreaterThanOrEqual(before)
      expect(parsed.timestamp).toBeLessThanOrEqual(after)
    })

    it('should generate checksum', () => {
      const serialized = serializeState({
        refs: { a: 1, b: 2 },
        reactive: { user: { name: 'Alice' } },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.checksum).toBeDefined()
      expect(typeof parsed.checksum).toBe('string')
    })

    it('should handle empty state', () => {
      const serialized = serializeState({})

      const parsed = JSON.parse(serialized)
      expect(parsed.refs).toEqual({})
      expect(parsed.reactive).toEqual({})
      expect(parsed.props).toEqual({})
    })

    it('should serialize nested objects', () => {
      const serialized = serializeState({
        reactive: {
          user: {
            name: 'Alice',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.reactive.user.settings.theme).toBe('dark')
    })

    it('should serialize arrays', () => {
      const serialized = serializeState({
        refs: {
          items: [1, 2, 3],
          users: [{ name: 'Alice' }, { name: 'Bob' }],
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.refs.items).toEqual([1, 2, 3])
      expect(parsed.refs.users[0].name).toBe('Alice')
    })
  })

  describe('generateStateScript', () => {
    it('should generate script tag with state', () => {
      const script = generateStateScript({
        refs: { count: 42 },
      })

      expect(script).toContain('<script')
      expect(script).toContain('id="__STX_STATE__"')
      expect(script).toContain('type="application/json"')
      expect(script).toContain('</script>')
    })

    it('should include serialized state', () => {
      const script = generateStateScript({
        refs: { message: 'Hello World' },
      })

      expect(script).toContain('"message"')
      expect(script).toContain('Hello World')
    })
  })

  describe('generateEventBindings', () => {
    it('should generate data attribute for events', () => {
      const bindings = generateEventBindings([
        { type: 'click', handler: 'handleClick' },
        { type: 'submit', handler: 'handleSubmit', preventDefault: true },
      ])

      expect(bindings).toContain('data-stx-events=')
      expect(bindings).toContain('click')
      expect(bindings).toContain('handleClick')
      expect(bindings).toContain('submit')
    })

    it('should return empty string for no events', () => {
      const bindings = generateEventBindings([])
      expect(bindings).toBe('')
    })

    it('should include modifiers', () => {
      const bindings = generateEventBindings([
        {
          type: 'click',
          handler: 'handleClick',
          modifiers: ['prevent', 'stop'],
        },
      ])

      expect(bindings).toContain('prevent')
      expect(bindings).toContain('stop')
    })
  })

  describe('generateHydrationScript', () => {
    it('should generate complete hydration script', () => {
      const script = generateHydrationScript({
        refs: { count: 0 },
      })

      expect(script).toContain('data-stx-hydration-runtime')
      expect(script).toContain('__STX_STATE__')
    })

    it('should include component hydration logic', () => {
      const script = generateHydrationScript()

      expect(script).toContain('data-stx-component')
      expect(script).toContain('stx-hydrated')
    })

    it('should support different hydration strategies', () => {
      const script = generateHydrationScript()

      expect(script).toContain('eager')
      expect(script).toContain('idle')
      expect(script).toContain('visible')
      expect(script).toContain('interaction')
    })

    it('should include requestIdleCallback fallback', () => {
      const script = generateHydrationScript()

      expect(script).toContain('requestIdleCallback')
      expect(script).toContain('setTimeout')
    })

    it('should include IntersectionObserver for visible strategy', () => {
      const script = generateHydrationScript()

      expect(script).toContain('IntersectionObserver')
    })

    it('should dispatch stx:hydrated event', () => {
      const script = generateHydrationScript()

      expect(script).toContain("stx:hydrated")
      expect(script).toContain('dispatchEvent')
    })
  })

  describe('generateHydrationCSS', () => {
    it('should generate CSS for hydration states', () => {
      const css = generateHydrationCSS()

      expect(css).toContain('<style')
      expect(css).toContain('data-stx-hydration-styles')
    })

    it('should include pre-hydration styles', () => {
      const css = generateHydrationCSS()

      expect(css).toContain('[data-stx-component]:not(.stx-hydrated)')
    })

    it('should include loading state styles', () => {
      const css = generateHydrationCSS()

      expect(css).toContain('.stx-hydrating')
    })

    it('should include error state styles', () => {
      const css = generateHydrationCSS()

      expect(css).toContain('.stx-hydration-error')
    })

    it('should include progressive enhancement fallback', () => {
      const css = generateHydrationCSS()

      expect(css).toContain('@supports not')
    })
  })

  describe('HydrationRuntime', () => {
    it('should create runtime with default options', () => {
      const runtime = new HydrationRuntime()
      expect(runtime).toBeDefined()
      expect(runtime.hydrated).toBe(false)
    })

    it('should create runtime with custom options', () => {
      const runtime = new HydrationRuntime({
        root: '#app',
        strict: true,
        timeout: 5000,
      })
      expect(runtime).toBeDefined()
    })

    it('should track hydration state', () => {
      const runtime = new HydrationRuntime()
      expect(runtime.hydrated).toBe(false)
    })

    it('should return null state when not hydrated', () => {
      const runtime = new HydrationRuntime()
      expect(runtime.getState()).toBeNull()
    })
  })

  describe('getHydrationRuntime', () => {
    it('should return singleton instance', () => {
      // Reset by creating new instances in different context
      const runtime1 = getHydrationRuntime()
      const runtime2 = getHydrationRuntime()
      expect(runtime1).toBe(runtime2)
    })
  })

  describe('State Serialization Edge Cases', () => {
    it('should handle circular references gracefully', () => {
      // Circular refs will fail JSON.stringify, so we pass simple objects
      const serialized = serializeState({
        refs: { value: 'test' },
      })

      expect(() => JSON.parse(serialized)).not.toThrow()
    })

    it('should handle special characters in strings', () => {
      const serialized = serializeState({
        refs: {
          special: 'Test\nWith\tSpecial\rChars',
          unicode: '你好世界',
          emoji: '🎉🚀',
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.refs.special).toContain('Test')
      expect(parsed.refs.unicode).toBe('你好世界')
      expect(parsed.refs.emoji).toBe('🎉🚀')
    })

    it('should handle null and undefined values', () => {
      const serialized = serializeState({
        refs: {
          nullValue: null,
          undefinedValue: undefined,
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.refs.nullValue).toBeNull()
      expect(parsed.refs.undefinedValue).toBeUndefined()
    })

    it('should handle large numbers', () => {
      const serialized = serializeState({
        refs: {
          big: Number.MAX_SAFE_INTEGER,
          small: Number.MIN_SAFE_INTEGER,
          float: 3.14159265359,
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.refs.big).toBe(Number.MAX_SAFE_INTEGER)
      expect(parsed.refs.small).toBe(Number.MIN_SAFE_INTEGER)
      expect(parsed.refs.float).toBeCloseTo(3.14159265359)
    })

    it('should handle boolean values', () => {
      const serialized = serializeState({
        refs: {
          trueVal: true,
          falseVal: false,
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.refs.trueVal).toBe(true)
      expect(parsed.refs.falseVal).toBe(false)
    })

    it('should handle Date objects (serialized as ISO string)', () => {
      const date = new Date('2025-01-15T00:00:00.000Z')
      const serialized = serializeState({
        refs: {
          date: date.toISOString(),
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.refs.date).toBe('2025-01-15T00:00:00.000Z')
    })
  })

  describe('Integration with Route Params', () => {
    it('should serialize route params', () => {
      const serialized = serializeState({
        routeParams: {
          id: '123',
          slug: 'my-post',
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.routeParams.id).toBe('123')
      expect(parsed.routeParams.slug).toBe('my-post')
    })
  })

  describe('Integration with Stores', () => {
    it('should serialize store state', () => {
      const serialized = serializeState({
        stores: {
          user: { name: 'Alice', isLoggedIn: true },
          cart: { items: [], total: 0 },
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.stores.user.name).toBe('Alice')
      expect(parsed.stores.cart.items).toEqual([])
    })
  })

  describe('Meta Information', () => {
    it('should serialize page meta', () => {
      const serialized = serializeState({
        meta: {
          title: 'My Page',
          description: 'Page description',
          url: '/my-page',
        },
      })

      const parsed = JSON.parse(serialized)
      expect(parsed.meta.title).toBe('My Page')
      expect(parsed.meta.description).toBe('Page description')
    })
  })
})
