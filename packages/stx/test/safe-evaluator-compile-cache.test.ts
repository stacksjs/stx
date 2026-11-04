/**
 * Compiled expression functions are cached, and the cache does not collide
 * (stacksjs/stx#1945).
 *
 * `new Function` is a compile — it parses the source and allocates a code
 * object. One render of a component-dense page did that 5,666 times for 106
 * distinct sources, a 53x redundancy, which was the largest remaining cost on
 * this issue once the string copies were gone. Compiled bodies are memoised now.
 *
 * A cache is only sound if the key covers everything the compiled function
 * depends on. It depends on two things: the source, and the PARAMETER NAMES,
 * because those are what bind the caller's positional values to identifiers in
 * the expression. Keying on the source alone silently evaluates one expression
 * against another's variables — the same values, read under the wrong names.
 */

import { describe, expect, it, spyOn } from 'bun:test'
import { configureSafeEvaluator, createSafeFunction, resetSafeEvaluatorConfig, safeEvaluateCondition } from '../src/safe-evaluator'

describe('the compiled-expression cache', () => {
  it('returns the same answer on a repeat call', async () => {
    const first = createSafeFunction('a + b', ['a', 'b'])
    const second = createSafeFunction('a + b', ['a', 'b'])

    expect(await first(2, 3)).toBe(5)
    expect(await second(10, 20)).toBe(30)
  })

  it('does not confuse two expressions that share a parameter list', async () => {
    const sum = createSafeFunction('a + b', ['a', 'b'])
    const product = createSafeFunction('a * b', ['a', 'b'])

    expect(await sum(3, 4)).toBe(7)
    expect(await product(3, 4)).toBe(12)
  })

  it('does not reuse a compile across different parameter names', async () => {
    // Same source text, different bindings. Keyed on the source alone, the
    // second call would read `x`/`y` positionally under the names `a`/`b` --
    // right values, wrong identifiers, and `undefined` for anything the first
    // signature did not declare.
    const asAB = createSafeFunction('a - b', ['a', 'b'])
    expect(await asAB(10, 4)).toBe(6)

    const asBA = createSafeFunction('a - b', ['b', 'a'])
    // Arguments are positional: b=10, a=4, so a - b is 4 - 10.
    expect(await asBA(10, 4)).toBe(-6)
  })

  it('keeps parameter count part of the identity', async () => {
    const two = createSafeFunction('a + b', ['a', 'b'])
    const three = createSafeFunction('a + b', ['a', 'b', 'c'])

    expect(await two(1, 2)).toBe(3)
    expect(await three(1, 2, 99)).toBe(3)
  })
})


describe('expression preparation cache (#2158)', () => {
  it('reuses validation and preparation without retaining argument values', () => {
    const trim = spyOn(String.prototype, 'trim')
    try {
      const first = createSafeFunction('cachedPlanValue + 17', ['cachedPlanValue'])
      const preparationCalls = trim.mock.calls.length
      expect(preparationCalls).toBeGreaterThan(0)
      const second = createSafeFunction('cachedPlanValue + 17', ['cachedPlanValue'])
      expect(trim.mock.calls.length).toBe(preparationCalls)
      expect(first(2)).toBe(19)
      expect(second(9)).toBe(26)
    }
    finally {
      trim.mockRestore()
    }
  })

  it('isolates missing-identifier callbacks and keeps every condition fail-closed', () => {
    const firstMissing: string[] = []
    const secondMissing: string[] = []
    const first = createSafeFunction('!missingPlanGuard && value', ['value'], name => firstMissing.push(name))
    const second = createSafeFunction('!missingPlanGuard && value', ['value'], name => secondMissing.push(name))
    expect(first(1)).toBe(1)
    expect(second(2)).toBe(2)
    expect(firstMissing).toEqual(['missingPlanGuard'])
    expect(secondMissing).toEqual(['missingPlanGuard'])
    for (let i = 0; i < 3; i++) {
      expect(safeEvaluateCondition('!missingPlanGuard && value', { value: true })).toBe(false)
      expect(safeEvaluateCondition('!missingPlanGuard && value', { value: true, missingPlanGuard: false })).toBe(true)
    }
  })

  it('snapshots positional keys and never aliases different context signatures', () => {
    const keys = ['b', 'a', 'data-id']
    const first = createSafeFunction('a - b + 11', keys)
    keys.reverse()
    const reversed = createSafeFunction('a - b + 11', keys)
    expect(first(2, 7, 99)).toBe(16)
    expect(reversed(99, 7, 2)).toBe(16)
    expect(createSafeFunction('a - b + 11', ['b', 'a', 'data-id'])(5, 3, 99)).toBe(9)
  })

  it('invalidates validation after configuration changes and still guards runtime keys', () => {
    try {
      configureSafeEvaluator({ allowBracketNotation: true })
      expect(createSafeFunction('planObject["label"]', ['planObject'])({ label: 'first' })).toBe('first')
      resetSafeEvaluatorConfig()
      expect(() => createSafeFunction('planObject["label"]', ['planObject'])).toThrow()
      configureSafeEvaluator({ allowBracketNotation: true })
      expect(createSafeFunction('planObject["label"]', ['planObject'])({ label: 'second' })).toBe('second')
      const first = createSafeFunction('planObject[planKey]', ['planObject', 'planKey'])
      const second = createSafeFunction('planObject[planKey]', ['planObject', 'planKey'])
      expect(first({ label: 'safe' }, 'label')).toBe('safe')
      expect(second({}, 'constructor')).toBeUndefined()
      expect(second({}, '__proto__')).toBeUndefined()
    }
    finally {
      resetSafeEvaluatorConfig()
    }
  })
})
