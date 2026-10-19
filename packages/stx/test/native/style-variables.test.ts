import { describe, expect, it } from 'bun:test'
import { parseNativeStyle } from '../../src/native/compiler/inline-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('resolves local declarations, nested fallbacks and aliases independent of declaration order', async () => {
  const input = 'padding:var(--space);border-radius:var(--missing,var(--radius,8px));color:var(--ink);--space:var(--base);--base:1.5rem;--radius:6px;--ink:#123456'
  const diagnostics: unknown[] = []
  const expected = { padding: 24, borderRadius: 6, color: '#123456' }
  expect(parseNativeStyle(input, error => diagnostics.push(error))).toEqual(expected)
  expect(diagnostics).toEqual([])
  expect((await translateHtmlToIR(`<div style="${input}">Themed</div>`)).root.style).toEqual(expected)
  expect(parseNativeStyle({ '--n': 4, gap: 'var(--n)', color: 'var(--missing,rgba(1, 2, 3, .5))' })).toEqual({ gap: 4, color: 'rgba(1, 2, 3, .5)' })
})

it('invalidates cycles, including fallback-only dependencies, and uses consuming fallbacks', () => {
  for (const definitions of [
    { '--a': 'var(--a, red)' },
    { '--a': 'var(--b)', '--b': 'var(--a)' },
    { '--a': 'var(--b, var(--a))', '--b': 'red' },
    { '--a': 'var(--b) var(--c)', '--b': 'var(--a)', '--c': 'var(--b,green)' },
  ]) {
    expect(parseNativeStyle({ ...definitions, color: 'var(--a, blue)' }).color).toBe('blue')
    expect(parseNativeStyle({ ...definitions, color: 'var(--a)' }).color).toBeUndefined()
  }
  expect(parseNativeStyle({ '--n': 'initial', width: 'var(--n,12px)' })).toEqual({ width: 12 })
  expect(parseNativeStyle({ '--a': 'var(--a)', '--outside': 'var(--a,green)', color: 'var(--outside,blue)' }).color).toBe('green')
  expect(parseNativeStyle({ '--a': 'var(--b) var(--c)', '--b': 'var(--a)', '--c': 'var(--b,green)', color: 'var(--c,blue)' }).color).toBe('blue')
})

it('keeps quoted text literal and names case-sensitive; bounds expansion and rejects unresolved values', () => {
  expect(parseNativeStyle({ '--Size': '2rem', padding: 'var(--size,8px)', width: 'var(--Size)', fontFamily: '"var(--literal)"' }))
    .toEqual({ padding: 8, width: 32, fontFamily: '"var(--literal)"' })
  const diagnostics: unknown[] = []
  expect(parseNativeStyle({ color: 'var(--missing)', width: 'var(--bad', '--parent-token': '12px' }, error => diagnostics.push(error))).toEqual({})
  expect(diagnostics).toEqual([
    { kind: 'non-numeric-style', name: 'color' },
    { kind: 'non-numeric-style', name: 'width' },
    { kind: 'unknown-style', name: '--parent-token' },
  ])
  const values: Record<string, string> = { '--v0': 'a' }
  for (let i = 1; i < 25; i++) values[`--v${i}`] = `var(--v${i - 1})var(--v${i - 1})`
  expect(parseNativeStyle({ ...values, color: 'var(--v24,red)' }).color).toBe('red')
})

describe.each([false, true])('reactive local native variables (minify=%s)', (minify) => {
  it('updates resolved styles, removes old values, and does not leak custom properties to the host', async () => {
    const { code } = await compileNativeScreen(`<script client>
const styles = state({ '--radius': '1rem', borderRadius: 'var(--radius)', color: 'var(--ink,#123456)' })
window.styles = styles
</script><div testID="control" style="border-radius:4px" :style="styles">Themed</div>`, { minify })
    const warnings: string[] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, warn: (message: string) => warnings.push(message) } } })
    try {
      await phone.settle()
      expect(phone.byTestID('control')!.style).toMatchObject({ borderRadius: 16, color: '#123456' })
      phone.context.styles.set('--radius:6px;--ink:#abcdef;border-radius:var(--radius);color:var(--ink)')
      await phone.settle()
      expect(phone.byTestID('control')!.style).toMatchObject({ borderRadius: 6, color: '#abcdef' })
      expect(warnings).toEqual([])
      expect(Object.keys(phone.byTestID('control')!.style).some(key => key.startsWith('--'))).toBe(false)
      phone.context.styles.set({ color: 'var(--gone,red)' })
      await phone.settle()
      expect(phone.byTestID('control')!.style).toMatchObject({ borderRadius: 4, color: 'red' })
      phone.context.styles.set(null)
      await phone.settle()
      expect(phone.byTestID('control')!.style).toMatchObject({ borderRadius: 4, color: null })
    }
    finally { phone.unmount() }
  }, 30_000)
})
