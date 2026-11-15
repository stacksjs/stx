import { afterEach, expect, spyOn, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { buildComponentLibrary as sourceBuild } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'

const buildComponentLibrary = process.env.STX_LIBRARY_DIST ? (await import('../../dist/component-library.js')).buildComponentLibrary : sourceBuild
const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })

// The public compiler and a real custom element catch missing scope/emitter
// delivery. A separate Chrome fixture covers browser loading and CSP.
test('shared typed emits and ordinary handlers survive the native component-library build', async () => {
  const root = createTempDir('stx-library-emits-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  await Bun.write(join(inputDir, 'EventProbe.stx'), `<script>
import { defineProps, defineEmits, withDefaults } from 'stx'
interface EventProbeProps { id: string }
const { id } = withDefaults(defineProps<EventProbeProps>(), {})
const emit = defineEmits<{ submit: [detail: { id: string }] }>()
function onSubmit(): void { emit('submit', { id }) }
</script><template><button @click="onSubmit">Submit</button></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'emits', bundle: false, progressive: false })
  await import(join(outputDir, 'emits-event-probe.js'))
  const element = document.createElement('emits-event-probe')
  const details: unknown[] = []
  element.addEventListener('submit', event => details.push((event as CustomEvent).detail))
  element.setAttribute('id', `first'quoted"`)
  document.body.append(element)
  expect(element.querySelector('button')?.textContent).toBe('Submit')
  element.querySelector('button')!.click()
  expect(details).toEqual([{ id: `first'quoted"` }])
  element.setAttribute('id', 'updated')
  await (element as HTMLElement & { updateComplete: Promise<void> }).updateComplete
  element.querySelector('button')!.click()
  expect(details).toEqual([{ id: `first'quoted"` }, { id: 'updated' }])
  const manifest = await Bun.file(join(outputDir, 'custom-elements.json')).json()
  expect(manifest.modules[0].declarations[0].events).toEqual([{ name: 'submit', type: { text: 'CustomEvent<{ id: string }>' } }])
  const declarations = await Bun.file(join(outputDir, 'emits-event-probe.d.ts')).text()
  expect(declarations).toContain('"submit": CustomEvent<{ id: string }>')
  expect(declarations).not.toContain('interface EventProbeProps { id: string }')
  element.remove()
})

// Signals and teardown are owned by each element, including after props change.
test('emitter closures keep instance signals and release effects and hooks on disconnect', async () => {
  const root = createTempDir('stx-library-emits-state-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  await Bun.write(join(inputDir, 'Counter.stx'), `<script>
import { state, derived, effect, onMount, onDestroy, defineEmits } from '@stacksjs/stx'
const { label } = defineProps<{ label: string }>()
const emit = defineEmits<{ change: [detail: { label: string; count: number }], mounted: [], disposed: [] }>()
const count = state(0)
const doubled = derived(() => count() * 2)
effect(() => { emit('effect', count()); return () => emit('cleanup', count()) })
onMount(() => { emit('mounted'); return () => emit('disposed') })
onDestroy(() => emit('destroyed'))
function increase(): void { count.update(value => value + 1); emit('change', { label, count: count() }) }
function setCount(value: number): void { count.set(value) }
</script><template><button @click="increase()">{{ label }}:{{ doubled() }}</button></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'stateful-emits', bundle: false, progressive: false })
  await import(join(outputDir, 'stateful-emits-counter.js'))
  type Counter = HTMLElement & { setCount(value: number): void; updateComplete: Promise<void> }
  const first = document.createElement('stateful-emits-counter') as Counter
  const second = document.createElement('stateful-emits-counter') as Counter
  const events: Array<[string, unknown]> = []
  for (const name of ['change', 'mounted', 'disposed', 'destroyed', 'effect', 'cleanup']) first.addEventListener(name, event => events.push([name, (event as CustomEvent).detail]))
  first.setAttribute('label', 'first')
  second.setAttribute('label', 'second')
  document.body.append(first, second)
  first.querySelector('button')!.click()
  await first.updateComplete
  expect(first.textContent).toBe('first:2')
  expect(second.textContent).toBe('second:0')
  first.setAttribute('label', 'changed')
  await first.updateComplete
  first.querySelector('button')!.click()
  await first.updateComplete
  expect(first.textContent).toBe('changed:4')
  expect(events.filter(([name]) => name === 'change')).toEqual([['change', { label: 'first', count: 1 }], ['change', { label: 'changed', count: 2 }]])
  expect(events.filter(([name]) => name === 'mounted')).toHaveLength(1)
  first.remove()
  expect(events.filter(([name]) => name === 'disposed')).toHaveLength(1)
  expect(events.filter(([name]) => name === 'destroyed')).toHaveLength(1)
  const before = events.length
  first.setCount(7)
  await first.updateComplete
  expect(events).toHaveLength(before)
  document.body.append(first)
  expect(first.textContent).toBe('changed:14')
  expect(events.filter(([name]) => name === 'mounted')).toHaveLength(2)
  first.remove()
  second.remove()
})

