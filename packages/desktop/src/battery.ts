/**
 * Battery & Power State
 *
 * Read battery level, charging status, thermal pressure, and tell the
 * OS to keep the system awake while a long task runs.
 *
 * **Different from `power.ts`** — that module wraps the macOS
 * `caffeinate` *subprocess* (works without a Craft window). This
 * module talks to the native `craft.power` bridge for richer metrics
 * (battery %, thermal state) and uses IOKit's
 * `IOPMAssertionCreateWithName` instead of spawning a child process.
 *
 * Browser fallback: most fields use the deprecated `BatteryManager`
 * API where it's still available; `preventSleep`/`allowSleep` use the
 * Wake Lock API (`navigator.wakeLock.request('screen')`).
 */

import { hasBridge, onCraftEvent } from './_bridge'

export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical' | 'unknown'

export interface BatteryAPI {
  /** True if currently charging (plugged in AND filling). */
  isCharging: () => Promise<boolean>
  /** True if connected to AC power, regardless of fill state. */
  isPluggedIn: () => Promise<boolean>
  /** True if Low Power Mode is on. */
  isLowPowerMode: () => Promise<boolean>
  /**
   * Battery fill, 0..1. Returns null when the system has no battery
   * (typical desktops) so callers can distinguish "no battery" from
   * "fully charged".
   */
  level: () => Promise<number | null>
  /** Minutes until empty (discharging) or full (charging). null if unknown. */
  timeRemaining: () => Promise<number | null>
  /** OS thermal state. */
  thermalState: () => Promise<ThermalState>
  /** System uptime in seconds. */
  uptimeSeconds: () => Promise<number>
  /**
   * Tell the OS to keep the display/system awake.
   * `reason` is shown in tools like Activity Monitor.
   */
  preventSleep: (reason?: string) => Promise<void>
  /** Release a previous `preventSleep` call. Idempotent. */
  allowSleep: () => Promise<void>
  /** Subscribe to OS sleep events. */
  onSleep: (cb: () => void) => () => void
  /** Subscribe to OS wake events. */
  onWake: (cb: () => void) => () => void
}

export const battery: BatteryAPI = {
  async isCharging() {
    if (hasBridge('power')) return await window.craft!.power.isCharging()
    const b = await getWebBatteryManager()
    return b ? !!b.charging : false
  },

  async isPluggedIn() {
    if (hasBridge('power')) return await window.craft!.power.isPluggedIn()
    const b = await getWebBatteryManager()
    // BatteryManager has no "pluggedIn" — proxy via charging-or-fully-charged.
    return b ? !!b.charging || b.level >= 0.999 : false
  },

  async isLowPowerMode() {
    if (hasBridge('power')) return await window.craft!.power.isLowPowerMode()
    return false
  },

  async level() {
    if (hasBridge('power')) {
      const v = await window.craft!.power.batteryLevel()
      return typeof v === 'number' ? v : null
    }
    const b = await getWebBatteryManager()
    return b ? b.level : null
  },

  async timeRemaining() {
    if (hasBridge('power')) {
      const r = await window.craft!.power.timeRemaining()
      return typeof r === 'number' ? r : null
    }
    const b = await getWebBatteryManager()
    if (!b) return null
    // BatteryManager reports seconds; we return minutes for parity with
    // the native side. Infinity means "unknown / not on battery."
    const sec = b.charging ? b.chargingTime : b.dischargingTime
    return Number.isFinite(sec) ? Math.round(sec / 60) : null
  },

  async thermalState() {
    if (hasBridge('power')) {
      const s = await window.craft!.power.thermalState()
      return (s as ThermalState) || 'unknown'
    }
    return 'unknown'
  },

  async uptimeSeconds() {
    if (hasBridge('power')) return await window.craft!.power.uptimeSeconds()
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return Math.round(performance.now() / 1000)
    }
    return 0
  },

  async preventSleep(reason = 'app is busy') {
    if (hasBridge('power')) {
      await window.craft!.power.preventSleep(reason)
      return
    }
    // Web fallback: Screen Wake Lock API. Earlier this overwrote the
    // sentinel on every call and silently leaked the previous lock.
    // Now release any in-flight lock first, then acquire fresh — same
    // observable behaviour from the caller's perspective, no leak.
    if (typeof navigator === 'undefined' || !(navigator as any).wakeLock) return
    const w = window as any
    if (w.__craftWebWakeLock?.release) {
      try { await w.__craftWebWakeLock.release() } catch { /* ignore */ }
      w.__craftWebWakeLock = null
    }
    try {
      const sentinel = await (navigator as any).wakeLock.request('screen')
      w.__craftWebWakeLock = sentinel
    }
    catch { /* user denied or unsupported */ }
  },

  async allowSleep() {
    if (hasBridge('power')) {
      await window.craft!.power.allowSleep()
      return
    }
    const s = (window as any).__craftWebWakeLock
    if (s && typeof s.release === 'function') {
      try { await s.release() } catch { /* ignore */ }
      ;(window as any).__craftWebWakeLock = null
    }
  },

  onSleep(cb) {
    return onCraftEvent<void>('craft:powerSleep', cb)
  },
  onWake(cb) {
    return onCraftEvent<void>('craft:powerWake', cb)
  },
}

async function getWebBatteryManager(): Promise<any | null> {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as any
  if (typeof nav.getBattery !== 'function') return null
  try { return await nav.getBattery() } catch { return null }
}
