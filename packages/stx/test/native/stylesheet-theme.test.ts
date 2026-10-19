import { describe, expect, it } from 'bun:test'
import { extractStylesheetTheme } from '../../src/native/compiler/stylesheet-theme'
import { createStyleVariables } from '../../src/native/compiler/style-variables'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

it('preserves document theme specificity, source order, importance and appearance', async () => {
  const warnings: string[] = []
  const theme = await extractStylesheetTheme(`<style>
:root { --ink:red; --gap:4px; --alias:var(--gap); --keep:1px!important }
html { --ink:blue }
.dark { --ink:#123456; --gap:8px }
:root.dark { --ink:rgb(1, 2, 3) }
.dark { --ink:green }
@media (prefers-color-scheme: light) { :root { --gap:6px } }
</style><style media="screen">:root { --gap:10px; --keep:2px }</style>
<style media="(prefers-color-scheme:dark)">:root { --gap:12px }</style>`, name => warnings.push(name))
  expect(warnings).toEqual([])
  const light = createStyleVariables(theme.light).computed()
  const dark = createStyleVariables(theme.dark).computed()
  expect(light.get('--ink')).toBe('red')
  expect(dark.get('--ink')).toBe('rgb(1, 2, 3)')
  expect(light.get('--alias')).toBe('10px')
  expect(dark.get('--alias')).toBe('12px')
  expect(light.get('--keep')).toBe('1px')
})

it('does not turn scoped variables or unsupported conditions into a global theme', async () => {
  const warnings: string[] = []
  const theme = await extractStylesheetTheme(`<script>const example = '<style>:root {--fake:1}</style>'</script>
<style>
/* :root { --comment:bad } */
.card { --scoped:red }
@media (min-width:600px) { :root { --wide:1 } }
@layer theme { :root { --layer:1 } }
:root { --literal:"a;{b}"; color:red }
</style><style media="print">:root { --print:1 }</style>`, name => warnings.push(name))
  expect(theme.light).toEqual([['--literal', '"a;{b}"']])
  expect(warnings).toContain('.card')
  expect(warnings.some(name => name.startsWith('@media'))).toBe(true)
  expect(warnings).toContain('@layer theme')
  expect(warnings).toContain('style type/media')
})

it('uses stylesheet values in compiled IR and exposes unsupported theme selectors', async () => {
  const { root, diagnostics } = await translateHtmlToIR('<style>:root { --stx-radius-control:12px; --gap:8px } .card { --gap:40px }</style><div class="rounded-control" style="padding:var(--gap)">Content</div>')
  expect(root.style).toMatchObject({ borderRadius: 12, padding: 8 })
  expect(root._stylesheetTheme?.light).toContainEqual(['--gap', '8px'])
  expect(diagnostics).toContainEqual({ kind: 'unsupported-theme-rule', tag: 'style', name: '.card' })
})

describe.each([false, true])('stylesheet themes on native (minify=%s)', (minify) => {
  it('retains computed variables through document wrappers that do not become native views', async () => {
    const { code } = await compileNativeScreen(`<html style="--gap:5px;--stx-field:red"><head><style>:root {--alias:var(--gap);--stx-field:#123456!important}.dark {--stx-field:#abcdef!important}</style></head><body style="--gap:7px"><main style="--stx-radius-control:9px"><div testID="wrapped" class="bg-field rounded-control" style="padding:var(--gap);margin:var(--alias)">Content</div></main></body></html>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      expect(phone.byTestID('wrapped')!.style).toMatchObject({ padding: 7, margin: 5, borderRadius: 9, backgroundColor: '#123456' })
      phone.appearance('dark')
      await phone.settle()
      expect(phone.byTestID('wrapped')!.style).toMatchObject({ padding: 7, margin: 5, borderRadius: 9, backgroundColor: '#abcdef' })
    }
    finally { phone.unmount() }
  }, 30_000)

  it('updates variables before descendants on appearance changes and preserves local overrides', async () => {
    const { code } = await compileNativeScreen(`<script client>
const show = state(true)
const rows = state([1])
const local = state(null)
window.probe = { show, rows, local }
</script><style>
:root { --stx-field:#ffffff; --gap:8px; --alias:var(--gap); --stx-radius-control:4px }
.dark { --stx-field:#123456; --gap:12px; --stx-radius-control:10px }
</style><div>
<div :if="show" testID="conditional" class="bg-field rounded-control" style="padding:var(--alias)">Conditional</div>
<div :style="local" style="--gap:3px"><div testID="local" style="padding:var(--gap);margin:var(--alias)" class="bg-field">Local</div></div>
<div :for="row in rows" :testID="'row-' + row" style="padding:var(--gap)" class="bg-field">Row</div>
</div>`, { minify })
    const phone = mountNativeScreen(code, 'Screen', { colorScheme: 'dark' })
    try {
      await phone.settle()
      expect(phone.byTestID('conditional')!.style).toMatchObject({ backgroundColor: '#123456', borderRadius: 10, padding: 12 })
      expect(phone.byTestID('local')!.style).toMatchObject({ padding: 3, margin: 12, backgroundColor: '#123456' })
      phone.context.probe.show.set(false)
      await phone.settle()
      phone.appearance('light')
      phone.context.probe.rows.set([1, 2])
      phone.context.probe.local.set({ '--gap': '6px', '--stx-field': '#abcdef' })
      await phone.settle()
      expect(phone.byTestID('row-2')!.style).toMatchObject({ padding: 8, backgroundColor: '#ffffff' })
      expect(phone.byTestID('local')!.style).toMatchObject({ padding: 6, margin: 8, backgroundColor: '#abcdef' })
      phone.context.probe.show.set(true)
      await phone.settle()
      expect(phone.byTestID('conditional')!.style).toMatchObject({ padding: 8, borderRadius: 4, backgroundColor: '#ffffff' })
      phone.appearance('dark')
      await phone.settle()
      expect(phone.byTestID('row-2')!.style.padding).toBe(12)
      expect(phone.byTestID('local')!.style).toMatchObject({ padding: 6, margin: 12, backgroundColor: '#abcdef' })
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)
})
