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
 */

import { hasBridge } from './_bridge'

export interface AppleScriptResult {
  ok: boolean
  /** Stringified script result (NSAppleEventDescriptor.stringValue). */
  result?: string
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
