import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { type NativeStyleDiagnostic, parseNativeStyle } from '../../src/native/compiler/inline-style'

describe('shared native inline-style normalization', () => {
  it('preserves pointer targeting across CSS, objects and class utilities', async () => {
    for (const mode of ['auto', 'none', 'box-none', 'box-only']) {
      for (const input of [{ pointerEvents: mode }, JSON.stringify({ pointerEvents: mode }), `pointer-events:${mode}`]) {
        const diagnostics: NativeStyleDiagnostic[] = []
        expect(parseNativeStyle(input, d => diagnostics.push(d))).toEqual({ pointerEvents: mode })
        expect(diagnostics).toEqual([])
      }
      const result = await translateHtmlToIR(`<div style="pointer-events:${mode}"><button>Action</button></div>`)
      expect(result.root.style.pointerEvents).toBe(mode)
      expect(result.diagnostics.filter(d => d.kind === 'unknown-style')).toEqual([])
    }
    for (const mode of ['auto', 'none']) {
      expect(compileClassStyles(`pointer-events-${mode}`)).toEqual({ style: { pointerEvents: mode }, unknown: [] })
    }
    for (const mode of ['all', 'invalid', 0, true]) {
      const diagnostics: NativeStyleDiagnostic[] = []
      expect(parseNativeStyle({ pointerEvents: mode }, d => diagnostics.push(d))).toEqual({})
      expect(diagnostics).toEqual([{ kind: 'unknown-style', name: `pointerEvents:${mode}` }])
    }
  })

  it('normalizes CSS, object and serialized object styles identically', async () => {
    const object = { paddingLeft: '12px', fontSize: '1.5rem', width: '50%', opacity: '.5', fontWeight: '700' }
    const css = 'padding-left:12px;font-size:1.5rem;width:50%;opacity:.5;font-weight:700'
    const expected = { paddingLeft: 12, fontSize: 24, width: '50%', opacity: 0.5, fontWeight: '700' }
    for (const input of [object, JSON.stringify(object), css]) {
      const diagnostics: NativeStyleDiagnostic[] = []
      expect(parseNativeStyle(input, d => diagnostics.push(d))).toEqual(expected)
      expect(diagnostics).toEqual([])
    }
    expect((await translateHtmlToIR(`<div style="${css}">text</div>`)).root.style).toEqual(expected)
    expect(parseNativeStyle({ fontWeight: 700 })).toEqual({ fontWeight: '700' })
  })

  it('preserves explicit grid row tracks in object, serialized and CSS styles', async () => {
    for (const rows of ['repeat(2, 1fr)', '1fr 1fr', 2]) {
      const expected = { display: 'grid', gridTemplateRows: rows }
      for (const input of [expected, JSON.stringify(expected)]) {
        const diagnostics: NativeStyleDiagnostic[] = []
        expect(parseNativeStyle(input, d => diagnostics.push(d))).toEqual(expected)
        expect(diagnostics).toEqual([])
      }
    }
    const css = 'display:grid;grid-template-rows:repeat(2, 1fr)'
    expect(parseNativeStyle(css)).toEqual({ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)' })
    expect((await translateHtmlToIR(`<div style="${css}"><span>row</span></div>`)).root.style)
      .toEqual({ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)' })
  })

  it('does not corrupt quoted font names or semicolons in CSS function values', () => {
    const image = 'url("data:image/svg+xml;base64,abc")'
    expect(parseNativeStyle(`background-image:${image};font-family:"A;B";padding:8px`))
      .toEqual({ backgroundImage: image, fontFamily: '"A;B"', padding: 8 })
    expect(parseNativeStyle({ fontFamily: '123', color: '123' })).toEqual({ fontFamily: '123', color: '123' })
  })

  it('reports invalid numeric values instead of emitting malformed native fields', () => {
    for (const value of ['1.2.3px', '1.2.3%', '.', NaN, Infinity, -Infinity, '1e999px', '1e999%', 'calc(100% - 8px)', {}, true]) {
      const diagnostics: NativeStyleDiagnostic[] = []
      expect(parseNativeStyle({ width: value, fontSize: value, padding: '8px' }, d => diagnostics.push(d))).toEqual({ padding: 8 })
      expect(diagnostics).toEqual([
        { kind: 'non-numeric-style', name: 'width' },
        { kind: 'non-numeric-style', name: 'fontSize' },
      ])
    }
    expect(parseNativeStyle({ marginTop: '-.5rem', width: '+2e1px', opacity: '1e-1' })).toEqual({ marginTop: -8, width: 20, opacity: 0.1 })
  })

  it('preserves valid structured styles and reports invalid transforms and offsets', () => {
    const valid = { shadowOffset: { width: 0, height: 2 }, transform: [{ translateX: 8 }, { rotate: '45deg' }, { scale: 1.5 }] }
    expect(parseNativeStyle(valid)).toEqual(valid)
    expect(parseNativeStyle({ transform: [] })).toEqual({ transform: [] })
    for (const transform of [[{ scale: Infinity }], [{ translateX: '12px' }], [{ rotate: 2 }], [{ rotate: 'bad' }], [{ madeUp: 1 }], [{ scale: 1, scaleX: 2 }]]) {
      const diagnostics: NativeStyleDiagnostic[] = []
      expect(parseNativeStyle({ transform, shadowOffset: { width: NaN, height: 2 } }, d => diagnostics.push(d))).toEqual({})
      expect(diagnostics).toHaveLength(2)
      expect(diagnostics.every(d => d.kind === 'non-numeric-style')).toBe(true)
    }
  })

  it('reports unsupported keys and values while allowing bound styles to clear', () => {
    const diagnostics: NativeStyleDiagnostic[] = []
    expect(parseNativeStyle({ padding: null, margin: '', color: undefined, cursor: 'pointer', '--token': 2 }, d => diagnostics.push(d))).toEqual({})
    expect(diagnostics).toEqual([{ kind: 'unknown-style', name: 'cursor' }, { kind: 'unknown-style', name: '--token' }])
    for (const input of [null, undefined, false, '', {}]) expect(parseNativeStyle(input)).toEqual({})
    expect(parseNativeStyle([{}], d => diagnostics.push(d))).toEqual({})
    expect(diagnostics.at(-1)).toEqual({ kind: 'non-numeric-style', name: 'style' })
  })

  it('decodes entities only at the compiled HTML boundary', async () => {
    const html = await translateHtmlToIR('<div style="font-family:A&amp;B;padding:bad;cursor:pointer">text</div>')
    expect(html.root.style).toEqual({ fontFamily: 'A&B' })
    expect(html.diagnostics).toContainEqual({ kind: 'non-numeric-style', tag: 'div', name: 'padding' })
    expect(html.diagnostics).toContainEqual({ kind: 'unknown-style', tag: 'div', name: 'cursor' })
    expect(parseNativeStyle({ fontFamily: 'A&amp;B' })).toEqual({ fontFamily: 'A&amp;B' })
  })
})
