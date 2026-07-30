import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { focus, hasFocusShortcuts } from '../src/focus'
import { findCall, installMockBridge } from './_mock-bridge'

describe('focus (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['focus'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('getStatus passes the native payload through', async () => {
    bridge.whenCalled('focus', 'getStatus', { supported: true, isFocused: true, authorization: 'authorized' })
    const s = await focus.getStatus()
    expect(s.supported).toBe(true)
    expect(s.isFocused).toBe(true)
    expect(s.authorization).toBe('authorized')
  })

  it('preserves null isFocused, which means "declined to answer"', async () => {
    bridge.whenCalled('focus', 'getStatus', { supported: true, isFocused: null, authorization: 'notDetermined' })
    const s = await focus.getStatus()
    // Collapsing this to false would tell the app notifications are flowing
    // when the truth is that nobody has been asked yet.
    expect(s.isFocused).toBeNull()
  })

  it('requestAuthorization returns the resulting status', async () => {
    bridge.whenCalled('focus', 'requestAuthorization', 'denied')
    expect(await focus.requestAuthorization()).toBe('denied')
  })

  it('setEnabled forwards the flag and shortcut names', async () => {
    bridge.whenCalled('focus', 'setEnabled', { ok: true, strategy: 'shortcut', exitCode: 0 })
    const r = await focus.setEnabled(true, { onShortcut: 'On', offShortcut: 'Off' })
    expect(r.ok).toBe(true)
    expect(findCall(bridge.calls, 'focus', 'setEnabled')!.args).toEqual([
      true,
      { onShortcut: 'On', offShortcut: 'Off' },
    ])
  })

  it('setEnabled refuses without ever reaching the bridge when the shortcut is unset', async () => {
    const r = await focus.setEnabled(true, { offShortcut: 'Off' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/onShortcut/)
    expect(findCall(bridge.calls, 'focus', 'setEnabled')).toBeUndefined()
  })

  it('setEnabled(false) checks offShortcut, not onShortcut', async () => {
    const r = await focus.setEnabled(false, { onShortcut: 'On' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/offShortcut/)
  })

  it('surfaces a failed shortcut as a result rather than a throw', async () => {
    bridge.whenCalled('focus', 'setEnabled', { ok: false, exitCode: 1, error: 'not found' })
    const r = await focus.setEnabled(true, { onShortcut: 'Missing' })
    expect(r.ok).toBe(false)
    expect(r.error).toBe('not found')
  })

  it('runShortcut requires a name', async () => {
    await expect(focus.runShortcut('')).rejects.toThrow(/required/)
  })

  it('hasFocusShortcuts requires every name to be installed', async () => {
    bridge.whenCalled('focus', 'listShortcuts', ['Hush Focus On', 'Hush Focus Off', 'Other'])
    expect(await hasFocusShortcuts('Hush Focus On', 'Hush Focus Off')).toBe(true)
    expect(await hasFocusShortcuts('Hush Focus On', 'Nope')).toBe(false)
  })

  it('hasFocusShortcuts with no names is false, not vacuously true', async () => {
    bridge.whenCalled('focus', 'listShortcuts', [])
    expect(await hasFocusShortcuts()).toBe(false)
  })
})

describe('focus (no bridge)', () => {
  beforeEach(() => {
    delete (window as any).craft
  })

  it('reports unsupported rather than throwing', async () => {
    const s = await focus.getStatus()
    expect(s.supported).toBe(false)
    expect(s.isFocused).toBeNull()
    expect(s.authorization).toBe('unsupported')
    expect(await focus.requestAuthorization()).toBe('unsupported')
    expect(await focus.listShortcuts()).toEqual([])
  })

  it('mutations resolve with a reason', async () => {
    const r = await focus.setEnabled(true, { onShortcut: 'On' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/Craft/)
  })
})
