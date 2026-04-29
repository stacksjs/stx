import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { globalShortcuts } from '../src/global-shortcuts'
import { findCall, installMockBridge } from './_mock-bridge'

describe('globalShortcuts', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['shortcuts'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('register forwards id, accelerator, opts', async () => {
    await globalShortcuts.register('cmd-k', 'Cmd+K', { repeats: true })
    const c = findCall(bridge.calls, 'shortcuts', 'register')!
    expect(c.args[0]).toBe('cmd-k')
    expect(c.args[1]).toBe('Cmd+K')
    expect((c.args[2] as any).repeats).toBe(true)
  })

  it('unregister, enable, disable forward id', async () => {
    await globalShortcuts.unregister('a')
    await globalShortcuts.enable('a')
    await globalShortcuts.disable('a')
    expect(findCall(bridge.calls, 'shortcuts', 'unregister')!.args).toEqual(['a'])
    expect(findCall(bridge.calls, 'shortcuts', 'enable')!.args).toEqual(['a'])
    expect(findCall(bridge.calls, 'shortcuts', 'disable')!.args).toEqual(['a'])
  })

  it('unregisterAll forwards', async () => {
    await globalShortcuts.unregisterAll()
    expect(findCall(bridge.calls, 'shortcuts', 'unregisterAll')).toBeDefined()
  })

  it('isRegistered returns boolean', async () => {
    bridge.whenCalled('shortcuts', 'isRegistered', true)
    expect(await globalShortcuts.isRegistered('x')).toBe(true)
  })

  it('list returns array', async () => {
    bridge.whenCalled('shortcuts', 'list', [{ id: 'x', accelerator: 'Cmd+K', enabled: true }])
    const l = await globalShortcuts.list()
    expect(l).toHaveLength(1)
    expect(l[0].accelerator).toBe('Cmd+K')
  })

  it('on() subscribes to craft:shortcut and unsubscribes via the returned fn', () => {
    let received: any = null
    const off = globalShortcuts.on((e) => { received = e })

    window.dispatchEvent(new CustomEvent('craft:shortcut', {
      detail: { id: 'cmd-k', accelerator: 'Cmd+K', timestamp: 123 },
    }))
    expect(received).toBeDefined()
    expect(received.id).toBe('cmd-k')

    off()
    received = null
    window.dispatchEvent(new CustomEvent('craft:shortcut', {
      detail: { id: 'after-off', accelerator: '', timestamp: 0 },
    }))
    expect(received).toBeNull()
  })
})

describe('globalShortcuts (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('all calls are graceful no-ops', async () => {
    await expect(globalShortcuts.register('x', 'A')).resolves.toBeUndefined()
    await expect(globalShortcuts.unregister('x')).resolves.toBeUndefined()
    await expect(globalShortcuts.unregisterAll()).resolves.toBeUndefined()
    expect(await globalShortcuts.isRegistered('x')).toBe(false)
    expect(await globalShortcuts.list()).toEqual([])
  })
})
