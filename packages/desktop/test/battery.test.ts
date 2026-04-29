import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { battery } from '../src/battery'
import { findCall, installMockBridge } from './_mock-bridge'

describe('battery (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['power'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('isCharging / isPluggedIn / isLowPowerMode return booleans', async () => {
    bridge.whenCalled('power', 'isCharging', true)
    bridge.whenCalled('power', 'isPluggedIn', true)
    bridge.whenCalled('power', 'isLowPowerMode', false)
    expect(await battery.isCharging()).toBe(true)
    expect(await battery.isPluggedIn()).toBe(true)
    expect(await battery.isLowPowerMode()).toBe(false)
  })

  it('level / timeRemaining / thermalState forward values', async () => {
    bridge.whenCalled('power', 'batteryLevel', 0.85)
    bridge.whenCalled('power', 'timeRemaining', 142)
    bridge.whenCalled('power', 'thermalState', 'fair')
    expect(await battery.level()).toBe(0.85)
    expect(await battery.timeRemaining()).toBe(142)
    expect(await battery.thermalState()).toBe('fair')
  })

  it('uptimeSeconds forwards', async () => {
    bridge.whenCalled('power', 'uptimeSeconds', 3600)
    expect(await battery.uptimeSeconds()).toBe(3600)
  })

  it('preventSleep / allowSleep forward', async () => {
    await battery.preventSleep('rendering video')
    await battery.allowSleep()
    expect(findCall(bridge.calls, 'power', 'preventSleep')!.args).toEqual(['rendering video'])
    expect(findCall(bridge.calls, 'power', 'allowSleep')).toBeDefined()
  })

  it('preventSleep uses default reason when none provided', async () => {
    await battery.preventSleep()
    expect(findCall(bridge.calls, 'power', 'preventSleep')!.args[0]).toBe('app is busy')
  })

  it('onSleep / onWake fire on the right events', () => {
    const sleeps: number[] = []
    const wakes: number[] = []
    const offSleep = battery.onSleep(() => sleeps.push(Date.now()))
    const offWake = battery.onWake(() => wakes.push(Date.now()))
    window.dispatchEvent(new CustomEvent('craft:powerSleep'))
    window.dispatchEvent(new CustomEvent('craft:powerWake'))
    expect(sleeps).toHaveLength(1)
    expect(wakes).toHaveLength(1)
    offSleep()
    offWake()
  })
})

describe('battery (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('isLowPowerMode falls back to false', async () => {
    expect(await battery.isLowPowerMode()).toBe(false)
  })

  it('thermalState falls back to "unknown"', async () => {
    expect(await battery.thermalState()).toBe('unknown')
  })
})
