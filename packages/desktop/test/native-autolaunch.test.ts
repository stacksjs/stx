import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { nativeAutoLaunch } from '../src/native-autolaunch'
import { installMockBridge } from './_mock-bridge'

describe('nativeAutoLaunch', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['autoLaunch'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('enable / disable / isEnabled return booleans', async () => {
    bridge.whenCalled('autoLaunch', 'enable', true)
    bridge.whenCalled('autoLaunch', 'disable', true)
    bridge.whenCalled('autoLaunch', 'isEnabled', true)
    expect(await nativeAutoLaunch.enable()).toBe(true)
    expect(await nativeAutoLaunch.disable()).toBe(true)
    expect(await nativeAutoLaunch.isEnabled()).toBe(true)
  })

  it('returns false when bridge resolves to false', async () => {
    bridge.whenCalled('autoLaunch', 'enable', false)
    expect(await nativeAutoLaunch.enable()).toBe(false)
  })
})

describe('nativeAutoLaunch (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('all methods return false', async () => {
    expect(await nativeAutoLaunch.enable()).toBe(false)
    expect(await nativeAutoLaunch.disable()).toBe(false)
    expect(await nativeAutoLaunch.isEnabled()).toBe(false)
  })
})
