/**
 * Biometric authentication (TouchID / FaceID / OpticID).
 *
 * Wraps `LAContext` on macOS. Apps that secure features behind a
 * biometric gate (password managers, finance, encrypted notes) call
 * `evaluate(reason)` to present the system prompt; the call resolves
 * with `{success: true|false}` once the user dismisses the sheet.
 *
 * **Required Info.plist key**: `NSFaceIDUsageDescription` — without
 * it, evaluate() fails immediately on devices that have FaceID.
 *
 * No web fallback — WebAuthn covers a subset (security keys, browser-
 * level passkeys) but doesn't expose macOS biometrics directly.
 */

import { hasBridge } from './_bridge'

export type BiometryType = 'none' | 'touchID' | 'faceID' | 'opticID'

export interface BiometricEvaluateOptions {
  /** Allow falling back to the device passcode after biometry fails. */
  allowPasscodeFallback?: boolean
}

export interface BiometricEvaluateResult {
  success: boolean
  /** When `success` is false, Apple's `LAError` numeric code. */
  errorCode?: number
}

export interface BiometricAPI {
  /** True if the device has biometry hardware AND it's enrolled. */
  isAvailable: () => Promise<boolean>
  /** Which biometry hardware is present. `'none'` if unavailable. */
  getBiometryType: () => Promise<BiometryType>
  /**
   * Present the prompt and resolve once the user dismisses it.
   * `reason` is shown in the prompt body — required by Apple.
   */
  evaluate: (reason: string, options?: BiometricEvaluateOptions) => Promise<BiometricEvaluateResult>
}

export const biometric: BiometricAPI = {
  async isAvailable() {
    if (!hasBridge('biometric')) return false
    return await window.craft!.biometric.isAvailable()
  },
  async getBiometryType() {
    if (!hasBridge('biometric')) return 'none'
    return await window.craft!.biometric.getBiometryType()
  },
  async evaluate(reason, options) {
    if (!reason) throw new Error('biometric.evaluate: reason is required')
    if (!hasBridge('biometric')) return { success: false, errorCode: -1 }
    return await window.craft!.biometric.evaluate(reason, options)
  },
}
