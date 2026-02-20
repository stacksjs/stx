/**
 * Comprehensive tests for STX template improvements
 * Features:
 * 1. Auto-unwrap signals in expressions
 * 2. Pipe syntax for formatters
 * 3. @for with @loading and @empty states
 * 4. :attr shorthand for dynamic binding
 * 5. Global helpers auto-injected
 * 6. Declarative data fetching (useFetch)
 * 7. Computed/derived shorthand ($: prefix)
 * 8. Event handler shorthand (count++, !visible)
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'

describe('Feature #1: Auto-unwrap signals in expressions', () => {
  it('should have createAutoUnwrapProxy function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('function createAutoUnwrapProxy(scope)')
  })

  it('should auto-unwrap signals when accessed via proxy', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('val._isSignal || val._isDerived')
    expect(runtime).toContain('return val()')
  })

  it('should use auto-unwrap proxy in toValue function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('createAutoUnwrapProxy(baseScope)')
    expect(runtime).toContain('enableAutoUnwrap')
  })

  it('should use auto-unwrap proxy in text interpolation', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('const unwrapScope = createAutoUnwrapProxy(capturedScope)')
  })
})

describe('Feature #2: Pipe syntax for formatters', () => {
  it('should have parsePipeExpression function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('function parsePipeExpression(expr, scope)')
  })

  it('should have executePipeExpression function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('function executePipeExpression(valueExpr, pipes, scope)')
  })

  it('should parse pipe expressions with regex', () => {
    const runtime = generateSignalsRuntimeDev()
    // Check for pipe parsing pattern
    expect(runtime).toContain('pipeIndex')
    expect(runtime).toContain('pipeChain')
  })

  it('should support pipe arguments with colon syntax', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("split(':')")
  })

  it('should use globalHelpers for pipe filters', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('globalHelpers[pipe.name]')
  })

  it('should use pipe syntax in text interpolation', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('parsePipeExpression(expr, capturedScope)')
    expect(runtime).toContain('executePipeExpression(pipeResult.valueExpr')
  })

  it('should use pipe syntax in attribute expressions', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('parsePipeExpression(expr, attrCapturedScope)')
  })
})

describe('Feature #3: @for with @loading and @empty states', () => {
  it('should check for @loading attribute on @for element', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("el.getAttribute('@loading')")
    expect(runtime).toContain('loadingExpr')
  })

  it('should check for @empty attribute on @for element', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("el.getAttribute('@empty')")
    expect(runtime).toContain('emptyExpr')
  })

  it('should look for @for-loading sibling element', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("hasAttribute('@for-loading')")
    expect(runtime).toContain('loadingTemplate')
  })

  it('should look for @for-empty sibling element', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("hasAttribute('@for-empty')")
    expect(runtime).toContain('emptyTemplate')
  })

  it('should have showLoading and hideLoading helpers', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('const showLoading = () =>')
    expect(runtime).toContain('const hideLoading = () =>')
  })

  it('should have showEmpty and hideEmpty helpers', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('const showEmpty = () =>')
    expect(runtime).toContain('const hideEmpty = () =>')
  })

  it('should show loading state when loading expression is true', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('if (loadingExpr)')
    expect(runtime).toContain('const isLoading = evalExpr(loadingExpr)')
    expect(runtime).toContain('showLoading()')
  })

  it('should show empty state when list is empty', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('if (list.length === 0)')
    expect(runtime).toContain('showEmpty()')
  })
})

describe('Feature #4: :attr shorthand for dynamic binding', () => {
  it('should handle :attr as alias for @bind:attr', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("name.startsWith(':')")
    expect(runtime).toContain("name.startsWith('@bind:')")
  })

  it('should extract attribute name correctly for :attr', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("name.startsWith('@bind:') ? name.slice(6) : name.slice(1)")
  })

  it('should not confuse :: pseudo-elements with :attr', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("!name.startsWith('::')")
  })
})

describe('Feature #5: Global helpers auto-injected', () => {
  it('should define globalHelpers object', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('const globalHelpers = {')
  })

  it('should have fmt helper for number formatting', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('fmt(n)')
    expect(runtime).toContain("1000000) return (n / 1000000).toFixed(1) + 'M'")
    expect(runtime).toContain("1000) return (n / 1000).toFixed(1) + 'K'")
  })

  it('should have formatDate helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("formatDate(date, format = 'YYYY-MM-DD')")
    expect(runtime).toContain("replace('YYYY', year)")
  })

  it('should have timeAgo helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('timeAgo(date)')
    expect(runtime).toContain("'just now'")
    expect(runtime).toContain("+ 'm ago'")
    expect(runtime).toContain("+ 'h ago'")
    expect(runtime).toContain("+ 'd ago'")
  })

  it('should have debounce helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('debounce(fn, delay = 300)')
    expect(runtime).toContain('clearTimeout(timeout)')
  })

  it('should have throttle helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('throttle(fn, limit = 300)')
    expect(runtime).toContain('inThrottle')
  })

  it('should have capitalize helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('capitalize(str)')
    expect(runtime).toContain('charAt(0).toUpperCase()')
  })

  it('should have truncate helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("truncate(str, length = 50, suffix = '...')")
  })

  it('should have json helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('json(value, indent = 2)')
    expect(runtime).toContain('JSON.stringify(value, null, indent)')
  })

  it('should have pluralize helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('pluralize(count, singular, plural)')
    expect(runtime).toContain("singular + 's'")
  })

  it('should have clamp helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('clamp(value, min, max)')
    expect(runtime).toContain('Math.min(Math.max(value, min), max)')
  })

  it('should have currency helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("currency(value, symbol = '$', decimals = 2)")
  })

  it('should have percent helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('percent(value, decimals = 0)')
    expect(runtime).toContain("+ '%'")
  })

  it('should inject globalHelpers into text interpolation scope', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('...globalHelpers')
  })
})

describe('Feature #6: Declarative data fetching (useFetch)', () => {
  it('should have useFetch function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('function useFetch(urlOrFn, options = {})')
  })

  it('should return data, loading, and error signals', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('const data = state(options.initialData')
    expect(runtime).toContain('const loading = state(true)')
    expect(runtime).toContain('const error = state(null)')
  })

  it('should have fetchData async function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('const fetchData = async () =>')
  })

  it('should support transform option', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('options.transform')
    expect(runtime).toContain('options.transform(result)')
  })

  it('should auto-fetch on mount', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('onMount(fetchData)')
  })

  it('should support url as function for reactive fetching', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("typeof urlOrFn === 'function'")
  })

  it('should return refetch function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('refetch: fetchData')
  })

  it('should expose useFetch on window.stx', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('useFetch,')
    expect(runtime).toContain('window.useFetch = useFetch')
  })
})

describe('Feature #7: Computed/derived shorthand ($: prefix)', () => {
  it('should have $computed function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('function $computed(fn)')
  })

  it('should $computed call derived internally', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('return derived(fn)')
  })

  it('should have $watch function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('function $watch(deps, fn)')
  })

  it('should expose $computed on window', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('window.$computed = $computed')
  })

  it('should expose $watch on window', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('window.$watch = $watch')
  })
})

describe('Feature #8: Event handler shorthand', () => {
  it('should have parseEventShorthand function', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('function parseEventShorthand(expr, scope)')
  })

  it('should handle !variable toggle syntax', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('/^!\\w+$/')
    expect(runtime).toContain('signal.set(!signal())')
  })

  it('should handle variable++ increment syntax', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('/^\\w+\\+\\+$/')
    expect(runtime).toContain('signal.update(n => n + 1)')
  })

  it('should handle variable-- decrement syntax', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('/^\\w+--$/')
    expect(runtime).toContain('signal.update(n => n - 1)')
  })

  it('should handle += operator', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("case '+':")
    expect(runtime).toContain('return n + addValue')
  })

  it('should handle -= operator', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("case '-':")
    expect(runtime).toContain('return n - addValue')
  })

  it('should handle simple assignment', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('simpleAssignMatch')
    expect(runtime).toContain('signal.set(newValue)')
  })

  it('should use parseEventShorthand in executeHandler', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('const shorthandFn = parseEventShorthand(expr, scope)')
  })
})

describe('Minified runtime compatibility', () => {
  it('should produce valid minified output with new features', () => {
    const minified = generateSignalsRuntime()
    expect(minified).toBeTruthy()
    expect(minified.length).toBeLessThan(generateSignalsRuntimeDev().length)
  })

  it('should preserve globalHelpers in minified form', () => {
    const minified = generateSignalsRuntime()
    expect(minified).toContain('globalHelpers')
    expect(minified).toContain('fmt')
    expect(minified).toContain('formatDate')
    expect(minified).toContain('debounce')
  })

  it('should preserve useFetch in minified form', () => {
    const minified = generateSignalsRuntime()
    expect(minified).toContain('useFetch')
  })

  it('should preserve $computed in minified form', () => {
    const minified = generateSignalsRuntime()
    expect(minified).toContain('$computed')
  })
})

describe('Integration: Features working together', () => {
  it('should have all core functions exposed on window.stx', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('window.stx = {')
    expect(runtime).toContain('state,')
    expect(runtime).toContain('derived,')
    expect(runtime).toContain('effect,')
    expect(runtime).toContain('batch,')
    expect(runtime).toContain('useFetch,')
    expect(runtime).toContain('$computed,')
    expect(runtime).toContain('$watch,')
    expect(runtime).toContain('helpers: globalHelpers')
  })

  it('should have core functions exposed globally on window', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('window.state = state')
    expect(runtime).toContain('window.derived = derived')
    expect(runtime).toContain('window.effect = effect')
    expect(runtime).toContain('window.batch = batch')
    expect(runtime).toContain('window.onMount = onMount')
    expect(runtime).toContain('window.onDestroy = onDestroy')
    expect(runtime).toContain('window.useFetch = useFetch')
    expect(runtime).toContain('window.$computed = $computed')
    expect(runtime).toContain('window.$watch = $watch')
  })
})
