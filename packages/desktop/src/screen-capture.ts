/**
 * Programmatic screen + window capture.
 *
 * macOS uses `CGWindowListCreateImage` (works on every supported
 * release; permission-gated by Privacy → Screen Recording). Apps
 * should guide the user via `permissions.openSettings('screen_recording')`
 * before calling — otherwise the capture returns a black image.
 *
 * No web fallback — `getDisplayMedia()` exists but it's a different
 * shape (live stream vs still). Calls outside Craft return null.
 */
import { hasBridge } from './_bridge'

export interface CapturableWindow {
  /** CGWindowID — pass to `captureWindow()`. */
  id: number
  /** Window title. May be empty. */
  name: string
  /** Owning app's name (e.g. "Safari", "Finder"). */
  ownerName: string
}

export interface ScreenCaptureAPI {
  /**
   * Capture the entire primary display. Returns a `data:image/png;base64,...`
   * data URL ready to drop into an `<img src>`, or null if the capture
   * failed (typically permission-denied).
   */
  captureScreen: () => Promise<string | null>
  /** Capture a specific window by its CGWindowID. */
  captureWindow: (id: number) => Promise<string | null>
  /** List every on-screen window the OS will let us capture. */
  listWindows: () => Promise<CapturableWindow[]>
}

export const screenCapture: ScreenCaptureAPI = {
  async captureScreen() {
    if (!hasBridge('screenCapture')) return null
    const r = await window.craft!.screenCapture.captureScreen()
    return r ? String(r) : null
  },
  async captureWindow(id) {
    if (!hasBridge('screenCapture')) return null
    if (!Number.isFinite(id) || id <= 0) throw new Error('captureWindow: id must be a positive number')
    const r = await window.craft!.screenCapture.captureWindow(id)
    return r ? String(r) : null
  },
  async listWindows() {
    if (!hasBridge('screenCapture')) return []
    return await window.craft!.screenCapture.listWindows()
  },
}
