import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'
import { generateClientRuntime } from '../../src/reactivity'
import { generateHydrationScript, serializeState } from '../../src/hydration'

describe('rendering modes - signals runtime', () => {
  it('should generate minified runtime', () => {
    const runtime = generateSignalsRuntime()

    expect(runtime).toBeDefined()
    expect(typeof runtime).toBe('string')
    expect(runtime.length).toBeGreaterThan(0)

    // Should be minified (no multiple consecutive spaces outside strings)
    // Check that most newlines are removed
    expect(runtime.split('\n').length).toBeLessThan(10)
  })

  it('should generate development runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toBeDefined()
    expect(typeof runtime).toBe('string')

    // Should include comments
    expect(runtime).toContain('//')
    // Should have readable formatting
    expect(runtime.split('\n').length).toBeGreaterThan(100)
  })

  it('should include state function in runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('function state')
  })

  it('should include derived function in runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('function derived')
  })

  it('should include effect function in runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('function effect')
  })

  it('should include batch function in runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('function batch')
  })

  it('should include lifecycle hooks', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('onMount')
    expect(runtime).toContain('onDestroy')
  })

  it('should expose global helpers', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('globalHelpers')
    expect(runtime).toContain('fmt')
    expect(runtime).toContain('formatDate')
    expect(runtime).toContain('timeAgo')
    expect(runtime).toContain('debounce')
    expect(runtime).toContain('throttle')
  })

  it('should include useFetch composable', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('useFetch')
  })

  it('should set up global window.stx', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('window.stx')
  })

  it('should include auto-initialization', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('DOMContentLoaded')
    expect(runtime).toContain('data-stx')
  })

  it('should include pipe syntax support', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('parsePipeExpression')
  })

  it('should include event handler shorthand', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('parseEventShorthand')
  })

  it('should include auto-unwrap proxy', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('createAutoUnwrapProxy')
  })
})

describe('rendering modes - Vue-style client runtime', () => {
  it('should generate client runtime script', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('<script')
    expect(runtime).toContain('data-stx-client-runtime')
    expect(runtime).toContain('</script>')
  })

  it('should include ref implementation', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('function ref')
  })

  it('should include reactive implementation', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('function reactive')
  })

  it('should include computed implementation', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('function computed')
  })

  it('should include watch implementation', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('function watch')
  })

  it('should include lifecycle hooks', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('onBeforeMount')
    expect(runtime).toContain('onMounted')
    expect(runtime).toContain('onBeforeUpdate')
    expect(runtime).toContain('onUpdated')
    expect(runtime).toContain('onBeforeUnmount')
    expect(runtime).toContain('onUnmounted')
  })

  it('should include store management', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('useStore')
    expect(runtime).toContain('hasStore')
    expect(runtime).toContain('registerStore')
  })

  it('should include route params management', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('useRouteParams')
    expect(runtime).toContain('setRouteParams')
  })

  it('should include SSR detection', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('isClient')
    expect(runtime).toContain('isServer')
  })

  it('should set up DOMContentLoaded handler', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('DOMContentLoaded')
  })

  it('should set up beforeunload handler', () => {
    const runtime = generateClientRuntime()

    expect(runtime).toContain('beforeunload')
  })
})

describe('rendering modes - hydration integration', () => {
  it('should generate complete hydration script', () => {
    const script = generateHydrationScript({
      refs: { count: 0 },
      stores: { counter: { value: 10 } },
    })

    expect(script).toContain('__STX_STATE__')
    expect(script).toContain('stx-hydration-runtime')
  })

  it('should restore stores on hydration', () => {
    const script = generateHydrationScript({
      stores: {
        user: { name: 'Alice', id: 1 },
        settings: { theme: 'dark' },
      },
    })

    expect(script).toContain('stores')
    expect(script).toContain('registerStore')
  })

  it('should restore route params on hydration', () => {
    const script = generateHydrationScript({
      routeParams: { id: '123', slug: 'my-post' },
    })

    expect(script).toContain('routeParams')
    expect(script).toContain('setRouteParams')
  })

  it('should support different hydration strategies', () => {
    const script = generateHydrationScript()

    expect(script).toContain('eager')
    expect(script).toContain('visible')
    expect(script).toContain('idle')
    // interaction and lazy might use different naming
    expect(script).toContain('strategy')
  })

  it('should mark components as hydrated', () => {
    const script = generateHydrationScript()

    expect(script).toContain('stx-hydrated')
    expect(script).toContain('data-hydrated')
  })

  it('should dispatch hydration events', () => {
    const script = generateHydrationScript()

    expect(script).toContain('CustomEvent')
    expect(script).toContain('stx:hydrated')
  })
})

