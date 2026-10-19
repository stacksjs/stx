/**
 * The signed-in account on a native screen: craft.session reads the token the
 * host keeps in secure storage and reports each change the host sends as
 * SESSION_CHANGED, so a screen can reset per-account state on it.
 */
import { expect, test } from 'bun:test'
import { STXBridge } from '../../src/native/bridge/protocol'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'

function host(options: { key?: string, token?: string | null, session?: Record<string, unknown> } = {}) {
  let receive: (raw: string) => void = () => {}
  const native: Record<string, any> = {
    capabilities: ['secureStorage'],
    sessionTokenKey: options.key,
    postMessage() {},
    onMessage(callback: (raw: string) => void) { receive = callback },
  }
  const protocol = new STXBridge()
  protocol.initialize(native)
  const target: Record<string, any> = { craft: { secureStorage: { getSync: (key: string) => key === (options.key || 'auth.token') ? options.token ?? null : null }, ...(options.session ? { session: options.session } : {}) } }
  const craft = installCraftBridge(protocol, native, target)
  const send = (payload: Record<string, unknown>) => receive(JSON.stringify({ type: 'SESSION_CHANGED', payload }))
  return { craft, send }
}

test('reads the token the host keeps, under the host\'s key', () => {
  expect(host({ token: 'tok-1' }).craft.session.token()).toBe('tok-1')
  expect(host({ token: null }).craft.session.token()).toBeNull()
  const custom = host({ key: 'app.session', token: 'tok-2' })
  expect(custom.craft.session.key).toBe('app.session')
  expect(custom.craft.session.token()).toBe('tok-2')
})

test('reports each change once, with the token before it, until unsubscribed', () => {
  const { craft, send } = host()
  const heard: Array<[string | null, string | null]> = []
  const stop = craft.session.onChange((token: string | null, previous: string | null) => heard.push([token, previous]))
  send({ key: 'auth.token', token: 'a', previous: null })
  send({ key: 'auth.token', token: 'b', previous: 'a' })
  send({ key: 'auth.token', token: null, previous: 'b' })
  send({ key: 'auth.token', token: 'c', previous: 'c' })
  send({ key: 'other.key', token: 'd', previous: null })
  stop()
  send({ key: 'auth.token', token: 'e', previous: null })
  expect(heard).toEqual([['a', null], ['b', 'a'], [null, 'b']])
})

test('keeps what the host installed for itself', () => {
  const { craft } = host({ session: { key: 'host.key', token: () => 'host-token' }, token: 'ignored' })
  expect(craft.session.key).toBe('host.key')
  expect(craft.session.token()).toBe('host-token')
})

test('advertises change events only when the native host declares their token key', () => {
  // An old host can still subscribe, but has never promised to emit an event.
  expect(host().craft.session.supportsEvents).toBe(false)
  expect(host({ key: '' }).craft.session.supportsEvents).toBe(false)
  expect(host({ key: 'auth.token' }).craft.session.supportsEvents).toBe(true)
})
