/**
 * Integration tests for STX template improvements
 * Tests features working together in realistic scenarios
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('Template Improvements Integration', () => {
  describe('Pipe syntax with global helpers', () => {
    it('should have fmt helper available for pipes', () => {
      const runtime = generateSignalsRuntimeDev()
      // Verify fmt is in globalHelpers and can be used in pipes
      expect(runtime).toContain('fmt(n)')
      expect(runtime).toContain('globalHelpers[pipe.name]')
    })

    it('should support chained pipes', () => {
      const runtime = generateSignalsRuntimeDev()
      // Verify pipe parsing supports chains
      expect(runtime).toContain('pipeChain.split')
    })
  })

  describe('Auto-unwrap with @for loops', () => {
    it('should inject globalHelpers into @for scope', () => {
      const runtime = generateSignalsRuntimeDev()
      // Verify globalHelpers is included in @for scope
      expect(runtime).toContain('...globalHelpers, ...extraScope')
    })

    it('should support @for with @loading state', () => {
      const runtime = generateSignalsRuntimeDev()
      // Verify @loading works with @for
      expect(runtime).toContain('loadingExpr')
      expect(runtime).toContain('showLoading()')
    })
  })

  describe(':attr shorthand with reactive expressions', () => {
    it('should process :attr like @bind:attr', () => {
      const runtime = generateSignalsRuntimeDev()
      // Both syntaxes should use the same binding logic
      expect(runtime).toContain("name.startsWith('@bind:') || (name.startsWith(':') && !name.startsWith('::'))")
    })

    it('should use auto-unwrap in attribute bindings', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('createAutoUnwrapProxy(attrCapturedScope)')
    })
  })

  describe('Event handlers with shorthand syntax', () => {
    it('should support all shorthand operators', () => {
      const runtime = generateSignalsRuntimeDev()
      // Verify all shorthand patterns are supported
      expect(runtime).toContain('!signal()')  // toggle
      expect(runtime).toContain('signal.update(n => n + 1)')  // increment
      expect(runtime).toContain('signal.update(n => n - 1)')  // decrement
      expect(runtime).toContain("case '+':")  // += operator
      expect(runtime).toContain("case '-':")  // -= operator
      expect(runtime).toContain("case '*':")  // *= operator
      expect(runtime).toContain("case '/':")  // /= operator
    })
  })

  describe('useFetch with signal reactivity', () => {
    it('should create reactive signals for data, loading, error', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('const data = state(options.initialData')
      expect(runtime).toContain('const loading = state(true)')
      expect(runtime).toContain('const error = state(null)')
    })

    it('should support reactive URL function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("typeof urlOrFn === 'function'")
      expect(runtime).toContain('effect(() => {')
    })
  })

  describe('$computed and $watch helpers', () => {
    it('should expose $computed globally', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('window.$computed = $computed')
    })

    it('should expose $watch globally', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('window.$watch = $watch')
    })

    it('should have $computed return derived signal', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function $computed(fn)')
      expect(runtime).toContain('return derived(fn)')
    })
  })

  describe('Complete API surface', () => {
    it('should expose all new features on window.stx', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('useFetch,')
      expect(runtime).toContain('$computed,')
      expect(runtime).toContain('$watch,')
      expect(runtime).toContain('helpers: globalHelpers')
    })

    it('should expose globals on window for convenience', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('window.useFetch = useFetch')
      expect(runtime).toContain('window.$computed = $computed')
      expect(runtime).toContain('window.$watch = $watch')
    })
  })
})

describe('Helper Functions', () => {
  describe('fmt helper', () => {
    it('should format numbers with K suffix', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("+ 'K'")
    })

    it('should format numbers with M suffix', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("+ 'M'")
    })

    it('should handle null/undefined', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("if (n == null) return '0'")
    })
  })

  describe('formatDate helper', () => {
    it('should support custom format string', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("format = 'YYYY-MM-DD'")
    })

    it('should handle invalid dates', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("if (isNaN(d.getTime())) return ''")
    })
  })

  describe('timeAgo helper', () => {
    it('should format recent times as "just now"', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("return 'just now'")
    })

    it('should format minutes ago', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("+ 'm ago'")
    })
  })

  describe('debounce and throttle helpers', () => {
    it('should have debounce with configurable delay', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('debounce(fn, delay = 300)')
    })

    it('should have throttle with configurable limit', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('throttle(fn, limit = 300)')
    })
  })

  describe('String helpers', () => {
    it('should have capitalize helper', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('capitalize(str)')
    })

    it('should have truncate helper with suffix', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("truncate(str, length = 50, suffix = '...')")
    })
  })

  describe('Formatting helpers', () => {
    it('should have currency helper', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("currency(value, symbol = '$', decimals = 2)")
    })

    it('should have percent helper', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('percent(value, decimals = 0)')
    })

    it('should have pluralize helper', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('pluralize(count, singular, plural)')
    })

    it('should have clamp helper', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('clamp(value, min, max)')
    })

    it('should have json helper', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('json(value, indent = 2)')
    })
  })
})

describe('@for directive enhancements', () => {
  describe('@loading state', () => {
    it('should parse @loading attribute', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("el.getAttribute('@loading')")
    })

    it('should look for @for-loading sibling', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("hasAttribute('@for-loading')")
    })

    it('should clone and show loading template', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('loadingTemplate.cloneNode(true)')
      expect(runtime).toContain('parent.insertBefore(loadingElement, placeholder)')
    })
  })

  describe('@empty state', () => {
    it('should parse @empty attribute', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("el.getAttribute('@empty')")
    })

    it('should look for @for-empty sibling', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("hasAttribute('@for-empty')")
    })

    it('should show empty state when list is empty', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('if (list.length === 0)')
      expect(runtime).toContain('showEmpty()')
    })

    it('should support @empty as inline text', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('evalExpr(emptyExpr)')
      expect(runtime).toContain('document.createTextNode(emptyContent)')
    })
  })
})