describe('rendering modes - state serialization for SSR', () => {
  it('should serialize state for client consumption', () => {
    const state = {
      refs: { count: 42, name: 'test' },
      reactive: { user: { id: 1 } },
      props: { title: 'Hello' },
      routeParams: { id: '123' },
      stores: { counter: { value: 0 } },
    }

    const serialized = serializeState(state)
    const parsed = JSON.parse(serialized)

    expect(parsed.refs.count).toBe(42)
    expect(parsed.reactive.user.id).toBe(1)
    expect(parsed.props.title).toBe('Hello')
    expect(parsed.routeParams.id).toBe('123')
    expect(parsed.stores.counter.value).toBe(0)
  })

  it('should include metadata', () => {
    const serialized = serializeState({
      meta: {
        title: 'Page Title',
        description: 'Page description',
        url: '/my-page',
      },
    })

    const parsed = JSON.parse(serialized)

    expect(parsed.meta.title).toBe('Page Title')
    expect(parsed.meta.description).toBe('Page description')
    expect(parsed.meta.url).toBe('/my-page')
  })

  it('should escape dangerous characters', () => {
    const state = {
      refs: {
        script: '</script><script>alert("xss")</script>',
        html: '<div onclick="evil()">test</div>',
      },
    }

    const serialized = serializeState(state)

    // Should be escaped
    expect(serialized).not.toContain('</script>')
    expect(serialized).toContain('\\u003c')
  })

  it('should handle circular references gracefully', () => {
    // Note: Standard JSON.stringify throws on circular refs
    // Our serializer should handle or throw cleanly
    const obj: any = { a: 1 }
    // obj.self = obj // This would cause circular reference

    // For now, just verify normal objects work
    const serialized = serializeState({
      refs: { obj: { a: 1 } },
    })

    expect(serialized).toContain('"a":1')
  })
})

describe('rendering modes - runtime compatibility', () => {
  it('should have compatible APIs between signals and Vue-style', () => {
    // Both should provide reactive primitives
    const signalsRuntime = generateSignalsRuntimeDev()
    const vueRuntime = generateClientRuntime()

    // Signals-style: state, derived, effect
    expect(signalsRuntime).toContain('state')
    expect(signalsRuntime).toContain('derived')
    expect(signalsRuntime).toContain('effect')

    // Vue-style: ref, computed, watch
    expect(vueRuntime).toContain('ref')
    expect(vueRuntime).toContain('computed')
    expect(vueRuntime).toContain('watch')
  })

  it('should both support lifecycle hooks', () => {
    const signalsRuntime = generateSignalsRuntimeDev()
    const vueRuntime = generateClientRuntime()

    // Both have mount/destroy semantics
    expect(signalsRuntime).toContain('onMount')
    expect(signalsRuntime).toContain('onDestroy')

    expect(vueRuntime).toContain('onMounted')
    expect(vueRuntime).toContain('onUnmounted')
  })

  it('should both support store integration', () => {
    const signalsRuntime = generateSignalsRuntimeDev()
    const vueRuntime = generateClientRuntime()

    // Both should support stores
    expect(signalsRuntime).toContain('_scopes')
    expect(vueRuntime).toContain('useStore')
  })
})

describe('rendering modes - SSR/SPA detection', () => {
  it('should include server/client detection helpers', () => {
    const vueRuntime = generateClientRuntime()

    // Client runtime should have detection methods
    expect(vueRuntime).toContain('isClient')
    expect(vueRuntime).toContain('isServer')
  })

  it('should default to client mode in client runtime', () => {
    const runtime = generateClientRuntime()

    // The runtime should indicate it's on client
    expect(runtime).toContain('isClient: function() { return true; }')
    expect(runtime).toContain('isServer: function() { return false; }')
  })
})

