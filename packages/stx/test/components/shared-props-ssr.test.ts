import { WebView } from 'bun'
import { afterAll, expect, test } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { buildComponentLibrary } from '../../src/component-library'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

const root = createTempDir('stx-shared-props-')
afterAll(() => rmSync(root, { recursive: true, force: true }))

const source = `<script server>const privateOnly = 'PRIVATE-shared-props-server'</script>
<script>
import './browser-only.ts'
interface FieldProps {
  label: string
  type?: string
  class?: string
  count?: number
  enabled?: boolean
  items?: string[]
}
const { label, type, class: inputClass, count, enabled, items } = withDefaults(defineProps<FieldProps>(), {
  type: 'text', class: 'field-input', count: 4, enabled: true, items: ['first', 'second, item']
})
if (typeof window === 'undefined') throw new Error('Client setup executed during SSR')
globalThis.__stxSharedBody = true
</script>
<template><section><label>{{ label }}</label><input type="{{ type }}" class="{{ inputClass }}"><output>{{ count }}|{{ enabled }}</output><ul>@foreach(items as item)<li>{{ item }}</li>@endforeach</ul></section></template>`

const compactSource = String.raw`<script>const { data, label = '\u0041\x42\u{1F600}' } = withDefaults(defineProps<{ data?: object, label?: string }>(), { data: {"nested":{"value":7},"deep":{"nested":{"inside":{"value":9}}},"braces":"}} {{{"} })</script><template><p>{{ data.nested.value }}|{{ data.deep.nested.inside.value }}|{{ data.braces }}</p><span>{{ label }}</span></template>`

const numericSource = `<script>const { count = 1_000, negative = -1_000, trailing = 1., half = .5, exponent = +1_2.5_0e-1, hex = -0xFF_FF, binary = +0b1010_0101, octal = 0o7_7 } = defineProps<{ count?: number, negative?: number, trailing?: number, half?: number, exponent?: number, hex?: number, binary?: number, octal?: number }>()</script><template><output>{{ count }}|{{ negative }}|{{ trailing }}|{{ half }}|{{ exponent }}|{{ hex }}|{{ binary }}|{{ octal }}</output></template>`
const numericOutput = '1000|-1000|1|0.5|1.25|-65535|165|63'
const numericKeysSource = `<script>const { data = {1e3:'exponent',0x10:'hex',1_000:'last',1.:'dot',.5:'half','0x10':'quoted'} } = defineProps<{ data?: object }>()</script><template><output>@foreach(data as key => value)[{{ key }}={{ value }}]@endforeach</output></template>`
const numericKeysOutput = '[1=dot][16=hex][1000=last][0.5=half][0x10=quoted]'

test('shared public props preserve JavaScript numeric literals in SSR and compiled elements', async () => {
  const inputDir = join(root, 'numeric-source'), outputDir = join(root, 'numeric-dist')
  await Bun.write(join(inputDir, 'Numeric.stx'), numericSource)
  const html = await processDirectives('<Numeric/>', {}, join(root, 'numeric.stx'), { componentsDir: inputDir, root, cache: false }, new Set())
  expect(html.match(/<output>(.*?)<\/output>/)?.[1]).toBe(numericOutput)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'shared', bundle: false })
  const { Numeric } = await import(join(outputDir, 'index.js'))
  const element = new Numeric()
  element.connectedCallback()
  expect(element.querySelector('output')?.textContent).toBe(numericOutput)
})

test('shared public props canonicalize numeric object keys but preserve quoted keys', async () => {
  const inputDir = join(root, 'numeric-keys-source'), outputDir = join(root, 'numeric-keys-dist')
  await Bun.write(join(inputDir, 'NumericKeys.stx'), numericKeysSource)
  const html = await processDirectives('<NumericKeys/>', {}, join(root, 'numeric-keys.stx'), { componentsDir: inputDir, root, cache: false }, new Set())
  expect(html.match(/<output>(.*?)<\/output>/)?.[1]).toBe(numericKeysOutput)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'shared', bundle: false })
  const { NumericKeys } = await import(join(outputDir, 'index.js'))
  const element = new NumericKeys()
  element.connectedCallback()
  expect(element.querySelector('output')?.textContent).toBe(numericKeysOutput)
})

