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
  /** Fired when a new device is discovered. */
  onDeviceFound: (cb: (device: BluetoothDevice) => void) => () => void
  /** Fired when a device finishes connecting. */
  onDeviceConnected: (cb: (device: BluetoothDevice) => void) => () => void
  /** Fired when a connected device disconnects. */
  onDeviceDisconnected: (cb: (device: BluetoothDevice) => void) => () => void
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
  onDeviceFound(cb)        { return onCraftEvent<BluetoothDevice>('craft:bluetooth:deviceFound', cb) },
  onDeviceConnected(cb)    { return onCraftEvent<BluetoothDevice>('craft:bluetooth:deviceConnected', cb) },
  onDeviceDisconnected(cb) { return onCraftEvent<BluetoothDevice>('craft:bluetooth:deviceDisconnected', cb) },
}
