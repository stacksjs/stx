/**
 * Do Not Disturb / Focus.
 *
 * Reading Focus is public macOS API (`INFocusStatusCenter`, macOS 12+) but
 * permission-gated: the app must call `requestAuthorization()` and declare
 * `NSFocusStatusUsageDescription` in its `Info.plist`.
 *
 * Writing Focus is *not* available to third-party apps. The system service
 * rejects every client without an Apple-private entitlement, so the only
 * sanctioned path is to run a user-created Shortcut containing the **Set
 * Focus** action — which is what `setEnabled()` does. Apps are expected to
 * walk the user through creating those shortcuts once and to verify them with
 * `listShortcuts()` before offering the feature.
 *
 * No web fallback exists: a browser cannot read or set the system's Focus.
 * Outside Craft every call resolves to an unsupported result rather than
 * throwing, so cross-platform code can call unconditionally.
 */
import { hasBridge } from './_bridge'

/**
 * Mirrors `INFocusStatusAuthorizationStatus`. `unsupported` is Craft's own
 * value for platforms where the framework isn't present at all.
 */
export type FocusAuthorization = 'notDetermined' | 'restricted' | 'denied' | 'authorized' | 'unsupported'

export interface FocusStatus {
  /** False when Focus isn't available on this platform. */
  supported: boolean
  /**
   * Whether the user is in *any* Focus. `null` means the system declined to
   * answer — almost always missing authorization, which is not the same as
   * "not focused". Branch on the two separately.
   */
  isFocused: boolean | null
  authorization: FocusAuthorization
}

export interface FocusShortcutOptions {
  /** Shortcut to run when turning Focus on. */
  onShortcut?: string
  /** Shortcut to run when turning Focus off. */
  offShortcut?: string
}

export interface FocusResult {
  ok: boolean
  strategy?: 'shortcut'
  /** Exit status of the Shortcuts CLI. */
  exitCode?: number
  shortcut?: string
  error?: string
}

export interface FocusAPI {
  /** Current Focus state. Never throws — check `supported` first. */
  getStatus: () => Promise<FocusStatus>
  /** Present the system permission prompt for Focus status. */
  requestAuthorization: () => Promise<FocusAuthorization>
  /**
   * Turn Focus on or off by running the matching user shortcut. Resolves with
   * `ok: false` and a reason rather than throwing, because the common failure
   * — the shortcut doesn't exist yet — is something the app should surface to
   * the user, not treat as a crash.
   */
  setEnabled: (enabled: boolean, options?: FocusShortcutOptions) => Promise<FocusResult>
  /** Run any shortcut by name — for per-mode or timed Focus flows. */
  runShortcut: (name: string) => Promise<FocusResult>
  /** Every shortcut installed for the current user. Empty off-platform. */
  listShortcuts: () => Promise<string[]>
}

const UNSUPPORTED: FocusStatus = { supported: false, isFocused: null, authorization: 'unsupported' }

function unavailable(): FocusResult {
  return { ok: false, error: 'Focus control is only available in a Craft window on macOS' }
}

export const focus: FocusAPI = {
  async getStatus() {
    if (!hasBridge('focus')) return { ...UNSUPPORTED }
    return await window.craft!.focus.getStatus()
  },

  async requestAuthorization() {
    if (!hasBridge('focus')) return 'unsupported'
    return await window.craft!.focus.requestAuthorization()
  },

  async setEnabled(enabled, options = {}) {
    if (!hasBridge('focus')) return unavailable()
    const name = enabled ? options.onShortcut : options.offShortcut
    if (!name) {
      return {
        ok: false,
        error: `focus.setEnabled: no ${enabled ? 'onShortcut' : 'offShortcut'} configured`,
      }
    }
    return await window.craft!.focus.setEnabled(enabled, options)
  },

  async runShortcut(name) {
    if (!hasBridge('focus')) return unavailable()
    if (!name) throw new Error('focus.runShortcut: name is required')
    return await window.craft!.focus.runShortcut(name)
  },

  async listShortcuts() {
    if (!hasBridge('focus')) return []
    return await window.craft!.focus.listShortcuts()
  },
}

/**
 * Whether every shortcut the app depends on is installed.
 *
 * Worth calling on launch: the shortcuts are user-created, so the honest time
 * to discover they're missing is before the user is relying on the feature,
 * not at the moment a meeting starts.
 */
export async function hasFocusShortcuts(...names: string[]): Promise<boolean> {
  if (names.length === 0) return false
  const installed = new Set(await focus.listShortcuts())
  return names.every(name => installed.has(name))
}
