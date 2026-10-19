/**
 * Haptics on a native screen: notification() and selection() play the host's
 * own notification and selection haptics (Craft iOS has both), fall back to an
 * impact on a host that does not know them, and no haptics call ever rejects.
 */
import { expect, test } from 'bun:test'
import { STXBridge } from '../../src/native/bridge/protocol'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'

/** A host that answers each Haptics request with `reply(method, args)`: data, or `{ error: code }`. */
function host(reply: (method: string, args: unknown[]) => unknown = () => null) {
  const sent: Array<{ method: string, args: unknown[] }> = []
  let receive: (raw: string) => void = () => {}
  const native = {
    capabilities: ['haptics'],
    capabilityTimeoutMs: 50,
    postMessage(raw: string) {
      const message = JSON.parse(raw)
      if (message.type !== 'API_REQUEST') return
      const { method, args } = message.payload
      sent.push({ method, args })
      const answer = reply(method, args) as { error?: string } | null
      queueMicrotask(() => receive(JSON.stringify(answer && answer.error
        ? { type: 'API_ERROR', correlationId: message.id, payload: { code: answer.error, message: answer.error } }
        : { type: 'API_RESPONSE', correlationId: message.id, payload: { data: answer } })))
    },
    onMessage(callback: (raw: string) => void) { receive = callback },
  }
  const protocol = new STXBridge()
  protocol.initialize(native)
  const craft = installCraftBridge(protocol, native, {})
  return { craft, sent }
}

test('notification and selection reach the native notification and selection haptics', async () => {
  const { craft, sent } = host()
  await craft.haptics.notification('success')
  await craft.haptics.notification('warning')
  await craft.haptics.notification('error')
  await craft.haptics.notification()
  await craft.haptics.selection()
  await craft.haptics.impact('rigid')
  await craft.haptics.prepare('selection')
  expect(sent).toEqual([
    { method: 'notification', args: ['success'] },
    { method: 'notification', args: ['warning'] },
    { method: 'notification', args: ['error'] },
    { method: 'notification', args: ['success'] },
    { method: 'selection', args: [] },
    { method: 'impact', args: ['rigid'] },
    { method: 'prepare', args: ['selection'] },
  ])
})

test('a host without them gets the impact they used to be, and is not asked again', async () => {
  const { craft, sent } = host(method => method === 'impact' ? null : { error: 'UNKNOWN_ACTION' })
  await craft.haptics.notification('error')
  await craft.haptics.notification('warning')
  await craft.haptics.selection()
  await craft.haptics.selection()
  await craft.haptics.prepare()
  await craft.haptics.prepare()
  expect(sent).toEqual([
    { method: 'notification', args: ['error'] },
    { method: 'impact', args: ['heavy'] },
    { method: 'impact', args: ['medium'] },
    { method: 'selection', args: [] },
    { method: 'impact', args: ['soft'] },
    { method: 'impact', args: ['soft'] },
    { method: 'prepare', args: [] },
  ])
})

test('no haptics call rejects, whatever the host answers', async () => {
  for (const code of ['UNSUPPORTED', 'CAPABILITY_DISABLED', 'UNKNOWN_ACTION', 'NATIVE_ERROR']) {
    const { craft } = host(() => ({ error: code }))
    await expect(craft.haptics.impact('light')).resolves.toBeUndefined()
    await expect(craft.haptics.notification('success')).resolves.toBeUndefined()
    await expect(craft.haptics.selection()).resolves.toBeUndefined()
    await expect(craft.haptics.prepare('impact')).resolves.toBeUndefined()
    await expect(craft.haptic('heavy')).resolves.toBeUndefined()
  }
})

test('a host that never answers times out quietly', async () => {
  const sent: string[] = []
  const native = {
    capabilities: ['haptics'],
    capabilityTimeoutMs: 10,
    postMessage(raw: string) { sent.push(JSON.parse(raw).type) },
    onMessage() {},
  }
  const protocol = new STXBridge()
  protocol.initialize(native)
  const craft = installCraftBridge(protocol, native, {})
  await expect(craft.haptics.selection()).resolves.toBeUndefined()
  expect(sent).toContain('API_REQUEST')
})
