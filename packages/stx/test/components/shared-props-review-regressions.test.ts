// The first six cases retain the independent Standards review fixtures and assertions.
import { afterAll, expect, test } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { buildComponentLibrary } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'
const root = createTempDir('stx-standards-props-')
afterAll(() => rmSync(root, { recursive: true, force: true }))
async function render(name: string, source: string, tags = `<${name}/>`, parent = {}) {
  await Bun.write(join(root, `${name}.stx`), source)
  return await processDirectives(tags, parent, join(root, `${name}-page.stx`), { componentsDir: root, root, cache: false }, new Set())
}
test('literal strings preserve JS unicode and hex escapes in actual SSR', async () => {
  const html = await render('Escapes', String.raw`<script>const { label = '\u0041\x42\u{1F600}' } = defineProps<{ label?: string }>()</script><template><p>{{ label }}</p></template>`)
  expect(html.match(/<p>(.*?)<\/p>/)?.[1]).toBe('AB😀')
})
test('prototype-named public props use literal defaults rather than inherited Object members', async () => {
  const html = await render('PrototypeNames', `<script>const { constructor: ctor = 'ctor-default', toString: text = 'text-default' } = defineProps<{ constructor?: string, toString?: string }>()</script><template><p>{{ ctor }}|{{ text }}</p></template>`)
  expect(html.match(/<p>(.*?)<\/p>/)?.[1]).toBe('ctor-default|text-default')
})
test('each SSR instance owns deeply mutable literal defaults', async () => {
  const source = `<script>const { data } = withDefaults(defineProps<{ data?: object }>(), { data: { list: ['seed'], nested: { count: 2 } } })</script><script server>const size = data.list.push('added'); data.nested.count += 1</script><template><p>{{ size }}|{{ data.nested.count }}</p></template>`
  const html = await render('FreshData', source, '<FreshData/><FreshData/>')
  expect(html.match(/<p>2\|3<\/p>/g)).toHaveLength(2)
  const second = await render('FreshData', source)
  expect(second).toContain('<p>2|3</p>')
})
test('unsupported expressions are omitted without executing browser code', async () => {
  const html = await render('NoEval', `<script>const props = withDefaults(defineProps<{ title?: string, data?: object }>(), { title: globalThis.__standardsEval = 'ran', data: { get title() { globalThis.__standardsEval = 'ran'; return 'bad' } } }); throw new Error('setup ran')</script><template><p>{{ props.title }}</p></template>`)
  expect(html).toContain('<p></p>')
  expect((globalThis as any).__standardsEval).toBeUndefined()
})
test('literal defaults compile into per-element mutable values', async () => {
  const inputDir = join(root,'mutable-input'), outputDir = join(root,'mutable-output')
  await Bun.write(join(inputDir,'Mutable.stx'), `<script>const props = withDefaults(defineProps<{ items?: string[], data?: object }>(), { items: ['seed'], data: { count: 2 } })</script><template><p>{{ props.items.length }}|{{ props.data.count }}</p></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix:'standards', bundle:false })
  const { Mutable } = await import(join(outputDir,'index.js'))
  const a = new Mutable(), b = new Mutable()
  a.items.push('changed'); a.data.count++
  b.connectedCallback()
  expect(b.querySelector('p')?.textContent).toBe('1|2')
})
test('a public method in a client block retains the shared prop type it references', async () => {
  const inputDir = join(root, 'method-input'), outputDir = join(root,'method-output')
  await Bun.write(join(inputDir,'Typed.stx'), `<script>
interface RequestOptions {
 label?: string
}
const { label = 'shared' } = defineProps<RequestOptions>()
</script><script client>
function describe(options: RequestOptions): string { return options.label || 'empty' }
</script><template><p>{{ label }}</p></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix:'standards', bundle:false })
  await Bun.write(join(root,'method-consumer.ts'), `import { Typed } from './method-output/index.js'; const component = new Typed(); const label: string = component.describe({ label: 'hello' }); void label`)
  await Bun.write(join(root,'method-tsconfig.json'), JSON.stringify({ compilerOptions:{strict:true,skipLibCheck:false,noEmit:true,types:[],target:'ESNext',module:'ESNext',moduleResolution:'Bundler',lib:['ESNext','DOM']},files:['method-consumer.ts'] }))
  const check = Bun.spawnSync([process.execPath,'--bun','tsc','-p',join(root,'method-tsconfig.json'),'--pretty','false'],{stdout:'pipe',stderr:'pipe'})
  expect(check.stdout.toString()+check.stderr.toString()).toBe('')
  expect(check.exitCode).toBe(0)
})

test('shared public props preserve escaped literal data in SSR and compiled elements', async () => {
  const inputDir = join(root, 'escapes-input'), outputDir = join(root, 'escapes-output')
  const component = String.raw`<script>const props = withDefaults(defineProps<{ label?: string, controls?: string, joined?: string, template?: string }>(), { label: '\u0041\x42\u{1F600}', controls: '\b\f\n\r\t\v\0', joined: 'first\
second', template: ` + '`' + String.raw`line\u0041\
second\t\${literal}` + '`' + ` })</script><template><p>{{ props.label }}|{{ props.joined }}</p></template>`
  await Bun.write(join(inputDir, 'Escaped.stx'), component)
  const html = await processDirectives('<Escaped/>', {}, join(root, 'escapes.stx'), { componentsDir: inputDir, root, cache: false }, new Set())
  expect(html.match(/<p>(.*?)<\/p>/)?.[1]).toBe('AB😀|firstsecond')
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'review', bundle: false })
  const { Escaped } = await import(join(outputDir, 'index.js'))
  const element = new Escaped()
  expect(element.label).toBe('AB😀')
  expect(element.controls).toBe('\b\f\n\r\t\v\0')
  expect(element.joined).toBe('firstsecond')
  expect(element.template).toBe('lineAsecond\t${literal}')
  element.connectedCallback()
  expect(element.querySelector('p')?.textContent).toBe('AB😀|firstsecond')
})

test('SSR reads own prototype-named overrides and safely projects a prototype-sensitive local alias', async () => {
  const component = `<script>const { constructor: ctor = 'ctor-default', toString: text = 'text-default', label: __proto__ = 'own-alias' } = defineProps<{ constructor?: string, toString?: string, label?: string }>()</script><script server>const ownAlias = __proto__</script><template><p>{{ ctor }}|{{ text }}|{{ ownAlias }}</p></template>`
  const html = await render('OwnNames', component, '<OwnNames/><OwnNames constructor="" toString="override" label="provided"/><OwnNames :constructor="undefined" :toString="undefined"/>')
  expect([...html.matchAll(/<p>(.*?)<\/p>/g)].map(match => match[1])).toEqual(['ctor-default|text-default|own-alias', '|override|provided', 'ctor-default|text-default|own-alias'])
})
