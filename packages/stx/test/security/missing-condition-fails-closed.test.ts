import { describe, expect, it } from 'bun:test'
import { processConditionals } from '../../src/conditionals'
import { safeEvaluate, safeEvaluateCondition } from '../../src/safe-evaluator'

describe('missing identifiers in conditions fail closed (#2081)', () => {
  it('does not turn a missing negated guard into true', () => {
    expect(safeEvaluateCondition('!blocked', {})).toBe(false)
    expect(safeEvaluateCondition('blocked === undefined', {})).toBe(false)
  })

  it('only fails closed when execution actually reads a missing name', () => {
    expect(safeEvaluateCondition('true || missing', {})).toBe(true)
    expect(safeEvaluateCondition('false && missing', {})).toBe(false)
  })

  it('keeps non-conditional fallback expressions working', () => {
    expect(safeEvaluate('missing || fallback', { fallback: 'ready' })).toBe('ready')
  })

  it('keeps @if content hidden and selects @else', () => {
    const output = processConditionals(
      '@if(!blocked)<p>private</p>@else<p>closed</p>@endif',
      {},
      'guard.stx',
    )
    expect(output).not.toContain('private')
    expect(output).toContain('<p>closed</p>')
  })

  it('still renders a negated guard when the value is explicitly false', () => {
    const output = processConditionals(
      '@if(!blocked)<p>open</p>@else<p>closed</p>@endif',
      { blocked: false },
      'guard.stx',
    )
    expect(output).toContain('<p>open</p>')
    expect(output).not.toContain('<p>closed</p>')
  })
})
