import { expect, it } from 'bun:test'
import { extractStylesheetTheme } from '../../src/native/compiler/stylesheet-theme'
import { createStyleVariables } from '../../src/native/compiler/style-variables'

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
