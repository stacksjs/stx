import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { system } from '../src/system'
import { installMockBridge } from './_mock-bridge'

describe('system (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['system'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('color getters return strings', async () => {
    bridge.whenCalled('system', 'accentColor', '#0a84ff')
    bridge.whenCalled('system', 'highlightColor', '#ffae00')
    expect(await system.accentColor()).toBe('#0a84ff')
    expect(await system.highlightColor()).toBe('#ffae00')
  })

  it('language / locale / timezone forward', async () => {
    bridge.whenCalled('system', 'language', 'de')
    bridge.whenCalled('system', 'locale', 'de-DE')
    bridge.whenCalled('system', 'timezone', 'Europe/Berlin')
    expect(await system.language()).toBe('de')
    expect(await system.locale()).toBe('de-DE')
    expect(await system.timezone()).toBe('Europe/Berlin')
  })

  it('boolean accessibility flags forward', async () => {
    bridge.whenCalled('system', 'reduceMotion', true)
    bridge.whenCalled('system', 'reduceTransparency', false)
    bridge.whenCalled('system', 'increaseContrast', true)
    bridge.whenCalled('system', 'is24HourTime', true)
    expect(await system.reduceMotion()).toBe(true)
    expect(await system.reduceTransparency()).toBe(false)
    expect(await system.increaseContrast()).toBe(true)
    expect(await system.is24HourTime()).toBe(true)
  })

  it('hostname / username / systemVersion forward', async () => {
    bridge.whenCalled('system', 'hostname', 'macbook')
    bridge.whenCalled('system', 'username', 'alice')
    bridge.whenCalled('system', 'systemVersion', '14.4.1')
    expect(await system.hostname()).toBe('macbook')
    expect(await system.username()).toBe('alice')
    expect(await system.systemVersion()).toBe('14.4.1')
  })
})

describe('system (no bridge — web fallback)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('locale falls back to navigator.language', async () => {
    const v = await system.locale()
    // Happy DOM gives some value — empty or a real string. Just make
    // sure we don't throw.
    expect(typeof v).toBe('string')
  })

  it('timezone falls back to Intl', async () => {
    const v = await system.timezone()
    expect(typeof v).toBe('string')
  })

  it('hostname returns "" without bridge', async () => {
    expect(await system.hostname()).toBe('')
  })
})
