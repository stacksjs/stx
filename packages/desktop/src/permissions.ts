/**
 * Privacy Permissions
 *
 * Check and request OS-level permission for sensitive capabilities
 * (camera, microphone, screen recording, etc). Wraps macOS TCC
 * (`AVCaptureDevice authorizationStatusForMediaType:`) and equivalents.
 *
 * Browser fallback uses the (limited) `navigator.permissions.query`
 * API where available — note that the web API only knows about a small
 * subset of names ('camera', 'microphone', 'geolocation', 'notifications').
 */
import { hasBridge } from './_bridge'

/** Status values match the macOS TCC convention. */
export type PermissionStatus = 'granted' | 'denied' | 'restricted' | 'undetermined' | 'not-supported'

export type PermissionName = 
| 'camera'
| 'microphone'
| 'screen_recording'
| 'accessibility'
| 'full_disk_access'
| 'input_monitoring'
| 'location'
| 'notifications'
| 'contacts'
| 'calendar'
| 'reminders'
| 'photos'
| 'bluetooth'

export interface PermissionsAPI {
  /** Read current status without prompting. */
  check: (name: PermissionName) => Promise<PermissionStatus>
  /**
   * Request permission. On macOS this triggers the system modal for
   * permissions that haven't been answered yet; for ones already in
   * a non-undetermined state, the user has to flip it manually in
   * System Settings — call `openSettings(name)` to jump them there.
   */
  request: (name: PermissionName) => Promise<PermissionStatus>
  /** Open the Privacy pane scoped to the named permission. */
  openSettings: (name?: PermissionName) => Promise<void>
}

export const permissions: PermissionsAPI = {
  async check(name) {
    if (hasBridge('permissions')) return await window.craft!.permissions.check(name)
    return await webCheck(name)
  },
  async request(name) {
    if (hasBridge('permissions')) return await window.craft!.permissions.request(name)
    return await webRequest(name)
  },
  async openSettings(name) {
    if (hasBridge('permissions')) await window.craft!.permissions.openSettings(name)
  },
}

async function webCheck(name: PermissionName): Promise<PermissionStatus> {
  if (typeof navigator === 'undefined' || !(navigator as any).permissions?.query) return 'not-supported'
  try {
    const result = await (navigator as any).permissions.query({ name })
    return mapWebState(result.state)
  }
  catch { return 'not-supported' }
}

async function webRequest(name: PermissionName): Promise<PermissionStatus> {
  // The web has no general-purpose `request` — most APIs prompt
  // implicitly when you try to use them. We special-case the well-known
  // ones and otherwise fall back to a `check`.
  if (name === 'notifications' && typeof window !== 'undefined' && 'Notification' in window) {
    const r = await (window as any).Notification.requestPermission()
    return r === 'granted' ? 'granted' : r === 'denied' ? 'denied' : 'undetermined'
  }
  return await webCheck(name)
}

function mapWebState(s: string): PermissionStatus {
  if (s === 'granted') return 'granted'
  if (s === 'denied') return 'denied'
  if (s === 'prompt') return 'undetermined'
  return 'undetermined'
}
