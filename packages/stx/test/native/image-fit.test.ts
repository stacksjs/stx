import { expect, it } from 'bun:test'
import { parseNativeStyle, parseNativeStyleLayers } from '../../src/native/compiler/inline-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

it('maps CSS image fit values to native host modes in strings, objects and variables', async () => {
  for (const [fit, resizeMode] of [['cover', 'cover'], ['contain', 'contain'], ['fill', 'stretch'], ['none', 'center']]) {
    expect(parseNativeStyle(`object-fit: ${fit}`)).toEqual({ resizeMode })
    expect(parseNativeStyle({ objectFit: fit })).toEqual({ resizeMode })
    expect(parseNativeStyle(`--fit: ${fit}; object-fit: var(--fit)`)).toEqual({ resizeMode })
    const { root, diagnostics } = await translateHtmlToIR(`<img src="/photo.png" style="object-fit: ${fit}">`)
    expect(root.style.resizeMode).toBe(resizeMode)
    expect(diagnostics).toEqual([])
  }
})

it('keeps declaration order and style layer precedence for the resizeMode alias', () => {
  expect(parseNativeStyle('resize-mode: center; object-fit: fill')).toEqual({ resizeMode: 'stretch' })
  expect(parseNativeStyle('object-fit: fill; resize-mode: center')).toEqual({ resizeMode: 'center' })
  const { styles } = parseNativeStyleLayers(['object-fit: cover', { objectFit: 'contain' }], undefined, () => {})
  expect(Object.assign({}, ...styles)).toEqual({ resizeMode: 'contain' })
})

it('reports unsupported fits instead of silently mapping them to a different fit', () => {
  for (const value of ['scale-down', 'bogus', 5]) {
    const diagnostics: unknown[] = []
    expect(parseNativeStyle({ objectFit: value }, diagnostic => diagnostics.push(diagnostic))).toEqual({})
    expect(diagnostics).toEqual([{ kind: 'unknown-style', name: `objectFit:${value}` }])
  }
  expect(parseNativeStyle({ objectFit: null })).toEqual({})
  expect(parseNativeStyle('object-fit: CONTAIN')).toEqual({ resizeMode: 'contain' })
})
