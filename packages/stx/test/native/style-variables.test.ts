import { describe, expect, it } from 'bun:test'
import { parseNativeStyle, parseNativeStyleLayers } from '../../src/native/compiler/inline-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import type { STXNode } from '../../src/native/compiler/ir'

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

it('resolves authored, bound and forwarded layers against one local variable environment', () => {
  const diagnostics: unknown[] = []
  const resolved = parseNativeStyleLayers([
    '--space:4px;--alias:var(--space);padding:var(--alias)',
    { '--space': '8px', margin: 'var(--space)' },
    { '--space': '16px', borderRadius: 'var(--alias)' },
  ], undefined, d => diagnostics.push(d))
  expect(resolved.styles).toEqual([{ padding: 16 }, { margin: 16 }, { borderRadius: 16 }])
  expect(resolved.variables.get('--alias')).toBe('16px')
  expect(diagnostics).toEqual([])
  expect(parseNativeStyleLayers(['--a:var(--b);color:var(--a,blue)', { '--b': 'var(--a)' }], undefined, () => {}).styles[0]).toEqual({ color: 'blue' })
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

it('inherits compiled inline variables without leaking between siblings or re-evaluating parent aliases', async () => {
  const { root, diagnostics } = await translateHtmlToIR(`<div style="--space:12px;--alias:var(--space);--ink:#123456">
    <div id="overridden" style="--space:24px;padding:var(--space);margin:var(--alias)"><div id="nested" style="padding:var(--space);color:var(--ink)"></div></div>
    <div id="sibling" style="padding:var(--space)"></div>
    <div id="invalid" style="--space:initial"><div id="fallback" style="padding:var(--space,3px)"></div></div>
    <div id="inherited" style="--space:inherit;padding:var(--space)"></div>
    <svg><g style="--ink:#abcdef"><path id="paint" style="fill:var(--ink)" d="M0 0L1 1" /></g></svg>
  </div>`)
  const byId = new Map<string, STXNode>()
  const visit = (node: STXNode): void => {
    if (node.props.id) byId.set(String(node.props.id), node)
    for (const child of node.children) if (typeof child !== 'string') visit(child)
  }
  visit(root)
  expect(byId.get('overridden')!.style).toMatchObject({ padding: 24, margin: 12 })
  expect(byId.get('nested')!.style).toMatchObject({ padding: 24, color: '#123456' })
  expect(byId.get('sibling')!.style.padding).toBe(12)
  expect(byId.get('fallback')!.style.padding).toBe(3)
  expect(byId.get('inherited')!.style.padding).toBe(12)
  expect(byId.get('paint')!.style.fill).toBe('#abcdef')
  expect(diagnostics.filter(d => d.kind === 'unknown-style' || d.kind === 'non-numeric-style')).toEqual([])
})

describe.each([false, true])('reactive local native variables (minify=%s)', (minify) => {
  it('propagates parent themes through aliases, shadows, hidden branches and new loop rows', async () => {
    const { code } = await compileNativeScreen(`<script client>
const theme = state({ '--gap': '12px', '--ink': '#123456' })
const local = state({ '--gap': '24px' })
const show = state(true)
const rows = state([1])
window.theme = theme; window.local = local; window.show = show; window.rows = rows
</script>
<div :style="theme" style="--gap:4px;--ink:blue;--alias:var(--gap)">
  <div testID="child" style="padding:var(--gap);color:var(--ink)"></div>
  <div :style="local" style="--own:var(--gap);margin:var(--alias);padding:var(--own)" testID="shadow">
    <div testID="nested" style="padding:var(--gap);color:var(--ink)"></div>
  </div>
  <div :if="show" testID="conditional" style="padding:var(--gap)"></div>
  <div :show="show" testID="hidden" style="padding:var(--gap);display:flex"></div>
  <div :for="row in rows" :testID="'row-' + row" style="padding:var(--gap)"></div>
</div>
<div testID="outside" style="padding:var(--gap,2px)"></div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      expect(phone.byTestID('child')!.style).toMatchObject({ padding: 12, color: '#123456' })
      expect(phone.byTestID('shadow')!.style).toMatchObject({ padding: 24, margin: 12 })
      expect(phone.byTestID('nested')!.style).toMatchObject({ padding: 24, color: '#123456' })
      phone.context.show.set(false)
      await phone.settle()
      phone.context.theme.set({ '--gap': '18px', '--ink': '#abcdef' })
      phone.context.rows.set([1, 2])
      await phone.settle()
      expect(phone.byTestID('child')!.style).toMatchObject({ padding: 18, color: '#abcdef' })
      expect(phone.byTestID('shadow')!.style).toMatchObject({ padding: 24, margin: 18 })
      expect(phone.byTestID('nested')!.style).toMatchObject({ padding: 24, color: '#abcdef' })
      expect(phone.byTestID('hidden')!.style).toMatchObject({ padding: 18, display: 'none' })
      expect(phone.byTestID('row-2')!.style.padding).toBe(18)
      expect(phone.byTestID('outside')!.style.padding).toBe(2)
      phone.context.show.set(true)
      phone.context.local.set(null)
      await phone.settle()
      expect(phone.byTestID('conditional')!.style.padding).toBe(18)
      expect(phone.byTestID('hidden')!.style).toMatchObject({ padding: 18, display: 'flex' })
      expect(phone.byTestID('shadow')!.style).toMatchObject({ padding: 18, margin: 18 })
      phone.context.theme.set(null)
      await phone.settle()
      expect(phone.byTestID('child')!.style).toMatchObject({ padding: 4, color: 'blue' })
      expect(phone.byTestID('row-2')!.style.padding).toBe(4)
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)

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
