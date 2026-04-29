/**
 * Continuity Camera — list paired iPhone (and other Apple) cameras.
 *
 * Once the user has enabled it in Settings → General → AirPlay & Handoff,
 * the iPhone shows up alongside built-in cameras in `AVCaptureDevice`'s
 * device list. We surface the list so apps can populate a "choose camera"
 * UI; binding the actual capture session is the app's responsibility
 * (or `navigator.mediaDevices.getUserMedia` from the renderer side).
 *
 * The `isContinuity` flag distinguishes Continuity-paired devices from
 * regular built-in / USB cameras so apps can label them appropriately.
 */

import { hasBridge } from './_bridge'

export interface ContinuityCameraDevice {
  /** Stable AVCaptureDevice unique identifier. */
  id: string
  /** Localized name (e.g. "iPhone Camera"). */
  name: string
  /** Manufacturer string from AVCaptureDevice. */
  manufacturer: string
  /** True if the device is paired via Continuity Camera. */
  isContinuity: boolean
}

export interface ContinuityCameraAPI {
  listCameras: () => Promise<ContinuityCameraDevice[]>
}

export const continuityCamera: ContinuityCameraAPI = {
  async listCameras() {
    if (!hasBridge('continuityCamera')) return []
    return await window.craft!.continuityCamera.listCameras()
  },
}
