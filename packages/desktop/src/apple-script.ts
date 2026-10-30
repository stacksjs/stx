/**
 * AppleScript executor.
 *
 * `craft.appleScript.execute(source)` compiles + runs an AppleScript
 * source string and resolves with the script's `stringValue`. Apps
 * use this to drive system automation flows: telling Mail to compose
 * a message, asking Music to play a track, mounting a disk image.
 *
 * No web fallback — AppleScript is a macOS-only system facility.
 * Calls outside Craft resolve with `{ok: false}`.
 *
 * A failed script resolves with `{ok: false, error: {code, message}}` from
 * Craft builds that report it (`NSAppleScriptErrorNumber` and
 * `NSAppleScriptErrorMessage`). Older builds omit `error`, so read it as
 * optional; `classifyAppleScriptError` handles both.
 */
import { hasBridge } from './_bridge'

export interface AppleScriptError {
  /** The AppleScript error number, such as -1743 for a refused Automation permission. */
  code?: number
  /** The message AppleScript produced, in the user's language. */
  message?: string
}

export interface AppleScriptResult {
  ok: boolean
  /** Stringified script result (NSAppleEventDescriptor.stringValue). */
  result?: string
  /** Why the script failed, when the host reports it. */
  error?: AppleScriptError
}

export type AppleScriptFailureKind
  = | 'automation-denied'
    | 'accessibility-denied'
    | 'cancelled'
    | 'syntax'
    | 'app-not-running'
    | 'unknown'

/** The error numbers an app can act on. Anything else is `unknown` and keeps AppleScript's own message. */
const failureKinds: Readonly<Record<number, AppleScriptFailureKind>> = {
  // errAEEventNotPermitted and errAEEventWouldRequireUserConsent: the Automation permission.
  [-1743]: 'automation-denied',
  [-1744]: 'automation-denied',
  // The assistive-access errors System Events reports when Accessibility is not granted.
  [-25211]: 'accessibility-denied',
  [-1719]: 'accessibility-denied',
  [-128]: 'cancelled',
  // Compile errors: the script itself is wrong.
  [-2740]: 'syntax',
  [-2741]: 'syntax',
  [-2753]: 'syntax',
  [-600]: 'app-not-running',
}

/** Sort a failed result into something an interface can respond to, without parsing localized text. */
export function classifyAppleScriptError(result: Pick<AppleScriptResult, 'ok' | 'error'>): { kind: AppleScriptFailureKind, code?: number, message?: string } | null {
  if (result.ok) return null
  const code = typeof result.error?.code === 'number' && Number.isFinite(result.error.code) ? result.error.code : undefined
  return { kind: code !== undefined && Object.hasOwn(failureKinds, code) ? failureKinds[code]! : 'unknown', code, message: result.error?.message }
}

export interface AppleScriptAPI {
  /** Compile and run an AppleScript source string. */
  execute: (source: string) => Promise<AppleScriptResult>
}

export const appleScript: AppleScriptAPI = {
  async execute(source) {
    if (!source) throw new Error('appleScript.execute: source is required')
    if (!hasBridge('appleScript')) return { ok: false }
    return await window.craft!.appleScript.execute(source)
  },
}
