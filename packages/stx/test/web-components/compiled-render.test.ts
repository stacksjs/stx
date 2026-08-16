import { describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildComponentLibrary } from '../../src/component-library'

/**
 * Components that carry logic, not just markup.
 *
 * Before this, the build stored the template as a string and the runtime did
 * path lookups over it, so `@if` and `@foreach` reached the browser as literal
 * text and a component's script was discarded entirely. A component could show
 * a value and could not derive one, which is most of what a component is for.
 *
 * The compile happens here, at build time, and what ships is a function. These
 * assert the generated source rather than a rendered DOM: the compiler's job is
 * to emit correct JavaScript, and reading it is how a regression names itself
 * instead of surfacing as a blank element three layers away.
 */

async function build(component: string, extra?: { file: string, contents: string }): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-compiled-'))
  const input = path.join(dir, 'src')
  const output = path.join(dir, 'dist')
  await Bun.write(path.join(input, 'Widget.stx'), component)
  if (extra) await writeFile(path.join(input, extra.file), extra.contents)
  await buildComponentLibrary({ inputDir: input, outputDir: output })
  return readFile(path.join(output, 'stx-widget.js'), 'utf8')
}

describe('compiled component render', () => {
  it('compiles a conditional chain into real branches', async () => {
    const source = await build(`
<script>
import { defineProps } from 'stx'
interface Props { count: number }
const { count } = defineProps<Props>()
const many = count > 10
</script>
<template>
  <p>@if (many)lots@elseif (count > 0)some@else none@endif</p>
</template>
`)

    // Branches, not a template string with directives left in it.
    expect(source).toContain('if (many) {')
    expect(source).toContain('} else if (count > 0) {')
    expect(source).toContain('} else {')
    // The string template survives as the fallback for logic-free components,
    // so the directives are gone from the render, not from the whole module.
    const render = source.slice(source.indexOf('render(__helpers)'), source.indexOf('defineComponent('))
    expect(render).not.toContain('@if')
    expect(render).not.toContain('@endif')
  })

  it('carries the script\'s derived values into the render', async () => {
    const source = await build(`
<script>
import { defineProps } from 'stx'
interface Props { total: number }
const { total } = defineProps<Props>()
const doubled = total * 2
</script>
<template><b>{{ doubled }}</b></template>
`)

    // The whole point: a component that computes rather than only displays.
    expect(source).toContain('const doubled = total * 2')
    expect(source).toContain('__escape(doubled)')
  })

  it('iterates arrays and objects, and survives a missing collection', async () => {
    const source = await build(`
<script>
import { defineProps } from 'stx'
interface Props { rows: any[] }
const { rows } = defineProps<Props>()
</script>
<template>
  <ul>@foreach (rows as row)<li>{{ row.label }}</li>@endforeach</ul>
</template>
`)

    // __values rather than a bare for-of: a loop over something absent runs
    // zero times instead of failing the whole page over one empty list.
    expect(source).toContain('for (const row of __values(rows))')
    const render = source.slice(source.indexOf('render(__helpers)'), source.indexOf('defineComponent('))
    expect(render).not.toContain('@foreach')
  })

  it('reads the key => value form of a loop', async () => {
    const source = await build(`
<script>
import { defineProps } from 'stx'
interface Props { totals: any }
const { totals } = defineProps<Props>()
</script>
<template>@foreach (totals as name => value)<i>{{ name }}{{ value }}</i>@endforeach</template>
`)

    expect(source).toContain('for (const [name, value] of __entries(totals))')
  })

  it('escapes a value and leaves the raw form alone', async () => {
    const source = await build(`
<script>
import { defineProps } from 'stx'
interface Props { text: string, markup: string }
const { text, markup } = defineProps<Props>()
</script>
<template><span>{{ text }}</span><span>{!! markup !!}</span></template>
`)

    // A value is data. Only the author writing the raw form says otherwise.
    expect(source).toContain('__escape(text)')
    expect(source).toContain('__raw(markup)')
  })

  it('applies the defaults withDefaults declared', async () => {
    const source = await build(`
<script>
import { defineProps, withDefaults } from 'stx'
interface Props { unit?: string, invert?: boolean, scale?: number }
const { unit, invert, scale } = withDefaults(defineProps<Props>(), { unit: 'number', invert: false, scale: 2 })
</script>
<template><b>{{ unit }}</b></template>
`)

    expect(source).toContain("unit = 'number'")
    expect(source).toContain('invert = false')
    expect(source).toContain('scale = 2')
  })

  it('hoists a helper import and points it at the built module', async () => {
    const source = await build(`
<script>
import { defineProps } from 'stx'
import { format } from './helpers'
interface Props { value: number }
const { value } = defineProps<Props>()
</script>
<template><b>{{ format(value) }}</b></template>
`, { file: 'helpers.ts', contents: 'export const format = (n: number): string => String(n)' })

    // Sharing helpers with the rest of a codebase is the reason to write the
    // component in stx rather than restating it in the consuming language. The
    // specifier is rewritten because the module now lives in the output tree.
    expect(source).toContain('import { format } from')
    expect(source).toContain('../src/helpers')
    // stx's own compile-time helpers have no runtime meaning and must not survive.
    expect(source).not.toContain("from 'stx'")
  })

  it('strips template comments rather than shipping them', async () => {
    const source = await build(`
<script>
import { defineProps } from 'stx'
interface Props { value: number }
const { value } = defineProps<Props>()
</script>
<template><b>{{ value }}</b>{{-- a note to the reader of the component --}}</template>
`)

    expect(source).not.toContain('a note to the reader')
  })

  it('leaves a logic-free component on the string template', async () => {
    const source = await build(`
<template><p>static</p></template>
`)

    // Nothing to compile means nothing gained, and a component that already
    // worked should not change shape.
    expect(source).not.toContain('render(__helpers)')
  })
})