test('documented tuple, overload, payload-map and runtime event forms publish strict CustomEvent contracts', async () => {
  const root = createTempDir('stx-library-event-contracts-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  const cases = {
    Tuple: `const emit = defineEmits<{ change: [value: string]; empty: []; pair: [id: number, value: string] }>()`,
    Overload: `interface OverloadEventMap { (event: 'change', value: string): void; (event: 'empty'): void; (event: 'pair', id: number, value: string): void }\nconst emit = defineEmits<OverloadEventMap>()`,
    Payload: `interface PayloadEventMap { change: string; empty: []; pair: [id: number, value: string] }\n</script><script client>const emit = defineEmits<PayloadEventMap>()`,
    Runtime: `const emit = defineEmits(['change', 'empty', 'pair'])`,
    Object: `const emit = defineEmits({ change: null, empty: null, pair: null })`,
  }
  for (const [name, declaration] of Object.entries(cases)) await Bun.write(join(inputDir, `${name}.stx`), `<script>
${declaration}
function publish(): void { emit('change', 'value'); emit('empty'); emit('pair', 7, 'second') }
</script><template><button @click="publish">Publish</button><button @click="emit('change', 'direct')">Direct</button></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'contracts-emits', bundle: false, progressive: false })
  for (const name of Object.keys(cases)) {
    const tag = `contracts-emits-${name.toLowerCase()}`
    await import(join(outputDir, `${tag}.js`))
    const element = document.createElement(tag)
    const details: unknown[] = []
    for (const event of ['change', 'empty', 'pair']) element.addEventListener(event, event => details.push((event as CustomEvent).detail))
    document.body.append(element)
    const buttons = element.querySelectorAll('button')
    buttons[0]!.click()
    buttons[1]!.click()
    expect(details).toEqual(['value', [], [7, 'second'], 'direct'])
    element.remove()
  }
  await Bun.write(join(root, 'consumer.ts'), `
import { Tuple, type TupleEventMap } from './dist/contracts-emits-tuple.js'
import type { OverloadEventMap } from './dist/contracts-emits-overload.js'
import type { PayloadEventMap } from './dist/contracts-emits-payload.js'
import './dist/custom-elements.js'
const element = new Tuple()
element.addEventListener('change', event => { const detail: string = event.detail; void detail })
element.addEventListener('pair', event => { const detail: [number, string] = event.detail; void detail })
element.addEventListener('keydown', event => { const key: string = event.key; void key })
const change: TupleEventMap['change'] = new CustomEvent('change', { detail: 'correct' })
const overload: OverloadEventMap['pair'] = new CustomEvent('pair', { detail: [7, 'second'] as [number, string] })
const payload: PayloadEventMap['change'] = change
const callback: NonNullable<JSX.IntrinsicElements['contracts-emits-tuple']['onChange']> = event => { const detail: string = event.detail; void detail }
// @ts-expect-error Event detail remains a string.
const invalid: TupleEventMap['change'] = new CustomEvent('change', { detail: 1 })
// @ts-expect-error Tuple event detail retains both typed arguments.
const badPair: OverloadEventMap['pair'] = new CustomEvent('pair', { detail: ['wrong', 2] })
void [change, overload, payload, callback, invalid, badPair]
`)
  await Bun.write(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: false, target: 'esnext', lib: ['esnext', 'dom'], module: 'esnext', moduleResolution: 'bundler', types: [] }, files: ['consumer.ts'] }))
  const compiler = Bun.spawn(['bun', 'x', '--bun', 'tsc', '-p', join(root, 'tsconfig.json'), '--pretty', 'false'], { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe' })
  const [code, stdout, stderr] = await Promise.all([compiler.exited, new Response(compiler.stdout).text(), new Response(compiler.stderr).text()])
  expect(code, stdout + stderr).toBe(0)
}, 30000)

test('cross-script public method types survive macro-only event contract consumption', async () => {
  const root = createTempDir('stx-library-cross-script-events-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  await Bun.write(join(inputDir, 'Cross.stx'), `<script>
interface CrossEventMap { change: [detail: Delivery] }
interface Delivery { id: string }
const copy = 'export function stays literal'
</script><script client>
const emit = defineEmits<CrossEventMap>()
function deliver(detail: Delivery): Delivery { emit('change', detail); return detail }
</script><template><p>{{ copy }}</p></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'cross-emits', bundle: false, progressive: false })
  const { Cross } = await import(join(outputDir, 'index.js'))
  const element = new Cross()
  document.body.append(element)
  expect(element.textContent).toBe('export function stays literal')
  const details: unknown[] = []
  element.addEventListener('change', (event: CustomEvent) => details.push(event.detail))
  expect(element.deliver({ id: 'one' })).toEqual({ id: 'one' })
  expect(details).toEqual([{ id: 'one' }])
  const declarations = await Bun.file(join(outputDir, 'cross-emits-cross.d.ts')).text()
  expect(declarations).toContain('interface Delivery { id: string }')
  expect(declarations).toContain('deliver(detail: Delivery): Delivery')
  expect(declarations).not.toContain('interface CrossEventMap { change: [detail: Delivery] }')
  element.remove()
})

