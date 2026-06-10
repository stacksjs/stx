/**
 * Live Activities — a thin wrapper over Handoff.
 *
 * **Apple's "Live Activities" are an iOS-only ActivityKit feature**
 * that lights up Lock Screens and Dynamic Island. They require an
 * iOS 16+ Widget Extension target and can't be invoked from a
 * Craft window directly.
 *
 * What this module ships is the *macOS-compatible approximation*:
 * we publish an NSUserActivity that nearby Apple devices (including
 * the user's iPhone, if it's running a companion app) can pick up
 * via Handoff. It's not a Live Activity in the iOS sense, but it
 * exposes the same conceptual API so app code can be future-ready
 * and dual-targeted.
 *
 * For real iOS Live Activities, ship a Widget Extension target and
 * call `Activity.request(...)` from Swift. This module is the
 * cross-platform glue — same surface, best-effort behaviour.
 */
import { handoff } from './handoff'

export interface LiveActivityState {
  /** Title shown in the Lock Screen / nearby device UI. */
  title?: string
  /** URL to fall back to on devices without the app. */
  webpageURL?: string
  /** Free-form payload passed through to the receiving device. */
  state?: Record<string, unknown>
}

export interface LiveActivitiesAPI {
  /**
   * Start a live-activity-shaped session. On macOS this maps to an
   * `NSUserActivity` published via Handoff.
   * @param type — the activity type identifier (must be declared in
   *               `Info.plist > NSUserActivityTypes`).
   */
  start: (type: string, state?: LiveActivityState) => Promise<boolean>
  /** Push a new state. Devices receiving the activity see the latest. */
  update: (state: LiveActivityState) => Promise<boolean>
  /** End the activity. Idempotent. */
  stop: () => Promise<void>
}

export const liveActivities: LiveActivitiesAPI = {
  async start(type, state) {
    return handoff.startActivity(type, {
      title: state?.title,
      webpageURL: state?.webpageURL,
      userInfo: state?.state,
    })
  },
  async update(state) {
    return handoff.updateActivity({
      title: state.title,
      webpageURL: state.webpageURL,
      userInfo: state.state,
    })
  },
  async stop() {
    await handoff.stopActivity()
  },
}
