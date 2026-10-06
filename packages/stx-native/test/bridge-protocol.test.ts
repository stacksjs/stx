import { describe, expect, it } from 'bun:test'
import { NativeCapabilityError, STXBridge } from '../src/bridge/protocol'

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
})
