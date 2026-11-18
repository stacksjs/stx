/**
 * "Sign in with Face ID", without a template.
 *
 * Craft keeps a credential where only the face or finger enrolled on this
 * device releases it (`craft.biometrics.storeCredential`, Craft 0.0.511): the
 * Keychain itself withholds it until the person passes, so a token read
 * afterwards is not merely guarded by the app's own code. This module is the
 * flow around those calls, so `<BiometricSignIn>` and an app's own settings
 * screen say and do the same thing:
 *
 * - after a password sign-in, `enable(token)` keeps the app's device token;
 * - on the sign-in screen, `probe()` says whether to offer the button and
 *   what to call it, and `signIn(reason)` shows the system prompt;
 * - on sign-out, `forget()`.
 *
 * Keep a device token the server can revoke, never the password: the server
 * swaps it for a session and forgets it on sign-out.
 *
 * Away from Craft (a browser, Android today) there is no host and every call
 * answers that nothing is available, so the button is simply not offered.
 */

/** What the host reports: `craft.biometrics.getBiometricType()`. */
export type BiometricKind = 'faceId' | 'touchId' | 'fingerprint' | 'none' | null

/** The part of `craft.biometrics` this flow uses. */
export interface BiometricCredentialHost {
  isAvailable: () => Promise<boolean>
  getBiometricType: () => Promise<string | null>
  storeCredential: (key: string, value: string) => Promise<unknown>
  getCredential: (key: string, reason?: string) => Promise<string | null>
  hasCredential: (key: string) => Promise<boolean>
  deleteCredential: (key: string) => Promise<unknown>
}

/** Whether to offer biometric sign-in here, and what to call it. */
export interface BiometricProbe {
  /** A face or finger is enrolled and the host keeps credentials. */
  available: boolean
  kind: BiometricKind
  /** `Face ID`, `Touch ID` or `Fingerprint`; empty when unavailable. */
  label: string
  /** A credential is kept under the key: offer the button. */
  saved: boolean
}

/**
 * How a sign-in ended.
 *
 * - `signed-in`: the token, to swap for a session.
 * - `cancelled`: the person dismissed the prompt; leave the button.
 * - `invalidated`: nothing came back (another face or finger was enrolled, or
 *   it was never kept). It is forgotten, so ask for the password.
 * - `failed`: the face or finger did not match, or the host refused; `code`
 *   is the host's (`AUTHENTICATION_FAILED`, `BIOMETRICS_UNAVAILABLE`, ...).
 */
export type BiometricSignInResult =
| { status: 'signed-in', token: string }
| { status: 'cancelled' }
| { status: 'invalidated' }
| { status: 'failed', code: string, message: string }

export interface BiometricSignIn {
  probe: () => Promise<BiometricProbe>
  signIn: (reason?: string) => Promise<BiometricSignInResult>
  /** Keep `token` behind the face or finger. Resolves false when it cannot be kept here. */
  enable: (token: string) => Promise<boolean>
  forget: () => Promise<void>
}

/** The key a credential is kept under when the app does not name one. */
export const BIOMETRIC_DEFAULT_KEY = 'session'

const LABELS: Readonly<Record<string, string>> = {
  faceId: 'Face ID',
  touchId: 'Touch ID',
  fingerprint: 'Fingerprint',
}

/** What to call the host's kind of biometry: `faceId` is `Face ID`. */
export function biometricLabel(kind: unknown): string {
  return typeof kind === 'string' ? (LABELS[kind] || '') : ''
}

/** The button's words: `Sign in with Face ID`. */
export function biometricSignInLabel(kind: unknown): string {
  const label = biometricLabel(kind)
  return label ? `Sign in with ${label}` : ''
}

/** The host's `craft.biometrics`, when this page runs inside Craft and it keeps credentials. */
export function biometricHost(): BiometricCredentialHost | null {
  const craft = (globalThis as { craft?: { biometrics?: Partial<BiometricCredentialHost> } }).craft
  const host = craft?.biometrics
  if (!host)
    return null
  const needed: Array<keyof BiometricCredentialHost> = ['isAvailable', 'getBiometricType', 'storeCredential', 'getCredential', 'hasCredential', 'deleteCredential']
  return needed.every(name => typeof host[name] === 'function') ? host as BiometricCredentialHost : null
}

const NOTHING: BiometricProbe = Object.freeze({ available: false, kind: null, label: '', saved: false })

function codeOf(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' && code ? code : 'UNKNOWN'
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? '')
}

/**
 * The flow for one credential.
 *
 * `host` defaults to the page's `craft.biometrics`, read on each call, so a
 * bridge installed after this was created is still found.
 */
export function createBiometricSignIn(key: string = BIOMETRIC_DEFAULT_KEY, host?: BiometricCredentialHost | null): BiometricSignIn {
  const name = String(key || '').trim() || BIOMETRIC_DEFAULT_KEY
  const current = (): BiometricCredentialHost | null => host === undefined ? biometricHost() : host

  async function probe(): Promise<BiometricProbe> {
    const bio = current()
    if (!bio)
      return NOTHING
    try {
      if (!await bio.isAvailable())
        return NOTHING
      const kind = (await bio.getBiometricType()) as BiometricKind
      const label = biometricLabel(kind)
      if (!label)
        return NOTHING
      return { available: true, kind, label, saved: await bio.hasCredential(name) === true }
    }
    catch {
      // A host that cannot answer is one with nothing to offer.
      return NOTHING
    }
  }

  async function signIn(reason?: string): Promise<BiometricSignInResult> {
    const bio = current()
    if (!bio)
      return { status: 'failed', code: 'UNSUPPORTED', message: 'Biometric sign-in is not available here.' }
    try {
      const token = await bio.getCredential(name, reason || undefined)
      if (typeof token === 'string' && token)
        return { status: 'signed-in', token }
      // Gone or invalidated: forget it so the button is not offered again.
      await bio.deleteCredential(name).catch(() => {})
      return { status: 'invalidated' }
    }
    catch (error) {
      const code = codeOf(error)
      if (code === 'AUTHENTICATION_CANCELLED')
        return { status: 'cancelled' }
      return { status: 'failed', code, message: messageOf(error) }
    }
  }

  async function enable(token: string): Promise<boolean> {
    const bio = current()
    if (!bio || typeof token !== 'string' || !token)
      return false
    try {
      if (!await bio.isAvailable())
        return false
      await bio.storeCredential(name, token)
      return true
    }
    catch {
      // BIOMETRICS_UNAVAILABLE (nothing enrolled, no passcode) or a Keychain
      // error: the app keeps signing in with the password.
      return false
    }
  }

  async function forget(): Promise<void> {
    const bio = current()
    if (!bio)
      return
    await bio.deleteCredential(name).catch(() => {})
  }

  return { probe, signIn, enable, forget }
}
