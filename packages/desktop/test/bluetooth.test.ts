import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { bluetooth } from '../src/bluetooth'
import { findCall, installMockBridge } from './_mock-bridge'

describe('bluetooth (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['bluetooth'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('isEnabled / powerState forward booleans / strings', async () => {
    bridge.whenCalled('bluetooth', 'isEnabled', true)
    bridge.whenCalled('bluetooth', 'powerState', 'poweredOn')
    expect(await bluetooth.isEnabled()).toBe(true)
    expect(await bluetooth.powerState()).toBe('poweredOn')
  })

  it('connectedDevices / pairedDevices return arrays', async () => {
    bridge.whenCalled('bluetooth', 'connectedDevices', [
      { id: 'a', name: 'Magic Mouse', connected: true },
    ])
    const r = await bluetooth.connectedDevices()
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('Magic Mouse')
  })

  it('startDiscovery / stopDiscovery / connect / disconnect forward', async () => {
    await bluetooth.startDiscovery()
    await bluetooth.stopDiscovery()
    await bluetooth.connect('abc')
    await bluetooth.disconnect('abc')
    expect(findCall(bridge.calls, 'bluetooth', 'startDiscovery')).toBeDefined()
    expect(findCall(bridge.calls, 'bluetooth', 'stopDiscovery')).toBeDefined()
    expect(findCall(bridge.calls, 'bluetooth', 'connect')!.args).toEqual(['abc'])
    expect(findCall(bridge.calls, 'bluetooth', 'disconnect')!.args).toEqual(['abc'])
  })

  it('event listeners receive the device payload', () => {
    const log: string[] = []
    const offFound = bluetooth.onDeviceFound((d) => log.push('found:' + d.name))
    const offConn = bluetooth.onDeviceConnected((d) => log.push('conn:' + d.name))
    const offDisc = bluetooth.onDeviceDisconnected((d) => log.push('disc:' + d.name))

    window.dispatchEvent(new CustomEvent('craft:bluetooth:deviceFound',
      { detail: { id: '1', name: 'Pods', connected: false } }))
    window.dispatchEvent(new CustomEvent('craft:bluetooth:deviceConnected',
      { detail: { id: '1', name: 'Pods', connected: true } }))
    window.dispatchEvent(new CustomEvent('craft:bluetooth:deviceDisconnected',
      { detail: { id: '1', name: 'Pods', connected: false } }))

    expect(log).toEqual(['found:Pods', 'conn:Pods', 'disc:Pods'])
    offFound()
    offConn()
    offDisc()
  })
})

describe('bluetooth (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('isEnabled / isDiscovering return false', async () => {
    expect(await bluetooth.isEnabled()).toBe(false)
    expect(await bluetooth.isDiscovering()).toBe(false)
  })

  it('lists return empty arrays', async () => {
    expect(await bluetooth.connectedDevices()).toEqual([])
    expect(await bluetooth.pairedDevices()).toEqual([])
  })

  it('powerState defaults to "unknown"', async () => {
    expect(await bluetooth.powerState()).toBe('unknown')
  })
})
