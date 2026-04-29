/**
 * Network / Reachability
 *
 * Connection type, WiFi info, IP/MAC addresses, VPN status, proxy
 * settings. When running in a Craft native window this dispatches to
 * the `craft.network` bridge (SystemConfiguration on macOS / NLM on
 * Windows / NetworkManager on Linux). Browser fallback uses the
 * `navigator.connection` API where available.
 *
 * Some fields (MAC address, VPN, proxy) are unavailable in browsers
 * for security reasons — they return empty/false there rather than
 * throwing, so feature-detection on the result is the cleanest pattern.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export type ConnectionType =
  | 'wifi'
  | 'ethernet'
  | 'cellular'
  | 'bluetooth'
  | 'vpn'
  | 'none'
  | 'unknown'

export interface NetworkInterface {
  name: string
  /** IPv4/IPv6 address. */
  address: string
  /** True if the interface is up and has carrier. */
  isUp: boolean
  /** True for loopback (127.0.0.1 / ::1). */
  isLoopback: boolean
}

export interface ProxySettings {
  http?: string
  https?: string
  ftp?: string
  socks?: string
  /** Hosts that should bypass the proxy. */
  exceptions?: string[]
}

export interface NetworkAPI {
  /** Coarse-grained type of the active connection. */
  connectionType: () => Promise<ConnectionType>
  /** SSID of the joined WiFi network, or undefined if not on WiFi. */
  wifiSSID: () => Promise<string | undefined>
  /** Signal strength in dBm (negative — closer to 0 = stronger). */
  wifiSignalStrength: () => Promise<number | undefined>
  /** Primary IP address. */
  ipAddress: () => Promise<string>
  /** Hardware address of the active interface. May be empty in browsers. */
  macAddress: () => Promise<string>
  /** Every active network interface. */
  interfaces: () => Promise<NetworkInterface[]>
  /** True if a VPN tunnel is up. False on web (always). */
  isVPNConnected: () => Promise<boolean>
  /** System proxy settings. Empty object on web. */
  proxySettings: () => Promise<ProxySettings>
  /** Open the system Network preference pane / settings page. */
  openPreferences: () => Promise<void>
  /** Subscribe to reachability changes. */
  onChange: (cb: (info: { type: ConnectionType, online: boolean }) => void) => () => void
}

export const network: NetworkAPI = {
  async connectionType() {
    if (hasBridge('network')) return await window.craft!.network.connectionType()
    return webConnectionType()
  },
  async wifiSSID() {
    if (hasBridge('network')) {
      const v = await window.craft!.network.wifiSSID()
      return v || undefined
    }
    return undefined
  },
  async wifiSignalStrength() {
    if (hasBridge('network')) {
      const v = await window.craft!.network.wifiSignalStrength()
      return typeof v === 'number' ? v : undefined
    }
    return undefined
  },
  async ipAddress() {
    if (hasBridge('network')) return await window.craft!.network.ipAddress()
    return ''
  },
  async macAddress() {
    if (hasBridge('network')) return await window.craft!.network.macAddress()
    return ''
  },
  async interfaces() {
    if (hasBridge('network')) return await window.craft!.network.interfaces()
    return []
  },
  async isVPNConnected() {
    if (hasBridge('network')) return await window.craft!.network.isVPNConnected()
    return false
  },
  async proxySettings() {
    if (hasBridge('network')) {
      const r = await window.craft!.network.proxySettings()
      return r || {}
    }
    return {}
  },
  async openPreferences() {
    if (hasBridge('network')) await window.craft!.network.openPreferences()
  },
  onChange(cb): () => void {
    if (hasBridge('network')) {
      return onCraftEvent<{ type: ConnectionType, online: boolean }>('craft:networkChange', cb)
    }
    if (typeof window === 'undefined') return () => {}
    const onlineH = () => cb({ type: webConnectionType(), online: true })
    const offlineH = () => cb({ type: 'none', online: false })
    window.addEventListener('online', onlineH)
    window.addEventListener('offline', offlineH)
    return () => {
      window.removeEventListener('online', onlineH)
      window.removeEventListener('offline', offlineH)
    }
  },
}

function webConnectionType(): ConnectionType {
  if (typeof navigator === 'undefined') return 'unknown'
  if (navigator.onLine === false) return 'none'
  const conn = (navigator as any).connection
  if (!conn) return 'unknown'
  // navigator.connection.type: 'wifi'|'cellular'|'ethernet'|'bluetooth'|'wimax'|'none'|'other'|'unknown'
  const t = String(conn.type || conn.effectiveType || 'unknown').toLowerCase()
  if (t === 'wifi' || t === 'cellular' || t === 'ethernet' || t === 'bluetooth' || t === 'none') return t
  return 'unknown'
}
