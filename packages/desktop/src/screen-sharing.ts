/**
 * Screen-sharing and screen-recording detection.
 *
 * macOS exposes no direct "is my screen being captured?" API, so Craft
 * combines four independent signals: the CGSession dictionary's shared-screen
 * and off-console keys, the floating sharing control conferencing apps show
 * while a share is live, and recorder windows.
 *
 * The window-level signals match the sharing *indicator*, never the presence
 * of the app. "Zoom is running" describes most of a working day; acting on it
 * would silence notifications permanently.
 *
 * No web fallback: `getDisplayMedia()` tells a page about its own capture, not
 * about the machine. Outside Craft, `getState()` reports nothing detected and
 * `watch()` resolves without starting anything.
 */
import { hasBridge, onCraftEvent } from './_bridge'

/** Which signal produced a detection. */
export type ScreenSharingKind = 'system' | 'remote' | 'conference' | 'recording'

export interface ScreenSharingSource {
  /** Owning application, as the window server reports it. */
  app: string
  /** Window title that matched. Empty when the owner alone was the signal. */
  window: string
  kind: ScreenSharingKind
}

export interface ScreenSharingSignals {
  /** macOS Screen Sharing / Apple Remote Desktop has the session. */
  systemScreenShare: boolean
  /** The session is being driven from somewhere other than this console. */
  remoteSession: boolean
  /** A conferencing app is showing its live sharing control. */
  conferenceSharing: boolean
  /** A recorder is capturing the screen. */
  screenRecording: boolean
}

export interface ScreenSharingState {
  /** True when any signal fired. */
  sharing: boolean
  signals: ScreenSharingSignals
  /** Every indicator that matched, so apps can explain *why* they reacted. */
  sources: ScreenSharingSource[]
}

/** Interval bounds enforced natively; mirrored here so callers get the same clamp. */
export const MIN_WATCH_INTERVAL_MS = 250
export const MAX_WATCH_INTERVAL_MS = 60_000
export const DEFAULT_WATCH_INTERVAL_MS = 2000

export interface ScreenSharingAPI {
  /** One-shot evaluation of every signal. */
  getState: () => Promise<ScreenSharingState>
  /**
   * Start polling. Fires `onChange` once immediately, then only when the
   * resolved state actually differs. Returns the interval the native side
   * settled on after clamping.
   */
  watch: (intervalMs?: number) => Promise<number>
  stop: () => Promise<void>
  /** Subscribe to state changes. Returns an unsubscribe function. */
  onChange: (cb: (state: ScreenSharingState) => void) => () => void
}

const IDLE: ScreenSharingState = {
  sharing: false,
  signals: {
    systemScreenShare: false,
    remoteSession: false,
    conferenceSharing: false,
    screenRecording: false,
  },
  sources: [],
}

function idleState(): ScreenSharingState {
  return { ...IDLE, signals: { ...IDLE.signals }, sources: [] }
}

export const screenSharing: ScreenSharingAPI = {
  async getState() {
    if (!hasBridge('screenSharing')) return idleState()
    return await window.craft!.screenSharing.getState()
  },

  async watch(intervalMs = DEFAULT_WATCH_INTERVAL_MS) {
    const clamped = Math.min(MAX_WATCH_INTERVAL_MS, Math.max(MIN_WATCH_INTERVAL_MS, Math.round(intervalMs)))
    if (!hasBridge('screenSharing')) return clamped
    const r = await window.craft!.screenSharing.watch(clamped)
    return (r && r.intervalMs) || clamped
  },

  async stop() {
    if (!hasBridge('screenSharing')) return
    await window.craft!.screenSharing.unwatch()
  },

  // Subscribing to the window event directly, rather than through the bridge
  // facade's own `onChange`, keeps this working before the bridge has
  // finished injecting — a listener registered early still receives the first
  // emission that `watch()` sends immediately on start.
  onChange(cb) {
    return onCraftEvent('craft:screenSharing:change', cb)
  },
}

/**
 * Subscribe and start polling in one call, returning a single teardown.
 *
 * The two halves are easy to leak apart — `onChange` without `watch` never
 * fires, and `watch` without a matching `stop` keeps the timer alive across a
 * page reload.
 */
export async function watchScreenSharing(
  cb: (state: ScreenSharingState) => void,
  intervalMs: number = DEFAULT_WATCH_INTERVAL_MS,
): Promise<() => void> {
  const off = screenSharing.onChange(cb)
  await screenSharing.watch(intervalMs)
  return () => {
    off()
    void screenSharing.stop()
  }
}
