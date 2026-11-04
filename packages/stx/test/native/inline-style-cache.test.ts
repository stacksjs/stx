import { describe, expect, it } from 'bun:test'
import { type NativeStyleDiagnostic, parseNativeStyle, parseNativeStyleLayers } from '../../src/native/compiler/inline-style'

function parse(inputs: unknown[], inherited?: ReadonlyMap<string, string | undefined>) {
  const diagnostics: NativeStyleDiagnostic[] = []
  const result = parseNativeStyleLayers(inputs, inherited, diagnostic => diagnostics.push(diagnostic))
  return { ...result, diagnostics }
}

describe('layered native style cache (#2155)', () => {
  it.each([
    [{ ' --accent': 'red' }, { color: 'var(--accent)' }],
    ['{" \\u002d\\u002daccent":"red"}', '{"color":"\\u0076ar(--accent)"}'],
    [' --accent: red', 'color: VAR(--accent)'],
  ])('preserves declarations on cold and warm parses: %j', (...layers) => {
    for (let i = 0; i < 3; i++) {
      const result = parse(layers)
      expect(result.variables.get('--accent')).toBe('red')
      expect(result.styles).toEqual([{}, { color: 'red' }])
      expect(result.diagnostics).toEqual([])
    }
  })

  it.each(['color: VAR(--cache-inherited)', '{"color":"\\u0076ar(--cache-inherited)"}', { color: 'vAr(--cache-inherited)' }])('resolves each inherited environment for %j', (layer) => {
    for (const color of ['red', 'blue', 'green']) {
      const inherited = new Map([['--cache-inherited', color]])
      const result = parse([layer], inherited)
      expect(result.styles).toEqual([{ color }])
      expect(result.variables).toBe(inherited)
      expect(result.diagnostics).toEqual([])
    }
  })

  it.each([NaN, Infinity, -Infinity])('reports nonfinite opacity after null on every call: %s', (opacity) => {
    expect(parse([{ opacity: null }]).diagnostics).toEqual([])
    for (let i = 0; i < 3; i++) {
      expect(parse([{ opacity }])).toMatchObject({ styles: [{}], diagnostics: [{ kind: 'non-numeric-style', name: 'opacity' }] })
    }
  })

  it('uses authored entries rather than invoking an authored toJSON representation', () => {
    parse([{ color: 'red' }])
    let calls = 0
    const layer = Object.defineProperty({ color: 'blue' }, 'toJSON', { value() { calls++; return { color: 'red' } } })
    for (let i = 0; i < 3; i++) expect(parse([layer]).styles).toEqual([{ color: 'blue' }])
    expect(calls).toBe(0)
    const unknown = { opacity: 0.3, toJSON() { return { opacity: 0.3 } } }
    expect(parse([unknown]).diagnostics).toEqual([{ kind: 'unknown-style', name: 'tojson' }])
    expect(parse([unknown]).diagnostics).toEqual([{ kind: 'unknown-style', name: 'tojson' }])
  })

  it('reads root and structured getters once per invocation, even on cache hits', () => {
    let rootReads = 0
    let widthReads = 0
    let heightReads = 0
    let scaleReads = 0
    const offset = { get width() { widthReads++; return 3 }, get height() { heightReads++; return 4 } }
    const layer = { get shadowOffset() { rootReads++; return offset }, transform: [{ get scale() { scaleReads++; return 1.2 } }] }
    for (let i = 1; i <= 3; i++) {
      const result = parse([layer])
      expect(result.styles).toEqual([{ shadowOffset: { width: 3, height: 4 }, transform: [{ scale: 1.2 }] }])
      expect(result.diagnostics).toEqual([])
      expect([rootReads, widthReads, heightReads, scaleReads]).toEqual([i, i, i, i])
    }
  })

  it('does not hide invalid structured getter values behind an earlier clean entry', () => {
    parse([{ shadowOffset: { width: 0, height: 2 } }])
    let reads = 0
    const offset = { get width() { reads++; return NaN }, height: 2 }
    for (let i = 1; i <= 3; i++) {
      expect(parse([{ shadowOffset: offset }])).toMatchObject({ styles: [{}], diagnostics: [{ kind: 'non-numeric-style', name: 'shadowOffset' }] })
      expect(reads).toBe(i)
    }
  })

  it('preserves signed zero instead of aliasing its JSON representation', () => {
    parse([{ opacity: 0 }])
    expect(Object.is(parse([{ opacity: -0 }]).styles[0].opacity, -0)).toBe(true)
    parse([{ transform: [{ scale: 0 }] }])
    expect(Object.is(parse([{ transform: [{ scale: -0 }] }]).styles[0].transform?.[0].scale, -0)).toBe(true)
  })

  it.each([
    { padding: '12px', opacity: 0.4 },
    'padding:12px;opacity:.4',
    '{"padding":"12px","opacity":0.4}',
    { shadowOffset: { width: 4, height: 5 }, transform: [{ rotate: '45deg' }, { translateX: 12 }] },
  ])('retains successful cache reuse and unchanged normalization for %j', (layer) => {
    const expected = parseNativeStyle(layer)
    const first = parse([layer])
    const second = parse([layer])
    expect(first.styles[0]).toEqual(expected)
    expect(second.styles[0]).toBe(first.styles[0])
    expect(second.diagnostics).toEqual([])
  })

  it('bounds successful cache history and still parses evicted styles correctly', () => {
    const first = parse([{ padding: 314159 }]).styles[0]
    for (let i = 0; i < 2001; i++) parse([{ padding: 400000 + i }])
    const again = parse([{ padding: 314159 }]).styles[0]
    expect(again).toEqual(first)
    expect(again).not.toBe(first)
  })
})
