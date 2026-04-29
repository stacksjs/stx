/**
 * Handoff (Apple Continuity)
 *
 * `NSUserActivity` lets one of the user's Apple devices pick up a
 * task started on another. A reading app can publish "currently
 * reading X at chapter Y" and have the user's iPad pick up exactly
 * where they left off, etc.
 *
 * The bridge exposes:
 *
 *   - `startActivity(type, opts)`   — broadcast a new activity. The
 *                                     `type` is the activity name
 *                                     declared in `Info.plist`'s
 *                                     `NSUserActivityTypes`.
 *   - `updateActivity(opts)`        — mutate the in-flight activity.
 *   - `stopActivity()`              — invalidate.
 *   - `getCurrentActivity()`        — read the current snapshot.
 *   - `onIncoming(cb)`              — subscribe to incoming handoffs
 *                                     from another device.
 *
 * **Required Info.plist setup:** add a `NSUserActivityTypes` array
 * listing the activity-type strings your app will use. Without that
 * declaration, macOS rejects the activity at registration time.
 *
 * Browser fallback: this module is a graceful no-op (subscriptions
 * never fire). Handoff has no web equivalent.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export interface HandoffActivityOptions {
  /** Human-readable title shown in the Handoff UI. */
  title?: string
  /** URL to fall back to on devices without the app installed. */
  webpageURL?: string
  /**
   * Arbitrary state to send to the receiving device. Must be plist-
   * compatible (strings, numbers, bools, arrays, dicts of the same).
   * Round-trips through NSJSONSerialization.
   */
  userInfo?: Record<string, unknown>
}

export interface HandoffSnapshot {
  type: string
  title: string
  webpageURL: string
}

export interface HandoffIncomingEvent {
  type: string
  title?: string
  webpageURL?: string
  userInfo?: Record<string, unknown>
}

export interface HandoffAPI {
  /** Start broadcasting a new activity. Resolves to true on success. */
  startActivity: (type: string, options?: HandoffActivityOptions) => Promise<boolean>
  /** Update the in-flight activity (title / webpageURL / userInfo). */
  updateActivity: (options: HandoffActivityOptions) => Promise<boolean>
  /** Invalidate the current activity. Idempotent. */
  stopActivity: () => Promise<void>
  /** Read the current activity, or null if none. */
  getCurrentActivity: () => Promise<HandoffSnapshot | null>
  /** Subscribe to incoming handoffs from another device. */
  onIncoming: (cb: (event: HandoffIncomingEvent) => void) => () => void
}

export const handoff: HandoffAPI = {
  async startActivity(type, options) {
    if (!type) throw new Error('handoff.startActivity: type is required')
    if (!hasBridge('handoff')) return false
    // Tolerate both shapes: the production JS facade in craft-bridge.js
    // extracts `{ok:boolean}` to a bare boolean, but the TS-only mock
    // path returns the raw `{ok}` envelope. Either way we surface a
    // single boolean to the caller so call sites stay clean.
    const r = await window.craft!.handoff.startActivity(type, options)
    return typeof r === 'boolean' ? r : !!(r && r.ok)
  },
  async updateActivity(options) {
    if (!hasBridge('handoff')) return false
    const r = await window.craft!.handoff.updateActivity(options)
    return typeof r === 'boolean' ? r : !!(r && r.ok)
  },
  async stopActivity() {
    if (!hasBridge('handoff')) return
    await window.craft!.handoff.stopActivity()
  },
  async getCurrentActivity() {
    if (!hasBridge('handoff')) return null
    const r = await window.craft!.handoff.getCurrentActivity()
    return r && typeof r.type === 'string' ? r : null
  },
  onIncoming(cb) {
    return onCraftEvent<HandoffIncomingEvent>('craft:handoff:incoming', cb)
  },
}
