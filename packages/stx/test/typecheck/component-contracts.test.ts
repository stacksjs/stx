import { afterEach, expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { createTempDir } from '../../src/temp-dir'

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

async function fixture(parent: string) {
  const dir = createTempDir('stx-callsite-')
  dirs.push(dir)
  await Bun.write(join(dir, 'components/Counter.stx'), `<script client>
interface Props { count: number; label?: string }
const props = defineProps<Props>()
const emit = defineEmits<{ change: [value: number] }>()
</script><div></div>`)
  const page = join(dir, 'page.stx')
  await Bun.write(page, parent)
  const result = await typecheckStxFiles([page])
  expect(result.failure).toBeUndefined()
  return { dir, page, result }
}

it('reports static and dynamic prop errors at the parent attributes', async () => {
  const { page, result } = await fixture(`<script client>const text = 'bad'</script>
<Counter
  :count="text"
/>
<Counter count="also bad" />`)
  expect(result.diagnostics.filter(d => d.blockKind === 'template').map(d => [d.file, d.line])).toEqual([[page, 3], [page, 5]])
  expect(result.diagnostics.map(d => d.column)).toEqual([11, 17])
})

it('checks missing required props even in scriptless templates', async () => {
  const { page, result } = await fixture('<Counter label="hello" />')
  expect(result.diagnostics).toHaveLength(1)
  expect(result.diagnostics[0].file).toBe(page)
  expect(result.diagnostics[0].line).toBe(1)
  expect(result.diagnostics[0].column).toBe(1)
  expect(result.diagnostics[0].message).toContain('count')
})

it('types event payloads and bare handler references, allowing valid reactive bindings and fallthrough', async () => {
  const { result } = await fixture(`<script client>
const count = state(1)
function numeric(n: number) {}
function textOnly(s: string) {}
</script>
<Counter :count="count" class="card" aria-label="count" @change="numeric($event)" />
<Counter :count="count()" @change="textOnly($event)" />
<Counter :count="count" @change="textOnly" />`)
  expect(result.diagnostics.filter(d => d.blockKind === 'template').map(d => d.line)).toEqual([7, 8])
})

it('uses explicit component aliases, imported prop types, optional props and defaults', async () => {
  const { dir, page } = await fixture('')
  await Bun.write(join(dir, 'types.ts'), 'export interface Item { id: number }')
  await Bun.write(join(dir, 'components/Counter.stx'), `<script client>
import type { Item } from '../types'
interface Props { item: Item; count: number; label?: string }
const props = withDefaults(defineProps<Props>(), { count: 1 })
</script><div></div>`)
  await Bun.write(page, `<script client>
import Alias from './components/Counter.stx'
const item = state({ id: 1 })
</script>
<Alias :item="item" />
<Alias :item="item()" label="valid" />
<Alias v-bind:item="{ id: 'invalid' }" />`)
  const result = await typecheckStxFiles([page])
  expect(result.diagnostics.filter(d => d.blockKind === 'template').map(d => d.line)).toEqual([7])
})

it('handles nested braced expressions, > in expressions, and typed signal assignment handlers', async () => {
  const { result } = await fixture(`<script client>
const count = state(1)
const title = state('')
</script>
<Counter count={count() > 0 ? ({ value: 2 }).value : 0} @change="count = $event" />
<Counter count={{ nested: { value: 3 } }.nested.value} />
<Counter count={'bad'} @change="title = $event" />
<Counter count={
  3
} />`)
  expect(result.diagnostics.map(d => d.line)).toEqual([7, 7])
})

it('resolves package component aliases using the renderer package index', async () => {
  const { dir, page } = await fixture('')
  const pkg = join(dir, 'node_modules/example-ui')
  await Bun.write(join(pkg, 'package.json'), JSON.stringify({ name: 'example-ui', types: 'index.d.ts' }))
  await Bun.write(join(pkg, 'index.d.ts'), 'export declare const Counter: unknown')
  await Bun.write(join(pkg, 'src/nested/Counter.stx'), '<script client>const props = defineProps<{ count: number }>()</script>')
  await Bun.write(page, `<script client>import { Counter as Alias } from 'example-ui'</script>
<Alias :count="1" /><alias :count="2" /><Alias count="wrong" />`)
  const result = await typecheckStxFiles([page], { compilerOptions: { paths: { 'example-ui': [join(pkg, 'index.d.ts')] } } })
  expect(result.failure).toBeUndefined()
  expect(result.diagnostics.map(d => d.line)).toEqual([2])
})

it('honors configured-directory @import overrides and native-element exclusions', async () => {
  const { dir, page } = await fixture('')
  const componentsDir = join(dir, 'custom')
  await Bun.write(join(componentsDir, 'Counter.stx'), `<script client>
const props = defineProps({ label: { type: String, required: true }, count: { default: 1 } })
</script>`)
  await Bun.write(join(componentsDir, 'Input.stx'), '<script client>const props = defineProps<{ missing: number }>()</script>')
  await Bun.write(page, `@import('Counter', 'Input')
<Counter label="valid" />
<input /><INPUT />
<Counter label="bad count" count="wrong" />`)
  const result = await typecheckStxFiles([page], { componentsDir })
  expect(result.failure).toBeUndefined()
  expect(result.diagnostics.map(d => d.line)).toEqual([4])
})

it('accepts runtime event lists and checks their handlers as the first emitted payload', async () => {
  const { dir, page } = await fixture('')
  await Bun.write(join(dir, 'components/Counter.stx'), `<script client>
const emit = defineEmits(['change', 'close'])
emit('change', { id: 1 })
emit('close')
emit('forwarded')
const typed = defineEmits<{ change: [value: number] }>()
typed('missing', 1)
typed('change', 'bad')
</script><button @click="emit('change', { id: 2 })">Change</button>`)
  const child = await typecheckStxFiles([join(dir, 'components/Counter.stx')])
  expect(child.failure).toBeUndefined()
  expect(child.diagnostics.map(d => d.line)).toEqual([7, 8])
  expect(child.diagnostics[0].message).toContain('missing')
  await Bun.write(page, `<script client>
function onChange(value: { id: number }) {}
</script><Counter @change="onChange" @change.inline="onChange($event)" />`)
  const parent = await typecheckStxFiles([page])
  expect(parent.failure).toBeUndefined()
  expect(parent.diagnostics).toEqual([])
})

it('accepts a boolean prop written as plain "true" or "false" text, as the runtime does, and still rejects other text (stacksjs/stx#2141)', async () => {
  const { dir, page } = await fixture('')
  await Bun.write(join(dir, 'components/Figure.stx'), `<script>
interface Props { src: string; priority?: boolean; label?: string }
const { src, priority = false } = defineProps<Props>()
</script><img src="{{ src }}">`)
  await Bun.write(page, `<Figure src="a.webp" priority="true" />
<Figure src="b.webp" priority="false" />
<Figure src="c.webp" priority />
<Figure src="d.webp" label="true" />
<Figure src="e.webp" priority="yes" />`)
  const result = await typecheckStxFiles([page])
  expect(result.failure).toBeUndefined()
  // Only the fifth tag is wrong: "yes" is not a boolean spelling.
  expect(result.diagnostics.filter(d => d.blockKind === 'template').map(d => d.line)).toEqual([5])
})
