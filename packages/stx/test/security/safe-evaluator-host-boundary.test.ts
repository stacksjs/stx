import { describe, expect, it } from 'bun:test'
import {
  configureSafeEvaluator,
  createSafeFunction,
  createSafeLoopFunction,
  resetSafeEvaluatorConfig,
  safeEvaluate,
  safeEvaluateCode,
  sanitizeExpression,
} from '../../src/safe-evaluator'

describe('safe evaluator host boundary (#2078)', () => {
  it('rejects server and network capabilities inherited from Bun globals', () => {
    for (const expression of [
      'Bun.spawnSync(["echo", "owned"])',
      'fetch("https://example.com")',
      'Buffer.from("owned")',
      'Deno.env.get("SECRET")',
      'WebAssembly.compile(bytes)',
      'crypto.subtle',
    ]) {
      expect(() => sanitizeExpression(expression)).toThrow()
      expect(safeEvaluate(expression, { bytes: [] })).toBeUndefined()
    }
  })

  it('does not let context values restore blocked capabilities', () => {
    expect(safeEvaluate('Bun.version', { Bun })).toBeUndefined()
    expect(safeEvaluate('fetch(url)', { fetch: () => 'called', url: '/secret' })).toBeUndefined()
  })

  it('guards dynamic bracket keys at runtime while preserving data-table access', () => {
    configureSafeEvaluator({ allowBracketNotation: true })
    try {
      expect(() => sanitizeExpression('value["name"]')).not.toThrow()
      expect(safeEvaluate('value[key]', { value: { name: 'Ada' }, key: 'name' })).toBe('Ada')
      expect(safeEvaluate('value[key]', { value: {}, key: 'constructor' })).toBeUndefined()
      expect(() => sanitizeExpression('value[key + suffix]')).toThrow('dynamic bracket notation')
      expect(() => sanitizeExpression('value["constructor"]')).toThrow('bracket key constructor')
    }
    finally {
      resetSafeEvaluatorConfig()
    }
  })

  it('rejects escaped identifiers that can hide blocked names and properties', () => {
    expect(() => sanitizeExpression(String.raw`B\u0075n.version`)).toThrow()
    expect(() => sanitizeExpression(String.raw`value.c\u006Fnstructor`)).toThrow()
  })

  it('exposes data helpers but not Object reflection escape hatches', () => {
    expect(createSafeFunction('Object.keys(value).length', ['value'])({ a: 1, b: 2 })).toBe(2)
    expect(createSafeFunction('typeof Object.getPrototypeOf', [])()).toBe('undefined')
    expect(createSafeFunction('typeof Object.getOwnPropertyDescriptor', [])()).toBe('undefined')
  })
})

describe('exported evaluator helpers share the policy (#2080)', () => {
  it('blocks host capabilities in safeEvaluateCode', () => {
    expect(safeEvaluateCode('return Bun.version', {})).toBeUndefined()
    expect(safeEvaluateCode('return fetch(url)', { url: 'https://example.com' })).toBeUndefined()
    expect(safeEvaluateCode('return Buffer.from(value)', { value: 'x' })).toBeUndefined()
  })

  it('blocks unsafe expressions interpolated by createSafeLoopFunction', () => {
    expect(() => createSafeLoopFunction(
      'for',
      'let i = 0; i < 1; i++',
      '{{ Bun.version }}',
      [],
    )).toThrow()
    const dynamic = createSafeLoopFunction(
      'for',
      'let i = 0; i < 1; i++',
      '{{ value[key] }}',
      ['value', 'key'],
    )
    expect(dynamic({ name: 'Ada' }, 'name')).toBe('Ada')
    expect(dynamic({}, 'constructor')).toBe('')
  })

  it('filters hostile context keys from loop functions', () => {
    const fn = createSafeLoopFunction('for', 'let i = 0; i < 1; i++', '{{ safe }}', ['Bun', 'safe'])
    expect(fn(Bun, 'ok')).toBe('ok')
  })

  it('rejects non-finite or injectable loop limits', () => {
    expect(() => createSafeLoopFunction('while', 'true', 'x', [], Number.NaN)).toThrow(RangeError)
    expect(() => createSafeLoopFunction('while', 'true', 'x', [], Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})
