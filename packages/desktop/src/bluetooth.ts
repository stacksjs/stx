/**
 * Bluetooth
 *
 * Discover, pair, and connect to nearby devices. Uses CoreBluetooth on
 * macOS (`CBCentralManager`); equivalents on Linux/Windows.
 *
 * No web fallback — `navigator.bluetooth.requestDevice()` exists but
 * the model is fundamentally different (per-call user prompt, no
 * persistent pairings). Calls outside Craft return defaults.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export interface BluetoothDevice {
  /** Stable identifier. */
  id: string
  /** Friendly device name. May be empty. */
  name: string
  /** True if currently connected. */
  connected: boolean
  /** RSSI (signal strength, dBm). Negative — closer to 0 = stronger. */
  rssi?: number
  /** Manufacturer-data when present. */
  manufacturer?: string
}

export type BluetoothPowerState = 'unknown' | 'resetting' | 'unsupported' | 'unauthorized' | 'poweredOff' | 'poweredOn'

export interface BluetoothService {
  /** UUID string (16- or 128-bit). CoreBluetooth normalizes both forms. */
  uuid: string
  /** True for "primary" services (vs "included" sub-services). */
  primary?: boolean
}

export interface BluetoothCharacteristic {
  uuid: string
  /** Service this characteristic belongs to. */
  serviceUuid: string
  /** Properties advertised by the peripheral. */
  properties?: Array<'read' | 'write' | 'writeWithoutResponse' | 'notify' | 'indicate' | 'broadcast' | 'authenticatedSignedWrites' | 'extendedProperties'>
}

export interface BluetoothCharacteristicValueEvent {
  deviceId: string
  serviceUuid: string
  characteristicUuid: string
  /** Hex-encoded bytes. */
  valueHex: string
}

export type BluetoothWriteMode = 'with-response' | 'without-response'

export interface BluetoothAPI {
  isEnabled: () => Promise<boolean>
  powerState: () => Promise<BluetoothPowerState>
  connectedDevices: () => Promise<BluetoothDevice[]>
  pairedDevices: () => Promise<BluetoothDevice[]>
  startDiscovery: () => Promise<void>
  stopDiscovery: () => Promise<void>
  isDiscovering: () => Promise<boolean>
  connect: (id: string) => Promise<void>
  disconnect: (id: string) => Promise<void>
  openPreferences: () => Promise<void>
  /**
   * Discover GATT services on a connected peripheral. Resolves once the
   * native side returns the service list — does not stream incrementally.
   */
  discoverServices: (deviceId: string) => Promise<BluetoothService[]>
  /** Discover characteristics for one service. */
  discoverCharacteristics: (deviceId: string, serviceUuid: string) => Promise<BluetoothCharacteristic[]>
  /**
   * Read the current value of a characteristic. Returns hex-encoded bytes
   * — keeps the bridge JSON-friendly without forcing an opinion about
   * encoding (UTF-8 / float32 / etc.) at this layer.
   */
  readCharacteristic: (deviceId: string, serviceUuid: string, characteristicUuid: string) => Promise<{ ok: boolean, valueHex?: string, reason?: string }>
  /**
   * Write a value to a characteristic. `valueHex` should be a hex string
   * (`"01ff"`); `mode` defaults to `with-response` (CBCharacteristicWriteWithResponse).
   */
  writeCharacteristic: (
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    valueHex: string,
    mode?: BluetoothWriteMode,
  ) => Promise<{ ok: boolean, reason?: string }>
  /**
   * Subscribe to value notifications/indications. Pass `false` to stop.
   * Updates arrive via `onCharacteristicValue`.
   */
  setCharacteristicNotify: (deviceId: string, serviceUuid: string, characteristicUuid: string, on: boolean) => Promise<{ ok: boolean, reason?: string }>
  /** Fired when a new device is discovered. */
  onDeviceFound: (cb: (device: BluetoothDevice) => void) => () => void
  /** Fired when a device finishes connecting. */
  onDeviceConnected: (cb: (device: BluetoothDevice) => void) => () => void
  /** Fired when a connected device disconnects. */
  onDeviceDisconnected: (cb: (device: BluetoothDevice) => void) => () => void
  /**
   * Fired when a subscribed characteristic delivers a new value. Tied to
   * `setCharacteristicNotify(..., true)`.
   */
  onCharacteristicValue: (cb: (event: BluetoothCharacteristicValueEvent) => void) => () => void
}

