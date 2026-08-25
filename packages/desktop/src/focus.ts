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

/**
 * How the shortcut is run.
 *
 * `cli` execs `/usr/bin/shortcuts` and reports the shortcut's real exit
 * status. `url` opens `shortcuts://run-shortcut`, the only route the App
 * Sandbox permits — but it is fire-and-forget: LaunchServices confirms it
 * handed the URL over, never that the shortcut ran. `auto` picks `url` under
 * sandbox and `cli` everywhere else, so a real status is used where one
 * exists.
 */
export type FocusStrategy = 'auto' | 'cli' | 'url'

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
  /** Defaults to `auto`. */
  strategy?: FocusStrategy
}

export interface FocusResult {
  ok: boolean
  strategy?: 'shortcut' | 'url'
  /** Exit status of the Shortcuts CLI. Absent for the `url` strategy. */
  exitCode?: number
  /**
   * `url` strategy only: the request reached Shortcuts. Not a claim that the
   * shortcut ran — that signal does not exist on this route.
   */
  dispatched?: boolean
  shortcut?: string
  error?: string
}

export interface FocusShortcutList {
  /**
   * False when enumeration was not possible — inside the App Sandbox, or off
   * platform. An empty `shortcuts` then means *could not check*, not *none
   * installed*, and must not send the user through setup again.
   */
  canList: boolean
  shortcuts: string[]
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
  /** Same, plus whether enumeration was possible at all. */
  listShortcutsResult: () => Promise<FocusShortcutList>
}

const UNSUPPORTED: FocusStatus = { supported: false, isFocused: null, authorization: 'unsupported' }

function unavailable(): FocusResult {
  return { ok: false, error: 'Focus control is only available in a Craft window on macOS' }
}

export const focus: FocusAPI = {
  async getStatus() {
    if (!hasBridge('focus')) return { ...UNSUPPORTED }
    return await window.craft!.focus!.getStatus()
  },

  async requestAuthorization() {
    if (!hasBridge('focus')) return 'unsupported'
    return await window.craft!.focus!.requestAuthorization()
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
    return await window.craft!.focus!.setEnabled(enabled, options)
  },

  async runShortcut(name) {
    if (!hasBridge('focus')) return unavailable()
    if (!name) throw new Error('focus.runShortcut: name is required')
    return await window.craft!.focus!.runShortcut(name)
  },

  async listShortcuts() {
    if (!hasBridge('focus')) return []
    return await window.craft!.focus!.listShortcuts()
  },

  async listShortcutsResult() {
    if (!hasBridge('focus')) return { canList: false, shortcuts: [] }
    // craft-bridge.js ships `listShortcutsResult` (it maps onto the
    // focus/listShortcuts request), but craft-native 0.0.76 does not declare
    // it on CraftFocusAPI, so the call is a TS2551 without a cast.
    //
    // Cast rather than augment: `index.d.ts` re-exports a fixed list of type
    // names and CraftFocusAPI is not on it, so `declare module 'craft-native'
    // { interface CraftFocusAPI }` does not merge with anything — it silently
    // declares a SECOND, empty interface and the call still fails. Both gaps
    // are worth an upstream issue.
    const focusApi = window.craft!.focus! as {
      listShortcutsResult?: () => Promise<{ canList?: boolean, shortcuts?: string[] }>
    }
    const r = await focusApi.listShortcutsResult?.()
    return { canList: Boolean(r?.canList), shortcuts: r?.shortcuts ?? [] }
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

/**
 * Like `hasFocusShortcuts`, but distinguishes "not installed" from "could not
 * check". Prefer this anywhere the answer drives a setup prompt.
 */
export async function focusShortcutsReady(...names: string[]): Promise<boolean | 'unknown'> {
  if (names.length === 0) return false
  const { canList, shortcuts } = await focus.listShortcutsResult()
  if (!canList) return 'unknown'
  const installed = new Set(shortcuts)
  return names.every(name => installed.has(name))
}
