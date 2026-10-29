import { describe, expect, it } from 'bun:test'
import { createSafeContext, createSafeFunction } from '../src/safe-evaluator'

/**
 * Two hot paths, made cheaper without changing what they answer
 * (stacksjs/stacks#3035): a context key's dangerous-name verdict is worked
 * out once and remembered, and parameters are put in canonical order by code
 * unit rather than by locale.
 */

describe('dangerous context keys, remembered', () => {
  it('drops the same keys on every call, and keeps the ones that only look alike', () => {
    const context = { constructor: 1, prototype: 2, __proto__x: 3, prototypeName: 4, ok: 5, evaluation: 6 }
    for (let call = 0; call < 3; call++) {
      const safe = createSafeContext(context)
      expect(Object.hasOwn(safe, 'constructor')).toBe(false)
      expect(Object.hasOwn(safe, 'prototype')).toBe(false)
      expect(Object.hasOwn(safe, '__proto__x')).toBe(false)
      // Word boundaries: these contain a dangerous word but are not one.
      expect(safe.prototypeName).toBe(4)
      expect(safe.evaluation).toBe(6)
      expect(safe.ok).toBe(5)
    }
  })
})

describe('parameter order', () => {
  it('evaluates the same expression correctly whatever order the keys arrive in', () => {
    const forward = createSafeFunction('a - b', ['a', 'b'])
    const reversed = createSafeFunction('a - b', ['b', 'a'])
    expect(forward(5, 2)).toBe(3)
    expect(reversed(2, 5)).toBe(3)
  })

  it('keeps upper- and lower-case names apart, where code-unit and locale order differ', () => {
    // Code-unit order puts `Bx` before `ax`; a locale compare puts `ax` first.
    // Either is canonical; what matters is that each value reaches its name.
    const keys = ['ax', 'Bx', 'bx', 'Ax']
    const evaluate = createSafeFunction('`${Ax}${Bx}${ax}${bx}`', keys)
    expect(evaluate('a', 'B', 'b', 'A')).toBe('ABab')
  })
})
