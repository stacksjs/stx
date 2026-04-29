import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { network } from '../src/network'
import { findCall, installMockBridge } from './_mock-bridge'

describe('network (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['network'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('connectionType forwards from bridge', async () => {
    bridge.whenCalled('network', 'connectionType', 'wifi')
    expect(await network.connectionType()).toBe('wifi')
  })

  it('wifiSSID returns string or undefined', async () => {
    bridge.whenCalled('network', 'wifiSSID', 'home-net')
    expect(await network.wifiSSID()).toBe('home-net')

    bridge.whenCalled('network', 'wifiSSID', '')
    expect(await network.wifiSSID()).toBeUndefined()
  })

  it('wifiSignalStrength returns number or undefined', async () => {
    bridge.whenCalled('network', 'wifiSignalStrength', -45)
    expect(await network.wifiSignalStrength()).toBe(-45)
  })

  it('ipAddress / macAddress / interfaces forward', async () => {
    bridge.whenCalled('network', 'ipAddress', '192.168.1.10')
    bridge.whenCalled('network', 'macAddress', 'aa:bb:cc:dd:ee:ff')
    bridge.whenCalled('network', 'interfaces', [
      { name: 'en0', address: '192.168.1.10', isUp: true, isLoopback: false },
    ])
    expect(await network.ipAddress()).toBe('192.168.1.10')
    expect(await network.macAddress()).toBe('aa:bb:cc:dd:ee:ff')
    const ifs = await network.interfaces()
    expect(ifs[0].name).toBe('en0')
  })

  it('isVPNConnected forwards', async () => {
    bridge.whenCalled('network', 'isVPNConnected', true)
    expect(await network.isVPNConnected()).toBe(true)
  })

  it('proxySettings returns {} when bridge returns nothing', async () => {
    expect(await network.proxySettings()).toEqual({})
  })

  it('openPreferences forwards', async () => {
    await network.openPreferences()
    expect(findCall(bridge.calls, 'network', 'openPreferences')).toBeDefined()
  })

  it('onChange subscribes to craft:networkChange', () => {
    let received: any = null
    const off = network.onChange((info) => { received = info })
    window.dispatchEvent(new CustomEvent('craft:networkChange', {
      detail: { type: 'wifi', online: true },
    }))
    expect(received.type).toBe('wifi')
    expect(received.online).toBe(true)
    off()
  })
})

describe('network (no bridge — web fallback)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('macAddress returns "" (security restriction)', async () => {
    expect(await network.macAddress()).toBe('')
  })

  it('isVPNConnected returns false', async () => {
    expect(await network.isVPNConnected()).toBe(false)
  })

  it('proxySettings returns {}', async () => {
    expect(await network.proxySettings()).toEqual({})
  })

  it('onChange falls back to online/offline events', () => {
    let received: any = null
    const off = network.onChange((info) => { received = info })
    window.dispatchEvent(new Event('offline'))
    expect(received).toBeDefined()
    expect(received.online).toBe(false)
    expect(received.type).toBe('none')
    off()
  })
})