// Public compiler + DOM events catch lexical row ownership across render changes.
test('loop handlers keep each nested row and replace callbacks after reorder', async () => {
  const root = createTempDir('stx-loop-emits-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  await Bun.write(join(inputDir, 'Rows.stx'), `<script>
const { items } = defineProps<{ items: string[] }>()
const emit = defineEmits<{ select: [value: string] }>()
</script><template>@foreach(items as row)@foreach(['a', 'b'] as suffix)<button @click="emit('select', row + suffix)">{{ row }}{{ suffix }}</button>@endforeach@endforeach</template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'loop-emits', bundle: false, progressive: false })
  const { Rows } = await import(join(outputDir, 'index.js'))
  const element = new Rows(), values: unknown[] = []
  element.items = ['first', 'second']
  element.addEventListener('select', (event: CustomEvent) => values.push(event.detail))
  document.body.append(element)
  for (const button of element.querySelectorAll('button')) button.click()
  expect(values).toEqual(['firsta', 'firstb', 'seconda', 'secondb'])
  element.items = ['second', 'first', 'third']
  await element.updateComplete
  for (const button of element.querySelectorAll('button')) button.click()
  expect(values.slice(4)).toEqual(['seconda', 'secondb', 'firsta', 'firstb', 'thirda', 'thirdb'])
  element.remove()
})

// Strict generated consumers catch collisions invisible to runtime transpilation.
test('authored event-map support types retain their own declaration scope', async () => {
  const root = createTempDir('stx-retained-map-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  for (const name of ['Retain', 'CrossRetain']) await Bun.write(join(inputDir, `${name}.stx`), `<script>
interface ${name}EventMap { change: [value: string] }
const emit = defineEmits<${name}EventMap>()
${name === 'CrossRetain' ? '</script><script client>' : ''}
function contract(input: ${name}EventMap): ${name}EventMap { emit('change', input.change[0]); return input }
</script><template><button @click="contract({ change: ['value'] })">Send</button></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'retained-map', bundle: false, progressive: false })
  await Bun.write(join(root, 'consumer.ts'), `
import { Retain, type RetainEventMap } from './dist/retained-map-retain.js'
import { CrossRetain } from './dist/retained-map-cross-retain.js'
import './dist/custom-elements.js'
for (const element of [new Retain(), new CrossRetain()]) {
  const result: { change: [string] } = element.contract({ change: ['value'] })
  element.addEventListener('change', event => { const value: string = event.detail; void value })
  // @ts-expect-error Authored tuple support retains its public method contract.
  element.contract({ change: [1] })
  void result
}
const callback: NonNullable<JSX.IntrinsicElements['retained-map-retain']['onChange']> = event => { const value: string = event.detail; void value }
const event: RetainEventMap['change'] = new CustomEvent('change', { detail: 'value' })
// @ts-expect-error Generated event map belongs exclusively to DOM events.
const wrong: RetainEventMap['change'] = ['value']
void [event, wrong, callback]
`)
  await Bun.write(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: false, target: 'esnext', lib: ['esnext', 'dom'], module: 'esnext', moduleResolution: 'bundler', types: [] }, files: ['consumer.ts'] }))
  const compiler = Bun.spawn(['bun', 'x', '--bun', 'tsc', '-p', join(root, 'tsconfig.json'), '--pretty', 'false'], { stdout: 'pipe', stderr: 'pipe' })
  const [code, stdout, stderr] = await Promise.all([compiler.exited, new Response(compiler.stdout).text(), new Response(compiler.stderr).text()])
  expect(code, stdout + stderr).toBe(0)
}, 30000)

