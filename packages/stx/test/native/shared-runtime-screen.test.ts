import { afterEach, describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileScreenSource } from '../../src/native/compiler/render-screen'
import { prepareSharedNativeScreen } from '../../src/native/runtime/shared-screen'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants } from '../../test-utils/dom-runtime-shim'

declare const window: any

describe('a native screen on the shared stx signals runtime', () => {
  afterEach(() => {
    delete window.__stx_host
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
      patch: { props: { 'accessibility-state': { uri: 'avatar.png' } } },
    }))
  })

  it('runs the same path as a DOM-free JavaScriptCore bundle', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-shared-'))
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
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-lifecycle-'))
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
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-craft-'))
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
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-craft-'))
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
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-plain-client-'))
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
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-import-'))
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
})