test('shared public props project defaults and aliases into SSR without running client setup or imports', async () => {
  await Bun.write(join(root, 'Field.stx'), source)
  await Bun.write(join(root, 'browser-only.ts'), `if (typeof window === 'undefined') throw new Error('Client import executed during SSR'); globalThis.__stxSharedImport = true`)
  const html = await processDirectives('<Field label="Default"/><Field label="Override" type="password" class="custom" :count="0" :enabled="false" :items="[]"/>', {}, join(root, 'index.stx'), { componentsDir: root, root, cache: false }, new Set())
  const sections = [...html.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)].map(match => match[1])
  expect(sections).toHaveLength(2)
  expect(sections[0]).toContain('type="text" class="field-input"')
  expect(sections[0]).toContain('<output>4|true</output>')
  expect(sections[0]).toContain('<li>second, item</li>')
  expect(sections[1]).toContain('type="password" class="custom"')
  expect(sections[1]).toContain('<output>0|false</output>')
  expect(sections[1]).not.toContain('<li>')
  expect((globalThis as any).__stxSharedBody).toBeUndefined()
  expect((globalThis as any).__stxSharedImport).toBeUndefined()
})

test('a macro-only local props interface may use the component Props name in strict generated declarations', async () => {
  const input = join(root, 'types-source'), output = join(root, 'types-dist')
  await Bun.write(join(input, 'Field.stx'), source.replace("import './browser-only.ts'", ''))
  await buildComponentLibrary({ inputDir: input, outputDir: output, prefix: 'shared', bundle: false })
  await Bun.write(join(root, 'consumer.ts'), `import type { Field, FieldProps } from './types-dist/index.js'
const field: Field = document.createElement('shared-field')
field.label = field.label.toUpperCase()
field.classList.add('native')
export const props: FieldProps = { label: 'Provided', class: 'custom', enabled: false }
`)
  await Bun.write(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler', lib: ['ESNext', 'DOM'], types: [], strict: true, skipLibCheck: false, noEmit: true }, files: ['consumer.ts'] }))
  const check = Bun.spawnSync([process.execPath, '--bun', 'tsc', '-p', join(root, 'tsconfig.json'), '--pretty', 'false'], { stdout: 'pipe', stderr: 'pipe' })
  expect(new TextDecoder().decode(check.stdout) + new TextDecoder().decode(check.stderr)).toBe('')
  expect(check.exitCode).toBe(0)
}, 30_000)

test('the same shared component renders and updates defaults, aliases and lists in ordinary Chrome', async () => {
  const inputDir = join(root, 'browser-source'), outputDir = join(root, 'browser-dist')
  await Bun.write(join(inputDir, 'Field.stx'), source)
  await Bun.write(join(inputDir, 'Literal.stx'), compactSource)
  await Bun.write(join(inputDir, 'Numeric.stx'), numericSource)
  await Bun.write(join(inputDir, 'NumericKeys.stx'), numericKeysSource)
  await Bun.write(join(inputDir, 'browser-only.ts'), `globalThis.__stxSharedImport = true`)
  const result = await buildComponentLibrary({ inputDir, outputDir, prefix: 'shared', bundle: false })
  for (const file of result.files.filter(file => /\.(?:js|ts)$/.test(file))) expect(await Bun.file(file).text()).not.toContain('PRIVATE-shared-props-server')
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(request) {
    const path = new URL(request.url).pathname
    if (path === '/') return new Response('<!doctype html><link rel="icon" href="data:,"><shared-field label="Default"></shared-field><shared-literal></shared-literal><shared-numeric></shared-numeric><shared-numeric-keys></shared-numeric-keys><script type="module" src="/index.js"></script>', { headers: { 'Content-Type': 'text/html' } })
    return new Response(Bun.file(join(outputDir, path)))
  } })
  const view = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
  try {
    await view.navigate(server.url.href)
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await view.evaluate(`document.querySelector('shared-field input')?.type`) === 'text') break
      await Bun.sleep(20)
    }
    expect(await view.evaluate(`(() => { const el = document.querySelector('shared-field'); return { label: el.querySelector('label')?.textContent, type: el.querySelector('input')?.type, className: el.querySelector('input')?.className, output: el.querySelector('output')?.textContent, items: [...el.querySelectorAll('li')].map(item => item.textContent), body: globalThis.__stxSharedBody, imported: globalThis.__stxSharedImport } })()`)).toEqual({ label: 'Default', type: 'text', className: 'field-input', output: '4|true', items: ['first', 'second, item'], body: true, imported: true })
    expect(await view.evaluate(`({ text: document.querySelector('shared-literal p')?.textContent, escaped: document.querySelector('shared-literal span')?.textContent })`)).toEqual({ text: '7|9|}} {{{', escaped: 'AB😀' })
    expect(await view.evaluate(`document.querySelector('shared-numeric output')?.textContent`)).toBe(numericOutput)
    expect(await view.evaluate(`document.querySelector('shared-numeric-keys output')?.textContent`)).toBe(numericKeysOutput)
    expect(await view.evaluate(`(async () => { const el = document.querySelector('shared-field'); el.label = 'Override'; el.type = 'password'; el.classList.add('custom'); el.count = 0; el.enabled = false; el.items = []; await el.updateComplete; return { label: el.querySelector('label').textContent, type: el.querySelector('input').type, className: el.querySelector('input').className, output: el.querySelector('output').textContent, items: el.querySelectorAll('li').length, nativeClassList: el.classList instanceof DOMTokenList } })()`)).toEqual({ label: 'Override', type: 'password', className: 'custom', output: '0|false', items: 0, nativeClassList: true })
  }
  finally { view.close(); server.stop(true) }
}, 30_000)

