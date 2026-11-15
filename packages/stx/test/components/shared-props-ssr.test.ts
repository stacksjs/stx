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
  await Bun.write(join(inputDir, 'browser-only.ts'), `globalThis.__stxSharedImport = true`)
  const result = await buildComponentLibrary({ inputDir, outputDir, prefix: 'shared', bundle: false })
  for (const file of result.files.filter(file => /\.(?:js|ts)$/.test(file))) expect(await Bun.file(file).text()).not.toContain('PRIVATE-shared-props-server')
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(request) {
    const path = new URL(request.url).pathname
    if (path === '/') return new Response('<!doctype html><link rel="icon" href="data:,"><shared-field label="Default"></shared-field><script type="module" src="/index.js"></script>', { headers: { 'Content-Type': 'text/html' } })
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
