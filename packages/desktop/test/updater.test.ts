import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { updater } from '../src/updater'
import { findCall, installMockBridge } from './_mock-bridge'

describe('updater (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['updater'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('checkForUpdates / checkInBackground forward', async () => {
    await updater.checkForUpdates()
    await updater.checkInBackground()
    expect(findCall(bridge.calls, 'updater', 'checkForUpdates')).toBeDefined()
    expect(findCall(bridge.calls, 'updater', 'checkInBackground')).toBeDefined()
  })

  it('setAutomaticChecks / setCheckInterval / setFeedURL forward args', async () => {
    await updater.setAutomaticChecks(true)
    await updater.setCheckInterval(3600)
    await updater.setFeedURL('https://example.com/appcast.xml')
    expect(findCall(bridge.calls, 'updater', 'setAutomaticChecks')!.args).toEqual([true])
    expect(findCall(bridge.calls, 'updater', 'setCheckInterval')!.args).toEqual([3600])
    expect(findCall(bridge.calls, 'updater', 'setFeedURL')!.args).toEqual(['https://example.com/appcast.xml'])
  })

  it('getLastUpdateCheckDate normalizes empty to null', async () => {
    bridge.whenCalled('updater', 'getLastUpdateCheckDate', '2024-01-01T00:00:00Z')
    expect(await updater.getLastUpdateCheckDate()).toBe('2024-01-01T00:00:00Z')

    bridge.whenCalled('updater', 'getLastUpdateCheckDate', '')
    expect(await updater.getLastUpdateCheckDate()).toBeNull()
  })

  it('getUpdateInfo returns null for malformed payloads', async () => {
    bridge.whenCalled('updater', 'getUpdateInfo', { version: '' })
    expect(await updater.getUpdateInfo()).toBeNull()

    bridge.whenCalled('updater', 'getUpdateInfo', { version: '1.2.3', releaseNotes: 'hi' })
    const info = await updater.getUpdateInfo()
    expect(info?.version).toBe('1.2.3')
    expect(info?.releaseNotes).toBe('hi')
  })

  it('onAvailable / onDownloaded fire on the right events', () => {
    let avail: any = null
    let downloaded: any = null
    const offA = updater.onAvailable((i) => { avail = i })
    const offD = updater.onDownloaded((i) => { downloaded = i })

    window.dispatchEvent(new CustomEvent('craft:updateAvailable', {
      detail: { version: '1.2.3' },
    }))
    window.dispatchEvent(new CustomEvent('craft:updateDownloaded', {
      detail: { version: '1.2.3' },
    }))

    expect(avail.version).toBe('1.2.3')
    expect(downloaded.version).toBe('1.2.3')
    offA()
    offD()
  })
})

describe('updater (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('all calls are graceful no-ops', async () => {
    await expect(updater.checkForUpdates()).resolves.toBeUndefined()
    await expect(updater.setFeedURL('x')).resolves.toBeUndefined()
    expect(await updater.getLastUpdateCheckDate()).toBeNull()
    expect(await updater.getUpdateInfo()).toBeNull()
  })
})

// =============================================================================
// Signature verification (Sparkle-style)
// =============================================================================

function bytesToBase64(bytes: Uint8Array | ArrayBuffer): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i])
  return btoa(bin)
}

async function makeSignedBundle(payload: Uint8Array): Promise<{ signatureB64: string, publicKeyB64: string }> {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' } as any, true, ['sign', 'verify']) as CryptoKeyPair
  const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, payload))
  const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))
  return { signatureB64: bytesToBase64(sig), publicKeyB64: bytesToBase64(rawPub) }
}

