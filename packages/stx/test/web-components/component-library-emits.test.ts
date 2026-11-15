import { afterEach, expect, test } from 'bun:test'
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
