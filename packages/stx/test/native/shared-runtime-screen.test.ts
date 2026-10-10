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
      postMessage: raw => sent.push(JSON.parse(raw)),
      onMessage: callback => { receive = callback },
    })

    installNodeConstants()
    window.__stx_host = screen.host
    new Function(generateSignalsRuntimeDev())()
    new Function(compiled.setup!.code)()
    screen.mount(window.stx, window.__stx_latestSetup)
    screen.host.flush()

    expect(sent[0]).toMatchObject({ type: 'RENDER', payload: { mode: 'replace' } })
    const initialOps = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(initialOps).toContainEqual(expect.objectContaining({
      op: 'updateNode',
      patch: { children: ['0'] },
    }))
    const listener = initialOps.find(operation => operation.patch?.events?.onPress)
    expect(listener).toBeTruthy()

    sent.length = 0
    receive({
      type: 'EVENT',
      payload: { handlerId: listener.patch.events.onPress, nativeEvent: {} },
    })
    screen.host.flush()

    const updateOps = sent.flatMap(message => message.payload.operations)
    expect(updateOps).toContainEqual(expect.objectContaining({
      op: 'updateNode',
      patch: { children: ['1'] },
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
    receive({ type: 'EVENT', payload: { handlerName: listener.patch.events.onPress, nativeEvent: {} } })
    await Promise.resolve()

    const updates = sent.flatMap(message => message.payload.operations)
    expect(updates).toContainEqual(expect.objectContaining({ patch: { children: ['1'] } }))
  })
})
