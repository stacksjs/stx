import { expect, test } from 'bun:test'
import { STXBridge } from '../../src/native/bridge/protocol'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'

function setup(owned: boolean) {
  const sent: any[] = []
  let receive: (raw: string) => void = () => {}
  const native = {
    capabilities: ['storage', 'geolocation', 'heartRate', ...(owned ? ['storageCompareAndSet', 'locationRecordingOwnership', 'heartRateRecordingOwnership'] : [])],
    postMessage(raw: string) { sent.push(JSON.parse(raw)) },
    onMessage(callback: (raw: string) => void) { receive = callback },
  }
  const protocol = new STXBridge()
  protocol.initialize(native)
  const craft = installCraftBridge(protocol, native, {})
  return { craft, sent, resolve(data: unknown = []) {
    const request = sent.at(-1)
    receive(JSON.stringify({ type: 'API_RESPONSE', correlationId: request.id, payload: { version: 1, requestId: request.id, data } }))
  } }
}

test('conditional storage checkpoints require a capable host and preserve false conflicts', async () => {
  const old = setup(false)
  expect(old.craft.capabilities.storageCompareAndSet).toBe(false)
  await expect(old.craft.storage.compareAndSet('draft', { id: 'A' }, { id: 'B' })).rejects.toMatchObject({ code: 'STORAGE_COMPARE_AND_SET_UNSUPPORTED' })
  expect(old.sent).toEqual([])
  const host = setup(true)
  expect(host.craft.capabilities.storageCompareAndSet).toBe(true)
  const answer = host.craft.storage.compareAndSet('draft', { id: 'A' }, { id: 'B' })
  expect(host.sent.at(-1).payload).toMatchObject({ module: 'Storage', method: 'compareAndSet', args: ['draft', { id: 'A' }, { id: 'B' }] })
  host.resolve(false)
  expect(await answer).toBe(false)
})

for (const [namespace, module] of [['location', 'Location'], ['heartRate', 'HeartRate']] as const) {
  test(`${namespace} preserves native ownership capability and each operation's identity`, async () => {
    const host = setup(true)
    expect(host.craft.capabilities[`${namespace}RecordingOwnership`]).toBe(true)
    for (const method of ['pauseRecording', 'resumeRecording', 'stopRecording', 'readRecording', 'getRecordingState', 'acknowledgeRecording']) {
      const options = method === 'readRecording' && namespace === 'heartRate' ? { expectedId: 'recording-B', since: 125 } : { expectedId: 'recording-B' }
      const answer = host.craft[namespace][method](options)
      expect(host.sent.at(-1).payload).toMatchObject({ module, method, args: [options] })
      host.resolve()
      await answer
    }
  })

  test(`${namespace} rejects guarded operations on older hosts without issuing native calls`, async () => {
    const host = setup(false)
    expect(host.craft.capabilities[`${namespace}RecordingOwnership`]).toBe(false)
    for (const method of ['pauseRecording', 'resumeRecording', 'stopRecording', 'readRecording', 'getRecordingState', 'acknowledgeRecording'])
      await expect(host.craft[namespace][method]({ expectedId: 'recording-B' })).rejects.toMatchObject({ code: 'RECORDING_OWNERSHIP_UNSUPPORTED' })
    expect(host.sent).toEqual([])
  })
}
