import { describe, expect, it } from 'bun:test'
import { processConditionals } from '../../src/conditionals'
import { createSafeFunction } from '../../src/safe-evaluator'

/**
 * Context coming from real templates often includes keys that look fine in
 * HTML (`passed-class`, `data-id`, `aria-label`) but are invalid JavaScript
 * identifiers. Before this fix, `new Function('passed-class', '...')` threw
 * "Unexpected token '-'. Expected a ')' or a ',' after a parameter
 * declaration." inside every `@if` / `{{ }}` evaluation as soon as the
 * surrounding context contained one such key — a single hyphenated entry
 * silently broke every directive in the template.
 */
describe('createSafeFunction — context key filtering', () => {
  it('skips hyphenated keys instead of throwing on `new Function`', () => {
    const fn = createSafeFunction('loading', ['loading', 'passed-class', 'foo'])
    // Values are positional alongside the original keys array.
    expect(fn(true, 'primary', 'bar')).toBe(true)
    expect(fn(false, 'primary', 'bar')).toBe(false)
  })

  it('handles colliding-position values (filtered key dropped, neighbours preserved)', () => {
    const fn = createSafeFunction('a + b', ['a', 'data-id', 'b'])
    expect(fn(1, 'XYZ', 4)).toBe(5)
  })

  it('drops keys that start with a digit', () => {
    const fn = createSafeFunction('count', ['count', '1bad', 'good'])
    expect(fn(7, 'meh', 'ok')).toBe(7)
  })

  it('drops keys with dots', () => {
    const fn = createSafeFunction('count', ['count', 'foo.bar'])
    expect(fn(3, 'baz')).toBe(3)
  })

  it('preserves $ and _ as valid identifier chars', () => {
    const fn = createSafeFunction('$x + _y', ['$x', '_y'])
    expect(fn(2, 3)).toBe(5)
  })
})

describe('processConditionals — robust to hyphenated context keys', () => {
  it('@if condition still evaluates when context has a hyphenated entry', () => {
    const result = processConditionals(
      '<button @if(loading) disabled @endif>x</button>',
      { loading: true, 'passed-class': 'primary' },
      'test.stx',
    )
    expect(result).not.toContain('If Error')
    expect(result).toContain('disabled')
  })

  it('@if/@else branches correctly with multiple hyphenated keys', () => {
    const tpl = '@if(active)<a/>@else<b/>@endif'
    const ctxTrue = { active: true, 'data-id': 1, 'aria-label': 'x' }
    const ctxFalse = { active: false, 'data-id': 1, 'aria-label': 'x' }
    expect(processConditionals(tpl, ctxTrue, 'test.stx')).toContain('<a/>')
    expect(processConditionals(tpl, ctxFalse, 'test.stx')).toContain('<b/>')
  })
})
