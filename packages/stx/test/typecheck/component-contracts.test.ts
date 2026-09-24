import { afterEach, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

async function fixture(parent: string) {
  const dir = mkdtempSync(join(tmpdir(), 'stx-callsite-'))
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