describe('updater.verifySignature', () => {
  it('returns true for a valid Ed25519 signature', async () => {
    const payload = new TextEncoder().encode('release-1.2.3.zip contents')
    const { signatureB64, publicKeyB64 } = await makeSignedBundle(payload)
    const ok = await updater.verifySignature({ payload, signatureB64, publicKeyB64 })
    expect(ok).toBe(true)
  })

  it('returns false when the payload is tampered', async () => {
    const payload = new TextEncoder().encode('release-1.2.3.zip contents')
    const { signatureB64, publicKeyB64 } = await makeSignedBundle(payload)

    const tampered = new Uint8Array(payload)
    tampered[0] ^= 0xFF
    const ok = await updater.verifySignature({ payload: tampered, signatureB64, publicKeyB64 })
    expect(ok).toBe(false)
  })

  it('returns false when the public key does not match', async () => {
    const payload = new TextEncoder().encode('payload')
    const { signatureB64 } = await makeSignedBundle(payload)
    const { publicKeyB64: differentKey } = await makeSignedBundle(payload)
    const ok = await updater.verifySignature({ payload, signatureB64, publicKeyB64: differentKey })
    expect(ok).toBe(false)
  })

  it('returns false on a malformed public key', async () => {
    const payload = new TextEncoder().encode('payload')
    const { signatureB64 } = await makeSignedBundle(payload)
    const ok = await updater.verifySignature({ payload, signatureB64, publicKeyB64: 'not-a-key' })
    expect(ok).toBe(false)
  })

  it('accepts ArrayBuffer payloads', async () => {
    const u = new TextEncoder().encode('buffered')
    const { signatureB64, publicKeyB64 } = await makeSignedBundle(u)
    const ok = await updater.verifySignature({
      payload: u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength),
      signatureB64,
      publicKeyB64,
    })
    expect(ok).toBe(true)
  })
})

describe('updater.verifyDownload', () => {
  let originalFetch: typeof fetch

  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('downloads, verifies, and returns the bytes when the signature matches', async () => {
    const payload = new TextEncoder().encode('happy-path-bundle')
    const { signatureB64, publicKeyB64 } = await makeSignedBundle(payload)
    globalThis.fetch = (() =>
      Promise.resolve(new Response(payload, { status: 200 }))
    ) as typeof fetch

    const result = await updater.verifyDownload({
      url: 'https://example.com/app.zip',
      signatureB64,
      publicKeyB64,
    })
    expect(result.ok).toBe(true)
    expect(result.payload).toBeDefined()
    expect(new TextDecoder().decode(result.payload!)).toBe('happy-path-bundle')
  })

  it('reports bad-signature when the bytes do not match the signature', async () => {
    const payload = new TextEncoder().encode('signed-payload')
    const { signatureB64, publicKeyB64 } = await makeSignedBundle(payload)
    globalThis.fetch = (() =>
      Promise.resolve(new Response(new TextEncoder().encode('different-bytes'), { status: 200 }))
    ) as typeof fetch

    const result = await updater.verifyDownload({
      url: 'https://example.com/app.zip',
      signatureB64,
      publicKeyB64,
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('bad-signature')
  })

  it('reports http-error for non-2xx responses', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(new Response('', { status: 404 }))
    ) as typeof fetch

    const result = await updater.verifyDownload({
      url: 'https://example.com/missing',
      signatureB64: 'AA==',
      publicKeyB64: 'AA==',
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('http-error')
    expect(result.status).toBe(404)
  })

  it('reports fetch-failed when the request rejects', async () => {
    globalThis.fetch = (() => Promise.reject(new Error('offline'))) as typeof fetch
    const result = await updater.verifyDownload({
      url: 'https://x',
      signatureB64: 'AA==',
      publicKeyB64: 'AA==',
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('fetch-failed')
  })

  it('reports bad-key for malformed public keys', async () => {
    globalThis.fetch = (() => Promise.resolve(new Response('x'))) as typeof fetch
    const result = await updater.verifyDownload({
      url: 'https://x',
      signatureB64: 'AA==',
      publicKeyB64: 'not-base64-of-correct-length',
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('bad-key')
  })
})
