/**
 * Drag and drop on a pointer host: a sidebar row that can be dragged and
 * dropped on, in the web's attribute and event names.
 */
import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { compileScreenSource } from '../../src/native/compiler/render-screen'
import { createTempDir } from '../../src/temp-dir'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

function find(node: any, id: string): any {
  if (!node || typeof node !== 'object') return null
  if (node.props?.testID === id) return node
  for (const child of node.children ?? []) {
    const hit = find(child, id)
    if (hit) return hit
  }
  return null
}

it('compiles draggable rows and drop targets to the host names', async () => {
  const root = createTempDir('stx-drag-drop-')
  const file = join(root, 'Main.stx')
  const source = `<script client>const moved = state('')</script>
<View><Pressable testID="row" draggable drag-data="tab-1" drag-url="https://stacksjs.com" drop-inside
  @dragstart="moved.set('start')" @drag-over="moved.set($event.position)" @dragleave="moved.set('')"
  @drop="moved.set($event.data)" @dragend="moved.set('end')" @hover-change="moved.set('hover')"><Text>Row</Text></Pressable></View>`
  await Bun.write(file, source)
  try {
    const result = await compileScreenSource(source, file, { root })
    const row = find(result.document.root ?? result.document, 'row')
    expect(row.props).toMatchObject({ draggable: true, dragData: 'tab-1', dragURL: 'https://stacksjs.com', dropInside: true })
    expect(Object.keys(row.events).sort()).toEqual(['onDragEnd', 'onDragLeave', 'onDragOver', 'onDragStart', 'onDrop', 'onHoverChange'])
    expect(result.diagnostics.filter((d: any) => /unknown|unsupported/i.test(d.message))).toEqual([])
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it('hears a field\'s arrow keys as @keydown, and leaves a key filter to the browser', async () => {
  const root = createTempDir('stx-keydown-')
  const file = join(root, 'Main.stx')
  const source = `<script client>const q = state(''); const at = state(0)</script>
<View><TextInput testID="bar" autofocus select-text-on-focus @keydown="at.set(at() + 1)" /><TextInput testID="other" @keydown.enter="at.set(0)" /></View>`
  await Bun.write(file, source)
  try {
    const result = await compileScreenSource(source, file, { root })
    const bar = find(result.document.root ?? result.document, 'bar')
    expect(bar.events).toHaveProperty('onKeyPress')
    expect(bar.props).toMatchObject({ autoFocus: true, selectTextOnFocus: true })
    expect(find(result.document.root ?? result.document, 'other').events ?? {}).not.toHaveProperty('onKeyPress')
    expect(result.diagnostics.some((d: any) => String(d.message ?? d.name ?? '').includes('keydown.enter') || d.name === '@keydown.enter')).toBe(true)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it('compiles @contextmenu, @longpress and @long-press to onLongPress', async () => {
  const root = createTempDir('stx-long-press-')
  const file = join(root, 'Main.stx')
  const source = `<script client>const n = state(0)</script>
<View><Pressable testID="a" @contextmenu="n.set(1)"><Text>A</Text></Pressable><Pressable testID="b" @longpress="n.set(2)"><Text>B</Text></Pressable><Pressable testID="c" @long-press="n.set(3)"><Text>C</Text></Pressable></View>`
  await Bun.write(file, source)
  try {
    const result = await compileScreenSource(source, file, { root })
    for (const id of ['a', 'b', 'c']) expect(Object.keys(find(result.document.root ?? result.document, id).events)).toEqual(['onLongPress'])
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

const longPressSource = `<script client>
const shown = state(true)
window.calls = []
window.shown = shown
</script><View><View :if="shown">
<Pressable testID="context" @contextmenu="window.calls.push('context:' + $event.marker)">Context</Pressable>
<Pressable testID="plain" @longpress="window.calls.push('plain:' + $event.marker)">Plain</Pressable>
<Pressable testID="hyphen" @long-press="window.calls.push('hyphen:' + $event.marker)">Hyphen</Pressable>
</View></View>`
const longPressBundles = new Map<boolean, ReturnType<typeof compileNativeScreen>>()
it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('delivers long-press aliases once, including after remount (%s, minify=%s)', async (platform, minify) => {
  let bundle = longPressBundles.get(minify)
  if (!bundle) {
    bundle = compileNativeScreen(longPressSource, { minify })
    longPressBundles.set(minify, bundle)
  }
  const phone = mountNativeScreen((await bundle).code, 'Screen', { platform })
  try {
    await phone.settle()
    const ids = ['context', 'plain', 'hyphen']
    const old = ids.map(id => phone.byTestID(id)!)
    for (const node of old) {
      expect(node.events.onLongPress).toBeTruthy()
      phone.press(node, 'onLongPress', { marker: 'first' })
    }
    expect(phone.context.calls).toEqual(ids.map(id => `${id}:first`))
    phone.context.shown.set(false)
    await phone.settle()
    for (const node of old) phone.press(node, 'onLongPress', { marker: 'removed' })
    expect(phone.context.calls).toHaveLength(3)
    phone.context.shown.set(true)
    await phone.settle()
    for (const [index, id] of ids.entries()) {
      const node = phone.byTestID(id)!
      expect(node).not.toBe(old[index])
      phone.press(node, 'onLongPress', { marker: 'remount' })
    }
    expect(phone.context.calls).toEqual([...ids.map(id => `${id}:first`), ...ids.map(id => `${id}:remount`)])
  }
  finally { phone.unmount() }
}, 30_000)
