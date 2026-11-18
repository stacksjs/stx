/**
 * The "Sign in with Face ID" flow around craft.biometrics' credentials: when
 * the button is offered, what a sign-in ends as, and that a credential that
 * cannot come back is forgotten.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import type { BiometricCredentialHost } from '../../src/ui/auth/biometric'
import { BIOMETRIC_DEFAULT_KEY, biometricHost, biometricLabel, biometricSignInLabel, createBiometricSignIn } from '../../src/ui/auth/biometric'

interface FakeOptions { available?: boolean, kind?: string | null, read?: () => Promise<string | null> }

function fakeHost(options: FakeOptions = {}) {
  const kept = new Map<string, string>()
  const calls: string[] = []
  const host: BiometricCredentialHost = {
    isAvailable: async () => options.available ?? true,
    getBiometricType: async () => options.kind === undefined ? 'faceId' : options.kind,
    storeCredential: async (key, value) => {
      calls.push(`store ${key}`)
      if (options.available === false)
        throw Object.assign(new Error('Nothing is enrolled'), { code: 'BIOMETRICS_UNAVAILABLE' })
      kept.set(key, value)
    },
    getCredential: async (key, reason) => {
      calls.push(`get ${key} ${reason ?? ''}`.trim())
      return options.read ? options.read() : (kept.get(key) ?? null)
    },
    hasCredential: async key => kept.has(key),
    deleteCredential: async (key) => {
      calls.push(`delete ${key}`)
      kept.delete(key)
    },
  }
  return { host, kept, calls }
}

const reject = (code: string) => async (): Promise<string | null> => {
  throw Object.assign(new Error(code.toLowerCase()), { code })
}

afterEach(() => {
  delete (globalThis as { craft?: unknown }).craft
})

describe('what the button is called', () => {
  it('names each kind the host reports, and nothing for none', () => {
    expect(biometricLabel('faceId')).toBe('Face ID')
    expect(biometricLabel('touchId')).toBe('Touch ID')
    expect(biometricLabel('fingerprint')).toBe('Fingerprint')
    expect(biometricLabel('none')).toBe('')
    expect(biometricLabel(null)).toBe('')
    expect(biometricSignInLabel('faceId')).toBe('Sign in with Face ID')
    expect(biometricSignInLabel('none')).toBe('')
  })
})

describe('whether to offer it', () => {
  it('offers it once a credential is kept, under the key the app names', async () => {
    const { host } = fakeHost()
    const flow = createBiometricSignIn('hq', host)
    expect(await flow.probe()).toEqual({ available: true, kind: 'faceId', label: 'Face ID', saved: false })
    expect(await flow.enable('device-token-1')).toBe(true)
    expect(await flow.probe()).toEqual({ available: true, kind: 'faceId', label: 'Face ID', saved: true })
    expect(await createBiometricSignIn('other', host).probe()).toMatchObject({ saved: false })
  })

  it('offers nothing with nothing enrolled, no host, or a host that cannot answer', async () => {
    expect(await createBiometricSignIn('hq', fakeHost({ available: false }).host).probe()).toEqual({ available: false, kind: null, label: '', saved: false })
    expect(await createBiometricSignIn('hq', fakeHost({ kind: 'none' }).host).probe()).toMatchObject({ available: false })
    expect(await createBiometricSignIn('hq', null).probe()).toMatchObject({ available: false })
    const broken = { ...fakeHost().host, isAvailable: async () => { throw new Error('bridge gone') } }
    expect(await createBiometricSignIn('hq', broken).probe()).toMatchObject({ available: false })
  })

  it('keeps nothing where nothing is enrolled, and an empty token never', async () => {
    const none = fakeHost({ available: false })
    expect(await createBiometricSignIn('hq', none.host).enable('t')).toBe(false)
    expect(none.calls).toEqual([])
    const some = fakeHost()
    expect(await createBiometricSignIn('hq', some.host).enable('')).toBe(false)
    expect(some.kept.size).toBe(0)
  })
})

describe('signing in', () => {
  it('returns the token on a match, asking with the reason given', async () => {
    const { host, calls } = fakeHost()
    const flow = createBiometricSignIn('hq', host)
    await flow.enable('device-token-1')
    expect(await flow.signIn('Sign in to HQ')).toEqual({ status: 'signed-in', token: 'device-token-1' })
    expect(calls).toContain('get hq Sign in to HQ')
  })

  it('keeps the credential when the person cancels', async () => {
    const { host, kept } = fakeHost({ read: reject('AUTHENTICATION_CANCELLED') })
    const flow = createBiometricSignIn('hq', host)
    await flow.enable('t')
    expect(await flow.signIn()).toEqual({ status: 'cancelled' })
    expect(kept.has('hq')).toBe(true)
  })

  it('forgets one that comes back empty, so the password is asked for', async () => {
    const { host, kept, calls } = fakeHost({ read: async () => null })
    const flow = createBiometricSignIn('hq', host)
    await flow.enable('t')
    expect(await flow.signIn()).toEqual({ status: 'invalidated' })
    expect(calls).toContain('delete hq')
    expect(kept.has('hq')).toBe(false)
    expect(await flow.probe()).toMatchObject({ saved: false })
  })

  it('reports a failed match with the host\'s code, and keeps the credential', async () => {
    const { host, kept } = fakeHost({ read: reject('AUTHENTICATION_FAILED') })
    const flow = createBiometricSignIn('hq', host)
    await flow.enable('t')
    expect(await flow.signIn()).toEqual({ status: 'failed', code: 'AUTHENTICATION_FAILED', message: 'authentication_failed' })
    expect(kept.has('hq')).toBe(true)
  })

  it('fails as unsupported with no host', async () => {
    expect(await createBiometricSignIn('hq', null).signIn()).toMatchObject({ status: 'failed', code: 'UNSUPPORTED' })
  })

  it('forgets on sign-out', async () => {
    const { host, kept } = fakeHost()
    const flow = createBiometricSignIn('hq', host)
    await flow.enable('t')
    await flow.forget()
    expect(kept.size).toBe(0)
  })
})

describe('the page\'s host', () => {
  it('uses craft.biometrics when it keeps credentials, found on each call', async () => {
    const flow = createBiometricSignIn()
    expect(await flow.probe()).toMatchObject({ available: false })
    const { host } = fakeHost()
    ;(globalThis as { craft?: unknown }).craft = { biometrics: host }
    expect(biometricHost()).toBe(host)
    expect(await flow.enable('t')).toBe(true)
    expect(await flow.probe()).toMatchObject({ saved: true })
    expect(await host.hasCredential(BIOMETRIC_DEFAULT_KEY)).toBe(true)
  })

  it('ignores a Craft too old to keep credentials', () => {
    ;(globalThis as { craft?: unknown }).craft = { biometrics: { isAvailable: async () => true, getBiometricType: async () => 'faceId', authenticate: async () => true } }
    expect(biometricHost()).toBeNull()
  })
})