const HEX_RE = /^[\da-f]*$/i

function assertHex(label: string, hex: string): void {
  if (typeof hex !== 'string' || !HEX_RE.test(hex) || hex.length % 2 !== 0) {
    throw new Error(`${label}: must be a hex string with even length, got ${JSON.stringify(hex)}`)
  }
}

export const bluetooth: BluetoothAPI = {
  async isEnabled()           { return hasBridge('bluetooth') ? await window.craft!.bluetooth.isEnabled() : false },
  async powerState()          { return hasBridge('bluetooth') ? await window.craft!.bluetooth.powerState() : 'unknown' as BluetoothPowerState },
  async connectedDevices()    { return hasBridge('bluetooth') ? await window.craft!.bluetooth.connectedDevices() : [] },
  async pairedDevices()       { return hasBridge('bluetooth') ? await window.craft!.bluetooth.pairedDevices() : [] },
  async startDiscovery()      { if (hasBridge('bluetooth')) await window.craft!.bluetooth.startDiscovery() },
  async stopDiscovery()       { if (hasBridge('bluetooth')) await window.craft!.bluetooth.stopDiscovery() },
  async isDiscovering()       { return hasBridge('bluetooth') ? await window.craft!.bluetooth.isDiscovering() : false },
  async connect(id)           { if (hasBridge('bluetooth')) await window.craft!.bluetooth.connect(id) },
  async disconnect(id)        { if (hasBridge('bluetooth')) await window.craft!.bluetooth.disconnect(id) },
  async openPreferences()     { if (hasBridge('bluetooth')) await window.craft!.bluetooth.openPreferences() },

  async discoverServices(deviceId) {
    if (!deviceId) throw new Error('bluetooth.discoverServices: deviceId is required')
    if (!hasBridge('bluetooth')) return []
    const r = await window.craft!.bluetooth.discoverServices(deviceId)
    return Array.isArray(r) ? r as BluetoothService[] : []
  },

  async discoverCharacteristics(deviceId, serviceUuid) {
    if (!deviceId || !serviceUuid) throw new Error('bluetooth.discoverCharacteristics: deviceId and serviceUuid are required')
    if (!hasBridge('bluetooth')) return []
    const r = await window.craft!.bluetooth.discoverCharacteristics(deviceId, serviceUuid)
    return Array.isArray(r) ? r as BluetoothCharacteristic[] : []
  },

  async readCharacteristic(deviceId, serviceUuid, characteristicUuid) {
    if (!deviceId || !serviceUuid || !characteristicUuid) {
      throw new Error('bluetooth.readCharacteristic: deviceId, serviceUuid, characteristicUuid are required')
    }
    if (!hasBridge('bluetooth')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.bluetooth.readCharacteristic(deviceId, serviceUuid, characteristicUuid)
  },

  async writeCharacteristic(deviceId, serviceUuid, characteristicUuid, valueHex, mode = 'with-response') {
    if (!deviceId || !serviceUuid || !characteristicUuid) {
      throw new Error('bluetooth.writeCharacteristic: deviceId, serviceUuid, characteristicUuid are required')
    }
    assertHex('bluetooth.writeCharacteristic.valueHex', valueHex)
    if (!hasBridge('bluetooth')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.bluetooth.writeCharacteristic(deviceId, serviceUuid, characteristicUuid, valueHex, mode)
  },

  async setCharacteristicNotify(deviceId, serviceUuid, characteristicUuid, on) {
    if (!deviceId || !serviceUuid || !characteristicUuid) {
      throw new Error('bluetooth.setCharacteristicNotify: deviceId, serviceUuid, characteristicUuid are required')
    }
    if (!hasBridge('bluetooth')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.bluetooth.setCharacteristicNotify(deviceId, serviceUuid, characteristicUuid, on)
  },

  onDeviceFound(cb)        { return onCraftEvent<BluetoothDevice>('craft:bluetooth:deviceFound', cb) },
  onDeviceConnected(cb)    { return onCraftEvent<BluetoothDevice>('craft:bluetooth:deviceConnected', cb) },
  onDeviceDisconnected(cb) { return onCraftEvent<BluetoothDevice>('craft:bluetooth:deviceDisconnected', cb) },
  onCharacteristicValue(cb) {
    return onCraftEvent<BluetoothCharacteristicValueEvent>('craft:bluetooth:characteristicValue', cb)
  },
}