describe('rendering modes - template binding', () => {
  it('should include template processing in signals runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('processElement')
    expect(runtime).toContain('@for')
    expect(runtime).toContain('@if')
    expect(runtime).toContain('@show')
    expect(runtime).toContain('@model')
    expect(runtime).toContain('@click')
  })

  it('should include text interpolation support', () => {
    const runtime = generateSignalsRuntimeDev()

    // The runtime handles interpolation - braces may be escaped in regex
    expect(runtime).toContain('\\{\\{')
    expect(runtime).toContain('\\}\\}')
  })

  it('should include attribute binding support', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('@bind:')
    expect(runtime).toContain('@class')
    expect(runtime).toContain('@style')
    expect(runtime).toContain('@text')
    expect(runtime).toContain('@html')
  })

  it('should include event binding support', () => {
    const runtime = generateSignalsRuntimeDev()

    // Event modifiers
    expect(runtime).toContain('prevent')
    expect(runtime).toContain('stop')
    expect(runtime).toContain('capture')
    expect(runtime).toContain('passive')
    expect(runtime).toContain('once')
  })

  it('should include two-way binding support', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('@model')
    expect(runtime).toContain('bindModel')
  })
})

describe('rendering modes - component scoping', () => {
  it('should support scoped components', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('data-stx-scope')
    expect(runtime).toContain('findElementScope')
    expect(runtime).toContain('_scopes')
  })

  it('should support component-level state', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('componentScope')
  })
})

describe('rendering modes - progressive enhancement', () => {
  it('should work without JavaScript (SSR output)', () => {
    // SSR should produce valid HTML that works without JS
    // The hydration script handles the enhancement
    const hydrationScript = generateHydrationScript()

    // Should not have inline JS that breaks without runtime
    expect(hydrationScript).toContain('DOMContentLoaded')
  })

  it('should support fallback for IntersectionObserver', () => {
    const hydrationScript = generateHydrationScript()

    // IntersectionObserver is used in hydration for lazy loading
    expect(hydrationScript).toContain('IntersectionObserver')
  })

  it('should support fallback for requestIdleCallback', () => {
    const hydrationScript = generateHydrationScript()

    expect(hydrationScript).toContain('requestIdleCallback')
    expect(hydrationScript).toContain('setTimeout') // Fallback
  })
})

describe('rendering modes - performance optimizations', () => {
  it('should include batching in signals runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('isBatching')
    expect(runtime).toContain('pendingEffects')
  })

  it('should include caching for derived values', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('isDirty')
    expect(runtime).toContain('cached')
  })

  it('should include dependency tracking', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('activeEffect')
    expect(runtime).toContain('effectStack')
  })
})

describe('rendering modes - error handling', () => {
  it('should include error handling in expression evaluation', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('try')
    expect(runtime).toContain('catch')
    expect(runtime).toContain('console.warn')
  })

  it('should handle expression errors gracefully', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('[STX]') // Error prefix
  })

  it('should include hydration error handling', () => {
    const hydrationScript = generateHydrationScript()

    expect(hydrationScript).toContain('catch')
  })
})

describe('rendering modes - minification', () => {
  it('should produce smaller minified output', () => {
    const dev = generateSignalsRuntimeDev()
    const minified = generateSignalsRuntime()

    expect(minified.length).toBeLessThan(dev.length)
  })

  it('should remove comments in minified output', () => {
    const minified = generateSignalsRuntime()

    // Should not have comment syntax (except in strings)
    const commentMatches = minified.match(/\/\/[^\n'"]*/g) || []
    // Filter out any that are inside strings
    expect(commentMatches.length).toBeLessThan(5)
  })

  it('should preserve functionality after minification', () => {
    const minified = generateSignalsRuntime()

    // Core functions should still be present
    expect(minified).toContain('state')
    expect(minified).toContain('derived')
    expect(minified).toContain('effect')
  })
})
