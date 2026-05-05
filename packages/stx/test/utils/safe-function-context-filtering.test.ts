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

  it('drops `class` (reserved word) — common HTML attribute name', () => {
    const fn = createSafeFunction('disabled', ['disabled', 'class', 'for'])
    expect(fn(true, 'btn-primary', 'email-input')).toBe(true)
    expect(fn(false, 'btn-primary', 'email-input')).toBe(false)
  })

  it('drops every other reserved word that shows up as a context key', () => {
    // A grab-bag of names that real templates use as bag keys but that
    // JS rejects in parameter position.
    const reservedKeys = ['if', 'for', 'class', 'new', 'this', 'super', 'let', 'const', 'return']
    const allKeys = ['name', ...reservedKeys, 'count']
    const fn = createSafeFunction('name + ":" + count', allKeys)
    const values = ['ok', 1, 2, 3, 4, 5, 6, 7, 8, 9, 42]
    expect(fn(...values)).toBe('ok:42')
  })

  it('drops `arguments` and `eval` (strict-mode-only reserved param names)', () => {
    const fn = createSafeFunction('x', ['x', 'arguments', 'eval'])
    expect(fn(7, [], () => 0)).toBe(7)
  })

  it('@if condition still evaluates when context has a `class` key (the real-world AppButton case)', () => {
    const result = processConditionals(
      '<button @if(disabled) disabled @endif>x</button>',
      { disabled: true, class: 'btn-primary', for: 'email' },
      'test.stx',
    )
    expect(result).not.toContain('If Error')
    expect(result).toContain('disabled')
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
