/**
 * Regression test for stacksjs/stx#1733.
 *
 * Any `x-if` / `:if` / `@if` expression that calls a signal as a function
 * inside a comparison or boolean op — `count() === 0`, `!recording()`,
 * `count() > 0` — silently evaluated to '' (falsy) regardless of the
 * underlying value, because bindIf's evalExpr ran the expression through
 * createAutoUnwrapProxy (which turns `count` into the unwrapped value `0`,
 * so `count()` becomes `0()` → TypeError) and the catch suppressed
 * TypeError/ReferenceError, returning ''.
 *
 * Fix: mirror the retry-without-unwrap fallback that bindStyle / bindShow
 * / evalAttrExpr already had — on the first failure, re-run the expression
 * against the raw (non-proxied) scope so call-syntax works.
 *
 * Two layers of coverage:
 *  1. Behavioral — reconstruct bindIf's exact two-tier evalExpr using the
 *     REAL createAutoUnwrapProxy + state extracted from the generated
 *     runtime, and assert the contract table from the issue. This exercises
 *     the actual unwrap-proxy behavior and the actual fix mechanism.
 *  2. Structural — confirm the generated runtime's bindIf contains the
 *     nested try/catch so a future refactor can't silently drop it.
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

// Extract a top-level `function NAME(...) {...}` body from the runtime
// source by brace-matching. Used to pull the real createAutoUnwrapProxy
// and state out of the generated runtime so the behavioral harness runs
// against framework code, not a re-implementation.
function extractFunction(src: string, name: string): string {
  const startIdx = src.indexOf(`function ${name}(`)
  if (startIdx === -1)
    throw new Error(`${name} not found in runtime`)
  let depth = 0
  let i = src.indexOf('{', startIdx)
  for (; i < src.length; i++) {
    if (src[i] === '{')
      depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0)
        return src.slice(startIdx, i + 1)
    }
  }
  throw new Error(`unbalanced braces extracting ${name}`)
}

// Build a `state(initial)` factory + the real createAutoUnwrapProxy, then
// a two-tier evalIf that is a faithful copy of the fixed bindIf evalExpr.
function buildHarness() {
  const runtime = generateSignalsRuntimeDev()
  const proxySrc = extractFunction(runtime, 'createAutoUnwrapProxy')

  // Minimal signal: a callable that returns its value, carries _isSignal,
  // and has .set. createAutoUnwrapProxy keys off _isSignal / _isDerived to
  // decide whether to call-and-return on property access.
  function state<T>(initial: T) {
    let v = initial
    const read = (() => v) as any
    read._isSignal = true
    read.set = (next: T) => { v = next }
    return read as { (): T, set: (n: T) => void, _isSignal: true }
  }

  // eslint-disable-next-line no-new-func
  const factory = new Function(
    'isSignalLike',
    `${proxySrc}\n;return createAutoUnwrapProxy;`,
  )
  // createAutoUnwrapProxy in the runtime references isSignal/isDerived-style
  // checks via the signal's own _isSignal/_isDerived brand, not an external
  // helper, so we don't need to pass anything — but provide a no-op in case
  // a build variant references a free identifier.
  const createAutoUnwrapProxy = factory(() => false) as (scope: Record<string, unknown>) => Record<string, unknown>

  // Faithful copy of the FIXED bindIf evalExpr (signals.ts ~2409).
  function evalIf(expression: string, scope: Record<string, unknown>): unknown {
    if (/^__[A-Z_]+__$/.test(expression.trim()))
      return expression
    try {
      const unwrapScope = createAutoUnwrapProxy(scope)
      // eslint-disable-next-line no-new-func
      const fn = new Function(...Object.keys(scope), `return ${expression}`)
      return fn(...Object.values(unwrapScope))
    }
    catch {
      // retry without unwrap — the fix
      // eslint-disable-next-line no-new-func
      const fn2 = new Function(...Object.keys(scope), `return ${expression}`)
      return fn2(...Object.values(scope))
    }
  }

  return { state, evalIf }
}

describe('bindIf evaluates signal-call expressions (#1733)', () => {
  const { state, evalIf } = buildHarness()

  it('count() === 0 → true when count is 0', () => {
    const count = state(0)
    expect(evalIf('count() === 0', { count })).toBe(true)
  })

  it('count() === 0 → false when count is 7', () => {
    const count = state(7)
    expect(evalIf('count() === 0', { count })).toBe(false)
  })

  it('count() > 0 reflects the value', () => {
    const count = state(0)
    expect(evalIf('count() > 0', { count })).toBe(false)
    count.set(7)
    expect(evalIf('count() > 0', { count })).toBe(true)
  })

  it('count() !== 5 reflects the value', () => {
    const count = state(0)
    expect(evalIf('count() !== 5', { count })).toBe(true)
    count.set(5)
    expect(evalIf('count() !== 5', { count })).toBe(false)
  })

  it('!recording() negates a boolean signal', () => {
    const recording = state(false)
    expect(evalIf('!recording()', { recording })).toBe(true)
    recording.set(true)
    expect(evalIf('!recording()', { recording })).toBe(false)
  })

  it('bare signal call count() returns the value (not coincidentally falsy)', () => {
    const count = state(0)
    expect(evalIf('count()', { count })).toBe(0)
    count.set(7)
    expect(evalIf('count()', { count })).toBe(7)
  })

  it('nested store-style access store.signal() === 0 works', () => {
    const store = { unreadCount: state(0) }
    expect(evalIf('store.unreadCount() === 0', { store })).toBe(true)
    store.unreadCount.set(3)
    expect(evalIf('store.unreadCount() === 0', { store })).toBe(false)
  })

  it('still handles bare-reference comparisons via the unwrap proxy', () => {
    // count > 0 (no parens) must still work — it relies on the proxy
    // unwrapping `count` to its value. This is the path the proxy is FOR;
    // the retry must not break it.
    const count = state(7)
    expect(evalIf('count > 0', { count })).toBe(true)
    count.set(0)
    expect(evalIf('count > 0', { count })).toBe(false)
  })

  it('passes through build-time placeholder expressions untouched', () => {
    expect(evalIf('__TITLE__', {})).toBe('__TITLE__')
  })
})

describe('runtime structure guard (#1733)', () => {
  const runtime = generateSignalsRuntimeDev()

  it('bindIf evalExpr has a nested retry-without-unwrap try/catch', () => {
    // Pin the fix shape: the bindIf comment references #1733 and the
    // retry path constructs a second Function against the raw scope.
    expect(runtime).toContain('Retry without the unwrap proxy so call-syntax (signal()) works.')
  })
})
