import { afterEach, describe, expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { prepareSharedNativeScreen } from '../../src/native/runtime/shared-screen'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants } from '../../test-utils/dom-runtime-shim'
import { restoreGlobalsAfterEach } from '../../test-utils/native-globals'
import { createTempDir } from '../../src/temp-dir'

declare const window: any

// The runtime installs craft and web storage on the global it runs in, which
// here is this process's own (test-utils/native-globals.ts).
restoreGlobalsAfterEach()

describe('a native screen on the shared stx signals runtime', () => {
  it('round trips native text and picker edits through x-model and application resets', async () => {
    const compiled = await compileScreenSource(`<script client>
const draft = state('Seed')
const choice = state('one')
function reset() { draft.set('Reset'); choice.set('one') }
</script>
<View>
<TextInput x-model="draft" testID="draft" />
<Picker x-model="choice" :options="[{value:'one',label:'One'},{value:'two',label:'Two'}]" testID="choice" />
<Text :text="draft() + ':' + choice()" />
<Button @click="reset()">Reset</Button>
</View>`, path.join(import.meta.dir, 'Model.stx'))
    const sent: any[] = []
    let receive: (raw: string) => void = () => {}
    const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, {
      postMessage: raw => sent.push(JSON.parse(raw)),
      onMessage: callback => { receive = callback },
    })
    installNodeConstants()
    window.__stx_host = screen.host
    new Function(generateSignalsRuntimeDev())()
    new Function(compiled.setup!.code)()
    screen.mount(window.stx, window.__stx_latestSetup)
    screen.host.flush()
    const rendered = sent.find(m => m.type === 'RENDER').payload.document
    const [input, picker, , button] = rendered.children
    const send = (id: string, data: unknown) => {
      receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: id, nativeEvent: data } }))
      screen.host.flush()
    }
    const initial = sent.filter(m => m.type === 'MUTATE').flatMap(m => m.payload.operations)
    expect(initial).toContainEqual(expect.objectContaining({ id: input.id, patch: { props: { value: 'Seed' } } }))
    expect(initial).toContainEqual(expect.objectContaining({ id: picker.id, patch: { props: { value: 'one' } } }))
    const inputHandler = initial.find(op => op.id === input.id && op.patch?.events?.onChangeText).patch.events.onChangeText
    const pickerHandler = initial.find(op => op.id === picker.id && op.patch?.events?.onValueChange).patch.events.onValueChange
    const resetHandler = initial.find(op => op.id === button.id && op.patch?.events?.onPress).patch.events.onPress
    sent.length = 0
    send(inputHandler, { text: 'Typed' })
    send(pickerHandler, { value: 'two' })
    const operations = () => sent.filter(m => m.type === 'MUTATE').flatMap(m => m.payload.operations)
    expect(operations()).toContainEqual(expect.objectContaining({ patch: { children: ['Typed:two'] } }))
    expect(operations()).toContainEqual(expect.objectContaining({ id: input.id, patch: { props: { value: 'Typed' } } }))
    expect(operations()).toContainEqual(expect.objectContaining({ id: picker.id, patch: { props: { value: 'two' } } }))
    sent.length = 0
    send(resetHandler, {})
    expect(operations()).toContainEqual(expect.objectContaining({ id: input.id, patch: { props: { value: 'Reset' } } }))
    expect(operations()).toContainEqual(expect.objectContaining({ id: picker.id, patch: { props: { value: 'one' } } }))
    screen.unmount()
  })

  afterEach(() => {
    delete window.__stx_host
  })

  it('keeps static and reactive native classes readable across appearance changes', async () => {
    const compiled = await compileScreenSource(`<script client>
const active = state(true)
function toggle() { active.set(!active()) }
</script>
<View class="bg-white dark:bg-slate-950">
<Text class="font-semibold text-slate-900 dark:text-white">Title</Text>
<Text class="text-2xl" :class="active() ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'">42</Text>
<Text :class="{ 'bg-blue-50 dark:bg-blue-900': active }">Badge</Text>
<Icon class="w-5 h-5" :class="active() ? 'i-lucide-bike text-blue-700 dark:text-blue-300' : 'i-lucide-heart text-slate-900 dark:text-white'" />
<Button @click="toggle()">Toggle</Button>
</View>`, path.join(import.meta.dir, 'Appearance.stx'))
    const sent: any[] = []
    let receive: (raw: string) => void = () => {}
    const bridge = {
      colorScheme: 'dark' as 'light' | 'dark',
      postMessage: (raw: string) => sent.push(JSON.parse(raw)),
      onMessage: (callback: typeof receive) => { receive = callback },
    }
    const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, bridge)
    installNodeConstants()
    window.__stx_host = screen.host
    new Function(generateSignalsRuntimeDev())()
    new Function(compiled.setup!.code)()
    screen.mount(window.stx, window.__stx_latestSetup)
    screen.host.flush()
    const rendered = sent.find(message => message.type === 'RENDER').payload.document
    expect(rendered.style.backgroundColor).toBe('#020617')
    expect(rendered.children[0].style.color).toBe('#ffffff')
    const ops = () => sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(ops()).toContainEqual(expect.objectContaining({ patch: { style: expect.objectContaining({ fontSize: 24, color: '#93c5fd' }) } }))
    expect(ops()).toContainEqual(expect.objectContaining({ patch: { props: { symbol: 'figure.outdoor.cycle', iconify: 'i-lucide-bike' } } }))
    const press = ops().find(operation => operation.patch?.events?.onPress)
    sent.length = 0
    receive(JSON.stringify({ type: 'APPEARANCE', payload: { colorScheme: 'light' } }))
    screen.host.flush()
    expect(ops()).toContainEqual(expect.objectContaining({ id: rendered.id, patch: { style: expect.objectContaining({ backgroundColor: '#ffffff' }) } }))
    expect(ops()).toContainEqual(expect.objectContaining({ patch: { style: expect.objectContaining({ fontSize: 24, color: '#1d4ed8' }) } }))
    sent.length = 0
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: press.patch.events.onPress, nativeEvent: {} } }))
    screen.host.flush()
    expect(ops()).toContainEqual(expect.objectContaining({ patch: { style: expect.objectContaining({ fontSize: 24, color: '#0f172a' }) } }))
    expect(ops()).toContainEqual(expect.objectContaining({ patch: { props: { symbol: 'heart', iconify: 'i-lucide-heart' } } }))
    expect(ops()).toContainEqual(expect.objectContaining({ patch: { style: expect.objectContaining({ backgroundColor: null }) } }))
    sent.length = 0
    receive(JSON.stringify({ type: 'APPEARANCE', payload: { colorScheme: 'dark' } }))
    screen.host.flush()
    expect(ops()).toContainEqual(expect.objectContaining({ patch: { style: expect.objectContaining({ fontSize: 24, color: '#ffffff' }) } }))
    screen.unmount()
  })

  it('turns a native press into a signal-driven text mutation', async () => {
    const source = `<script client>
const count = state(0)
function increment() { count.set(count() + 1) }
</script>
<View><Text :text="count" /><Button @click="increment()">Tap</Button></View>`
    const compiled = await compileScreenSource(source, path.join(import.meta.dir, 'Shared.stx'))
    expect(compiled.setup).not.toBeNull()

    const sent: any[] = []
    let receive: (message: unknown) => void = () => {}
    const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, {
      platform: 'ios',
      capabilityProtocolVersion: 1,
      capabilities: ['storage', 'lifecycle'],
      postMessage: raw => sent.push(JSON.parse(raw)),
      onMessage: callback => { receive = callback },
    })

    installNodeConstants()
    window.__stx_host = screen.host
    new Function(generateSignalsRuntimeDev())()
    new Function(compiled.setup!.code)()
    screen.mount(window.stx, window.__stx_latestSetup)
    screen.host.flush()

    expect(sent[0]).toMatchObject({
      type: 'RENDER',
      payload: {
        mode: 'replace',
        document: { type: 'View' },
      },
    })
    expect(sent[0].payload.document).not.toHaveProperty('root')
    const initialOps = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(initialOps).toContainEqual(expect.objectContaining({
      op: 'updateNode',
      patch: { children: ['0'] },
    }))
    const listener = initialOps.find(operation => operation.patch?.events?.onPress)
    expect(listener).toBeTruthy()

    sent.length = 0
    receive(JSON.stringify({
      type: 'EVENT',
      payload: { handlerId: listener.patch.events.onPress, nativeEvent: {} },
    }))
    screen.host.flush()

    const updateOps = sent.flatMap(message => message.payload.operations)
    expect(updateOps).toContainEqual(expect.objectContaining({
      op: 'updateNode',
      patch: { children: ['1'] },
    }))
  })

  it('binds native Modal show lifecycle listeners without changing @show visibility', async () => {
    const source = `<script client>
const visible = state(false)
const status = state('idle')
function shown() { status.set('shown') }
function requested() { status.set('requested') }
</script>
<View>
  <Modal :visible="visible" @show="shown()" @request-close="requested()"><Text>Modal</Text></Modal>
  <Text :text="status" />
</View>`
    const compiled = await compileScreenSource(source, path.join(import.meta.dir, 'NativeModalLifecycle.stx'))
    const sent: any[] = []
    let receive: (message: unknown) => void = () => {}
    const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, {
      postMessage: raw => sent.push(JSON.parse(raw)),
      onMessage: callback => { receive = callback },
    })

    installNodeConstants()
    window.__stx_host = screen.host
    new Function(generateSignalsRuntimeDev())()
    new Function(compiled.setup!.code)()
    screen.mount(window.stx, window.__stx_latestSetup)
    screen.host.flush()

    const initialOps = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    const showListener = initialOps.find(operation => operation.patch?.events?.onShow)
    const requestListener = initialOps.find(operation => operation.patch?.events?.onRequestClose)
    expect(showListener).toBeTruthy()
    expect(requestListener).toBeTruthy()

    sent.length = 0
    receive(JSON.stringify({
      type: 'EVENT',
      payload: { handlerId: showListener.patch.events.onShow, nativeEvent: {} },
    }))
    screen.host.flush()

    expect(sent.flatMap(message => message.payload.operations)).toContainEqual(expect.objectContaining({
      patch: { children: ['shown'] },
    }))
    sent.length = 0
    receive(JSON.stringify({
      type: 'EVENT',
      payload: { handlerId: requestListener.patch.events.onRequestClose, nativeEvent: {} },
    }))
    screen.host.flush()

    expect(sent.flatMap(message => message.payload.operations)).toContainEqual(expect.objectContaining({
      patch: { children: ['requested'] },
    }))
    screen.unmount()
  })

  it('reconciles keyed native :for rows through the shared runtime', async () => {
    const source = `<script client>
const items = state([{ id: 'a', label: 'Ada' }, { id: 'b', label: 'Bea' }])
const selected = state('none')
function reorder() { items.set([{ id: 'b', label: 'Bea 2' }, { id: 'c', label: 'Cy' }]) }
function select(id) { selected.set(id) }
</script>
<View>
  <ScrollView testID="list-scroll">
    <View :for="item in items" :key="item.id">
      <Text :text="item.label" />
      <Button @click="select(item.id)">Select</Button>
      <TextInput placeholder="Draft" @focus="select(item.id)" />
    </View>
  </ScrollView>
  <Text testID="selected" :text="'Selected ' + selected()" />
  <Button testID="reorder" @click="reorder()">Reorder</Button>
</View>`
    // Exact operation counts below describe low-level primitive rows. Shared
    // component factories/lifecycle are exercised by compiled bundle tests.
    const primitive = path.join(nativePrimitivesDir(), 'Button.stx')
    const compiled = await compileScreenSource(`@import('Button', '${primitive}')\n${source}`, path.join(import.meta.dir, 'NativeFor.stx'))
    const scroll = compiled.document.root.children[0] as any
    expect(scroll.children[0]).toMatchObject({
      bindings: { for: 'item in items', key: 'item.id' },
    })
    expect(scroll.children[0].props['data-stx-native-template']).toBe(true)
    const sent: any[] = []
    let receive: (message: unknown) => void = () => {}
    const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, {
      postMessage: raw => sent.push(JSON.parse(raw)),
      onMessage: callback => { receive = callback },
    })
    const sourceButtonId = ((scroll.children[0] as any).children[0].children[1] as any).props.__stxId

    installNodeConstants()
    window.__stx_host = screen.host
    new Function(generateSignalsRuntimeDev())()
    new Function(compiled.setup!.code)()
    screen.mount(window.stx, window.__stx_latestSetup)
    screen.host.flush()

    const initialOps = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(initialOps.some(operation => operation.id === sourceButtonId && operation.patch?.events?.onPress)).toBe(false)
    expect(initialOps.filter(operation => operation.op === 'createNode')).toHaveLength(8)
    const adaLabel = initialOps.find(operation => operation.patch?.children?.[0] === 'Ada')
    const beaLabel = initialOps.find(operation => operation.patch?.children?.[0] === 'Bea')
    expect(adaLabel).toBeTruthy()
    expect(beaLabel).toBeTruthy()
    const beaRow = initialOps.find(operation => operation.op === 'insertChild' && operation.childId === beaLabel.id)?.parentId
    const beaButton = initialOps.find(operation => operation.op === 'insertChild' && operation.parentId === beaRow
      && initialOps.some(candidate => candidate.id === operation.childId && candidate.patch?.events?.onPress))?.childId
    const beaInput = initialOps.find(operation => operation.op === 'insertChild' && operation.parentId === beaRow
      && initialOps.some(candidate => candidate.op === 'createNode' && candidate.id === operation.childId && candidate.node?.type === 'TextInput'))?.childId
    const adaRow = initialOps.find(operation => operation.op === 'insertChild' && operation.childId === adaLabel.id)?.parentId
    const adaButton = initialOps.find(operation => operation.op === 'insertChild' && operation.parentId === adaRow
      && initialOps.some(candidate => candidate.id === operation.childId && candidate.patch?.events?.onPress))?.childId
    expect(beaButton).toBeTruthy()
    expect(beaInput).toBeTruthy()
    expect(adaButton).toBeTruthy()
    // Text inputs now install focus tracking as they materialize. Authored
    // handlers join that existing multiplexer, so its id can arrive in the
    // createNode rather than a later updateNode. Exercise that exact id below.
    const beaFocus = initialOps.find(operation => operation.id === beaInput && operation.patch?.events?.onFocus)?.patch.events.onFocus
      ?? initialOps.find(operation => operation.id === beaInput && operation.op === 'createNode')?.node.events.onFocus
    expect(beaFocus).toMatch(/^h/)

    const reorderId = (compiled.document.root.children[2] as any).props.__stxId
    const reorderListener = initialOps.find(operation => operation.id === reorderId && operation.patch?.events?.onPress)
    sent.length = 0
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: reorderListener.patch.events.onPress, nativeEvent: {} } }))
    screen.host.flush()

    const updateOps = sent.flatMap(message => message.payload.operations)
    expect(updateOps.filter(operation => operation.op === 'createNode')).toHaveLength(4)
    expect(updateOps).toContainEqual(expect.objectContaining({ id: beaLabel.id, patch: { children: ['Bea 2'] } }))
    expect(updateOps).toContainEqual(expect.objectContaining({ patch: { children: ['Cy'] } }))
    expect(updateOps).toContainEqual(expect.objectContaining({ op: 'moveChild', parentId: scroll.props.__stxId }))
    expect(updateOps.some(operation => operation.op === 'removeNode' && operation.id === scroll.props.__stxId)).toBe(false)
    expect(updateOps.some(operation => operation.op === 'createNode' && operation.id === scroll.props.__stxId)).toBe(false)
    expect(updateOps.some(operation => operation.op === 'removeNode' && [beaLabel.id, beaInput].includes(operation.id))).toBe(false)
    expect(updateOps.some(operation => operation.op === 'createNode' && operation.id === beaInput)).toBe(false)

    // Craft keeps the native control focused when its keyed node is moved.
    // Dispatching the retained handler proves the row scope stayed attached too.
    sent.length = 0
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: beaFocus, nativeEvent: {} } }))
    screen.host.flush()
    expect(sent.flatMap(message => message.payload.operations)).toContainEqual(expect.objectContaining({
      patch: { children: ['Selected b'] },
    }))

    const adaListener = initialOps.find(operation => operation.id === adaButton && operation.patch?.events?.onPress)
    sent.length = 0
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: adaListener.patch.events.onPress, nativeEvent: {} } }))
    screen.host.flush()
    expect(sent).toHaveLength(0)

  })

  it('evaluates HTML-encoded style bindings through the native host', async () => {
    const source = `<script client>
const wide = state(false)
</script>
<View :style="{ &quot;width&quot;: wide() ? 200 : 100 }"><Text>Box</Text></View>`
    const compiled = await compileScreenSource(source, path.join(import.meta.dir, 'EncodedStyle.stx'))
    const sent: any[] = []
    const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, {
      postMessage: raw => sent.push(JSON.parse(raw)),
      onMessage: () => {},
    })

    installNodeConstants()
    window.__stx_host = screen.host
    new Function(generateSignalsRuntimeDev())()
    new Function(compiled.setup!.code)()
    screen.mount(window.stx, window.__stx_latestSetup)
    screen.host.flush()

    const updates = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(updates).toContainEqual(expect.objectContaining({ patch: { style: { width: 100 } } }))
  })

  it('keeps structured native prop bindings as objects', async () => {
    const source = `<script client>
const image = state({ uri: 'avatar.png' })
</script>
<View :accessibilityState="image"><Text>Image</Text></View>`
    const compiled = await compileScreenSource(source, path.join(import.meta.dir, 'StructuredProp.stx'))
    const sent: any[] = []
    const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, {
      postMessage: raw => sent.push(JSON.parse(raw)),
      onMessage: () => {},
    })

    installNodeConstants()
    window.__stx_host = screen.host
    new Function(generateSignalsRuntimeDev())()
    new Function(compiled.setup!.code)()
    screen.mount(window.stx, window.__stx_latestSetup)
    screen.host.flush()

    const updates = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(updates).toContainEqual(expect.objectContaining({
      patch: { props: { accessibilityState: { uri: 'avatar.png' } } },
    }))
  })

  it('updates conditional rows and imported labels after a native pull-to-refresh', async () => {
    const root = createTempDir('stx-native-refresh-')
    const file = path.join(root, 'Screen.stx')
    await Bun.write(path.join(root, 'labels.ts'), "export const label = value => 'Session: ' + value\n")
    await Bun.write(file, `<script client>
import { label } from './labels'
const rows = state([{ id: 'a', title: 'Run', ready: false }])
const refreshing = state(false)
const scrollTarget = state(null)
function refresh() {
  scrollTarget.set({ id: 'day-1', key: 1 })
  refreshing.set(true)
  rows.set([{ id: 'a', title: 'Ride', ready: true }])
}
</script>
<ScrollView @refresh="refresh()" :refreshing="refreshing" :scrollTarget="scrollTarget">
  <View :for="row in rows" :key="row.id">
    <Text :text="label(row.title)" />
    <Text :if="row.ready" :text="'Ready ' + row.title" />
  </View>
</ScrollView>`)
    const { code, diagnostics } = await compileSharedScreenBundle(file)
    expect(diagnostics.some(item => item.message.includes('unread-event'))).toBe(false)
    const sent: any[] = []
    let receive: (raw: string) => void = () => {}
    const scope = {
      console, Promise, Date, Map, Set, WeakMap, WeakSet,
      __stxNativeBridge: {
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: (callback: typeof receive) => { receive = callback },
      },
    }
    vm.runInNewContext(code, scope)
    await Bun.sleep(0)
    const initial = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(initial).toContainEqual(expect.objectContaining({ patch: { children: ['Session: Run'] } }))
    const listener = initial.find(operation => operation.patch?.events?.onRefresh)
    expect(listener).toBeTruthy()
    sent.length = 0
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: listener.patch.events.onRefresh, nativeEvent: {} } }))
    await Bun.sleep(0)
    const updates = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(updates).toContainEqual(expect.objectContaining({ patch: { children: ['Session: Ride'] } }))
    expect(updates).toContainEqual(expect.objectContaining({ patch: { children: ['Ready Ride'] } }))
    expect(updates).toContainEqual(expect.objectContaining({ patch: { props: { refreshing: true } } }))
    expect(updates).toContainEqual(expect.objectContaining({ patch: { props: { scrollTarget: { id: 'day-1', key: 1 } } } }))
  })

  it('runs the same path as a DOM-free JavaScriptCore bundle', async () => {
    const root = createTempDir('stx-native-shared-')
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const count = state(0)
function increment() { count.set(count() + 1) }
</script>
<View><Text :text="count" /><Button @click="increment()">Tap</Button></View>`)
    const { code } = await compileSharedScreenBundle(file)
    const sent: any[] = []
    let receive: (message: unknown) => void = () => {}
    const scope = {
      console,
      setTimeout,
      clearTimeout,
      Promise,
      Date,
      Map,
      Set,
      WeakMap,
      WeakSet,
      __stxNativeBridge: {
        platform: 'ios',
        capabilityProtocolVersion: 1,
        capabilities: ['storage', 'lifecycle'],
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: (callback: typeof receive) => { receive = callback },
      },
    }
    vm.runInNewContext(code, scope)
    await Promise.resolve()

    const initialOps = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    const listener = initialOps.find(operation => operation.patch?.events?.onPress)
    expect(listener).toBeTruthy()
    sent.length = 0
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerName: listener.patch.events.onPress, nativeEvent: {} } }))
    await Promise.resolve()

    const updates = sent.flatMap(message => message.payload.operations)
    expect(updates).toContainEqual(expect.objectContaining({ patch: { children: ['1'] } }))
  })

  it('mounts and tears down one native screen lifecycle exactly once', async () => {
    const root = createTempDir('stx-native-lifecycle-')
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
globalThis.__nativeLifecycle = []
const count = state(0)
globalThis.__nativeCount = count
onMount(() => {
  globalThis.__nativeLifecycle.push('mount')
  return () => globalThis.__nativeLifecycle.push('mount cleanup')
})
onDestroy(() => globalThis.__nativeLifecycle.push('destroy'))
</script>
<View><Text :text="count" /></View>`)
    const { code } = await compileSharedScreenBundle(file)
    const sent: any[] = []
    const scope: Record<string, any> = {
      console,
      setTimeout,
      clearTimeout,
      Promise,
      Date,
      Map,
      Set,
      WeakMap,
      WeakSet,
      __stxNativeBridge: {
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: () => {},
      },
    }

    vm.runInNewContext(code, scope)
    await Bun.sleep(0)
    expect(scope.__nativeLifecycle).toEqual(['mount'])

    sent.length = 0
    scope.__stxNativeUnmount()
    scope.__stxNativeUnmount()
    scope.__nativeCount.set(1)
    await Bun.sleep(0)

    expect(scope.__nativeLifecycle).toEqual(['mount', 'destroy', 'mount cleanup'])
    expect(sent.filter(message => message.type === 'MUTATE')).toHaveLength(0)
  })

  it('installs Craft capabilities before client setup executes', async () => {
    const root = createTempDir('stx-native-craft-')
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const status = state(craft.lifecycle.getState())
craft.lifecycle.onStateChange(next => status.set(next))
const ready = craft.storage.get('ready').then(value => status.set(value))
</script>
<View><Text :text="status" /></View>`)
    const { code } = await compileSharedScreenBundle(file)
    const sent: any[] = []
    let receive: (message: string) => void = () => {}
    const scope: Record<string, any> = {
      console,
      setTimeout,
      clearTimeout,
      Promise,
      Date,
      Map,
      Set,
      WeakMap,
      WeakSet,
      __stxNativeBridge: {
        platform: 'ios',
        capabilityProtocolVersion: 1,
        capabilities: ['storage', 'lifecycle'],
        initialAppState: 'active',
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: (callback: typeof receive) => { receive = callback },
      },
    }
    vm.runInNewContext(code, scope)
    const request = sent.find(message => message.type === 'API_REQUEST')
    expect(scope.craft).toMatchObject({ platform: 'ios', capabilities: { storage: true, lifecycle: true } })
    receive(JSON.stringify({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: 'ready' },
    }))
    await Bun.sleep(0)
    receive(JSON.stringify({ type: 'APP_STATE', payload: { state: 'background' } }))
    await Bun.sleep(0)
    const updates = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(updates).toContainEqual(expect.objectContaining({ patch: { children: ['ready'] } }))
    expect(updates).toContainEqual(expect.objectContaining({ patch: { children: ['background'] } }))
  })

  it('keeps navigation and native fetch on the shared bridge', async () => {
    const root = createTempDir('stx-native-craft-')
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, '<View><Text>Craft</Text></View>')
    const { code } = await compileSharedScreenBundle(file)
    const sent: any[] = []
    const nativeOptions: any[] = []
    let navTaps = 0
    let receive: (message: string) => void = () => {}
    const scope: Record<string, any> = {
      console,
      setTimeout,
      clearTimeout,
      Promise,
      Date,
      Map,
      Set,
      WeakMap,
      WeakSet,
      craft: { navigation: { setOptions: (options: unknown) => nativeOptions.push(options) } },
      __stxNativeBridge: {
        capabilities: ['fetch'],
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: (callback: typeof receive) => { receive = callback },
      },
    }
    vm.runInNewContext(code, scope)
    expect(scope.craft.route).toEqual({ name: 'main', params: {} })
    scope.craft.navigation.open('/m/workout/42')
    scope.craft.navigation.setOptions({ title: 'Today', rightButtons: [{ id: 'me', title: 'Me', onPress: () => { navTaps++ } }] })
    expect(sent.at(-1)).toMatchObject({ type: 'NAVIGATE_OPEN', payload: { path: '/m/workout/42' } })
    expect(nativeOptions).toEqual([{ title: 'Today', rightButtons: [{ id: 'me', title: 'Me' }] }])
    receive(JSON.stringify({ type: 'NAV_BUTTON', payload: { id: 'me' } }))
    expect(navTaps).toBe(1)
    let calendarTaps = 0
    scope.craft.navigation.setOptions({ leftButtons: [{ id: 'calendar', symbol: 'calendar', variant: 'neutral', onPress: () => { calendarTaps++ } }] })
    expect(nativeOptions.at(-1)).toEqual({ leftButtons: [{ id: 'calendar', symbol: 'calendar', variant: 'neutral' }] })
    receive(JSON.stringify({ type: 'NAV_BUTTON', payload: { id: 'me' } }))
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerName: 'navButton', nativeEvent: { id: 'calendar' } } }))
    expect(navTaps).toBe(2)
    expect(calendarTaps).toBe(1)
    scope.craft.navigation.setOptions({ rightButtons: [] })
    receive(JSON.stringify({ type: 'NAV_BUTTON', payload: { id: 'me' } }))
    receive(JSON.stringify({ type: 'NAV_BUTTON', payload: { id: 'calendar' } }))
    expect(navTaps).toBe(2)
    expect(calendarTaps).toBe(2)
    scope.craft.navigation.setOptions({ leftButtons: [] })
    receive(JSON.stringify({ type: 'NAV_BUTTON', payload: { id: 'calendar' } }))
    expect(calendarTaps).toBe(2)
    expect(() => scope.craft.navigation.push('missing')).toThrow('Unknown native screen')

    const response = scope.fetch('https://example.test/profile', { headers: { Accept: 'application/json' } })
    const request = sent.at(-1)
    expect(request).toMatchObject({
      type: 'API_REQUEST',
      payload: { module: 'Network', method: 'fetch', args: [{ url: 'https://example.test/profile', method: 'GET', headers: { accept: 'application/json' }, body: null }] },
    })
    receive(JSON.stringify({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: { status: 200, headers: { 'content-type': 'application/json' }, body: '{"name":"Glenn"}' } },
    }))
    expect(await (await response).json()).toEqual({ name: 'Glenn' })
  })

  it('executes a plain client handler without the retired redraw runtime', async () => {
    const root = createTempDir('stx-native-plain-client-')
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const label = 'Ready'
function leave() { craft.navigation.back() }
</script>
<View><Text :text="label" /><Button @click="leave()">Back</Button></View>`)
    const { code } = await compileSharedScreenBundle(file)
    const sent: any[] = []
    let receive: (message: string) => void = () => {}
    const scope: Record<string, any> = {
      console,
      Promise,
      Date,
      Map,
      Set,
      WeakMap,
      WeakSet,
      __stxNativeBridge: {
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: (callback: typeof receive) => { receive = callback },
      },
    }
    vm.runInNewContext(code, scope)
    await Bun.sleep(0)
    const operations = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(operations).toContainEqual(expect.objectContaining({ patch: { children: ['Ready'] } }))
    const listener = operations.find(operation => operation.patch?.events?.onPress).patch.events.onPress
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: listener, nativeEvent: {} } }))
    expect(sent.at(-1)).toMatchObject({ type: 'NAVIGATE_BACK' })
  })

  it('bundles TypeScript imports and preserves host synchronous state', async () => {
    const root = createTempDir('stx-native-import-')
    await Bun.write(path.join(root, 'label.ts'), `export type Kind = 'saved'
export function label(kind: Kind): string { return kind.toUpperCase() }`)
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, `<script client lang="ts">
import { label, type Kind } from './label'
const kind: Kind = craft.storage.getSync('kind') || 'saved'
const title = state(label(kind))
</script>
<View><Text :text="title" /></View>`)
    const { code } = await compileSharedScreenBundle(file)
    const sent: any[] = []
    const scope: Record<string, any> = {
      console,
      Promise,
      Date,
      Map,
      Set,
      WeakMap,
      WeakSet,
      craft: { storage: { getSync: () => 'saved', setSync: () => {} } },
      __stxNativeBridge: {
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: () => {},
      },
    }
    vm.runInNewContext(code, scope)
    await Bun.sleep(0)
    const operations = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(operations).toContainEqual(expect.objectContaining({ patch: { children: ['SAVED'] } }))
    expect(scope.craft.storage.getSync('kind')).toBe('saved')
  })

  it('runs an expanded component own client scope for every native instance', async () => {
    const root = createTempDir('stx-native-component-scope-')
    mkdirSync(path.join(root, 'components'), { recursive: true })
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(path.join(root, 'components', 'CounterBadge.stx'), `<script client>
const count = state(0)
const label = derived(() => 'Local ' + count())
function increment() { count.set(count() + 1) }
</script>
<View><Text :text="label" /><Button @click="increment()">Add</Button></View>`)
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, '<View><CounterBadge /><CounterBadge /></View>')

    const { code } = await compileSharedScreenBundle(file, { root })
    const sent: any[] = []
    let receive: (message: string) => void = () => {}
    const scope: Record<string, any> = {
      console,
      Promise,
      Date,
      Map,
      Set,
      WeakMap,
      WeakSet,
      __stxNativeBridge: {
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: (callback: typeof receive) => { receive = callback },
      },
    }
    vm.runInNewContext(code, scope)
    await Bun.sleep(0)

    const initial = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(initial.filter(operation => operation.patch?.children?.[0] === 'Local 0')).toHaveLength(2)
    const presses = initial.filter(operation => operation.patch?.events?.onPress)
    expect(presses).toHaveLength(2)

    sent.length = 0
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: presses[0].patch.events.onPress, nativeEvent: {} } }))
    scope.__stx_host.flush()
    const updates = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(updates.filter(operation => operation.patch?.children?.[0] === 'Local 1')).toHaveLength(1)
  })
})
