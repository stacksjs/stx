import { expect, it } from 'bun:test'
import { parseNativeStyle, parseNativeStyleLayers } from '../../src/native/compiler/inline-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

it('maps CSS image fit values to native host modes in strings, objects and variables', async () => {
  for (const fit of ['cover', 'contain', 'fill', 'none', 'scale-down']) {
    expect(parseNativeStyle(`object-fit: ${fit}`)).toEqual({ objectFit: fit })
    expect(parseNativeStyle({ objectFit: fit })).toEqual({ objectFit: fit })
    expect(parseNativeStyle(`--fit: ${fit}; object-fit: var(--fit)`)).toEqual({ objectFit: fit })
    const { root, diagnostics } = await translateHtmlToIR(`<img src="/photo.png" style="object-fit: ${fit}">`)
    expect(root.style.objectFit).toBe(fit)
    expect(diagnostics).toEqual([])
  }
})

it('keeps explicit image geometry independent from legacy resizeMode', () => {
  expect(parseNativeStyle('resize-mode: center; object-fit: fill')).toEqual({ resizeMode: 'center', objectFit: 'fill' })
  expect(parseNativeStyle('object-fit: fill; resize-mode: center')).toEqual({ resizeMode: 'center', objectFit: 'fill' })
  const { styles } = parseNativeStyleLayers(['object-fit: cover', { objectFit: 'contain' }], undefined, () => {})
  expect(Object.assign({}, ...styles)).toEqual({ objectFit: 'contain' })
})

it('reports unsupported fits instead of silently mapping them to a different fit', () => {
  for (const value of ['bogus', 5]) {
    const diagnostics: unknown[] = []
    expect(parseNativeStyle({ objectFit: value }, diagnostic => diagnostics.push(diagnostic))).toEqual({})
    expect(diagnostics).toEqual([{ kind: 'unknown-style', name: `objectFit:${value}` }])
  }
  expect(parseNativeStyle({ objectFit: null })).toEqual({})
  expect(parseNativeStyle('object-fit: CONTAIN')).toEqual({ objectFit: 'contain' })
})

it('normalizes supported positions and diagnoses unsupported offsets without approximating them', async () => {
  for (const position of ['center', 'top', 'left', 'right bottom', 'top right', 'center left', '25% 75%', '-20% 120%']) {
    for (const input of [`object-position: ${position}`, { objectPosition: position }, JSON.stringify({ objectPosition: position })])
      expect(parseNativeStyle(input)).toEqual({ objectPosition: position })
    const { root, diagnostics } = await translateHtmlToIR(`<img src="/photo.png" style="object-position:${position}">`)
    expect(root.style.objectPosition).toBe(position)
    expect(diagnostics).toEqual([])
  }
  for (const position of ['left left', 'top bottom', '10px 20px', 'right 10px bottom 20px', 'NaN% 50%', 4]) {
    const diagnostics: unknown[] = []
    expect(parseNativeStyle({ objectPosition: position }, diagnostic => diagnostics.push(diagnostic))).toEqual({})
    expect(diagnostics).toEqual([{ kind: 'unknown-style', name: `objectPosition:${position}` }])
  }
  expect(parseNativeStyle('object-position: TOP   RIGHT')).toEqual({ objectPosition: 'top right' })
  expect(parseNativeStyle({ objectFit: null, objectPosition: null })).toEqual({})
  const { root } = await translateHtmlToIR('<img source="/legacy.png" object-fit="scale-down" objectposition="top right">')
  expect(root.props).toMatchObject({ source: '/legacy.png', objectFit: 'scale-down', objectPosition: 'top right' })
})
