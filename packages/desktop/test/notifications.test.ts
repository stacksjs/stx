import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { notifications } from '../src/notifications'
import { findCall, installMockBridge } from './_mock-bridge'

describe('notifications', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['notifications'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('show forwards options to bridge', async () => {
    await notifications.show({ title: 'Hello', body: 'World' })
    const c = findCall(bridge.calls, 'notifications', 'show')
    expect(c).toBeDefined()
    expect((c!.args[0] as any).title).toBe('Hello')
    expect((c!.args[0] as any).body).toBe('World')
  })

  it('show requires a title', async () => {
    await expect(notifications.show({ title: '' })).rejects.toThrow(/title/)
  })

  it('schedule normalizes Date triggerAt to ISO string', async () => {
    const date = new Date('2024-01-01T00:00:00Z')
    await notifications.schedule({ title: 't', triggerAt: date })
    const c = findCall(bridge.calls, 'notifications', 'schedule')!
    expect((c.args[0] as any).triggerAt).toBe('2024-01-01T00:00:00.000Z')
  })

  it('cancel passes id', async () => {
    await notifications.cancel('abc')
    expect(findCall(bridge.calls, 'notifications', 'cancel')!.args).toEqual(['abc'])
  })

  it('cancelAll forwards', async () => {
    await notifications.cancelAll()
    expect(findCall(bridge.calls, 'notifications', 'cancelAll')).toBeDefined()
  })

  it('setBadge / clearBadge forward count', async () => {
    await notifications.setBadge(5)
    await notifications.clearBadge()
    expect(findCall(bridge.calls, 'notifications', 'setBadge')!.args).toEqual([5])
    expect(findCall(bridge.calls, 'notifications', 'clearBadge')).toBeDefined()
  })

  it('requestPermission returns boolean from bridge', async () => {
    bridge.whenCalled('notifications', 'requestPermission', true)
    expect(await notifications.requestPermission()).toBe(true)

    bridge.whenCalled('notifications', 'requestPermission', false)
    expect(await notifications.requestPermission()).toBe(false)
  })
})

describe('notifications (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('cancel/cancelAll do not throw without a bridge', async () => {
    await expect(notifications.cancel('x')).resolves.toBeUndefined()
    await expect(notifications.cancelAll()).resolves.toBeUndefined()
  })
})
