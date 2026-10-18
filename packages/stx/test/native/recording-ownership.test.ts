import { expect, test } from 'bun:test'
import { STXBridge } from '../../src/native/bridge/protocol'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'

function setup(owned: boolean) {
  const sent: any[] = []
  let receive: (raw: string) => void = () => {}
  const native = {
    capabilities: ['storage', 'geolocation', 'heartRate', 'crypto', ...(owned ? ['storageSetIfAbsent', 'storageCompareAndSet', 'locationRecordingOwnership', 'heartRateRecordingOwnership', 'locationRecordingIntentIdentity', 'heartRateRecordingIntentIdentity'] : [])],
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
  expect(old.craft.capabilities.storageSetIfAbsent).toBe(false)
  await expect(old.craft.storage.setIfAbsent('draft', null)).rejects.toMatchObject({ code: 'STORAGE_SET_IF_ABSENT_UNSUPPORTED' })
  expect(old.sent).toEqual([])
  const host = setup(true)
  expect(host.craft.capabilities.storageCompareAndSet).toBe(true)
  const answer = host.craft.storage.compareAndSet('draft', { id: 'A' }, { id: 'B' })
  expect(host.sent.at(-1).payload).toMatchObject({ module: 'Storage', method: 'compareAndSet', args: ['draft', { id: 'A' }, { id: 'B' }] })
  host.resolve(false)
  expect(await answer).toBe(false)
  const registered = host.craft.storage.setIfAbsent('draft', null)
  expect(host.sent.at(-1).payload).toMatchObject({ module: 'Storage', method: 'setIfAbsent', args: ['draft', null] })
  host.resolve(false)
  expect(await registered).toBe(false)
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

for (const [namespace, module] of [['location', 'Location'], ['heartRate', 'HeartRate']] as const) {
  test(`${namespace} starts the exact persisted intent and rejects response mismatches`, async () => {
    const old = setup(false)
    await expect(old.craft[namespace].startRecording({ recordingId: 'planned' })).rejects.toMatchObject({ code: 'RECORDING_INTENT_IDENTITY_UNSUPPORTED' })
    expect(old.sent).toEqual([])
    const host = setup(true)
    expect(host.craft.capabilities[`${namespace}RecordingIntentIdentity`]).toBe(true)
    const answer = host.craft[namespace].startRecording({ recordingId: 'planned' })
    expect(host.sent.at(-1).payload).toMatchObject({ module, method: 'startRecording', args: [{ recordingId: 'planned' }] })
    host.resolve({ id: 'planned' })
    expect(await answer).toMatchObject({ id: 'planned' })
    const mismatch = host.craft[namespace].startRecording({ recordingId: 'next' })
    host.resolve({ id: 'foreign' })
    await expect(mismatch).rejects.toMatchObject({ code: 'RECORDING_CONFLICT' })
    const before = host.sent.length
    for (const recordingId of ['', '  ', null, undefined, 42])
      await expect(host.craft[namespace].startRecording({ recordingId })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' })
    expect(host.sent.length).toBe(before)
  })
}

test('secure UUIDs cross the public native capability boundary', async () => {
  const host = setup(true)
  expect(host.craft.capabilities.crypto).toBe(true)
  const answer = host.craft.crypto.randomUUID()
  expect(host.sent.at(-1).payload).toMatchObject({ module: 'Crypto', method: 'randomUUID', args: [] })
  host.resolve('c4847342-93ce-4b80-bdc1-d26075fbc1d3')
  expect(await answer).toBe('c4847342-93ce-4b80-bdc1-d26075fbc1d3')
})
