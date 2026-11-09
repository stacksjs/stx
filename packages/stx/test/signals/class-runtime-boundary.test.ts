import { describe, expect, it } from 'bun:test'
import { SIGNALS_NATIVE_ROW_RUNTIME } from '../../src/client/signals-native-row-runtime'
import { SIGNALS_CLASS_RUNTIME } from '../../src/client/signals-class-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals class runtime boundary', () => {
  it('assembles the class fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_CLASS_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_CLASS_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps object, array, and string class forms together', () => {
    expect(SIGNALS_CLASS_RUNTIME).toContain('function bindClass(el, expr')
    expect(SIGNALS_CLASS_RUNTIME).toContain("typeof value === 'object'")
    expect(SIGNALS_CLASS_RUNTIME).toContain('Array.isArray(value)')
    expect(SIGNALS_CLASS_RUNTIME).toContain('createExpressionAutoUnwrapProxy(capturedScope, expr)')
  })
})

// SVG exposes a read-only animated object as className. Exercise that DOM
// contract rather than a string-valued HTML stand-in, including repeated updates.
it('updates SVG string and array classes without coercing SVGAnimatedString', () => {
  const rerun: Array<() => void> = []
  const scope = { classes: () => 'selected' as string | string[] }
  let attribute = 'static'
  const svg = {
    get className() { return { baseVal: attribute, toString: () => '[object SVGAnimatedString]' } },
    set className(value) { throw new TypeError('SVG className is read-only: ' + typeof value) },
    getAttribute: () => attribute,
    setAttribute: (_name: string, value: string) => { attribute = value },
  }
  const bind = new Function('effect', 'layerTemplateScopes', 'globalHelpers', 'componentScope', 'findElementScope', '__stxNamesIn', '__stxCompile', 'createExpressionAutoUnwrapProxy', `${SIGNALS_CLASS_RUNTIME}; return bindClass`)(
    (callback: () => void) => { rerun.push(callback); callback() },
    (_helpers: unknown, passed: unknown) => passed,
    {}, scope, () => scope, () => ['classes'],
    (keys: string[], body: string) => new Function(...keys, body),
    (passed: unknown) => passed,
  )
  bind(svg, 'classes()')
  expect(attribute).toBe('static selected')
  scope.classes = () => ['active', 'related']
  rerun[0]!()
  expect(attribute).toBe('static active related')
  scope.classes = () => ''
  rerun[0]!()
  expect(attribute).toBe('static')
})

it('applies the same SVG contract inside planned rows', () => {
  const start = SIGNALS_NATIVE_ROW_RUNTIME.indexOf('  function bindRowClass(')
  const end = SIGNALS_NATIVE_ROW_RUNTIME.indexOf('  // bindIf', start)
  let attribute = 'row'
  let current: string | string[] = 'queued'
  let update = () => {}
  const svg = {
    get className() { return { baseVal: attribute } },
    getAttribute: () => attribute,
    setAttribute: (name: string, value: string) => { if (name === 'class') attribute = value },
  }
  const bind = new Function('effect', 'evaluateRowSite', SIGNALS_NATIVE_ROW_RUNTIME.slice(start, end) + '; return bindRowClass')(
    (callback: () => void) => { update = callback; callback() }, () => current,
  )
  bind(svg, {}, { local: {} }, () => true)
  expect(attribute).toBe('row queued')
  current = ['running', 'selected']
  update()
  expect(attribute).toBe('row running selected')
})
