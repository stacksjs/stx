import { describe, expect, it } from 'bun:test'
import { NativeCapabilityError, STXBridge } from '../../src/native/bridge/protocol'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'
import type { NativeNavigationOptions } from '../../src/native/runtime/craft'

function host() {
  const sent: Array<Record<string, any>> = []
  let receive: (message: string) => void = () => {}
  return {
    sent,
    receive: (message: Record<string, any>) => receive(JSON.stringify(message)),
    bridge: {
      postMessage(raw: string) { sent.push(JSON.parse(raw)) },
      onMessage(callback: (message: string) => void) { receive = callback },
    },
  }
}

describe('typed native capability bridge', () => {
  it.each(['getSync', 'setSync'])('rejects unsupported synchronous storage %s without pretending to persist', (method) => {
    const native = host()
    const protocol = new STXBridge()
    protocol.initialize(native.bridge)
    // Advertising asynchronous storage does not install a synchronous host API.
    const craft = installCraftBridge(protocol, { ...native.bridge, capabilities: ['storage'] }, {})
    let failure: unknown
    try {
      if (method === 'getSync') craft.storage.getSync('checkpoint')
      else craft.storage.setSync('checkpoint', { generation: 1 })
    }
    catch (error) { failure = error }
    expect(failure).toBeInstanceOf(NativeCapabilityError)
    expect(failure).toMatchObject({ code: 'STORAGE_SYNC_UNSUPPORTED' })
    expect(native.sent).toEqual([])
    protocol.dispose()
  })

  it('preserves real synchronous host storage methods and their failures', () => {
    const native = host()
    const protocol = new STXBridge()
    protocol.initialize(native.bridge)
    let value: unknown = null
    const diskFull = new Error('Disk full')
    const getSync = () => value
    const setSync = (key: string, next: unknown) => {
      if (key === 'full') throw diskFull
      value = next
    }
    const craft = installCraftBridge(protocol, native.bridge, { craft: { storage: { getSync, setSync } } })
    expect(craft.storage.getSync).toBe(getSync)
    expect(craft.storage.setSync).toBe(setSync)
    expect(craft.storage.getSync('checkpoint')).toBeNull()
    craft.storage.setSync('checkpoint', { generation: 1 })
    expect(craft.storage.getSync('checkpoint')).toEqual({ generation: 1 })
    expect(() => craft.storage.setSync('full', { generation: 2 })).toThrow(diskFull)
    expect(craft.storage.getSync('checkpoint')).toEqual({ generation: 1 })
    protocol.dispose()
  })

  it('exposes owned audio recording only when the host advertises it', async () => {
    const native = host()
    const protocol = new STXBridge()
    protocol.initialize(native.bridge)
    const craft = installCraftBridge(protocol, { ...native.bridge, capabilities: ['audioRecording'] }, {})
    expect(craft.capabilities.audioRecording).toBe(true)
    const pending = craft.audioRecording.start('owner', { maxSeconds: 60 })
    const request = native.sent.find(message => message.payload?.module === 'AudioRecording')!
    expect(request.payload).toMatchObject({ version: 1, module: 'AudioRecording', method: 'start', args: ['owner', { maxSeconds: 60 }] })
    native.receive({ type: 'API_RESPONSE', correlationId: request.id, payload: { version: 1, requestId: request.id, data: true } })
    await expect(pending).resolves.toBe(true)
    protocol.dispose()
  })

  it.each(['ios', 'android'])('preserves screen chrome options and explicit navigation on %s', (platform) => {
    const native = host()
    const protocol = new STXBridge()
    protocol.initialize(native.bridge)
    const craft = installCraftBridge(protocol, { ...native.bridge, platform }, {})
    const options: NativeNavigationOptions = { hidden: true, tabBarHidden: true, swipeBack: false }
    craft.navigation.setOptions(options)
    craft.navigation.open('/feed')
    craft.navigation.setOptions({ hidden: false, tabBarHidden: false, swipeBack: true })
    expect(native.sent.map(({ type, payload }) => ({ type, payload }))).toEqual([
      { type: 'NAVIGATION_SET_OPTIONS', payload: options },
      { type: 'NAVIGATE_OPEN', payload: { path: '/feed' } },
      { type: 'NAVIGATION_SET_OPTIONS', payload: { hidden: false, tabBarHidden: false, swipeBack: true } },
    ])
    protocol.dispose()
  })

  it('sends protocol v1 and resolves a correlated response', async () => {
    const native = host()
    const bridge = new STXBridge()
    bridge.initialize(native.bridge)
    const answer = bridge.callNativeAPI<string>('Storage', 'get', 'theme')
    const request = native.sent[0]
    expect(request).toMatchObject({
      type: 'API_REQUEST',
      payload: { version: 1, module: 'Storage', method: 'get', args: ['theme'] },
    })
    native.receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: 'dark' },
    })
    expect(await answer).toBe('dark')
  })

  it('preserves structured native error codes', async () => {
    const native = host()
    const bridge = new STXBridge()
    bridge.initialize(native.bridge)
    const answer = bridge.callNativeAPI('Database', 'query', '')
    const request = native.sent[0]
    native.receive({
      type: 'API_ERROR',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, code: 'INVALID_ARGUMENT', message: 'SQL is empty' },
    })
    await expect(answer).rejects.toEqual(new NativeCapabilityError('INVALID_ARGUMENT', 'SQL is empty'))
  })

  it('cancels an API request when its JavaScript timer expires', async () => {
    const native = host()
    const bridge = new STXBridge()
    bridge.initialize(native.bridge)
    const answer = bridge.request('API_REQUEST', {
      version: 1,
      module: 'Storage',
      method: 'get',
      args: ['slow'],
    }, 5)
    await expect(answer).rejects.toMatchObject({ code: 'TIMEOUT' })
    expect(native.sent.at(-1)).toMatchObject({
      type: 'API_CANCEL',
      payload: { version: 1, requestId: native.sent[0].id, reason: 'timeout' },
    })
  })

  it('cancels every pending capability when its native screen closes', async () => {
    const native = host()
    const bridge = new STXBridge()
    bridge.initialize(native.bridge)
    const storage = bridge.callNativeAPI('Storage', 'get', 'draft')
    const network = bridge.callNativeAPI('Network', 'fetch', { url: 'https://example.test', method: 'GET' })
    const settled = Promise.allSettled([storage, network])
    const requestIds = native.sent.filter(message => message.type === 'API_REQUEST').map(message => message.id)

    bridge.dispose('screen-closed')

    const results = await settled
    expect(results).toEqual([
      { status: 'rejected', reason: expect.objectContaining({ code: 'CANCELLED' }) },
      { status: 'rejected', reason: expect.objectContaining({ code: 'CANCELLED' }) },
    ])
    expect(native.sent.filter(message => message.type === 'API_CANCEL').map(message => message.payload)).toEqual([
      { version: 1, requestId: requestIds[0], reason: 'screen-closed' },
      { version: 1, requestId: requestIds[1], reason: 'screen-closed' },
    ])
  })
})