test('optional tuple details model omitted, explicit undefined and supplied arguments', async () => {
  const root = createTempDir('stx-optional-emits-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  await Bun.write(join(inputDir, 'Optional.stx'), `<script>
const emit = defineEmits<{ change: [string?]; named: [value?: string] }>()
function publish(): void { emit('change'); emit('change', undefined); emit('change', 'value'); emit('named'); emit('named', undefined); emit('named', 'value') }
</script><template><button @click="publish">Send</button></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'optional-emits', bundle: false, progressive: false })
  const { Optional } = await import(join(outputDir, 'index.js'))
  const element = new Optional(), values: unknown[] = []
  for (const name of ['change', 'named']) element.addEventListener(name, (event: CustomEvent) => values.push(event.detail))
  document.body.append(element)
  element.querySelector('button')!.click()
  expect(values).toEqual([[], undefined, 'value', [], undefined, 'value'])
  element.remove()
  await Bun.write(join(root, 'consumer.ts'), `
import { Optional, type OptionalEventMap } from './dist/optional-emits-optional.js'
import './dist/custom-elements.js'
const element = new Optional()
for (const name of ['change', 'named'] as const) element.addEventListener(name, event => { const value: string | undefined | [] = event.detail; void value })
const omitted: OptionalEventMap['change'] = new CustomEvent('change', { detail: [] as [] })
const namedOmitted: OptionalEventMap['named'] = omitted
const callback: NonNullable<JSX.IntrinsicElements['optional-emits-optional']['onNamed']> = event => { const value: string | undefined | [] = event.detail; void value }
// @ts-expect-error Optional does not erase the supplied argument type.
const wrong: OptionalEventMap['change'] = new CustomEvent('change', { detail: 7 })
// @ts-expect-error Optional detail can be omitted and cannot be treated as always supplied.
const required: string = omitted.detail
void [omitted, namedOmitted, callback, wrong, required]
`)
  await Bun.write(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: false, target: 'esnext', lib: ['esnext', 'dom'], module: 'esnext', moduleResolution: 'bundler', types: [] }, files: ['consumer.ts'] }))
  const compiler = Bun.spawn(['bun', 'x', '--bun', 'tsc', '-p', join(root, 'tsconfig.json'), '--pretty', 'false'], { stdout: 'pipe', stderr: 'pipe' })
  const [code, stdout, stderr] = await Promise.all([compiler.exited, new Response(compiler.stdout).text(), new Response(compiler.stderr).text()])
  expect(code, stdout + stderr).toBe(0)
}, 30000)

test('mount-owned destroy hooks survive prop renders and reconnect exactly once', async () => {
  const root = createTempDir('stx-mount-destroy-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  await Bun.write(join(inputDir, 'Mounted.stx'), `<script>
const { label } = defineProps<{ label: string }>()
const emit = defineEmits<{ destroyed: [value: string]; rendered: [value: string] }>()
onMount(() => { onDestroy(() => emit('destroyed', label)); return () => emit('mountCleanup', label) })
onDestroy(() => emit('rendered', label))
</script><template><p>{{ label }}</p></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'mount-destroy', bundle: false, progressive: false })
  const { Mounted } = await import(join(outputDir, 'index.js'))
  const element = new Mounted(), values: unknown[] = []
  for (const name of ['destroyed', 'rendered', 'mountCleanup']) element.addEventListener(name, (event: CustomEvent) => values.push([name, event.detail]))
  element.setAttribute('label', 'first')
  document.body.append(element)
  element.setAttribute('label', 'updated')
  await element.updateComplete
  element.remove()
  expect(values).toEqual([['rendered', 'updated'], ['destroyed', 'first'], ['mountCleanup', 'first']])
  document.body.append(element)
  element.setAttribute('label', 'again')
  await element.updateComplete
  element.remove()
  expect(values.slice(3)).toEqual([['rendered', 'again'], ['destroyed', 'updated'], ['mountCleanup', 'updated']])
})

