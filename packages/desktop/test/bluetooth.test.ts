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

  it('GATT methods return bridge-unavailable shapes when no bridge', async () => {
    expect(await bluetooth.discoverServices('a')).toEqual([])
    expect(await bluetooth.discoverCharacteristics('a', 'b')).toEqual([])
    expect((await bluetooth.readCharacteristic('a', 'b', 'c')).ok).toBe(false)
    expect((await bluetooth.writeCharacteristic('a', 'b', 'c', '01')).ok).toBe(false)
    expect((await bluetooth.setCharacteristicNotify('a', 'b', 'c', true)).ok).toBe(false)
  })
})

describe('bluetooth — GATT services & characteristics', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => { bridge = installMockBridge(['bluetooth']) })
  afterEach(() => { bridge.uninstall() })

  it('discoverServices forwards deviceId and returns array', async () => {
    bridge.whenCalled('bluetooth', 'discoverServices', [
      { uuid: '180D', primary: true },
      { uuid: '180F', primary: true },
    ])
    const r = await bluetooth.discoverServices('dev-1')
    expect(r).toHaveLength(2)
    expect(r[0].uuid).toBe('180D')
    expect(findCall(bridge.calls, 'bluetooth', 'discoverServices')!.args).toEqual(['dev-1'])
  })

  it('discoverServices throws when deviceId is empty', async () => {
    await expect(bluetooth.discoverServices('')).rejects.toThrow(/deviceId/)
  })

  it('discoverCharacteristics returns the bridge response', async () => {
    bridge.whenCalled('bluetooth', 'discoverCharacteristics', [
      { uuid: '2A37', serviceUuid: '180D', properties: ['notify'] },
    ])
    const r = await bluetooth.discoverCharacteristics('dev-1', '180D')
    expect(r[0].properties).toEqual(['notify'])
    const c = findCall(bridge.calls, 'bluetooth', 'discoverCharacteristics')!
    expect(c.args).toEqual(['dev-1', '180D'])
  })

  it('readCharacteristic returns hex bytes from native', async () => {
    bridge.whenCalled('bluetooth', 'readCharacteristic', { ok: true, valueHex: 'deadbeef' })
    const r = await bluetooth.readCharacteristic('dev-1', '180D', '2A37')
    expect(r.ok).toBe(true)
    expect(r.valueHex).toBe('deadbeef')
  })

  it('writeCharacteristic forwards default mode (with-response)', async () => {
    bridge.whenCalled('bluetooth', 'writeCharacteristic', { ok: true })
    const r = await bluetooth.writeCharacteristic('dev-1', '180D', '2A37', '01ff')
    expect(r.ok).toBe(true)
    expect(findCall(bridge.calls, 'bluetooth', 'writeCharacteristic')!.args).toEqual([
      'dev-1', '180D', '2A37', '01ff', 'with-response',
    ])
  })

  it('writeCharacteristic forwards explicit without-response mode', async () => {
    bridge.whenCalled('bluetooth', 'writeCharacteristic', { ok: true })
    await bluetooth.writeCharacteristic('dev-1', '180D', '2A37', '00', 'without-response')
    expect(findCall(bridge.calls, 'bluetooth', 'writeCharacteristic')!.args[4]).toBe('without-response')
  })

  it('writeCharacteristic rejects malformed hex', async () => {
    await expect(bluetooth.writeCharacteristic('dev-1', '180D', '2A37', 'zzz')).rejects.toThrow(/hex/)
    await expect(bluetooth.writeCharacteristic('dev-1', '180D', '2A37', 'aaa')).rejects.toThrow(/even length/)
  })

  it('writeCharacteristic accepts empty hex (zero-length write)', async () => {
    bridge.whenCalled('bluetooth', 'writeCharacteristic', { ok: true })
    await bluetooth.writeCharacteristic('dev-1', '180D', '2A37', '')
  })

  it('setCharacteristicNotify forwards on-flag', async () => {
    bridge.whenCalled('bluetooth', 'setCharacteristicNotify', { ok: true })
    await bluetooth.setCharacteristicNotify('dev-1', '180D', '2A37', true)
    expect(findCall(bridge.calls, 'bluetooth', 'setCharacteristicNotify')!.args).toEqual([
      'dev-1', '180D', '2A37', true,
    ])
  })

  it('onCharacteristicValue surfaces native notification events', () => {
    const events: any[] = []
    const off = bluetooth.onCharacteristicValue(e => events.push(e))
    window.dispatchEvent(new CustomEvent('craft:bluetooth:characteristicValue', {
      detail: { deviceId: 'dev-1', serviceUuid: '180D', characteristicUuid: '2A37', valueHex: 'cafe' },
    }))
    expect(events[0].valueHex).toBe('cafe')
    off()
  })
})