test('identifier props share the public macro defaults and keep falsy caller values in SSR and generated elements', async () => {
  const inputDir = join(root, 'identifier-source'), outputDir = join(root, 'identifier-dist')
  const component = `<script>
// const { forged = 'wrong' } = defineProps()
function nested() { const { forged = 'wrong' } = defineProps(); return forged }
const example = "const { forged = 'wrong' } = defineProps()"
const props = withDefaults(defineProps<{ title?: string, count?: number, enabled?: boolean }>(), { title: 'Identifier', count: 2, enabled: true })
</script><template><p>{{ props.title }}|{{ props.count }}|{{ props.enabled }}</p></template>`
  await Bun.write(join(inputDir, 'Identifier.stx'), component)
  const html = await processDirectives('<Identifier/><Identifier title="" :count="0" :enabled="false"/>', {}, join(root, 'identifier.stx'), { componentsDir: inputDir, root, cache: false }, new Set())
  expect(html).toContain('<p>Identifier|2|true</p>')
  expect(html).toContain('<p>|0|false</p>')
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'shared', bundle: false })
  const module = await import(join(outputDir, 'index.js'))
  const element = new module.Identifier()
  element.connectedCallback()
  expect(element.querySelector('p')?.textContent).toBe('Identifier|2|true')
  element.title = ''; element.count = 0; element.enabled = false
  await element.updateComplete
  expect(element.querySelector('p')?.textContent).toBe('|0|false')
})

test('SSR reads only live top-level public macros and never executes default expressions', async () => {
  const inputDir = join(root, 'safe-source')
  await Bun.write(join(inputDir, 'Safe.stx'), `<script type="application/json">{"example":"const { forged = 'json' } = defineProps()"}</script>
<!-- <script>const { forged = 'comment' } = defineProps()</script> -->
<script client>
function nested() { const { forged = 'nested' } = defineProps(); return forged }
const sample = "const { forged = 'string' } = defineProps()"
const { title: caption = 'inline', enabled = false, count = 0, dangerous, data } = withDefaults(
  defineProps<{title?: string, enabled?: boolean, count?: number, dangerous?: string, data?: object}>(),
  { dangerous: (() => { globalThis.__stxDefaultExecuted = true; throw new Error('Executed default') })(), data: { nested: ['a,b', false, 0] } }
)
</script><template><article><b>{{ caption }}</b><em>{{ enabled }}|{{ count }}</em><span>{{ data.nested[0] }}</span></article></template>`)
  const html = await processDirectives('<Safe/><Safe title="" :enabled="false" :count="0"/>', { title: 'parent', caption: 'parent', enabled: true, count: 12 }, join(root, 'safe.stx'), { componentsDir: inputDir, root, cache: false }, new Set())
  expect(html).toContain('<b>inline</b>')
  expect(html).toContain('<b></b>')
  expect(html.match(/<em>false\|0<\/em>/g)).toHaveLength(2)
  expect(html).toContain('<span>a,b</span>')
  expect((globalThis as any).__stxDefaultExecuted).toBeUndefined()
})

test('shared public props preserve compact nested literal objects in SSR and compiled elements', async () => {
  const inputDir = join(root, 'compact-source'), outputDir = join(root, 'compact-dist')
  const component = compactSource
  await Bun.write(join(inputDir, 'Compact.stx'), component)
  const html = await processDirectives('<Compact/>', {}, join(root, 'compact.stx'), { componentsDir: inputDir, root, cache: false }, new Set())
  expect(html.match(/<p>(.*?)<\/p>/)?.[1]).toBe('7|9|}} &#123;&#8288;&#123;&#8288;&#123;')
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'shared', bundle: false })
  const { Compact } = await import(join(outputDir, 'index.js'))
  const element = new Compact()
  element.connectedCallback()
  expect(element.querySelector('p')?.textContent).toBe('7|9|}} {{{')
})