test('throwing cleanup reports errors and still releases all connection resources', async () => {
  const root = createTempDir('stx-cleanup-emits-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  await Bun.write(join(inputDir, 'Cleanup.stx'), `<script>
const { label } = defineProps<{ label: string }>()
const emit = defineEmits<{ observed: [value: number]; destroyed: []; released: [] }>()
const count = state(0)
effect(() => () => { throw new Error('expected effect cleanup exception') })
effect(() => { emit('observed', count()); return () => emit('released') })
onDestroy(() => { throw new Error('expected destroy exception') })
onDestroy(() => emit('destroyed'))
onMount(() => () => emit('mountCleanup'))
function increment(): void { count.update(value => value + 1) }
</script><template><button @click="increment">{{ label }}</button></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'cleanup-emits', bundle: false, progressive: false })
  const { Cleanup } = await import(join(outputDir, 'index.js'))
  const element = new Cleanup(), values: unknown[] = [], reported: unknown[][] = []
  for (const name of ['observed', 'destroyed', 'released', 'mountCleanup']) element.addEventListener(name, (event: CustomEvent) => values.push([name, event.detail]))
  const errors = spyOn(console, 'error').mockImplementation((...args) => { reported.push(args) })
  try {
    document.body.append(element)
    const button = element.querySelector('button')!
    element.remove()
    element.increment()
    button.click()
    await element.updateComplete
    expect(values).toEqual([['observed', 0], ['released', []], ['destroyed', []], ['mountCleanup', []]])
    expect(reported.map(args => String(args[1]))).toEqual(['Error: expected effect cleanup exception', 'Error: expected destroy exception'])
    document.body.append(element)
    element.setAttribute('label', 'rerender')
    await element.updateComplete
    expect(element.querySelector('button')!.textContent).toBe('rerender')
    element.remove()
    const before = values.length
    element.increment()
    expect(values).toHaveLength(before)
  }
  finally { errors.mockRestore(); element.remove() }
})

for (const publicImport of [false, true]) test(`element effects and ${publicImport ? 'public API' : 'canonical module'} helper signals share one native dependency tracker`, async () => {
  const root = createTempDir('stx-module-emits-')
  roots.push(root)
  const inputDir = join(root, 'components'), outputDir = join(root, 'dist')
  const signals = publicImport ? '@stacksjs/stx/signals-api' : new URL('../../src/signals-api.ts', import.meta.url).pathname
  await Bun.write(join(inputDir, 'helper.ts'), `import { state } from ${JSON.stringify(signals)}; export const shared = state(0); export function bumpShared() { shared.update(value => value + 1) }`)
  for (const name of ['First', 'Second']) await Bun.write(join(inputDir, `${name}.stx`), `<script>
import { shared, bumpShared } from './helper'
const emit = defineEmits<{ observed: [value: number] }>()
effect(() => emit('observed', shared()))
function bump(): void { bumpShared() }
</script><template><p>Shared</p></template>`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: `module-emits-${publicImport ? 'public' : 'canonical'}`, bundle: false, progressive: false })
  const { First, Second } = await import(join(outputDir, 'index.js'))
  const first = new First(), second = new Second(), values: unknown[] = [], other: unknown[] = []
  first.addEventListener('observed', (event: CustomEvent) => values.push(event.detail))
  second.addEventListener('observed', (event: CustomEvent) => other.push(event.detail))
  document.body.append(first, second)
  first.bump()
  expect(values).toEqual([0, 1])
  expect(other).toEqual([0, 1])
  first.remove()
  second.bump()
  expect(values).toEqual([0, 1])
  expect(other).toEqual([0, 1, 2])
  document.body.append(first)
  expect(values).toEqual([0, 1, 2])
  second.bump()
  expect(values).toEqual([0, 1, 2, 3])
  first.remove()
  second.remove()
})
