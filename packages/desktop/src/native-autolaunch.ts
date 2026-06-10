/**
 * Native Auto-Launch (start at login)
 *
 * Tells the OS to launch the app automatically when the user signs in.
 * Backed by `SMAppService` on macOS Ventura+. **Different from
 * `autolaunch.ts`** — that older module shells out to subprocesses
 * (`osascript`, etc); this one uses the modern Apple API.
 *
 * For a clean migration: prefer this module for new code. Keep
 * `autolaunch.ts` for backward compatibility with apps that haven't
 * adopted the Craft bridge yet.
 *
 * On systems where SMAppService isn't available (older macOS, Linux,
 * Windows) `enable`/`disable` resolve to `false` — let the caller
 * fall back to the legacy module.
 */
import { hasBridge } from './_bridge'

export interface NativeAutoLaunchAPI {
  /** Register the app to launch at login. Resolves to true on success. */
  enable: () => Promise<boolean>
  /** Unregister. Resolves to true on success. */
  disable: () => Promise<boolean>
  /** True if currently registered. */
  isEnabled: () => Promise<boolean>
}

export const nativeAutoLaunch: NativeAutoLaunchAPI = {
  async enable() {
    if (!hasBridge('autoLaunch')) return false
    return await window.craft!.autoLaunch.enable()
  },
  async disable() {
    if (!hasBridge('autoLaunch')) return false
    return await window.craft!.autoLaunch.disable()
  },
  async isEnabled() {
    if (!hasBridge('autoLaunch')) return false
    return await window.craft!.autoLaunch.isEnabled()
  },
}
