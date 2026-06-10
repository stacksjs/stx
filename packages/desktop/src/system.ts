/**
 * System / Host Info
 *
 * Read the OS-level facts an app needs for "render correctly on this
 * machine" — accent colour, locale, timezone, accessibility flags
 * (reduce motion / contrast / transparency), system version, hostname.
 *
 * In a browser, falls back to whatever standard web APIs surface
 * (mostly `Intl.DateTimeFormat().resolvedOptions()` + `matchMedia` for
 * the accessibility flags).
 */
import { hasBridge } from './_bridge'

export interface SystemInfo {
  /** macOS accent colour as a hex string ("#0a84ff"). Empty in browser. */
  accentColor: () => Promise<string>
  /** Selection / text-selection highlight colour. Empty in browser. */
  highlightColor: () => Promise<string>
  /** Primary user language code (e.g. "en"). */
  language: () => Promise<string>
  /** BCP-47 locale (e.g. "en-US"). */
  locale: () => Promise<string>
  /** IANA timezone name (e.g. "America/Los_Angeles"). */
  timezone: () => Promise<string>
  /** True if the user prefers 24-hour time. */
  is24HourTime: () => Promise<boolean>
  /** True if the user has Reduce Motion enabled. */
  reduceMotion: () => Promise<boolean>
  /** True if the user has Reduce Transparency enabled. */
  reduceTransparency: () => Promise<boolean>
  /** True if the user has Increase Contrast enabled. */
  increaseContrast: () => Promise<boolean>
  /** OS version string (e.g. "14.4.1"). */
  systemVersion: () => Promise<string>
  /** Machine hostname. Empty in browser. */
  hostname: () => Promise<string>
  /** Login username. Empty in browser. */
  username: () => Promise<string>
  /** Open System Settings / Preferences. */
  openPreferences: () => Promise<void>
}

export const system: SystemInfo = {
  accentColor: () => bridgeOr('system', 'accentColor', () => ''),
  highlightColor: () => bridgeOr('system', 'highlightColor', () => ''),
  language: () => bridgeOr('system', 'language', () => {
    if (typeof navigator === 'undefined') return ''
    return navigator.language?.split('-')[0] || ''
  }),
  locale: () => bridgeOr('system', 'locale', () => {
    if (typeof navigator === 'undefined') return ''
    return navigator.language || ''
  }),
  timezone: () => bridgeOr('system', 'timezone', () => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { return '' }
  }),
  is24HourTime: () => bridgeOr('system', 'is24HourTime', () => {
    try {
      const opts = new Intl.DateTimeFormat([], { hour: 'numeric' }).resolvedOptions() as any
      return opts.hourCycle === 'h23' || opts.hourCycle === 'h24'
    }
    catch { return false }
  }),
  reduceMotion: () => bridgeOr('system', 'reduceMotion', () => mediaMatches('(prefers-reduced-motion: reduce)')),
  reduceTransparency: () => bridgeOr('system', 'reduceTransparency', () => mediaMatches('(prefers-reduced-transparency: reduce)')),
  increaseContrast: () => bridgeOr('system', 'increaseContrast', () => mediaMatches('(prefers-contrast: more)')),
  systemVersion: () => bridgeOr('system', 'systemVersion', () => ''),
  hostname: () => bridgeOr('system', 'hostname', () => ''),
  username: () => bridgeOr('system', 'username', () => ''),
  async openPreferences() {
    if (hasBridge('system')) await window.craft!.system.openPreferences()
  },
}

async function bridgeOr<T>(ns: string, method: string, fallback: () => T | Promise<T>): Promise<T> {
  if (hasBridge(ns)) return (await window.craft![ns][method]()) as T
  return await fallback()
}

function mediaMatches(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(query).matches
}
