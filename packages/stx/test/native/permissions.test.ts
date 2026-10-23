import { afterEach, expect, it } from 'bun:test'
import { join } from 'node:path'
import { NativeCapabilityError, STXBridge } from '../../src/native/bridge/protocol'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

const protocols = new Set<STXBridge>()
afterEach(() => { protocols.forEach(protocol => protocol.dispose()); protocols.clear() })

function host(capabilities: string[], permissions?: object) {
  const sent: Array<{ id: string, type: string, payload: Record<string, unknown> }> = []
  let receive = (_raw: string) => {}
  const native = {
    capabilities,
    capabilityProtocolVersion: 1,
    postMessage(raw: string) { sent.push(JSON.parse(raw)) },
    onMessage(callback: typeof receive) { receive = callback },
  }
  const protocol = new STXBridge()
  protocols.add(protocol)
  protocol.initialize(native)
  const target = { craft: permissions ? { permissions } : {} }
  const install = () => installCraftBridge(protocol, native, target)
  return {
    craft: install(), sent, native, install,
    answer(data: unknown) {
      const request = sent.at(-1)!
      receive(JSON.stringify({ type: 'API_RESPONSE', correlationId: request.id, payload: { version: 1, requestId: request.id, data } }))
    },
    refuse() {
      const request = sent.at(-1)!
      receive(JSON.stringify({ type: 'API_ERROR', correlationId: request.id, payload: { version: 1, requestId: request.id, code: 'CAPABILITY_DISABLED', message: 'Push is disabled' } }))
    },
  }
}

it.each([false, true])('rejects unsupported permissions without sending a native request (push=%s, #2115)', async (push) => {
  const capabilities = push ? ['push'] : []
  const { craft, sent } = host(capabilities)
  for (const permission of ['location', 'camera', 'microphone', 'unknown']) {
    for (const method of ['check', 'request']) {
      await expect(craft.permissions[method](permission)).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
      await expect(craft.permissions[method](permission)).rejects.toThrow(permission)
    }
  }
  if (!capabilities.length) {
    await expect(craft.permissions.check('notifications')).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
    await expect(craft.permissions.request('notifications')).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
    await expect(craft.permissions.openSettings()).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
  }
  expect(sent).toEqual([])
})

it.each([false, true])('preserves host prototypes, method identity and receiver (push=%s)', async (push) => {
  const capabilities = push ? ['push'] : []
  class Permissions {
    status = 'denied'
    settings = 0
    check() { return Promise.resolve(this.status) }
    request() { return Promise.resolve(this.status) }
    openSettings() { this.settings++; return Promise.resolve() }
  }
  const permissions = new Permissions()
  const { craft, sent } = host(capabilities, permissions)
  expect(craft.permissions).toBe(permissions)
  expect(craft.permissions.check).toBe(Permissions.prototype.check)
  expect(craft.permissions.request).toBe(Permissions.prototype.request)
  expect(await craft.permissions.check('location')).toBe('denied')
  expect(await craft.permissions.request('notifications')).toBe('denied')
  await craft.permissions.openSettings()
  expect(permissions.settings).toBe(1)
  expect(sent).toEqual([])
})

it('does not write to a complete frozen host permission implementation', async () => {
  const permissions = Object.freeze({
    check: () => Promise.resolve('granted'),
    request: () => Promise.resolve('denied'),
    openSettings: () => Promise.resolve(),
  })
  expect(host(['push'], permissions).craft.permissions).toBe(permissions)
})

it.each([false, true])('fills only missing host methods (push=%s)', async (push) => {
  const capabilities = push ? ['push'] : []
  const refusal = new Error('Host refuses this permission')
  const permissions = { check: () => Promise.reject(refusal), metadata: 'host-owned' }
  const native = host(capabilities, permissions)
  expect(native.craft.permissions).toBe(permissions)
  expect(native.craft.permissions.check).toBe(permissions.check)
  expect(native.craft.permissions.metadata).toBe('host-owned')
  await expect(native.craft.permissions.check('camera')).rejects.toBe(refusal)
  const result = native.craft.permissions.request('notifications')
  if (capabilities.length) {
    expect(native.sent.at(-1)?.payload).toMatchObject({ module: 'Push', method: 'requestPermission', args: [] })
    native.answer('granted')
    expect(await result).toBe('granted')
  }
  else await expect(result).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
})

it('keeps notification status, prompt, settings and native error behavior', async () => {
  const native = host(['push'])
  for (const status of ['granted', 'denied', 'undetermined']) {
    const result = native.craft.permissions.check('notifications')
    expect(native.sent.at(-1)?.payload).toMatchObject({ module: 'Push', method: 'getPermissionStatus', args: [] })
    native.answer(status)
    expect(await result).toBe(status)
  }
  const prompt = native.craft.permissions.request('notifications')
  native.answer('denied')
  expect(await prompt).toBe('denied')
  const settings = native.craft.permissions.openSettings()
  expect(native.sent.at(-1)?.payload).toMatchObject({ module: 'Push', method: 'openSettings', args: [] })
  native.answer(true)
  expect(await settings).toBeUndefined()
  const failed = native.craft.permissions.request('notifications')
  native.refuse()
  await expect(failed).rejects.toEqual(new NativeCapabilityError('CAPABILITY_DISABLED', 'Push is disabled'))
})

it('refreshes only STX defaults on reinstall and retains later host replacements', async () => {
  const native = host([])
  await expect(native.craft.permissions.check('notifications')).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
  native.native.capabilities = ['push']
  native.install()
  const enabled = native.craft.permissions.check('notifications')
  native.answer('granted')
  expect(await enabled).toBe('granted')
  const check = () => Promise.resolve('denied')
  native.craft.permissions.check = check
  native.native.capabilities = []
  native.install()
  expect(native.craft.permissions.check).toBe(check)
  await expect(native.craft.permissions.request('notifications')).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
})

it.each([false, true])('ships the same permission behavior in a native bundle (minify=%s)', async (minify) => {
  const root = createTempDir('stx-permissions-')
  const file = join(root, 'Screen.stx')
  await Bun.write(file, '<View><Text>Permissions</Text></View>')
  const { code } = await compileSharedScreenBundle(file, { root, minify })
  for (const capabilities of [[], ['push']]) {
    const phone = mountNativeScreen(code, 'main', { capabilities, native: () => 'granted' })
    try {
      const permissions = phone.context.craft.permissions
      await expect(permissions.check('location')).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
      await expect(permissions.request('camera')).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
      expect(phone.natives).toEqual([])
      if (capabilities.length) expect(await permissions.check('notifications')).toBe('granted')
      else await expect(permissions.check('notifications')).rejects.toMatchObject({ code: 'PERMISSION_UNSUPPORTED' })
    }
    finally { phone.unmount() }
    // Create the host object in the VM: contextifying an outer-realm object
    // can wrap it, which is not evidence of a bridge identity change.
    const setup = `globalThis.permissionHost = { check: function() {
      globalThis.permissionReceiver = this === globalThis.permissionHost;
      return Promise.resolve('denied');
    }}; globalThis.craft = { permissions: globalThis.permissionHost };`
    const custom = mountNativeScreen(setup + code, 'main', { capabilities })
    try {
      expect(await custom.context.craft.permissions.check('location')).toBe('denied')
      expect(custom.context.permissionReceiver).toBe(true)
    }
    finally { custom.unmount() }
  }
}, 30_000)
